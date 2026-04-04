const db = require('./config/db');
async function main() {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM `user`');
        console.log(cols.map(c => c.Field).join(', '));
        // test lookup by student number
        const [rows] = await db.query("SELECT user_id, full_name, student_number FROM `user` WHERE student_number = 'IM/2023/025' LIMIT 1");
        console.log('lookup result:', JSON.stringify(rows));
    } catch(e) { console.log('ERR:', e.message); }
    process.exit(0);
}
main();
