const db = require('./config/db');

async function fixChathura() {
  try {
    // Force update Chathura's role to match the frontend expectations
    await db.query(`
      UPDATE user 
      SET 
        role = 'academic_staff', 
        user_type = 'Academic_Staff'
      WHERE full_name LIKE '%Chathura%'
    `);
    console.log("✅ Updated Chathura Rajapakse to Academic Staff role.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixChathura();
