const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL connection failed!");
        console.log(err.message);
        return;
    }

    console.log("MySQL Connected Successfully ✅");
    connection.release();
});

module.exports = db;