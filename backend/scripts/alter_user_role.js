const db = require('../config/db');

const modifyEnum = async () => {
    try {
        // Retrieve current enum definition first to be safe? 
        // For now, I will blindly expand it to include likely roles + Junior Treasurer
        // Assuming current is enum('member','admin','academic_staff','executive')

        const query = "ALTER TABLE user MODIFY COLUMN role ENUM('member', 'admin', 'academic_staff', 'executive', 'Junior Treasurer', 'Senior Treasurer') DEFAULT 'member'";

        await db.execute(query);
        console.log("✅ User table Modified: Added 'Junior Treasurer' to role ENUM.");

    } catch (error) {
        console.error('Error altering table:', error.message);
    } finally {
        process.exit();
    }
};

modifyEnum();
