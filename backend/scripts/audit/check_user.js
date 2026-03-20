const db = require('../../config/db');

async function checkUser() {
    try {
        const [users] = await db.execute("SELECT * FROM user WHERE full_name LIKE '%Boddhika%'");
        console.log('Found Users:', users);
        if (users.length > 0) {
            console.log('Current Role:', users[0].role_name || 'N/A');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkUser();
