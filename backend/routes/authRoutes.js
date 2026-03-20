const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST http://localhost:5000/api/auth/signup
router.post('/signup', authController.signup);

// POST http://localhost:5000/api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST http://localhost:5000/api/auth/login
router.post('/login', authController.login);

// POST http://localhost:5000/api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST http://localhost:5000/api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;