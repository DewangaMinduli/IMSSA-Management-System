const db = require('../../config/db');

async function createAndAssignRole() {
    try {
        let roleId = null;

        // 1. Check/Create Role
        const [roles] = await db.execute("SELECT * FROM role WHERE role_name = 'Junior Treasurer'");

        if (roles.length > 0) {
            roleId = roles[0].role_id;
            console.log("Role 'Junior Treasurer' found with ID:", roleId);
        } else {
            console.log("Creating 'Junior Treasurer' role...");
            const [res] = await db.execute("INSERT INTO role (role_name, hierarchy_level) VALUES ('Junior Treasurer', 5)");
            roleId = res.insertId;
            console.log("Created 'Junior Treasurer' role with ID:", roleId);
        }

        // 2. Find User
        const [users] = await db.execute("SELECT * FROM user WHERE full_name LIKE '%Buddhika%'");
        if (users.length === 0) {
            console.error("User Buddhika not found");
            process.exit(1);
        }
        const user = users[0];

        // 3. Update User
        await db.execute(
            "UPDATE user SET role_id = ?, hierarchy_level = 5, user_type = 'Student' WHERE user_id = ?",
            [roleId, user.user_id]
        );

        console.log(`✅ Assigned Role ID ${roleId} to ${user.full_name}`);

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

createAndAssignRole();
