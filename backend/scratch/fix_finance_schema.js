const db = require('../config/db');

async function fixSchema() {
    try {
        console.log("Altering transaction status enum...");
        await db.execute(`
            ALTER TABLE transaction 
            MODIFY COLUMN status ENUM('Pending', 'Verified', 'Approved', 'Rejected') 
            DEFAULT 'Pending'
        `);
        console.log("Schema fix completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Schema fix failed:", err);
        process.exit(1);
    }
}

fixSchema();
