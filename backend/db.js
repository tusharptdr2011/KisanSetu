const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "KisanSetu",

    // TiDB Cloud requires TLS for the public endpoint
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.log("❌ MySQL connection failed!");
        console.log(err.message);
        return;
    }

    console.log("MySQL Connected Successfully ✅");
});

module.exports = db;