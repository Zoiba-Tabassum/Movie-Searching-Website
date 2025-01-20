const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "zoiba123",
  database: "project",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Database connected successfully.");
});

module.exports = db;
