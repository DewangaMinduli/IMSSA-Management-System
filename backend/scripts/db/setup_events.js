const db = require('../../config/db');

async function setupEvents() {
    try {
        // 1. Create Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date_range VARCHAR(255),
        phase VARCHAR(100),
        oc_members VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active'
      )
    `);
        console.log("✅ 'events' table created.");

        // 2. Clear existing entries to avoid duplicates during dev
        await db.query("TRUNCATE TABLE events");

        // 3. Insert Data matches UI
        const sql = `INSERT INTO events (name, date_range, phase, oc_members) VALUES ?`;
        const values = [
            ['hackX 10.0', 'July 19 - Nov 11, 2025', 'Ideaprint Phase', 'Dineth Perera, Kavindi Silva'],
            ['hackX Jr. 8.0', 'August 6 - Nov 11, 2025', 'Registration Open Phase', 'Lakshitha Gunasekara']
        ];

        await db.query(sql, [values]);
        console.log("✅ 2 Events inserted.");

        process.exit(0);
    } catch (err) {
        console.error("Error setting up events:", err);
        process.exit(1);
    }
}

setupEvents();
