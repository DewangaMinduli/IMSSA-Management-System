const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

async function check() {
    const tables = ['event', 'oc_member', 'task', 'user_skill', 'skill', 'task_skill', 'user', 'letter_request'];
    const results = {};
    for (const t of tables) {
        try {
            const [rows] = await db.execute(`DESCRIBE ${t}`);
            results[t] = rows.map(r => r.Field);
        } catch (e) {
            results[t] = "Does not exist";
        }
    }
    fs.writeFileSync(path.join(__dirname, 'inspect_output.json'), JSON.stringify(results, null, 2));
    process.exit(0);
}
check();
