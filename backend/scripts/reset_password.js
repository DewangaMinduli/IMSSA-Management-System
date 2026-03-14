const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function resetPassword() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        rl.question('Enter the Student ID or Email of the user to reset: ', async (identifier) => {
            rl.question('Enter the NEW password: ', async (newPassword) => {

                if (newPassword.length < 6) {
                    console.log('Error: Password must be at least 6 characters.');
                    process.exit(1);
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPassword, salt);

                const [result] = await connection.execute(
                    'UPDATE User SET password_hash = ? WHERE student_number = ? OR email = ?',
                    [hashedPassword, identifier, identifier]
                );

                if (result.affectedRows > 0) {
                    console.log(`\nSUCCESS: Password updated for '${identifier}'.`);
                } else {
                    console.log(`\nERROR: User '${identifier}' not found.`);
                }

                await connection.end();
                rl.close();
            });
        });

    } catch (err) {
        console.error('Error:', err);
        rl.close();
    }
}

resetPassword();
