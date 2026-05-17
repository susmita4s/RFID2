const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

console.log("Database URL:", process.env.DATABASE_URL);

const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

console.log("Is Local:", isLocal);

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: isLocal ? null : {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000 // 20 seconds timeout
});

console.log("Attempting connection...");
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Database Connection Failed via mysql2:", err);
  } else {
    console.log("✅ Database Connected Successfully via mysql2!");
    conn.release();
  }
  pool.end();
});
