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

        // 2. Get Event Tasks (with volunteer flag and assignment info)
        const [tasks] = await db.execute(`
            SELECT t.task_id as id, t.title, t.description, t.deadline, t.status,
                   t.is_volunteer_opportunity, t.priority, t.proof_type,
                   GROUP_CONCAT(u.full_name SEPARATOR ', ') as assignedTo
            FROM task t
            LEFT JOIN task_assignment ta ON t.task_id = ta.task_id
            LEFT JOIN user u ON ta.assigned_user_id = u.user_id
            WHERE t.event_id = ?
            GROUP BY t.task_id
            ORDER BY t.deadline ASC
        `, [eventId]);

        // 3. Get Event OC details
        const [ocMembers] = await db.execute(`
            SELECT eo.id as eo_id, eo.user_id, eo.designation as role, 
                   u.full_name as name, u.student_number as student_id
            FROM event_coordinator eo
            JOIN user u ON eo.user_id = u.user_id
            WHERE eo.event_id = ?
        `, [eventId]);

        // 4. Get Event Timeline
        const [timeline] = await db.execute(`
            SELECT timeline_id as id, phase_name as title, scheduled_date as date
            FROM event_timeline
            WHERE event_id = ?
            ORDER BY scheduled_date ASC
        `, [eventId]);

        // 5. Get Partnerships for this event
        const [partnerships] = await db.execute(`
            SELECT partnership_id, company_name, contact_person, email,
                   package_type, amount_promised, status
            FROM partnership
            WHERE event_id = ?
            ORDER BY partnership_id DESC
        `, [eventId]);

        res.json({ event, tasks, committee: ocMembers, timeline, partnerships });

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

        await connection.execute(
            `DELETE FROM task_assignment WHERE task_id IN (SELECT task_id FROM task WHERE event_id = ?)`,
            [eventId]
        );
        await connection.execute(`DELETE FROM task WHERE event_id = ?`, [eventId]);
        await connection.execute(`DELETE FROM event_coordinator WHERE event_id = ?`, [eventId]);
        await connection.execute(`DELETE FROM event_timeline WHERE event_id = ?`, [eventId]);
        await connection.execute(`DELETE FROM partnership WHERE event_id = ?`, [eventId]);

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

        const [eventResult] = await connection.execute(
            `INSERT INTO event (term_id, event_name, description, venue, created_by_user_id, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [term_id, event_name, description || null, venue || null, created_by_user_id, start_date || null, end_date || null]
        );
        const newEventId = eventResult.insertId;

        if (ocMembers && ocMembers.length > 0) {
            for (const member of ocMembers) {
                const { user_id, designation } = member;

                await connection.execute(
                    `INSERT INTO event_coordinator (event_id, user_id, designation) VALUES (?, ?, ?)`,
                    [newEventId, user_id, designation || 'Organizing Committee Member']
                );

                const [roleCheck] = await connection.execute(
                    `SELECT * FROM member_role 
                     WHERE user_id = ? AND term_id = ? AND role_id = (SELECT role_id FROM role WHERE role_name = 'Organizing_Committee')`,
                    [user_id, term_id]
                );

                if (roleCheck.length === 0) {
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

// Add a new OC member to an event
exports.addOCMember = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { student_id, role } = req.body;
        
        console.log("Adding OC member. Event:", eventId, "Body:", req.body);

        if (!student_id) return res.status(400).json({ message: 'Student Number is required.' });

        // 1. Find user by student number
        const [users] = await db.execute(
            `SELECT user_id FROM user WHERE student_number = ? LIMIT 1`,
            [student_id.trim()]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: `No student found with number: ${student_id}` });
        }

        const userId = users[0].user_id;

        // 2. Check if already in OC
        const [existing] = await db.execute(
            `SELECT id FROM event_coordinator WHERE event_id = ? AND user_id = ?`,
            [eventId, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Student is already a member of this Organizing Committee.' });
        }

        // 3. Insert
        await db.execute(
            `INSERT INTO event_coordinator (event_id, user_id, designation) VALUES (?, ?, ?)`,
            [eventId, userId, role || 'Organizing Committee Member']
        );

        // 4. Optionally: ensure they have the OC role for this term (logic from createEvent)
        const [eventRows] = await db.execute('SELECT term_id FROM event WHERE event_id = ?', [eventId]);
        if (eventRows.length > 0) {
            const termId = eventRows[0].term_id;
            await db.execute(
                `INSERT IGNORE INTO member_role (user_id, role_id, term_id, status)
                 VALUES (?, (SELECT role_id FROM role WHERE role_name = 'Organizing_Committee'), ?, 'Active')`,
                [userId, termId]
            );
        }

        res.status(201).json({ message: 'OC Member added successfully' });
    } catch (err) {
        console.error("Error adding OC member:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update full OC member row (designation, and optionally swap user)
exports.updateOCMember = async (req, res) => {
    try {
        const { eoId } = req.params;
        const { designation, student_id } = req.body;

        if (!designation) return res.status(400).json({ message: 'designation is required.' });

        let userId = null;
        if (student_id) {
            const [users] = await db.execute(
                `SELECT user_id FROM user WHERE student_number = ? LIMIT 1`,
                [student_id.trim()]
            );
            if (users.length > 0) {
                userId = users[0].user_id;
            } else {
                return res.status(404).json({ message: "Student ID not found." });
            }
        }

        if (userId) {
            await db.execute(
                `UPDATE event_coordinator SET designation = ?, user_id = ? WHERE id = ?`,
                [designation, userId, eoId]
            );
        } else {
            await db.execute(
                `UPDATE event_coordinator SET designation = ? WHERE id = ?`,
                [designation, eoId]
            );
        }

        res.json({ message: 'OC member updated successfully' });
    } catch (err) {
        console.error("Error updating OC member:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ---------------------------------------------------------------------------------------------------
// TASK ENDPOINTS
// ---------------------------------------------------------------------------------------------------

exports.addTask = async (req, res) => {
    let connection;
    try {
        const eventId = req.params.id;
        const { title, description, assignedTo, deadline, status, is_volunteer_opportunity, priority, proof_type, skills } = req.body;

        if (!title) return res.status(400).json({ message: "Task title is required." });

        const isVolunteer = is_volunteer_opportunity ? 1 : 0;
        const pType = proof_type || 'None';

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `INSERT INTO task (event_id, title, description, deadline, status, is_volunteer_opportunity, priority, proof_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, title, description || null, deadline || null, status || 'Pending', isVolunteer, priority || 'Medium', pType]
        );
        
        const newTaskId = result.insertId;

        // Resolve assignees
        if (assignedTo && !isVolunteer) {
            let assignees = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
            for (const assignee of assignees) {
                if (!assignee) continue;
                let userId = null;
                const trimmed = String(assignee).trim();
                
                // Always try looking up as a student number first
                const [users] = await connection.execute(
                    `SELECT user_id FROM user WHERE student_number = ? LIMIT 1`,
                    [trimmed]
                );
                
                if (users.length > 0) {
                    userId = users[0].user_id;
                } else if (/^\d+$/.test(trimmed)) {
                    // Fallback to direct ID if numeric and no student number matches
                    userId = parseInt(trimmed);
                }

                if (userId) {
                    await connection.execute(
                        `INSERT INTO task_assignment (task_id, assigned_user_id, status) VALUES (?, ?, 'Assigned')`,
                        [newTaskId, userId]
                    );
                }
            }
        }

        // Apply skills mapping
        if (skills && Array.isArray(skills)) {
            for (const skillId of skills) {
                if (skillId) {
                    await connection.execute(
                         `INSERT INTO task_skill (task_id, skill_tag_id) VALUES (?, ?)`,
                         [newTaskId, parseInt(skillId)]
                    );
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Task added successfully', task_id: newTaskId });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error adding task:", err);
        res.status(500).json({ message: 'Server Error adding task' });
    } finally {
        if (connection) connection.release();
    }
};

// Update a task (title, description, deadline, priority)
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, deadline, priority, status, is_volunteer_opportunity } = req.body;

        if (!title) return res.status(400).json({ message: 'Title is required.' });

        await db.execute(
            `UPDATE task SET title = ?, description = ?, deadline = ?, priority = ?, status = ?, is_volunteer_opportunity = ? WHERE task_id = ?`,
            [title, description || null, deadline || null, priority || 'Medium', status || 'Pending', is_volunteer_opportunity ? 1 : 0, taskId]
        );

        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a task and its assignments
// Delete a task, assignments, and skills
exports.deleteTask = async (req, res) => {
    let connection;
    try {
        const { id, taskId } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.execute(`DELETE FROM task_skill WHERE task_id = ?`, [taskId]);
        await connection.execute(`DELETE FROM task_assignment WHERE task_id = ?`, [taskId]);
        const [result] = await connection.execute(`DELETE FROM task WHERE task_id = ? AND event_id = ?`, [taskId, id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Task not found." });
        }

        await connection.commit();
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        if(connection) await connection.rollback();
        console.error("Error deleting task:", err);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if(connection) connection.release();
    }
};


// Update task assignment status (the lifecycle dropdown)
exports.updateTaskAssignmentStatus = async (req, res) => {
    try {
        const { taskId, assignmentId } = req.params;
        const { status } = req.body;

        const validStatuses = ['Volunteer', 'Assigned', 'In Progress', 'Submitted', 'Approved', 'Declined'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const [result] = await db.execute(
            `UPDATE task_assignment SET status = ? WHERE assignment_id = ? AND task_id = ?`,
            [status, assignmentId, taskId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found.' });

        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        console.error("Error updating assignment status:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { id, taskId } = req.params;
        const { status } = req.body;
        
        if (!status) return res.status(400).json({ message: "Status is required." });

        await db.execute(
            `UPDATE task SET status = ? WHERE task_id = ? AND event_id = ?`,
            [status, taskId, id]
        );
        res.json({ message: 'Task status updated' });
    } catch (err) {
        console.error("Error updating task status:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};



// Get tasks assigned to current user across all events
exports.getMyTasks = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id is required.' });

        const [tasks] = await db.execute(`
            SELECT t.task_id as id, t.title, t.description as desc, t.deadline as due,
                   e.event_name as event, e.event_id,
                   ta.status, t.priority
            FROM task t
            JOIN event e ON t.event_id = e.event_id
            JOIN task_assignment ta ON t.task_id = ta.task_id
            WHERE ta.assigned_user_id = ?
            ORDER BY t.deadline ASC
        `, [user_id]);

        res.json(tasks);
    } catch (err) {
        console.error("Error fetching my tasks:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all volunteer opportunity tasks (for all dashboards)
exports.getVolunteerOpportunities = async (req, res) => {
    try {
        const [tasks] = await db.execute(`
            SELECT t.task_id as id, t.title, t.description as desc, t.deadline as due,
                   e.event_name as event, e.event_id,
                   t.priority
            FROM task t
            JOIN event e ON t.event_id = e.event_id
            WHERE t.is_volunteer_opportunity = 1
              AND t.status != 'Completed'
            ORDER BY t.deadline ASC
        `);
        res.json(tasks);
    } catch (err) {
        console.error("Error fetching volunteer opportunities:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Member volunteers for a task
exports.volunteerForTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id } = req.body;

        if (!user_id) return res.status(400).json({ message: 'user_id is required.' });

        // Check if already volunteered
        const [existing] = await db.execute(
            `SELECT assignment_id FROM task_assignment WHERE task_id = ? AND assigned_user_id = ?`,
            [taskId, user_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'You have already volunteered for this task.' });
        }

        await db.execute(
            `INSERT INTO task_assignment (task_id, assigned_user_id, status) VALUES (?, ?, 'Assigned')`,
            [taskId, user_id]
        );

        res.status(201).json({ message: 'Successfully volunteered for task.' });
    } catch (err) {
        console.error("Error volunteering for task:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ---------------------------------------------------------------------------------------------------
// TIMELINE ENDPOINTS
// ---------------------------------------------------------------------------------------------------

exports.addTimelineEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { title, date } = req.body;

        if (!title || !date) return res.status(400).json({ message: "Title and Date are required." });

        const [result] = await db.execute(
            `INSERT INTO event_timeline (event_id, phase_name, scheduled_date)
             VALUES (?, ?, ?)`,
            [eventId, title, date]
        );
        res.status(201).json({ message: 'Timeline event added successfully', timeline_id: result.insertId });
    } catch (err) {
        console.error("Error adding timeline event:", err);
        res.status(500).json({ message: 'Server Error adding timeline event' });
    }
};

exports.updateTimelineEvent = async (req, res) => {
    try {
        const { id, timelineId } = req.params;
        const { title, date } = req.body;
        if (!title || !date) return res.status(400).json({ message: "Title and Date are required." });

        await db.execute(
            `UPDATE event_timeline SET phase_name = ?, scheduled_date = ? WHERE timeline_id = ? AND event_id = ?`,
            [title, date, timelineId, id]
        );
        res.json({ message: 'Timeline event updated' });
    } catch (err) {
        console.error("Error updating timeline:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteTimelineEvent = async (req, res) => {
    try {
        const { id, timelineId } = req.params;
        await db.execute(`DELETE FROM event_timeline WHERE timeline_id = ? AND event_id = ?`, [timelineId, id]);
        res.json({ message: 'Timeline event deleted' });
    } catch (err) {
        console.error("Error deleting timeline:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ---------------------------------------------------------------------------------------------------
// PARTNERSHIP ENDPOINTS
// ---------------------------------------------------------------------------------------------------

exports.addPartnership = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { company_name, contact_person, email, package_type, amount_promised, status } = req.body;

        if (!company_name) return res.status(400).json({ message: "Company Name is required." });

        const validStatuses = ['Paid', 'Declined'];
        const finalStatus = validStatuses.includes(status) ? status : 'Paid';

        const [result] = await db.execute(
            `INSERT INTO partnership (event_id, company_name, contact_person, email, package_type, amount_promised, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [eventId, company_name, contact_person || null, email || null, package_type || null, amount_promised || null, finalStatus]
        );
        res.status(201).json({ message: 'Partnership added successfully', partnership_id: result.insertId });
    } catch (err) {
        console.error("Error adding partnership:", err);
        res.status(500).json({ message: 'Server Error adding partnership' });
    }
};

// Get archived partnerships (last 5 years, across all events)
exports.getPartnershipArchive = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.partnership_id, p.company_name, p.contact_person, p.email,
                   p.package_type, p.amount_promised, p.status,
                   e.event_name, e.start_date
            FROM partnership p
            JOIN event e ON p.event_id = e.event_id
            WHERE e.start_date >= DATE_SUB(NOW(), INTERVAL 5 YEAR)
            ORDER BY e.start_date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching partnership archive:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updatePartnership = async (req, res) => {
    try {
        const { id, partnershipId } = req.params;
        const { company_name, contact_person, email, package_type, amount_promised, status } = req.body;
        
        if (!company_name) return res.status(400).json({ message: "Company Name is required." });

        await db.execute(
            `UPDATE partnership 
             SET company_name=?, contact_person=?, email=?, package_type=?, amount_promised=?, status=?
             WHERE partnership_id = ? AND event_id = ?`,
             [company_name, contact_person || null, email || null, package_type || null, amount_promised || null, status || 'Paid', partnershipId, id]
        );
        res.json({ message: 'Partnership updated' });
    } catch (err) {
        console.error("Error updating partnership:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deletePartnership = async (req, res) => {
    try {
        const { id, partnershipId } = req.params;
        await db.execute(`DELETE FROM partnership WHERE partnership_id = ? AND event_id = ?`, [partnershipId, id]);
        res.json({ message: 'Partnership deleted' });
    } catch (err) {
        console.error("Error deleting partnership:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

