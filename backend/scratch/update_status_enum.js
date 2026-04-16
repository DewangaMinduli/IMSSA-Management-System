const db = require('../config/db');

async function updateStatusEnum() {
    try {
        // 1. Convert any existing 'Verified' to 'Approved' so we don't lose data
        console.log("Migrating 'Verified' to 'Approved'...");
        await db.execute("UPDATE transaction SET status = 'Approved' WHERE status = 'Verified'");

        // 2. Modify ENUM to remove 'Verified'
        console.log("Modifying ENUM to remove 'Verified' and keep only Pending, Approved, Rejected...");
        await db.execute(`
            ALTER TABLE transaction 
            MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected') 
            DEFAULT 'Pending'
        `);
        
        console.log("Database status enum updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Database update failed:", err);
        process.exit(1);
    }
}

updateStatusEnum();
