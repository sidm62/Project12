require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Tarjoillaan staattiset tiedostot (HTML, CSS, JS)
app.use(express.static(__dirname));

// Tietokantayhteys (Yksi pooli koko sovellukselle)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// --- AUTH-REITIT ---

// Rekisteröityminen
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Virhe rekisteröinnissä" });
        }
        res.status(201).json({ message: "Rekisteröityminen onnistui" });
    });
});

// Kirjautuminen
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

// Käyttäjätietojen haku
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

// Salasanan vaihto
app.put('/api/auth/change-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const sql = "UPDATE users SET password = ? WHERE id = ?";

    db.query(sql, [newPassword, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Salasanan vaihto onnistui" });
    });
});

// --- KAUPAN REITIT (Tuotteet ja Tilaukset) ---

app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error("❌ SQL-VIRHE:", err); // Tämä näkyy WebStormissa
            // Palautetaan tyhjä lista [] ja virheviesti
            return res.status(500).json({
                viesti: "Tietokantavirhe",
                details: err.message
            });
        }
        res.json(results);
    });
});
// LISÄÄ UUSI TUOTE TIETOKANTAAN
app.post('/api/products', (req, res) => {
    const { name, price, category, image_url } = req.body;
    
    // Suoritetaan SQL-komento, joka tallentaa uuden rivin tietokantaan
    const query = "INSERT INTO products (name, price, category, image_url) VALUES (?, ?, ?, ?)";
    
    db.query(query, [name, price, category, image_url], (err, result) => {
        if (err) {
            console.error("Virhe tuotteen lisäyksessä:", err);
            return res.status(500).json({ error: "Tietokantavirhe" });
        }
        res.status(201).json({ message: "Tuote lisätty", id: result.insertId });
    });
});

// POISTA TUOTE TIETOKANNASTA
app.delete('/api/products/:id', (req, res) => {
    // Otetaan kiinni url-osoitteessa tullut tuotteen ID
    const tuoteId = req.params.id; 
    
    // SQL-komento: Tuhoa rivi products-taulusta, jonka id on tämä
    const query = "DELETE FROM products WHERE id = ?";
    
    db.query(query, [tuoteId], (err, result) => {
        if (err) {
            console.error("Virhe tuotteen poistossa:", err);
            return res.status(500).json({ error: "Tietokantavirhe" });
        }
        res.status(200).json({ message: "Tuote poistettu onnistuneesti" });
    });
});
// PÄIVITÄ KOKO TUOTE TIETOKANNASSA
app.put('/api/products/:id', (req, res) => {
    const tuoteId = req.params.id;
    const { name, price, category, image_url, discount_price } = req.body;
    
    const query = "UPDATE products SET name = ?, price = ?, category = ?, image_url = ?, discount_price = ? WHERE id = ?";
    
    db.query(query, [name, price, category, image_url, discount_price, tuoteId], (err, result) => {
        if (err) {
            console.error("Virhe tuotteen päivityksessä:", err);
            return res.status(500).json({ error: "Tietokantavirhe" });
        }
        res.status(200).json({ message: "Tuote päivitetty onnistuneesti" });
    });
});

app.post('/api/orders', (req, res) => {
    // Otetaan vastaan frontista tulevat kentät
    const { userId, total_price, tuotteet } = req.body;

    // TÄRKEÄ: Katso WebStormin terminaaliin, kun painat nappia!
    console.log("Datan tarkistus:", { userId, total_price, tuotteet });

    if (!tuotteet || !Array.isArray(tuotteet)) {
        return res.status(400).json({ error: "Tuotteet puuttuvat tai ne ovat väärässä muodossa" });
    }

    const sqlOrder = "INSERT INTO orders (user_id, total_price) VALUES (?, ?)";
    db.query(sqlOrder, [userId, total_price], (err, result) => {
        if (err) {
            console.error("Orders-taulun virhe:", err.message);
            return res.status(500).json({ error: err.message });
        }

        const orderId = result.insertId;

        // Luodaan data order_items-taululle (järjestys: order_id, product_id, quantity, unit_price)
        const orderItemsData = tuotteet.map(item => [
            orderId,
            item.id,      // Varmista että frontti lähettää 'id'
            item.amount,  // Varmista että frontti lähettää 'amount'
            item.price    // Varmista että frontti lähettää 'price'
        ]);

        const sqlItems = "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?";
        db.query(sqlItems, [orderItemsData], (err) => {
            if (err) {
                console.error("Order_items-taulun virhe:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Tilaus onnistui!", orderId: orderId });
        });
    });
});
// --- HSL API REITTI (BACKEND PROXY) ---
app.get('/api/hsl', async (req, res) => {
    const query = `
    {
      stop(id: "HSL:1040129") {
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
app.get('/api/orders/user/:userId', (req, res) => {
    const userId = req.params.userId;

    // Korjattu SQL-kysely:
    // 1. Poistettu ylimääräinen "app.post" JOIN-lauseesta.
    // 2. Lisätty o.status, jotta asiakas näkee tilauksen vaiheen.
    const sql = `
    SELECT o.id AS orderId, o.created_at, o.total_price, o.status, 
           oi.quantity, p.name, p.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("SQL-VIRHE:", err);
            return res.status(500).json({ error: 'Virhe historian haussa' });
        }
        res.json(results);
    });
});
// --- TILAUSTEN SEURANTA ---

// 1. HAE KAIKKI TILAUKSET ADMINILLE
app.get('/api/orders', (req, res) => {
    // Haetaan tilaukset uusimmasta vanhimpaan (ORDER BY id DESC)
    const query = "SELECT * FROM orders ORDER BY id DESC";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Virhe tilausten haussa:", err);
            return res.status(500).json({ error: "Tietokantavirhe" });
        }
        res.status(200).json(results);
    });
});

// 2. PÄIVITÄ TILAUKSEN STATUS (Admin)
app.put('/api/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const uusiStatus = req.body.status; // Esim. "Valmistuksessa" tai "Valmis"
    
    const query = "UPDATE orders SET status = ? WHERE id = ?";
    
    db.query(query, [uusiStatus, orderId], (err, result) => {
        if (err) {
            console.error("Virhe statuksen päivityksessä:", err);
            return res.status(500).json({ error: "Tietokantavirhe" });
        }
        res.status(200).json({ message: "Status päivitetty onnistuneesti" });
    });
});

// Käynnistys
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ROAST-palvelin rullaa portissa ${PORT}`);
    console.log(`Kirjautuminen: http://localhost:${PORT}/api/auth/login`);
});