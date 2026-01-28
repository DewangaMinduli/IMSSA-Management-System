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
    if (err) { console.error(err); process.exit(1); }

    const tablesToCheck = ['transaction', 'budget_plan', 'financial_account', 'event', 'financial_accounts'];

    connection.query('SHOW TABLES', (err, results) => {
        if (err) { console.error(err); process.exit(1); }

        const existingTables = results.map(r => Object.values(r)[0]);
        console.log('Existing Tables:', existingTables);

        tablesToCheck.forEach(t => {
            if (existingTables.includes(t)) {
                console.log(`Table ${t} exists. checking columns...`);
                connection.query(`DESCRIBE ${t}`, (err, cols) => {
                    if (!err) console.log(`Columns for ${t}:`, cols.map(c => c.Field));
                });
            } else {
                console.log(`Table ${t} MISSING`);
            }
        });

        // Wait a bit for async describes then exit
        setTimeout(() => connection.end(), 1000);
    });
});
