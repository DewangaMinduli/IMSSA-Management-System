const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
// const submissionService = require('../utils/submissionService'); // Firebase not setup yet
const notificationService = require('../utils/notificationService');

// Student lookup (for task assignment)
router.get('/lookup-student', async (req, res) => {
    const db = require('../config/db');
    const { student_number } = req.query;
    if (!student_number) return res.status(400).json({ message: 'student_number required' });
    try {
        const [rows] = await db.execute(
            'SELECT user_id, full_name, student_number FROM user WHERE student_number = ? LIMIT 1',
            [student_number]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
        res.json(rows[0]);
    } catch(e) { res.status(500).json({ message: 'Server Error' }); }
});

// Event CRUD
router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);
router.get('/:id/details', eventController.getEventDetails);
router.post('/:id/oc', eventController.addOCMember);
router.put('/:id/oc-designation', eventController.updateOCDesignation);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// OC Member update
router.patch('/oc/:eoId', eventController.updateOCMember);

// Task routes
router.post('/:id/tasks', eventController.addTask);
router.put('/:id/tasks/:taskId', eventController.updateTask);
router.patch('/:id/tasks/:taskId', eventController.updateTaskStatus);
router.delete('/:id/tasks/:taskId', eventController.deleteTask);
router.patch('/tasks/:taskId/assignments/:assignmentId/status', eventController.updateTaskAssignmentStatus);

// Volunteer routes
router.get('/volunteer-opportunities', eventController.getVolunteerOpportunities);
router.post('/tasks/:taskId/volunteer', eventController.volunteerForTask);
router.get('/my-tasks', eventController.getMyTasks);

// Tasks to approve (OC / Exec)
router.get('/tasks-to-approve', eventController.getTasksToApprove);

// Task Details, Submissions & Comments
router.get('/tasks/:taskId/assignments/:assignmentId', eventController.getTaskAssignmentDetails);
router.patch('/tasks/:taskId/assignments/:assignmentId/submit', eventController.submitTaskAssignment);
router.post('/tasks/:taskId/assignments/:assignmentId/submit-with-link', eventController.submitTaskWithLink);
router.get('/tasks/:taskId/assignments/:assignmentId/comments', eventController.getComments);
router.post('/tasks/:taskId/assignments/:assignmentId/comments', eventController.addComment);

// Notifications
router.get('/notifications', async (req, res) => {
    try {
        const { user_id, limit = 20, unread_only } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id is required' });
        
        const notifications = await notificationService.getNotifications(parseInt(user_id), parseInt(limit), unread_only === 'true');
        res.json(notifications);
    } catch (err) {
        console.error('[Notifications Route] Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

router.get('/notifications/unread-count', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id is required' });
        
        const count = await notificationService.getUnreadCount(parseInt(user_id));
        res.json({ unread_count: count });
    } catch (err) {
        console.error('[Unread Count Route] Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

router.patch('/notifications/:notificationId/read', eventController.markNotificationAsRead);
router.patch('/notifications/read-all', eventController.markAllNotificationsAsRead);

// Timeline
router.post('/:id/timeline', eventController.addTimelineEvent);
router.put('/:id/timeline/:timelineId', eventController.updateTimelineEvent);
router.delete('/:id/timeline/:timelineId', eventController.deleteTimelineEvent);

// Partnership routes
router.post('/:id/partnerships', eventController.addPartnership);
router.put('/:id/partnerships/:partnershipId', eventController.updatePartnership);
router.delete('/:id/partnerships/:partnershipId', eventController.deletePartnership);
router.get('/partnerships/archive', eventController.getPartnershipArchive);

module.exports = router;
