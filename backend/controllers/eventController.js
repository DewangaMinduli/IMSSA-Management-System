const db = require('../config/db');

exports.getAllEvents = async (req, res) => {
    try {
        const { user_id } = req.query;
        let query = `
            SELECT e.event_id, e.event_name, 'Active' as status, e.start_date, e.end_date, 
                   COUNT(DISTINCT eo.user_id) as oc_count,
                   COUNT(DISTINCT t.task_id) as task_count
            FROM event e
            LEFT JOIN event_coordinator eo ON e.event_id = eo.event_id
            LEFT JOIN task t ON e.event_id = t.event_id
        `;
        let params = [];

        if (user_id) {
            query += ` WHERE e.event_id IN (SELECT event_id FROM event_coordinator WHERE user_id = ?) `;
            params.push(user_id);
        }

        query += `
            GROUP BY e.event_id
            ORDER BY e.start_date DESC
        `;

        const [rows] = await db.query(query, params);
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
            SELECT t.task_id as id, t.title as title, t.deadline, t.status,
                   u.full_name as assignedTo
            FROM task t
            LEFT JOIN task_assignment ta ON t.task_id = ta.task_id
            LEFT JOIN user u ON ta.assigned_user_id = u.user_id
            WHERE t.event_id = ?
            ORDER BY t.deadline ASC
        `, [eventId]);

        // 3. Get Event OC details
        const [ocMembers] = await db.execute(`
            SELECT eo.id as eo_id, eo.designation as role, u.full_name as name, u.student_number as id
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
        console.error("Error fetching OC Events:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteEvent = async (req, res) => {
    let connection;
    try {
        const eventId = req.params.id;
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Delete associated Task Assignments
        await connection.execute(
            `DELETE FROM task_assignment WHERE task_id IN (SELECT task_id FROM task WHERE event_id = ?)`,
            [eventId]
        );

        // 2. Delete associated Tasks
        await connection.execute(`DELETE FROM task WHERE event_id = ?`, [eventId]);

        // 3. Delete associated Event Coordinators
        await connection.execute(`DELETE FROM event_coordinator WHERE event_id = ?`, [eventId]);

        // 4. Delete associated Timelines
        await connection.execute(`DELETE FROM event_timeline WHERE event_id = ?`, [eventId]);

        // 5. Delete the Event itself
        const [result] = await connection.execute(`DELETE FROM event WHERE event_id = ?`, [eventId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Event not found' });
        }

        await connection.commit();
        res.json({ message: 'Event deleted successfully' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error deleting event:", err);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { event_name, description, venue, start_date, end_date } = req.body;

        if (!event_name) return res.status(400).json({ message: 'Event Name is required' });

        await db.execute(
            `UPDATE event 
             SET event_name = ?, description = ?, venue = ?, start_date = ?, end_date = ? 
             WHERE event_id = ?`,
            [event_name, description || null, venue || null, start_date || null, end_date || null, eventId]
        );

        res.json({ message: 'Event updated successfully' });
    } catch (err) {
        console.error("Error updating event:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};



exports.createEvent = async (req, res) => {
    let connection;
    try {
        const { event_name, description, venue, start_date, end_date, created_by_user_id, term_id, ocMembers } = req.body;

        if (!event_name || !created_by_user_id || !term_id) {
            return res.status(400).json({ message: 'event_name, created_by_user_id, and term_id are required fields.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insert Event
        const [eventResult] = await connection.execute(
            `INSERT INTO event (term_id, event_name, description, venue, created_by_user_id, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [term_id, event_name, description || null, venue || null, created_by_user_id, start_date || null, end_date || null]
        );
        const newEventId = eventResult.insertId;

        // 2. Insert OC Members & Upgrade Roles if necessary
        if (ocMembers && ocMembers.length > 0) {
            for (const member of ocMembers) {
                const { user_id, designation } = member;
                
                // Insert into event_coordinator
                await connection.execute(
                    `INSERT INTO event_coordinator (event_id, user_id, designation) VALUES (?, ?, ?)`,
                    [newEventId, user_id, designation || 'Organizing Committee Member']
                );

                // Check if user has Organizing_Committee role for this term
                const [roleCheck] = await connection.execute(
                    `SELECT * FROM member_role 
                     WHERE user_id = ? AND term_id = ? AND role_id = (SELECT role_id FROM role WHERE role_name = 'Organizing_Committee')`,
                    [user_id, term_id]
                );

                if (roleCheck.length === 0) {
                    // Upgrade their role
                    await connection.execute(
                        `INSERT INTO member_role (user_id, role_id, term_id, status)
                         VALUES (?, (SELECT role_id FROM role WHERE role_name = 'Organizing_Committee'), ?, 'Active')`,
                        [user_id, term_id]
                    );
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Event created successfully', event_id: newEventId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error creating event:", err);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateOCDesignation = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { target_user_id, new_designation } = req.body;

        if (!target_user_id || !new_designation) {
            return res.status(400).json({ message: 'target_user_id and new_designation are required.' });
        }

        const [result] = await db.execute(
            `UPDATE event_coordinator SET designation = ? WHERE event_id = ? AND user_id = ?`,
            [new_designation, eventId, target_user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'OC member not found for this event.' });
        }

        res.json({ message: 'Designation updated successfully' });
    } catch (err) {
        console.error("Error updating designation:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
