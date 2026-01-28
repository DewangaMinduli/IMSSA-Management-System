const db = require('./config/db');

async function checkUser() {
    try {
        const [users] = await db.execute("SELECT * FROM user WHERE full_name LIKE '%Buddhika%' OR full_name LIKE '%Boddhika%'");
        console.log('Found Users:', users);
        if (users.length > 0) {
            console.log('Correct Name:', users[0].full_name);
        } else {
            console.log('No user found with either spelling.');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkUser();
