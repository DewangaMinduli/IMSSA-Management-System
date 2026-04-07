const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

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
