// 1. USE 'require' (Standard Node.js stability)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 2. Import the Database Connection (The pool we created in config/db.js)
// This ensures authController can use db.execute()
const db = require('./config/db');

// 3. Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const financeRoutes = require('./routes/financeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows the server to read JSON from React

// --- ROUTES ---
// This connects your Login/Signup logic to the internet
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);

// Test Route (To check if server is alive)
app.get('/', (req, res) => {
    res.send('IMSSA Backend is running with MySQL Connection!');
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Optional: Test the DB connection on startup
    db.getConnection()
        .then(conn => {
            console.log("✅ Database connected successfully (MySQL2)");
            conn.release();
        })
        .catch(err => {
            console.error("❌ Database connection failed:", err);
        });
});