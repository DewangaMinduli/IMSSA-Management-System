const multer = require('multer');
const db = require('../config/db');
const { uploadFile } = require('../config/firebase');

// Configure multer for memory storage (Firebase will handle final storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const ALLOWED_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/psd',
        'application/vnd.adobe.photoshop',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, JPEG, PNG, PSD, TXT, DOC, DOCX'), false);
    }
};

exports.uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// Submit task with optional file upload
exports.submitTaskWithFile = async (req, res) => {
    let connection;
    try {
        const { taskId, assignmentId } = req.params;
        const { submission_text } = req.body;
        const file = req.file;

        // Validate input
        if (!taskId || !assignmentId) {
            return res.status(400).json({ message: 'taskId and assignmentId are required' });
        }

        // Verify assignment exists
        const [assignmentCheck] = await db.execute(
            'SELECT assignment_id, task_id, assigned_user_id, status FROM task_assignment WHERE assignment_id = ? AND task_id = ?',
            [assignmentId, taskId]
        );

        if (assignmentCheck.length === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const assignment = assignmentCheck[0];

        // Get task proof_type requirement
        const [taskCheck] = await db.execute(
            'SELECT proof_type FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskCheck.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = taskCheck[0];
        const proofType = task.proof_type;

        // Validate submission based on proof type
        if (proofType === 'File_Upload' && !file) {
            return res.status(400).json({ message: 'This task requires a file upload' });
        }

        if (proofType === 'Description_Only' && !submission_text) {
            return res.status(400).json({ message: 'This task requires a text description' });
        }

        let submission_file_url = null;

        // Upload file if provided
        if (file) {
            try {
                const uploadResult = await uploadFile(file, `submissions/task-${taskId}`);
                submission_file_url = uploadResult.url;
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                return res.status(500).json({ message: `File upload failed: ${uploadError.message}` });
            }
        }

        // Update task assignment with submission
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            `UPDATE task_assignment 
             SET submission_text = ?, submission_file_url = ?, status = 'Submitted'
             WHERE assignment_id = ? AND task_id = ?`,
            [submission_text || null, submission_file_url, assignmentId, taskId]
        );

        // Add notification to relevant OC members
        const [eventCheck] = await db.execute(
            'SELECT event_id FROM task WHERE task_id = ?',
            [taskId]
        );

        if (eventCheck.length > 0) {
            const eventId = eventCheck[0].event_id;

            // Get all OC members
            const [ocMembers] = await db.execute(
                `SELECT DISTINCT user_id FROM event_coordinator WHERE event_id = ?`,
                [eventId]
            );

            // Create notifications for OC members
            if (ocMembers.length > 0) {
                for (const ocMember of ocMembers) {
                    await connection.execute(
                        `INSERT INTO notification (user_id, title, message, type) 
                         VALUES (?, ?, ?, 'TASK')`,
                        [
                            ocMember.user_id,
                            'Task Submission',
                            `A member has submitted their work for your task. Review and approve when ready.`
                        ]
                    );
                }
            }
        }

        await connection.commit();

        res.json({
            message: 'Task submitted successfully',
            assignment_id: assignmentId,
            status: 'Submitted',
            submitted_at: new Date().toISOString(),
            file_url: submission_file_url || null
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error submitting task:', err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};

// Get task assignment details with ability to download file
exports.getTaskAssignmentWithFile = async (req, res) => {
    try {
        const { taskId, assignmentId } = req.params;

        const [rows] = await db.execute(`
            SELECT 
                t.task_id as id, 
                t.title, 
                t.description as \`desc\`, 
                t.deadline as due, 
                t.status as task_status,
                t.proof_type,
                e.event_name, 
                e.event_id,
                ta.assignment_id, 
                ta.status as assignment_status, 
                ta.submission_text, 
                ta.submission_file_url,
                ta.verified_by_user_id,
                u.full_name as assigned_to,
                u.student_number as assigned_student_no
            FROM task t
            JOIN task_assignment ta ON t.task_id = ta.task_id
            JOIN event e ON t.event_id = e.event_id
            JOIN user u ON ta.assigned_user_id = u.user_id
            WHERE t.task_id = ? AND ta.assignment_id = ?
        `, [taskId, assignmentId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching assignment details:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
