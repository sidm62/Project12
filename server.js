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

app.get('/api/orders/user/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
    SELECT o.id AS orderId, o.created_at, o.total_price, 
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
// Käynnistys
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ROAST-palvelin rullaa portissa ${PORT}`);
    console.log(`Kirjautuminen: http://localhost:${PORT}/api/auth/login`);
});