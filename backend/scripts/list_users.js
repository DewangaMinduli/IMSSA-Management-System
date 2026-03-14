const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [rows] = await connection.execute('SELECT user_id AS ID, student_number AS StudentID, email, role FROM User');

        const outputPath = path.join(__dirname, '..', 'users_list.json');
        fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
        console.log(`Users written to ${outputPath}`);

        await connection.end();
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

listUsers();
