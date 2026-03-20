const db = require('../../config/db');

const updateRole = async () => {
    try {
        const query = "UPDATE user SET role = 'Junior Treasurer', user_type = 'Student' WHERE full_name LIKE '%Buddhika%'";
        const [result] = await db.execute(query);
        console.log(`Updated ${result.affectedRows} users.`);
    } catch (error) {
        console.error('Error updating role:', error.message);
    } finally {
        process.exit();
    }
};

updateRole();
