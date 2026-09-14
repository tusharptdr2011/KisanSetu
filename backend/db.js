const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "KisanSetu",

    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("MySQL Connection Error:", err.message);
        return;
    }

    console.log("MySQL Connected Successfully ✅");
    connection.release();
});

module.exports = db;