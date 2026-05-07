/**
 * @fileoverview ROAST Burger -pääpalvelin (server.js).
 * Hallitsee autentikointia, tuotteita, tilauksia ja ulkoisia API-integraatioita.
 * Käyttää Express.js-kehystä ja MySQL2-tietokanta-ajuria.
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Tarjoillaan staattiset tiedostot (HTML, CSS, JS) suoraan juuresta
app.use(express.static(__dirname));

/**
 * Tietokantayhteyden määritys (Connection Pool).
 * Käyttää .env-tiedostossa määriteltyjä ympäristömuuttujia turvallisuuden vuoksi.
 */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
});

// --- AUTH-REITIT (Käyttäjien hallinta) ---

/**
 * Rekisteröi uuden käyttäjän tietokantaan.
 * @route POST /api/auth/register
 */
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            // Tarkistetaan onko sähköposti tai käyttäjänimi jo varattu
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Käyttäjänimi tai sähköposti on jo käytössä" });
            }
            return res.status(500).json({ error: "Virhe rekisteröinnissä" });
        }


        res.status(201).json({
            message: "Rekisteröityminen onnistui",
            user: {
                id: result.insertId,
                username: username
            }
        });
    });
});

/**
 * Tarkistaa käyttäjän kirjautumistiedot.
 * @route POST /api/auth/login
 */
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
            res.json({ message: "Kirjautuminen onnistui", user: result[0] });
        } else {
            res.status(401).json({ message: "Väärä tunnus tai salasana" });
        }
    });
});

/**
 * Hakee tietyn käyttäjän julkiset profiilitiedot ID:n perusteella.
 * @route GET /api/auth/user/:id
 */
app.get('/api/auth/user/:id', (req, res) => {
    const sql = "SELECT id, username, email, role FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Käyttäjää ei löytynyt" });
        }
    });
});

/**
 * Päivittää käyttäjän salasanan.
 * @route PUT /api/auth/change-password
 */
app.put('/api/auth/change-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const sql = "UPDATE users SET password = ? WHERE id = ?";

    db.query(sql, [newPassword, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Salasanan vaihto onnistui" });
    });
});

// --- KAUPAN REITIT (Tuotteet) ---

/**
 * Hakee kaikki tuotteet ruokalistaa varten.
 * @route GET /api/products
 */
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error(" SQL-VIRHE:", err);
            return res.status(500).json({ viesti: "Tietokantavirhe", details: err.message });
        }
        res.json(results);
    });
});

/**
 * Lisää uuden tuotteen (Ylläpito).
 * @route POST /api/products
 */
app.post('/api/products', (req, res) => {
    const { name, price, category, image_url } = req.body;
    const query = "INSERT INTO products (name, price, category, image_url) VALUES (?, ?, ?, ?)";

    db.query(query, [name, price, category, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: "Tietokantavirhe" });
        res.status(201).json({ message: "Tuote lisätty", id: result.insertId });
    });
});

/**
 * Poistaa tuotteen ID:n perusteella.
 * @route DELETE /api/products/:id
 */
app.delete('/api/products/:id', (req, res) => {
    const query = "DELETE FROM products WHERE id = ?";
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Tietokantavirhe" });
        res.status(200).json({ message: "Tuote poistettu onnistuneesti" });
    });
});

/**
 * Päivittää tuotteen tiedot tai hinnan (Ylläpito).
 * @route PUT /api/products/:id
 */
app.put('/api/products/:id', (req, res) => {
    const { name, price, category, image_url, discount_price } = req.body;
    const query = "UPDATE products SET name = ?, price = ?, category = ?, image_url = ?, discount_price = ? WHERE id = ?";

    db.query(query, [name, price, category, image_url, discount_price, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Tietokantavirhe" });
        res.status(200).json({ message: "Tuote päivitetty onnistuneesti" });
    });
});

// --- TILAUSLOGIIKKA ---

/**
 * Luo uuden tilauksen ja siihen liittyvät tilausrivit (Order Items).
 * @route POST /api/orders
 */
app.post('/api/orders', (req, res) => {
    const { userId, total_price, tuotteet } = req.body;

    // 1. VARMISTUS: Tarkistetaan, että data ei ole tyhjää
    if (!tuotteet || !Array.isArray(tuotteet) || tuotteet.length === 0) {
        return res.status(400).json({ error: "Ostoskori on tyhjä" });
    }

    // 2. TILAUS PÄÄTAULUUN
    const sqlOrder = "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'Vastaanotettu')";

    db.query(sqlOrder, [userId, total_price], (err, result) => {
        if (err) {
            console.error("VIRHE orders-tauluun:", err.message);
            return res.status(500).json({ error: err.message });
        }

        const orderId = result.insertId;

        // 3. DATAN MÄPPÄYS: Varmistetaan, että product_id ei ole koskaan null
        const orderItemsData = tuotteet.map(item => {
            // Etsitään ID:tä kaikista mahdollisista kentistä (id, product_id, productId)
            const p_id = item.id || item.product_id || item.productId;

            // Jos p_id on silti tyhjä, käytetään oletuksena 0 tai heitetään lokiin viesti
            if (!p_id) console.warn("Varoitus: Tuotteen ID puuttuu riviltä!", item);

            return [
                orderId,
                p_id,
                item.amount || item.quantity || 1, // Määrä
                item.price || 0                    // Hinta
            ];
        });

        // 4. TALLENNUS RIVITAULUUN (KORJATTU: unit_price -> price)
        // Huom: Jos tietokannassasi on unit_price, vaihda se takaisin alle.
        const sqlItems = "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?";

        db.query(sqlItems, [orderItemsData], (errItems) => {
            if (errItems) {
                console.error("VIRHE order_items-tauluun:", errItems.message);
                // Jos virhe on 'Unknown column price', vaihda yllä olevaan SQL:ään unit_price
                return res.status(500).json({ error: errItems.message });
            }

            console.log(`✅ Tilaus #${orderId} onnistui!`);
            res.json({ message: "Tilaus onnistui!", orderId: orderId });
        });
    });
});
/**
 * Hakee kirjautuneen käyttäjän tilaushistorian.
 * @route GET /api/orders/user/:userId
 */
app.get('/api/orders/user/:userId', (req, res) => {
    const sql = `
        SELECT
            o.id AS orderId,
            o.created_at,
            o.total_price,
            o.status,
            oi.product_id,    
            oi.quantity,      
            p.name,           
            p.price           
        FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC`;

    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Virhe historian haussa' });
        res.json(results);
    });
});
/**
 * Hakee kaikki tilaukset ylläpitäjälle.
 * @route GET /api/orders
 */
app.get('/api/orders', (req, res) => {
    db.query("SELECT * FROM orders ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Tietokantavirhe" });
        res.status(200).json(results);
    });
});

/**
 * Päivittää tilauksen tilan (esim. 'Valmistuksessa', 'Valmis').
 * @route PUT /api/orders/:id/status
 */
app.put('/api/orders/:id/status', (req, res) => {
    const query = "UPDATE orders SET status = ? WHERE id = ?";
    db.query(query, [req.body.status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Tietokantavirhe" });
        res.status(200).json({ message: "Status päivitetty" });
    });
});



// Ohjaa etusivulle saapuvat Roast.html-tiedostoon
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Roast.html'));
});

// --- ULKOISET API-REITIT ---

// --- HSL API REITTI (BACKEND PROXY) ---
app.get('/api/hsl', async (req, res) => {
    const query = `
    {
      stop(id: "HSL:1020105") {
        name
        stoptimesWithoutPatterns(numberOfDepartures: 5) {
          realtimeDeparture
          headsign
        }
      }
    }`;

    try {
        const response = await fetch("https://api.digitransit.fi/routing/v2/hsl/gtfs/v1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "digitransit-subscription-key": "7767ea6f9e7a4ef7a60e7666499c73bf"
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            const virheTeksti = await response.text();
            console.error("HSL Palvelimen antama virheviesti:", virheTeksti);
            return res.status(response.status).json({ message: "HSL rajapinta palautti virheen", details: virheTeksti });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error("Virhe HSL-tiedon hakemisessa backendissä:", error);
        res.status(500).json({ message: "Palvelinvirhe aikatauluja haettaessa" });
    }
});

// --- PALVELIMEN KÄYNNISTYS ---
if (require.main === module) {
    const PORT = process.env.PORT || 80;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 ROAST-palvelin rullaa portissa ${PORT}`);
        console.log(`Yritä yhdistää: http://10.120.36.67:${PORT}`);
    });
}

module.exports = app;