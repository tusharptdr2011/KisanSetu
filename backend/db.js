const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: Number(process.env.MYSQLPORT || 3306),
    database: process.env.MYSQLDATABASE,

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