const db = require('../config/db');

exports.createFeedback = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Message is required" });
        
        await db.execute('INSERT INTO feedback (message) VALUES (?)', [message]);
        res.status(201).json({ message: "Feedback submitted anonymously" });
    } catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getFeedback = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT feedback_id as id, message as text, created_at FROM feedback ORDER BY created_at DESC');
        
        const formatted = rows.map(r => {
            const date = new Date(r.created_at);
            return {
                id: r.id,
                text: r.text,
                date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                time: "Secure Submission"
            };
        });
        
        res.json(formatted);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
