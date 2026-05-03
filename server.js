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
    db.query('SELECT * FROM Products', (err, results) => {
        if (err) return res.status(500).json({ error: 'Tietokantavirhe' });
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
    const { userId, items, total } = req.body;
    db.query('INSERT INTO Orders (user_id, total_price) VALUES (?, ?)', [userId, total], (err, result) => {
        if (err) return res.status(500).json({ error: 'Virhe tilauksessa' });

        const orderId = result.insertId;
        const orderItemsData = items.map(item => [orderId, item.productId, item.amount, item.price]);

        db.query('INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES ?', [orderItemsData], (err) => {
            if (err) return res.status(500).json({ error: 'Virhe tilausriveissä' });
            res.json({ message: "Tilaus onnistui!" });
        });
    });
});

app.get('/api/orders/:userId', (req, res) => {
    const sql = `
        SELECT o.id AS orderId, o.order_date, o.total_price, 
               oi.product_id, oi.quantity, p.name, p.price
        FROM Orders o
        JOIN Order_Items oi ON o.id = oi.order_id
        JOIN Products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.order_date DESC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Virhe historian haussa' });
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