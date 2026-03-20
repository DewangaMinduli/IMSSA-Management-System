const db = require('../config/db');

exports.getAllEvents = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.event_id, e.event_name, e.status, e.start_date, e.end_date, 
                   COUNT(DISTINCT eo.user_id) as oc_count,
                   COUNT(DISTINCT t.task_id) as task_count
            FROM event e
            LEFT JOIN event_coordinator eo ON e.event_id = eo.event_id
            LEFT JOIN task t ON e.event_id = t.event_id
            GROUP BY e.event_id
            ORDER BY e.start_date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id;

        // 1. Get Event Basic Info
        const [eventRows] = await db.execute('SELECT * FROM event WHERE event_id = ?', [eventId]);
        if (eventRows.length === 0) return res.status(404).json({ message: 'Event not found' });
        const event = eventRows[0];

        // 2. Get Event Tasks
        const [tasks] = await db.execute(`
            SELECT t.task_id as id, t.task_name as title, t.deadline, t.status,
                   u.full_name as assignedTo
            FROM task t
            LEFT JOIN user u ON t.assigned_to = u.user_id
            WHERE t.event_id = ?
            ORDER BY t.deadline ASC
        `, [eventId]);

        // 3. Get Event OC details
        const [ocMembers] = await db.execute(`
            SELECT eo.id as eo_id, eo.role, u.full_name as name, u.student_no as id
            FROM event_coordinator eo
            JOIN user u ON eo.user_id = u.user_id
            WHERE eo.event_id = ?
        `, [eventId]);

        // 4. Get Event Timeline
        const [timeline] = await db.execute(`
            SELECT id, title, description, start_date as date
            FROM event_timeline
            WHERE event_id = ?
            ORDER BY start_date ASC
        `, [eventId]);

        res.json({
            event,
            tasks,
            committee: ocMembers,
            timeline
        });

    } catch (err) {
        console.error("Error fetching event details:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
