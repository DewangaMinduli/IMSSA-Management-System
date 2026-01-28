const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- HELPER: VALIDATION REGEX ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateIMNumber = (id) => /^IM\/20\d{2}\/\d{3}$/.test(id);
const validateStaffEmail = (email) => /^[a-zA-Z0-9._%+-]+@kln\.ac\.lk$/.test(email);
const validatePhoneNumber = (phone) => /^(?:\+94|0)?7\d{8}$/.test(phone);
const validateStrongPassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

exports.signup = async (req, res) => {
    try {
        const { identifier, full_name, password, phone_number } = req.body;
        if (!identifier || !full_name || !password || !phone_number) return res.status(400).json({ message: "All fields required" });

        if (!validateStrongPassword(password)) return res.status(400).json({ message: "Password weak" });
        if (!validatePhoneNumber(phone_number)) return res.status(400).json({ message: "Invalid phone" });

        let role = 'member';
        let student_number = null;
        let email = null;
        let finalEmail = req.body.email || "";

        if (validateStaffEmail(identifier)) { role = 'academic_staff'; email = identifier; }
        else if (validateIMNumber(identifier)) { role = 'member'; student_number = identifier; email = finalEmail; }
        else { return res.status(400).json({ message: "Invalid ID" }); }

        const [existing] = await db.execute('SELECT * FROM user WHERE (student_number = ? AND student_number IS NOT NULL) OR email = ?', [student_number, email]);
        if (existing.length > 0) return res.status(400).json({ message: "User exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userTypeDB = role === 'academic_staff' ? 'Academic_Staff' : 'Student';

        await db.execute('INSERT INTO user (student_number, full_name, email, phone_number, password_hash, role, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student_number, full_name, email, phone_number, hashedPassword, role, userTypeDB]);

        res.status(201).json({ message: "Registration successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ message: "Missing credentials" });

        const [users] = await db.execute('SELECT * FROM user WHERE student_number = ? OR email = ?', [identifier, identifier]);
        if (users.length === 0) return res.status(400).json({ message: "Invalid credentials" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // DEBUG LOG
        console.log("LOGIN SUCCESS USER:", user.full_name, "ROLE:", user.role, "LEVEL:", user.hierarchy_level);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                name: user.full_name,
                role: user.role,
                role_name: user.role, // Critical for frontend
                student_number: user.student_number,
                hierarchy_level: user.hierarchy_level, // Critical for frontend
                user_type: user.user_type
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const emailService = require('../utils/emailService');
exports.forgotPassword = async (req, res) => { /* simplified for brevity as not relevant to bug */ res.status(501).json({ message: "Not impl" }); };
exports.resetPassword = async (req, res) => { /* simplified */ res.status(501).json({ message: "Not impl" }); };
