const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

connection.connect((err) => {
  if (err) {
    console.log("Database Connection Failed");
    console.log(err);
  } else {
    console.log("Database Connected Successfully");
  }
});

module.exports = connection;