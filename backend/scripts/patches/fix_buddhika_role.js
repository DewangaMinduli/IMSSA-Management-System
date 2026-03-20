const db = require('../../config/db');

async function fixUser() {
    try {
        // 1. Find the user
        const [users] = await db.execute("SELECT * FROM user WHERE full_name LIKE '%Buddhika%'");
        if (users.length === 0) {
            console.log("User 'Buddhika' not found!");
            process.exit(1);
        }

        const user = users[0];
        console.log("Current User State:", { id: user.user_id, name: user.full_name, role: user.role_name, level: user.hierarchy_level });

        // 2. Update to Junior Treasurer
        // Setting hierarchy_level to 5 (Executive is usually > 3)
        // Setting role_name explicitly
        await db.execute(
            "UPDATE user SET role_name = 'Junior Treasurer', hierarchy_level = 5, user_type = 'Student' WHERE user_id = ?",
            [user.user_id]
        );

        console.log("✅ User updated to Junior Treasurer (Level 5)");

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

fixUser();
