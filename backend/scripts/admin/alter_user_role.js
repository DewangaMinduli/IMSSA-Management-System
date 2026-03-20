const db = require('../../config/db');

const modifyEnum = async () => {
    try {
        // Correctly target the 'role' table and 'role_name' column instead of the 'user' table
        const query = "ALTER TABLE role MODIFY COLUMN role_name ENUM('Member', 'Organizing_Committee', 'Executive_Board', 'President', 'Junior_Treasurer', 'Senior_Treasurer', 'Academic_Staff')";

        await db.execute(query);
        console.log("✅ Role table Modified: Updated role_name ENUM.");

    } catch (error) {
        console.error('Error altering table:', error.message);
    } finally {
        process.exit();
    }
};

modifyEnum();
