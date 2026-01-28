const db = require('./config/db');

async function checkSchema() {
    try {
        const [conn] = await db.query("DESCRIBE user");
        console.log("USER Table Schema:", conn.map(c => c.Field));

        const [roles] = await db.query("SELECT * FROM role");
        console.log("Available Roles:", roles);

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkSchema();
