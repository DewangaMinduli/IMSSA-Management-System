const db = require('../config/db');

const checkColumns = async () => {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM user LIKE 'role'");
        console.log("Role Column:", cols);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

checkColumns();
