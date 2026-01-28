const db = require('./config/db');

async function checkData() {
    try {
        console.log("--- ROLES ---");
        const [roles] = await db.execute("SELECT * FROM role");
        console.table(roles);

        console.log("\n--- USERS ---");
        const [users] = await db.execute("SELECT user_id, full_name, user_type FROM user LIMIT 20");
        console.table(users);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkData();
