const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- HELPER: VALIDATION REGEX ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateIMNumber = (id) => /^IM\/20\d{2}\/\d{3}$/.test(id);
const validateStaffEmail = (email) => /^[a-zA-Z0-9._%+-]+@kln\.ac\.lk$/.test(email);
const validatePhoneNumber = (phone) => /^(?:\+94|0)?7\d{8}$/.test(phone);
const validateStrongPassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

// --- MODULES NEEDED ---
const crypto = require('crypto');
const emailService = require('../utils/emailService');

exports.signup = async (req, res) => {
    try {
        const { identifier, full_name, password, phone_number, academic_level } = req.body;
        if (!identifier || !full_name || !password) {
            return res.status(400).json({ message: "Identifier, full name, and password are required" });
        }

        if (!validateStrongPassword(password)) return res.status(400).json({ message: "Password too weak" });
        if (phone_number && !validatePhoneNumber(phone_number)) return res.status(400).json({ message: "Invalid phone format" });

        let role = 'member';
        let userTypeDB = 'Student';
        let student_number = null;
        let email = null;
        let finalEmail = req.body.email || "";

        // --- STAFF PATH ---
        if (validateStaffEmail(identifier)) {
            role = 'academic_staff';
            userTypeDB = 'Academic_Staff';
            email = identifier; // @kln.ac.lk is guaranteed by the regex
        } 
        // --- STUDENT PATH ---
        else if (validateIMNumber(identifier)) {
            role = 'member';
            userTypeDB = 'Student';
            student_number = identifier;
            email = finalEmail;
            
            if (!email || !validateEmail(email)) {
                return res.status(400).json({ message: "Valid email is required for students" });
            }
        } 
        else {
            return res.status(400).json({ message: "Invalid Identifier. Must be IM/20XX/XXX or @kln.ac.lk email." });
        }

        // --- UNIQUENESS VALIDATION ---
        const [existing] = await db.execute(
            'SELECT user_id FROM user WHERE (student_number = ? AND student_number IS NOT NULL) OR email = ?',
            [student_number, email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Student Number or Email is already registered" });
        }

        // --- CREATE USER ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Ensure Staff don't get academic logic
        const finalAcademicLevel = userTypeDB === 'Academic_Staff' ? null : (academic_level || null);

        const [insertResult] = await db.execute(
            `INSERT INTO user 
            (student_number, full_name, email, phone_number, password_hash, user_type, academic_level, account_status, verification_token, token_expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
            [student_number, full_name, email, phone_number || null, hashedPassword, userTypeDB, finalAcademicLevel, verificationToken, tokenExpiresAt]
        );

        const newUserId = insertResult.insertId;

        // Fetch the corresponding role_id
        const roleMapping = { 'member': 'Member', 'academic_staff': 'Academic_Staff' };
        const dbRoleName = roleMapping[role];

        const [roleRows] = await db.execute('SELECT role_id FROM role WHERE role_name = ?', [dbRoleName]);
        if (roleRows.length > 0) {
            const roleId = roleRows[0].role_id;
            // Fetch active term_id
            const [termRows] = await db.execute('SELECT term_id FROM term WHERE is_active = 1 LIMIT 1');
            const termId = termRows.length > 0 ? termRows[0].term_id : 1; // Fallback to 1 if no active term

            // Assign role to user
            await db.execute(
                'INSERT INTO member_role (user_id, role_id, term_id, status) VALUES (?, ?, ?, ?)',
                [newUserId, roleId, termId, 'Active']
            );
        }

        // --- SEND VERIFICATION EMAIL ---
        // (Assuming emailService will be expanded to support this method later)
        if (emailService.sendVerificationEmail) {
            await emailService.sendVerificationEmail(email, verificationToken);
        } else {
            // Fallback development log
            console.log(`[DEV ONLY] Verify Link for ${email}: http://localhost:5173/verify?token=${verificationToken}`);
        }

        res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ message: "Missing credentials" });

        const [users] = await db.execute(`
            SELECT u.*, r.role_name as db_role_name, r.hierarchy_level 
            FROM user u
            LEFT JOIN member_role mr ON u.user_id = mr.user_id AND mr.status = 'Active'
            LEFT JOIN role r ON mr.role_id = r.role_id
            WHERE u.student_number = ? OR u.email = ?
            ORDER BY r.hierarchy_level DESC
        `, [identifier, identifier]);
        if (users.length === 0) return res.status(400).json({ message: "Invalid credentials" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Ensure user is verified/active
        if (user.account_status === 'Pending') {
            return res.status(403).json({ message: "Account is pending verification. Please check your email to verify your account before logging in." });
        }
        if (user.account_status === 'Suspended') {
            return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });
        }

        let normalizedRole = 'member';
        let displayRoleName = 'Member';
        
        switch(user.db_role_name) {
            case 'Academic_Staff': normalizedRole = 'academic_staff'; displayRoleName = 'Academic Staff'; break;
            case 'Executive_Board': normalizedRole = 'executive'; displayRoleName = 'Executive Board'; break;
            case 'President': normalizedRole = 'executive'; displayRoleName = 'President'; break;
            case 'Junior_Treasurer': normalizedRole = 'junior_treasurer'; displayRoleName = 'Junior Treasurer'; break;
            case 'Senior_Treasurer': normalizedRole = 'senior_treasurer'; displayRoleName = 'Senior Treasurer'; break;
            case 'Organizing_Committee': normalizedRole = 'organizing_committee'; displayRoleName = 'Organizing Committee'; break;
            default: normalizedRole = 'member'; displayRoleName = 'Member';
        }

        const hierarchy_level = user.hierarchy_level || 1;

        const token = jwt.sign({ id: user.user_id, role: normalizedRole }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // DEBUG LOG
        console.log("LOGIN SUCCESS USER:", user.full_name, "ROLE:", normalizedRole, "LEVEL:", hierarchy_level);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                name: user.full_name,
                role: normalizedRole,
                role_name: displayRoleName, // Critical for frontend
                student_number: user.student_number,
                hierarchy_level: hierarchy_level, // Critical for frontend
                user_type: user.user_type
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });

        const [users] = await db.execute(
            'SELECT user_id, token_expires_at FROM user WHERE verification_token = ?',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid verification token" });
        }

        const user = users[0];
        
        if (new Date(user.token_expires_at) < new Date()) {
            return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
        }

        // Activate account and clear token
        await db.execute(
            'UPDATE user SET account_status = ?, verification_token = NULL, token_expires_at = NULL WHERE user_id = ?',
            ['Active', user.user_id]
        );

        res.json({ message: "Email verified successfully. You can now log in." });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Server Error during verification" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ message: "Identifier is required" });

        const [users] = await db.execute(
            'SELECT user_id, email, full_name FROM user WHERE student_number = ? OR email = ?',
            [identifier, identifier]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];
        
        // Generate Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.execute(
            'UPDATE user SET verification_token = ?, token_expires_at = ? WHERE user_id = ?',
            [resetToken, tokenExpiresAt, user.user_id]
        );

        if (emailService.sendResetEmail) {
            await emailService.sendResetEmail(user.email, resetToken);
        } else {
            console.log(`[DEV ONLY] Reset Link for ${user.email}: http://localhost:5173/reset-password?token=${resetToken}`);
        }

        res.json({ message: "Password reset instructions have been sent to your email." });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: "Token and new password are required" });

        if (!validateStrongPassword(newPassword)) {
            return res.status(400).json({ message: "Password too weak" });
        }

        const [users] = await db.execute(
            'SELECT user_id, token_expires_at FROM user WHERE verification_token = ?',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid reset token" });
        }

        const user = users[0];

        if (new Date(user.token_expires_at) < new Date()) {
            return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.execute(
            'UPDATE user SET password_hash = ?, verification_token = NULL, token_expires_at = NULL WHERE user_id = ?',
            [hashedPassword, user.user_id]
        );

        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
