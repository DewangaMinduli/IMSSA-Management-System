const db = require('./config/db');

async function fixUserRole() {
    try {
        // 1. Get Role ID for 'Junior Treasurer'
        const [roles] = await db.execute("SELECT * FROM role WHERE role_name LIKE '%Junior Treasurer%' OR role_name LIKE '%Treasurer%'");
        console.log("Found Roles:", roles);

        if (roles.length === 0) {
            console.error("No Treasurer role found. Creating one...");
            // Optional: Create if missing, but let's see output first.
            process.exit(1);
        }

        const targetRole = roles.find(r => r.role_name.includes('Junior')) || roles[0];
        console.log("Target Role:", targetRole);

        // 2. Find User
        const [users] = await db.execute("SELECT * FROM user WHERE full_name LIKE '%Buddhika%'");
        if (users.length === 0) {
            console.error("User Buddhika not found");
            process.exit(1);
        }
        const user = users[0];
        console.log("Target User:", user.full_name, "Current Role ID:", user.role_id);

        // 3. Update User
        await db.execute(
            "UPDATE user SET role_id = ?, hierarchy_level = ?, user_type = 'Student' WHERE user_id = ?",
            [targetRole.role_id, targetRole.hierarchy_level, user.user_id]
        );

        console.log(`✅ Successfully updated ${user.full_name} to Role ID ${targetRole.role_id} (${targetRole.role_name})`);

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

fixUserRole();
