const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
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