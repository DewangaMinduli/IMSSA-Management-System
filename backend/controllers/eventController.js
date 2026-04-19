const db = require('../config/db');
const notificationHelper = require('../utils/notificationHelper');

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
            SELECT 
                t.task_id as id, 
                t.title, 
                t.description, 
                t.deadline, 
                t.status,
                t.is_volunteer_opportunity, 
                t.priority, 
                t.proof_type,
                GROUP_CONCAT(DISTINCT u.full_name SEPARATOR ', ') as assignedTo,
                GROUP_CONCAT(DISTINCT u.student_number SEPARATOR ', ') as assignedStudentNumbers,
                GROUP_CONCAT(DISTINCT u.user_id SEPARATOR ',') as assignedUserIds,
                GROUP_CONCAT(DISTINCT ta.assignment_id SEPARATOR ',') as assignmentIds,
                COUNT(DISTINCT ta.assignment_id) as current_volunteers
            FROM task t
            LEFT JOIN task_assignment ta ON t.task_id = ta.task_id 
                AND ta.status IN ('Assigned', 'In_Progress', 'Submitted', 'Verified', 'Rejected')
            LEFT JOIN user u ON ta.assigned_user_id = u.user_id
            WHERE t.event_id = ?
            GROUP BY t.task_id
            ORDER BY t.deadline ASC
        `, [eventId]);

        // Fetch skills for tasks
        if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);
            const placeholders = taskIds.map(() => '?').join(',');
            const [taskSkills] = await db.execute(`
                SELECT task_id, skill_tag_id 
                FROM task_skill 
                WHERE task_id IN (${placeholders})
            `, taskIds);

            // Group skills by task_id
            const skillsByTask = {};
            taskSkills.forEach(ts => {
                if (!skillsByTask[ts.task_id]) {
                    skillsByTask[ts.task_id] = [];
                }
                skillsByTask[ts.task_id].push(ts.skill_tag_id);
            });

            // Attach to tasks
            tasks.forEach(task => {
                task.skills = skillsByTask[task.id] || [];
                
                // Parse volunteer limit from description (format: <!--VL:N-->)
                const volMatch = task.description?.match(/<!--VL:(\d+)-->/);
                task.volunteer_limit = volMatch ? parseInt(volMatch[1]) : 5;
                // Clean description
                task.description = task.description?.replace(/<!--VL:\d+-->/, '') || '';
            });
        }

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
            SELECT partnership_id, company_name, contact_person, email, contact_number,
                   package_type, amount_promised, status
            FROM partnership
            WHERE event_id = ?
            ORDER BY partnership_id DESC
        `, [eventId]);

        // Fetch assignments per task (task_id → first active assignment_id)
        if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);
            const placeholders2 = taskIds.map(() => '?').join(',');
            const [assignments] = await db.execute(`
                SELECT task_id, assignment_id, status as assignment_status, assigned_user_id
                FROM task_assignment
                WHERE task_id IN (${placeholders2})
                AND status IN ('Assigned', 'In_Progress', 'Submitted', 'Verified', 'Rejected')
                ORDER BY assignment_id ASC
            `, taskIds);

            // Map first assignment per task (or all for volunteer)
            const assignmentsByTask = {};
            assignments.forEach(a => {
                if (!assignmentsByTask[a.task_id]) {
                    assignmentsByTask[a.task_id] = a;
                }
            });

            tasks.forEach(task => {
                const asgn = assignmentsByTask[task.id];
                task.assignment_id = asgn?.assignment_id || null;
                task.assignment_status = asgn?.assignment_status || null;
                task.assigned_user_id = asgn?.assigned_user_id || null;
            });
        }

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
        
        // Send notification to all users about new event
        try {
            await notificationHelper.notifyNewEventCreated(newEventId, event_name, created_by_user_id);
        } catch (notifyErr) {
            console.error('[createEvent] Notification error:', notifyErr);
        }
        
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
        const { title, description, deadline, is_volunteer_opportunity, priority, proof_type, volunteer_limit, assigned_users, skills } = req.body;

        if (!title) return res.status(400).json({ message: "Task title is required." });

        const isVolunteer = is_volunteer_opportunity ? 1 : 0;
        const pType = proof_type || 'None';
        const volLimit = volunteer_limit || 5;
        
        // Append volunteer limit as hidden marker for volunteer opportunities
        let finalDesc = description || '';
        if (isVolunteer) {
            finalDesc = `${finalDesc}<!--VL:${volLimit}-->`;
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `INSERT INTO task (event_id, title, description, deadline, status, is_volunteer_opportunity, priority, proof_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, title, finalDesc || null, deadline || null, 'Pending', isVolunteer, priority || 'Medium', pType]
        );
        
        const newTaskId = result.insertId;

        // Resolve assignees
        if (assigned_users && !isVolunteer) {
            let assignees = Array.isArray(assigned_users) ? assigned_users : [assigned_users];
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
        res.status(500).json({ message: 'Server Error adding task: ' + err.message, error: err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
    }
};

// Update a task (title, description, deadline, priority)
exports.updateTask = async (req, res) => {
    let connection;
    try {
        const { taskId } = req.params;
        const { title, description, deadline, priority, status, is_volunteer_opportunity, volunteer_limit, assigned_users, proof_type, skills } = req.body;

        if (!title) return res.status(400).json({ message: 'Title is required.' });

        const isVolunteer = is_volunteer_opportunity ? 1 : 0;
        const pType = proof_type || 'None';
        const volLimit = volunteer_limit || 5;
        
        // Append volunteer limit as hidden marker for volunteer opportunities
        let finalDesc = description || '';
        if (isVolunteer) {
            finalDesc = `${finalDesc}<!--VL:${volLimit}-->`;
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            `UPDATE task SET title = ?, description = ?, deadline = ?, priority = ?, status = ?, is_volunteer_opportunity = ?, proof_type = ? WHERE task_id = ?`,
            [title, finalDesc || null, deadline || null, priority || 'Medium', status || 'Pending', isVolunteer, pType, taskId]
        );

        if (!isVolunteer && assigned_users !== undefined) {
            await connection.execute(`DELETE FROM task_assignment WHERE task_id = ?`, [taskId]);
            let assignees = Array.isArray(assigned_users) ? assigned_users : [assigned_users];
            for (const assignee of assignees) {
                if (!assignee) continue;
                let userId = null;
                const trimmed = String(assignee).trim();
                
                const [users] = await connection.execute(
                    `SELECT user_id FROM user WHERE student_number = ? LIMIT 1`,
                    [trimmed]
                );
                
                if (users.length > 0) {
                    userId = users[0].user_id;
                } else if (/^\d+$/.test(trimmed)) {
                    userId = parseInt(trimmed);
                }

                if (userId) {
                    await connection.execute(
                        `INSERT INTO task_assignment (task_id, assigned_user_id, status) VALUES (?, ?, 'Assigned')`,
                        [taskId, userId]
                    );
                }
            }
        }

        if (skills !== undefined) {
            await connection.execute(`DELETE FROM task_skill WHERE task_id = ?`, [taskId]);
            let skillList = Array.isArray(skills) ? skills : [skills];
            for (const skillId of skillList) {
                if (skillId) {
                    await connection.execute(
                         `INSERT INTO task_skill (task_id, skill_tag_id) VALUES (?, ?)`,
                         [taskId, parseInt(skillId)]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if (connection) connection.release();
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
    let connection;
    try {
        const { taskId, assignmentId } = req.params;
        let { status } = req.body;

        console.log(`[updateTaskAssignmentStatus] Request: taskId=${taskId}, assignmentId=${assignmentId}, requestedStatus=${status}`);

        // Normalize frontend statuses
        if (status === 'Approved' || status === 'Verify') status = 'Verified';
        if (status === 'Declined' || status === 'Reject' || status === 'Needs_Revision') status = 'Rejected';
        if (status === 'In Progress') status = 'In_Progress';

        const validStatuses = ['Volunteer', 'Assigned', 'In_Progress', 'Submitted', 'Verified', 'Rejected'];
        if (!validStatuses.includes(status)) {
            console.error(`[updateTaskAssignmentStatus] Invalid status: ${status}`);
            return res.status(400).json({ message: 'Invalid status value: ' + status });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE task_assignment SET status = ? WHERE assignment_id = ? AND task_id = ?`,
            [status, assignmentId, taskId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        // Get assignment details to determine notification and skill awards
        const [assignmentData] = await connection.execute(
            `SELECT ta.assigned_user_id, t.title, t.priority, t.task_id
             FROM task_assignment ta
             JOIN task t ON ta.task_id = t.task_id
             WHERE ta.assignment_id = ?`,
            [assignmentId]
        );

        if (assignmentData.length > 0) {
            const { assigned_user_id, title, priority, task_id } = assignmentData[0];

            // 1. APPROVAL LOGIC (Status: Verified)
            if (status === 'Verified') {
                const points = priority === 'High' ? 30 : priority === 'Medium' ? 20 : 10;

                // Award Skills
                const [skills] = await connection.execute(
                    `SELECT skill_tag_id FROM task_skill WHERE task_id = ?`,
                    [task_id]
                );

                if (skills.length > 0) {
                    for (const row of skills) {
                        await connection.execute(`
                            INSERT INTO member_skill_level (user_id, skill_tag_id, points, last_verified_at)
                            VALUES (?, ?, ?, NOW())
                            ON DUPLICATE KEY UPDATE points = points + ?, last_verified_at = NOW()
                        `, [assigned_user_id, row.skill_tag_id, points, points]);
                    }
                }

                // Update Parent Task Status to Verified
                await connection.execute(
                    `UPDATE task SET status = 'Verified' WHERE task_id = ?`,
                    [task_id]
                );

                // Notify Member
                await connection.execute(
                    `INSERT INTO notification (user_id, title, message, type) 
                     VALUES (?, 'Task Approved', ?, 'TASK')`,
                    [assigned_user_id, `Your work for "${title}" has been approved. Skills points awarded!`]
                );

                console.log(`[updateTaskAssignmentStatus] Task ${task_id} marked as Completed and assignment ${assignmentId} Verified.`);
            } 
            
            // 2. REVISION LOGIC (Status: Rejected)
            else if (status === 'Rejected') {
                // Ensure parent task is not Completed if an assignment is rejected
                await connection.execute(
                    `UPDATE task SET status = 'In Progress' WHERE task_id = ? AND status = 'Submitted'`,
                    [task_id]
                );

                // Notify Member
                await connection.execute(
                    `INSERT INTO notification (user_id, title, message, type) 
                     VALUES (?, 'Revisions Requested', ?, 'TASK')`,
                    [assigned_user_id, `Your submission for "${title}" needs revisions. Check the discussion for feedback.`]
                );
                
                console.log(`[updateTaskAssignmentStatus] Assignment ${assignmentId} rejected (Needs Revision).`);
            }
        }

        await connection.commit();
        res.json({ 
            message: 'Status updated successfully', 
            newStatus: status,
            isApproved: status === 'Verified'
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error updating assignment status:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateTaskStatus = async (req, res) => {
    let connection;
    try {
        const { id: eventId, taskId } = req.params;
        let { status } = req.body;
        
        if (!status) return res.status(400).json({ message: "Status is required." });

        // Normalize status
        if (status === 'Approved' || status === 'Completed') status = 'Verified';
        if (status === 'Declined') status = 'Pending';

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Update Task Status
        const [result] = await connection.execute(
            `UPDATE task SET status = ? WHERE task_id = ? AND event_id = ?`,
            [status, taskId, eventId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Task not found." });
        }

        // 2. If marking as Verified, also verify any 'Submitted' assignments
        if (status === 'Verified') {
            // Find all 'Submitted' or 'In_Progress' assignments for this task
            const [assignments] = await connection.execute(
                `SELECT assignment_id FROM task_assignment WHERE task_id = ? AND status IN ('Submitted', 'In_Progress', 'Assigned')`,
                [taskId]
            );

            // Verify them all (triggers skill awards)
            for (const asgn of assignments) {
                // Here we call the same logic as updateTaskAssignmentStatus but manually
                await connection.execute(
                    `UPDATE task_assignment SET status = 'Verified' WHERE assignment_id = ?`,
                    [asgn.assignment_id]
                );

                // Award Skills logic (duplicated for safety or we could refactor)
                // Fetch details for this assignment
                const [asgnData] = await connection.execute(
                    `SELECT ta.assigned_user_id, t.priority 
                     FROM task_assignment ta JOIN task t ON ta.task_id = t.task_id
                     WHERE ta.assignment_id = ?`,
                    [asgn.assignment_id]
                );

                if (asgnData.length > 0) {
                    const { assigned_user_id, priority } = asgnData[0];
                    const points = priority === 'High' ? 30 : priority === 'Medium' ? 20 : 10;

                    const [skills] = await connection.execute(
                        `SELECT skill_tag_id FROM task_skill WHERE task_id = ?`,
                        [taskId]
                    );

                    for (const s of skills) {
                        await connection.execute(`
                            INSERT INTO member_skill_level (user_id, skill_tag_id, points, last_verified_at)
                            VALUES (?, ?, ?, NOW())
                            ON DUPLICATE KEY UPDATE points = points + ?, last_verified_at = NOW()
                        `, [assigned_user_id, s.skill_tag_id, points, points]);
                    }
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Task status updated and synchronized' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error updating task status:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};



// Get tasks assigned to current user across all events
exports.getMyTasks = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id is required.' });

        const [tasks] = await db.execute(`
            SELECT t.task_id as id, t.title, t.description as \`desc\`, t.deadline as due,
                   e.event_name as event, e.event_id,
                   ta.status, t.priority, t.proof_type, ta.assignment_id,
                   u.full_name as assigned_to
            FROM task t
            JOIN event e ON t.event_id = e.event_id
            JOIN task_assignment ta ON t.task_id = ta.task_id
            JOIN user u ON ta.assigned_user_id = u.user_id
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
// Optional: ?exclude_user_id=N  → excludes tasks from events created by that user
exports.getVolunteerOpportunities = async (req, res) => {
    try {
        const { exclude_user_id, current_user_id } = req.query;

        let query = `
            SELECT t.task_id as id, t.title, t.description as \`desc\`, t.deadline as due,
                   e.event_name as event, e.event_id,
                   t.priority, t.proof_type,
                   COUNT(DISTINCT ta.assignment_id) as volunteer_count
            FROM task t
            JOIN event e ON t.event_id = e.event_id
            LEFT JOIN task_assignment ta ON t.task_id = ta.task_id 
                AND ta.status IN ('Assigned', 'In_Progress', 'Submitted', 'Verified')
            WHERE t.is_volunteer_opportunity = 1
              AND t.status != 'Verified'
        `;
        const params = [];

        if (exclude_user_id) {
            // query += ` AND e.created_by_user_id != ? `;
            // params.push(exclude_user_id);
            // Removing this filter as even event creators should be able to volunteer for tasks
        }

        query += ` GROUP BY t.task_id ORDER BY t.deadline ASC`;

        const [tasks] = await db.execute(query, params);

        // Enhance response with slot info and user's volunteer status
        const enhancedTasks = await Promise.all(tasks.map(async (task) => {
            let userHasVolunteered = false;
            if (current_user_id) {
                const [checkVol] = await db.execute(
                    `SELECT assignment_id FROM task_assignment WHERE task_id = ? AND assigned_user_id = ?`,
                    [task.id, current_user_id]
                );
                userHasVolunteered = checkVol.length > 0;
            }

            // Parse volunteer limit from description (format: <!--VL:N-->)
            const volMatch = task.desc?.match(/<!--VL:(\d+)-->/);
            const maxVolunteers = volMatch ? parseInt(volMatch[1]) : 5;
            
            // Clean description by removing the hidden marker
            const cleanDesc = task.desc?.replace(/<!--VL:\d+-->/, '') || '';

            return {
                ...task,
                desc: cleanDesc,
                max_volunteers: maxVolunteers,
                volunteers_needed: Math.max(0, maxVolunteers - task.volunteer_count),
                is_full: task.volunteer_count >= maxVolunteers,
                user_has_volunteered: userHasVolunteered
            };
        }));

        res.json(enhancedTasks);
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
        
        if (!user_id) return res.status(400).json({ message: 'user_id is required' });

        // Get task details to check if it's a volunteer opportunity
        const [taskCheck] = await db.execute(
            'SELECT is_volunteer_opportunity, description FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskCheck.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = taskCheck[0];
        const isVolunteerOpportunity = task.is_volunteer_opportunity === 1;
        
        // Parse volunteer limit from description (format: <!--VL:N-->)
        const volMatch = task.description?.match(/<!--VL:(\d+)-->/);
        const volunteerLimit = volMatch ? parseInt(volMatch[1]) : 5;

        // Check if user has already volunteered for this task
        const [existing] = await db.execute(
            'SELECT assignment_id FROM task_assignment WHERE task_id = ? AND assigned_user_id = ?',
            [taskId, user_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ 
                message: 'You have already volunteered for this task',
                already_volunteered: true
            });
        }

        if (!isVolunteerOpportunity) {
            return res.status(400).json({ message: 'This task is not a volunteer opportunity' });
        }

        // Check current volunteer count for this task
        const [currentCount] = await db.execute(
            'SELECT COUNT(*) as count FROM task_assignment WHERE task_id = ? AND status IN (?, ?, ?, ?)',
            [taskId, 'Assigned', 'In_Progress', 'Submitted', 'Verified']
        );

        if (currentCount[0].count >= volunteerLimit) {
            return res.status(409).json({ 
                message: `This task has reached its maximum volunteer limit (${volunteerLimit})`,
                current_volunteers: currentCount[0].count,
                max_volunteers: volunteerLimit
            });
        }

        // Create volunteer assignment
        await db.execute(
            `INSERT INTO task_assignment (task_id, assigned_user_id, status) VALUES (?, ?, 'Assigned')`,
            [taskId, user_id]
        );

        // Send notification to OC and Exec members
        try {
            await notificationHelper.notifyVolunteerApplied(taskId, user_id);
        } catch (notifyErr) {
            console.error('[volunteerForTask] Notification error:', notifyErr);
            // Don't fail the request if notification fails
        }

        res.json({ 
            message: 'Successfully volunteered for task!',
            assignment_status: 'Assigned',
            is_volunteer_opportunity: true,
            volunteer_limit: volunteerLimit
        });

    } catch (err) {
        console.error("Error volunteering for task:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ---------------------------------------------------------------------------------------------------
// TASK DETAILS, SUBMISSIONS & COMMENTS
// ---------------------------------------------------------------------------------------------------

exports.getTaskAssignmentDetails = async (req, res) => {
    try {
        const { taskId, assignmentId } = req.params;
        const [rows] = await db.execute(`
            SELECT 
                t.task_id as id, t.title, t.description as \`desc\`, t.deadline as due, t.status as task_status,
                t.priority, t.proof_type,
                e.event_name, e.event_id,
                ta.assignment_id, ta.status as assignment_status, ta.submission_text, ta.submission_file_url, ta.assigned_user_id,
                u.full_name as assigned_to, u.student_number as assigned_student_no
            FROM task t
            JOIN task_assignment ta ON t.task_id = ta.task_id
            JOIN event e ON t.event_id = e.event_id
            JOIN user u ON ta.assigned_user_id = u.user_id
            WHERE t.task_id = ? AND ta.assignment_id = ?
        `, [taskId, assignmentId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching assignment details:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitTaskAssignment = async (req, res) => {
    try {
        const { taskId, assignmentId } = req.params;
        const { submission_text, user_id } = req.body;

        await db.execute(
            `UPDATE task_assignment SET submission_text = ?, status = 'Submitted', submitted_at = NOW() WHERE assignment_id = ?`,
            [submission_text, assignmentId]
        );

        // Send notification to OC and Exec members
        if (user_id) {
            try {
                await notificationHelper.notifyTaskSubmitted(taskId, user_id);
            } catch (notifyErr) {
                console.error('[submitTaskAssignment] Notification error:', notifyErr);
            }
        }

        res.json({ message: 'Task submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitTaskWithLink = async (req, res) => {
    let connection;
    try {
        const { taskId, assignmentId } = req.params;
        const { submission_text, drive_link } = req.body;

        // Validate input
        if (!taskId || !assignmentId) {
            return res.status(400).json({ message: 'taskId and assignmentId are required' });
        }

        // Verify assignment exists
        const [assignmentCheck] = await db.execute(
            'SELECT assignment_id, task_id, assigned_user_id, status FROM task_assignment WHERE assignment_id = ? AND task_id = ?',
            [assignmentId, taskId]
        );

        if (assignmentCheck.length === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Get task proof_type requirement
        const [taskCheck] = await db.execute(
            'SELECT proof_type FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskCheck.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = taskCheck[0];
        const proofType = task.proof_type;

        // Validate submission based on proof type
        if (proofType === 'File_Upload' && !drive_link) {
            return res.status(400).json({ message: 'This task requires a Google Drive link' });
        }

        if (proofType === 'Description_Only' && !submission_text) {
            return res.status(400).json({ message: 'This task requires a text description' });
        }

        // Validate Google Drive link format if provided
        if (drive_link && !drive_link.includes('drive.google.com')) {
            return res.status(400).json({ message: 'Please provide a valid Google Drive link' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Update task assignment with submission
        await connection.execute(
            `UPDATE task_assignment 
             SET submission_text = ?, submission_file_url = ?, status = 'Submitted'
             WHERE assignment_id = ? AND task_id = ?`,
            [submission_text || null, drive_link || null, assignmentId, taskId]
        );

        // Add notification to relevant OC members
        const [eventCheck] = await db.execute(
            'SELECT event_id FROM task WHERE task_id = ?',
            [taskId]
        );

        if (eventCheck.length > 0) {
            const eventId = eventCheck[0].event_id;

            // Get all OC members
            const [ocMembers] = await db.execute(
                `SELECT DISTINCT user_id FROM event_coordinator WHERE event_id = ?`,
                [eventId]
            );

            // Create notifications for OC members
            if (ocMembers.length > 0) {
                for (const ocMember of ocMembers) {
                    await connection.execute(
                        `INSERT INTO notification (user_id, title, message, type) 
                         VALUES (?, ?, ?, 'TASK')`,
                        [
                            ocMember.user_id,
                            'Task Submission',
                            `A member has submitted their work for your task. Review and approve when ready.`
                        ]
                    );
                }
            }
        }

        await connection.commit();

        res.json({
            message: 'Task submitted successfully',
            assignment_id: assignmentId,
            status: 'Submitted',
            submitted_at: new Date().toISOString(),
            drive_link: drive_link || null
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error submitting task:', err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.getComments = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const taskId = req.query.taskId;

        console.log(`[getComments] Fetching comments. taskId: ${taskId}, assignmentId: ${assignmentId}`);

        let query, params;
        if (taskId) {
            query = `
                SELECT tc.comment_id, tc.comment_text as text, tc.created_at, u.full_name as user, tc.user_id
                FROM task_comment tc
                JOIN user u ON tc.user_id = u.user_id
                WHERE tc.task_id = ? 
                   OR tc.assignment_id IN (SELECT assignment_id FROM task_assignment WHERE task_id = ?)
                ORDER BY tc.created_at ASC`;
            params = [taskId, taskId];
        } else {
            query = `
                SELECT tc.comment_id, tc.comment_text as text, tc.created_at, u.full_name as user, tc.user_id
                FROM task_comment tc
                JOIN user u ON tc.user_id = u.user_id
                WHERE tc.assignment_id = ?
                ORDER BY tc.created_at ASC`;
            params = [assignmentId];
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { user_id, text } = req.body;
        
        console.log(`[addComment] Received group chat request: assignmentId=${assignmentId}, user_id=${user_id}`);
        
        if (!user_id || !text) {
            return res.status(400).json({ message: 'user_id and text are required.' });
        }

        // Get task_id from assignment_id to ensure group chat sync
        const [taskLookup] = await db.execute('SELECT task_id FROM task_assignment WHERE assignment_id = ?', [assignmentId]);
        const taskId = taskLookup[0]?.task_id;

        // Insert comment with task_id for group-wide visibility
        console.log(`[addComment] Group Pool Chat: Inserting comment for task_id ${taskId}...`);
        let result;
        try {
            [result] = await db.execute(
                `INSERT INTO task_comment (assignment_id, task_id, user_id, comment_text) VALUES (?, ?, ?, ?)`,
                [assignmentId, taskId || null, user_id, text]
            );
        } catch (insertErr) {
            console.error('[addComment] ERROR inserting group comment:', insertErr);
            throw insertErr;
        }

        // Get task and assignment details for notifications
        console.log(`[addComment] Fetching assignment details for notifications...`);
        let assignmentDetails;
        try {
            [assignmentDetails] = await db.execute(
                `SELECT 
                    ta.task_id, ta.assigned_user_id as assigned_to, t.event_id,
                    t.title as task_title,
                    e.event_name as event_title,
                    u.full_name as commenter_name, u.user_type as commenter_role
                 FROM task_assignment ta
                 JOIN task t ON ta.task_id = t.task_id
                 JOIN event e ON t.event_id = e.event_id
                 JOIN user u ON u.user_id = ?
                 WHERE ta.assignment_id = ?`,
                [user_id, assignmentId]
            );
            console.log(`[addComment] Found ${assignmentDetails.length} assignment details`);
        } catch (queryErr) {
            console.error('[addComment] ERROR fetching assignment details:', queryErr);
            // Continue without notifications if this fails
            assignmentDetails = [];
        }

        if (assignmentDetails.length > 0) {
            const { task_id, assigned_to, event_id, task_title, event_title, commenter_name, commenter_role } = assignmentDetails[0];
            
            const isOC = commenter_role === 'Organizing_Committee' || commenter_role === 'oc';
            const isExec = ['Executive', 'executive', 'Executive_Board', 'Junior_Treasurer', 'President'].includes(commenter_role);
            const isMember = !isOC && !isExec;

            console.log(`[addComment] Commenter: ${commenter_name} (ID: ${user_id}), Role: ${commenter_role}, isOC: ${isOC}, isExec: ${isExec}, isMember: ${isMember}`);
            console.log(`[addComment] Task: ${task_title}, Event ID: ${event_id}, Assigned to: ${assigned_to}`);

            // Get OC members for this event (from event_coordinator table)
            const [ocMembers] = await db.execute(
                `SELECT DISTINCT ec.user_id 
                 FROM event_coordinator ec
                 WHERE ec.event_id = ?`,
                [event_id]
            );
            console.log(`[addComment] Found ${ocMembers.length} OC members for event ${event_id}:`, ocMembers.map(m => m.user_id));

            // Get all Exec members (including Jr Treasurer and President)
            const [execMembers] = await db.execute(
                `SELECT user_id FROM user 
                 WHERE user_type IN ('Executive', 'executive', 'Executive_Board', 'Junior_Treasurer', 'President')
                    OR role_name IN ('Executive', 'Junior_Treasurer', 'President')`
            );
            console.log(`[addComment] Found ${execMembers.length} Exec members:`, execMembers.map(m => m.user_id));

            // Combine OC and Exec members
            const ocAndExecIds = [...ocMembers, ...execMembers].map(u => u.user_id);
            const uniqueNotifyUsers = [...new Set(ocAndExecIds)];
            console.log(`[addComment] Unique OC+Exec users to notify:`, uniqueNotifyUsers);
            
            // Send notifications to ALL OC and Exec members (except the commenter)
            try {
                for (const notifyUserId of uniqueNotifyUsers) {
                    if (notifyUserId != user_id) { // Don't notify the commenter
                        const message = isMember 
                            ? `${commenter_name} asked a question on "${task_title}"`
                            : `${commenter_name} commented on "${task_title}"`;
                        
                        await db.execute(
                            `INSERT INTO notification (user_id, type, title, message, is_read, created_at) 
                             VALUES (?, 'TASK', ?, ?, 0, NOW())`,
                            [notifyUserId, 'New Comment', message]
                        );
                        console.log(`[addComment] Notification sent to OC/Exec user ${notifyUserId}`);
                    }
                }
                
                // If OC/Exec commented, ALSO notify the assigned member (if different from commenter and not already an OC/Exec)
                if ((isOC || isExec) && assigned_to && assigned_to != user_id) {
                    const isAssignedUserInOcExec = uniqueNotifyUsers.includes(parseInt(assigned_to));
                    if (!isAssignedUserInOcExec) {
                        const roleLabel = isOC ? 'Organizing Committee' : (commenter_role === 'Junior_Treasurer' ? 'Junior Treasurer' : (commenter_role === 'President' ? 'President' : 'Executive Board'));
                        await db.execute(
                            `INSERT INTO notification (user_id, type, title, message, is_read, created_at) 
                             VALUES (?, 'TASK', ?, ?, 0, NOW())`,
                            [assigned_to, 'New Comment', `${roleLabel} commented on your task "${task_title}"`]
                        );
                        console.log(`[addComment] Additional notification sent to assigned member ${assigned_to}`);
                    } else {
                        console.log(`[addComment] Assigned member ${assigned_to} is already in OC/Exec list, skipping duplicate`);
                    }
                }
                
                console.log(`[addComment] Notification process complete.`);
            } catch (notifyErr) {
                console.error('[addComment] Notification error (comment still posted):', notifyErr);
                // Don't fail the comment post if notifications fail
            }
        }

        res.status(201).json({ message: 'Comment added', comment_id: result.insertId });
    } catch (err) {
        console.error("[addComment] Error adding comment:", err);
        console.error("[addComment] Error stack:", err.stack);
        res.status(500).json({ message: 'Server Error', error: err.message, sqlMessage: err.sqlMessage });
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
        const { company_name, contact_person, email, contact_number, package_type, amount_promised, status } = req.body;

        if (!company_name) return res.status(400).json({ message: "Company Name is required." });

        const validStatuses = ['Paid', 'Declined', 'Pending'];
        const finalStatus = validStatuses.includes(status) ? status : 'Paid';

        const [result] = await db.execute(
            `INSERT INTO partnership (event_id, company_name, contact_person, email, contact_number, package_type, amount_promised, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, company_name, contact_person || null, email || null, contact_number || null, package_type || null, amount_promised || null, finalStatus]
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
            SELECT p.partnership_id, p.company_name, p.contact_person, p.email, p.contact_number,
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
        const { company_name, contact_person, email, contact_number, package_type, amount_promised, status } = req.body;
        
        if (!company_name) return res.status(400).json({ message: "Company Name is required." });

        await db.execute(
            `UPDATE partnership 
             SET company_name=?, contact_person=?, email=?, contact_number=?, package_type=?, amount_promised=?, status=?
             WHERE partnership_id = ? AND event_id = ?`,
             [company_name, contact_person || null, email || null, contact_number || null, package_type || null, amount_promised || null, status || 'Paid', partnershipId, id]
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

// ---------------------------------------------------------------------------------------------------
// TASKS TO APPROVE
// ---------------------------------------------------------------------------------------------------

// GET /api/events/tasks-to-approve?user_id={uid}&role={oc|exec}
// - role=oc  : tasks from events where user is in event_coordinator, status Submitted/Completed, not self-assigned
// - role=exec: ALL event tasks, status Submitted/Completed, not self-assigned
exports.getTasksToApprove = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id is required.' });

        let query;
        let params;

        if (role === 'oc') {
            // Only tasks from events this user is an OC member of
            query = `
                SELECT
                    t.task_id as id,
                    t.task_id,
                    t.title,
                    t.description as \`desc\`,
                    t.deadline as due,
                    t.status as task_status,
                    e.event_name as event,
                    e.event_id,
                    ta.assignment_id,
                    ta.status as assignment_status,
                    u.full_name as assigned_to,
                    u.student_number as assigned_student_no
                FROM task t
                JOIN event e ON t.event_id = e.event_id
                JOIN task_assignment ta ON t.task_id = ta.task_id
                JOIN user u ON ta.assigned_user_id = u.user_id
                WHERE t.event_id IN (
                    SELECT event_id FROM event_coordinator WHERE user_id = ?
                )
                AND ta.status IN ('Submitted', 'Completed')
                AND ta.assigned_user_id != ?
                ORDER BY t.deadline ASC
            `;
            params = [user_id, user_id];
        } else {
            // Exec: all events, all tasks
            query = `
                SELECT
                    t.task_id as id,
                    t.task_id,
                    t.title,
                    t.description as \`desc\`,
                    t.deadline as due,
                    t.status as task_status,
                    e.event_name as event,
                    e.event_id,
                    ta.assignment_id,
                    ta.status as assignment_status,
                    u.full_name as assigned_to,
                    u.student_number as assigned_student_no
                FROM task t
                JOIN event e ON t.event_id = e.event_id
                JOIN task_assignment ta ON t.task_id = ta.task_id
                JOIN user u ON ta.assigned_user_id = u.user_id
                WHERE ta.status IN ('Submitted', 'Completed')
                AND ta.assigned_user_id != ?
                ORDER BY t.deadline ASC
            `;
            params = [user_id];
        }

        const [tasks] = await db.execute(query, params);
        res.json(tasks);
    } catch (err) {
        console.error("Error fetching tasks to approve:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Notification handlers
exports.getNotifications = async (req, res) => {
    try {
        const { user_id, limit = 20 } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id required' });

        const [notifications] = await db.execute(
            `SELECT * FROM notification 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [user_id, parseInt(limit)]
        );
        res.json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ message: 'user_id required' });

        const [result] = await db.execute(
            `SELECT COUNT(*) as unread_count FROM notification 
             WHERE user_id = ? AND is_read = 0`,
            [user_id]
        );
        res.json({ unread_count: result[0].unread_count });
    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await db.execute(
            `UPDATE notification SET is_read = 1 WHERE notification_id = ?`,
            [notificationId]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: 'user_id required' });

        await db.execute(
            `UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
            [user_id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
