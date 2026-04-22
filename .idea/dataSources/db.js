const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');



dotenv.config({ path: envPath });

const mysql = require("mysql2");


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

db.connect((err) => {
    if (err) {
        console.error('Tietokantavirhe: ' + err.message);
    } else {
        console.log('✅ Yhteys tietokantaan onnistui');
    }
});

module.exports = db;