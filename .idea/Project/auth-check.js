const express = require('express');
const router = express.Router();
const db = require('../dataSources/db');

router.post('/register', (req, res) => {
    const {username, email,password} = req.body;
    const sql ="INSERT INTO users ( username,email, password) VALUES (?,?,?)";

    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({error: err});
        }
        res.status(201).json({message:"Rekisteröityminen onnistui"});
    });
});
router.post('/login', (req, res) => {
    const {username, password} = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json({error: err});

        if (result.length > 0) {
            res.json({message: "Kirjautuminen onnistui", user: result[0]});
        } else {
            res.status(401).json({message: "Väärä tunnus tai salasana"});
        }

    });

});

router.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "SELECT id, username, email, role FROM users WHERE id = ?";

    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Käyttäjää ei löytynyt" });
        }
    });
});

module.exports = router;