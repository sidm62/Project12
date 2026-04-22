const express = require('express');
const cors = require('cors');
const db = require('./db');


const authRoutes = require('../Project/auth-check');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('ROAST-palvelin on online ja reitit ladattu! 🚀');
});

app.listen(3000, () => {
    console.log(' ROAST-palvelin käynnissä portissa 3000');
});