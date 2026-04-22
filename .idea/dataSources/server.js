require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Tämä kertoo, mistä kansiosta HTML-sivut löytyvät
app.use(express.static(__dirname)); 

// Yhdistetään tietokantaan
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Reitti, joka hakee ruoat tietokannasta
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM Products', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Tietokantavirhe' });
        } else {
            res.json(results);
        }
    });
});

const PORT = 3000;
// --- UUSI KOODI: Tilauksen tallennus historiaan (Orders ja Order_Items) ---
app.post('/api/orders', (req, res) => {
    // Otetaan vastaan kuka tilasi ja mitä ostoskorissa oli
    const { userId, items, total } = req.body;
    
    // 1. Luodaan uusi tilaus Orders-tauluun (tallentaa ajan, summan ja käyttäjän)
    db.query('INSERT INTO Orders (user_id, total_price) VALUES (?, ?)', [userId, total], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Virhe tilauksen luonnissa' });
        }
        
        const orderId = result.insertId; // Otetaan talteen uuden tilauksen numero
        
        // 2. Valmistellaan ostoskorin tuotteet tietokantaa varten
        // HUOM: Vaatii, että frontend lähettää tuotteen ID:n (productId)
        const orderItemsData = items.map(item => [orderId, item.productId, item.amount, item.price]);
        
        // 3. Tallennetaan kaikki korin tuotteet Order_Items -tauluun
        db.query('INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES ?', [orderItemsData], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Virhe tilausrivien luonnissa' });
            }
            res.json({ message: "Tilaus tallennettu historiaan onnistuneesti!" });
        });
    });
});
// --- UUSI KOODI: Haetaan asiakkaan tilaushistoria "Tilaa uudelleen" -nappia varten ---
app.get('/api/orders/:userId', (req, res) => {
    const userId = req.params.userId;

    // Tämä SQL-taikatemppu (JOIN) hakee yhdellä kertaa sekä tilauksen tiedot että sen sisällä olevat ruoat!
    const sql = `
        SELECT o.id AS orderId, o.order_date, o.total_price, 
               oi.product_id, oi.quantity, p.name, p.price
        FROM Orders o
        JOIN Order_Items oi ON o.id = oi.order_id
        JOIN Products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.order_date DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Virhe historian haussa:', err);
            return res.status(500).json({ error: 'Virhe historian haussa' });
        }
        res.json(results); // Lähetetään asiakkaan koko tilaushistoria selaimelle
    });
});
app.listen(PORT, () => {
    console.log(`Palvelin käynnissä: http://localhost:${PORT}`);
});