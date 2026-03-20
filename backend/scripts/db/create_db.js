const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err, results) => {
        if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
        }
        console.log(`Database '${process.env.DB_NAME}' created or already exists.`);
        connection.end();
    });
});
