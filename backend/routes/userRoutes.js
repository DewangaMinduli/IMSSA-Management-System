const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET http://localhost:5000/api/users/academic-staff
router.get('/academic-staff', userController.getAcademicStaff);

// GET/PUT http://localhost:5000/api/users/profile?user_id=...
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// GET http://localhost:5000/api/users/search?q=query
router.get('/search', userController.searchStudents);

// GET http://localhost:5000/api/users/skills
router.get('/skills', userController.getSkillInventory);

// GET http://localhost:5000/api/users/skills/members?tag_id=...
router.get('/skills/members', userController.getSkillMembers);

// GET / POST http://localhost:5000/api/users/requests
router.get('/requests', userController.getRecommendationRequests);
router.post('/requests', userController.submitLetterRequest);
router.delete('/requests/:id', userController.deleteLetterRequest);
router.get('/requests/:requestId/draft', userController.getRecommendationDraft);

// GET http://localhost:5000/api/users/:id/analytics
router.get('/:id/analytics', userController.getStudentAnalytics);

// POST http://localhost:5000/api/users/rollover
router.post('/rollover', userController.rolloverTerm);

module.exports = router;
