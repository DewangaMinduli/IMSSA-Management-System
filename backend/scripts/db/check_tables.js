const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL.');

    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error showing tables:', err);
            process.exit(1);
        }
        console.log('Tables in database:', results);

        // precise check
        const tables = results.map(row => Object.values(row)[0]);
        console.log('Table List:', tables);
        connection.end();
    });
});
