const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function checkDB() {
    let connection;
    try {
        console.log('Connecting to:', process.env.DATABASE_URL);
        connection = await mysql.createConnection(process.env.DATABASE_URL);
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables in DB:', tables);
        
        // Try to find any user table
        const userTable = tables.find(t => Object.values(t)[0].toLowerCase().includes('user'));
        if (userTable) {
            const tableName = Object.values(userTable)[0];
            const [rows] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
            console.log(`Contents of ${tableName}:`, rows);
        } else {
            console.log('No user-related table found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

checkDB();
