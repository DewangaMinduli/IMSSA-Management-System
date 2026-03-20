const db = require('../../config/db');

async function updateAcademicStaff() {
    try {
        // Update the existing Academic Staff user or insert if not exists
        // Assuming email 'staff@imssa.com' or checking by role

        // First, find the user to update
        const [users] = await db.query("SELECT * FROM user WHERE role_name = 'Academic Staff' LIMIT 1");

        if (users.length > 0) {
            const email = users[0].email;
            await db.query(`
        UPDATE user 
        SET full_name = 'Dr. Chathura Rajapakse', 
            user_type = 'Academic Staff' 
        WHERE email = ?
      `, [email]);
            console.log(`✅ Updated existing user ${email} to Dr. Chathura Rajapakse`);
        } else {
            // Create new if doesn't exist (fallback)
            const hashedPassword = 'hashed_password_placeholder'; // In real app, hash it
            await db.query(`
        INSERT INTO user (full_name, email, password, role, role_name, user_type, hierarchy_level)
        VALUES ('Dr. Chathura Rajapakse', 'chathura@imssa.com', '12345', 'academic_staff', 'Academic Staff', 'Academic Staff', 3)
      `);
            console.log("✅ Created new user Dr. Chathura Rajapakse");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error updating user:", err);
        process.exit(1);
    }
}

updateAcademicStaff();
