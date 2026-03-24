const db = require('../config/db');

// --- GET OWN PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id required' });

        const [rows] = await db.execute(`
            SELECT u.user_id, u.full_name, u.email, u.phone_number, u.academic_year,
                   u.academic_level, u.user_type, u.account_status, u.created_at,
                   u.student_number,
                   COALESCE(
                       (SELECT r.role_name FROM member_role mr JOIN role r ON mr.role_id = r.role_id WHERE mr.user_id = u.user_id LIMIT 1),
                       u.user_type
                   ) as role_name
            FROM user u
            WHERE u.user_id = ?`, [user_id]);

        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//UPDATE OWN PROFILE 
exports.updateProfile = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id required' });

        const { full_name, phone_number } = req.body;
        await db.execute(
            'UPDATE user SET full_name = ?, phone_number = ? WHERE user_id = ?',
            [full_name, phone_number, user_id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//GET ALL ACADEMIC STAFF 
exports.getAcademicStaff = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT user_id, full_name, email FROM user WHERE user_type = ?',
            ['Academic_Staff']
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching academic staff:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- STUDENT SEARCH ---
exports.searchStudents = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        
        const searchTerm = `%${q}%`;
        const [rows] = await db.execute(
            `SELECT u.user_id, u.student_number as student_no, u.full_name,
                    COALESCE(
                        (SELECT r.role_name FROM member_role mr JOIN role r ON mr.role_id = r.role_id WHERE mr.user_id = u.user_id LIMIT 1),
                        u.user_type
                    ) as role_name
             FROM user u
             WHERE u.user_type = 'Student' AND (u.student_number LIKE ? OR u.full_name LIKE ?)
             LIMIT 10`,
            [searchTerm, searchTerm]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- SKILL INVENTORY ---
exports.getSkillInventory = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT st.tag_id as skill_id, st.name, COUNT(msl.user_id) AS count
            FROM skill_tag st
            LEFT JOIN member_skill_level msl ON st.tag_id = msl.skill_tag_id
            GROUP BY st.tag_id, st.name
            ORDER BY count DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching skill inventory:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- MEMBERS WITH A SPECIFIC SKILL ---
exports.getSkillMembers = async (req, res) => {
    try {
        const { tag_id } = req.query;
        if (!tag_id) return res.json([]);
        const [rows] = await db.execute(`
            SELECT u.user_id, u.full_name, u.student_number as student_no, msl.points,
                   COALESCE(
                       (SELECT r.role_name FROM member_role mr JOIN role r ON mr.role_id = r.role_id WHERE mr.user_id = u.user_id LIMIT 1),
                       u.user_type
                   ) as role_name
            FROM member_skill_level msl
            JOIN user u ON msl.user_id = u.user_id
            WHERE msl.skill_tag_id = ?
            ORDER BY msl.points DESC
        `, [tag_id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching skill members:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- RECOMMENDATION REQUESTS ---
exports.getRecommendationRequests = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT lr.request_id, lr.student_user_id as student_id, lr.lecturer_user_id as academic_staff_id,
                   lr.requested_at as request_date, lr.status, lr.purpose, lr.recipient_name, lr.company_name,
                   u.full_name, u.student_number as student_no
            FROM letter_request lr
            JOIN user u ON lr.student_user_id = u.user_id
            ORDER BY lr.requested_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching recommendation requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- SUBMIT LETTER REQUEST ---
exports.submitLetterRequest = async (req, res) => {
    try {
        const { student_user_id, lecturer_user_id, purpose, recipient_name, company_name } = req.body;
        if (!student_user_id || !lecturer_user_id || !purpose || !recipient_name || !company_name) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        await db.execute(
            'INSERT INTO letter_request (student_user_id, lecturer_user_id, purpose, recipient_name, company_name, status) VALUES (?, ?, ?, ?, ?, ?)',
            [student_user_id, lecturer_user_id, purpose, recipient_name, company_name, 'Pending']
        );
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (error) {
        console.error('Error submitting letter request:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --- STUDENT ANALYTICS PROFILE ---
exports.getStudentAnalytics = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Basic Info
        const [userRows] = await db.execute(
            'SELECT user_id, full_name, student_number, academic_year, academic_level, email FROM user WHERE user_id = ?',
            [userId]
        );
        if (userRows.length === 0) return res.status(404).json({ message: "User not found" });
        const user = userRows[0];

        // 2. Event Roles (from event_coordinator)
        const [roles] = await db.execute(`
            SELECT e.event_name, ec.designation as role
            FROM event_coordinator ec
            JOIN event e ON ec.event_id = e.event_id
            WHERE ec.user_id = ?
        `, [userId]);

        // 3. Tasks Completed (from task_assignment and task)
        const [tasks] = await db.execute(`
            SELECT t.title as task_name, e.event_name
            FROM task_assignment ta
            JOIN task t ON ta.task_id = t.task_id
            JOIN event e ON t.event_id = e.event_id
            WHERE ta.assigned_user_id = ? AND ta.status = 'Completed'
        `, [userId]);

        // 4. Skills Gained (from member_skill_level and skill_tag)
        const [skills] = await db.execute(`
            SELECT st.name as skill_name, msl.points
            FROM member_skill_level msl
            JOIN skill_tag st ON msl.skill_tag_id = st.tag_id
            WHERE msl.user_id = ?
            ORDER BY msl.points DESC
        `, [userId]);

        // Aggregate
        const analytics = {
            ...user,
            eventRoles: roles,
            completedTasks: tasks,
            skills: skills
        };

        res.json(analytics);
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
