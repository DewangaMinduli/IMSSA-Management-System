require('dotenv').config();
const mysql = require('mysql2/promise');

async function testQuery() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        const tables = ['event', 'task', 'event_timeline', 'event_coordinator'];
        for (const t of tables) {
            try {
                const [desc] = await connection.execute(`DESCRIBE \`${t}\`;`);
                console.log(`\nSCHEMA for ${t}:`);
                console.log(desc.map(c => `${c.Field} (${c.Type})`).join(', '));
            } catch(e) {
                console.log(`\nTable ${t} does not exist or error: ${e.message}`);
            }
        }
        
        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

testQuery();
