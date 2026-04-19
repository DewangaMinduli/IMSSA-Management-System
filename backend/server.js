// Core Dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Database Connection
const db = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const financeRoutes = require('./routes/financeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const skillRoutes = require('./routes/skillRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/skills', skillRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('IMSSA Backend is running with MySQL Connection!');
});

// Server Initialization
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Verify DB connectivity on startup
    db.getConnection()
        .then(conn => {
            console.log("✅ Database connected successfully (MySQL2)");
            conn.release();
        })
        .catch(err => {
            console.error("❌ Database connection failed:", err);
        });
});