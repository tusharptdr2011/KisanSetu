const mysql = require("mysql2");

// MySQL database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "KisanSetu"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.log("❌ MySQL connection failed!");
        console.log(err.message);
        return;
    }

    console.log("MySQL Connected Successfully ✅");
});

// Export database connection
module.exports = db;