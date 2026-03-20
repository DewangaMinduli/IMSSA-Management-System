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

    connection.query('SHOW TABLES', (err, tables) => {
        if (err) { console.error(err); process.exit(1); }

        const tableNames = tables.map(t => Object.values(t)[0]);
        const schema = {};

        let pending = tableNames.length;
        if (pending === 0) {
            console.log(JSON.stringify({}, null, 2));
            process.exit(0);
        }

        tableNames.forEach(tableName => {
            connection.query(`DESCRIBE ${tableName}`, (err, columns) => {
                if (err) {
                    console.error(`Error describing ${tableName}:`, err);
                } else {
                    schema[tableName] = columns.map(c => ({
                        Field: c.Field,
                        Type: c.Type,
                        Null: c.Null,
                        Key: c.Key,
                        Default: c.Default,
                        Extra: c.Extra
                    }));
                }
                pending--;
                if (pending === 0) {
                    const fs = require('fs');
                    fs.writeFileSync('backend_schema.json', JSON.stringify(schema, null, 2));
                    console.log('Schema written to backend_schema.json');
                    connection.end();
                    process.exit(0);
                }
            });
        });
    });
});
