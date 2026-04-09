const db = require('../config/db');

// Create notification for user(s)
exports.createNotification = async (userId, title, message, type = 'SYSTEM', relatedTaskId = null) => {
    try {
        const userIds = Array.isArray(userId) ? userId : [userId];

        for (const uid of userIds) {
            await db.execute(
                `INSERT INTO notification (user_id, title, message, type) 
                 VALUES (?, ?, ?, ?)`,
                [uid, title, message, type]
            );
        }

        return { success: true, usersNotified: userIds.length };
    } catch (err) {
        console.error('Error creating notification:', err);
        return { success: false, error: err.message };
    }
};

// Get notifications for user
exports.getNotifications = async (userId, limit = 20, unreadOnly = false) => {
    try {
        let query = `
            SELECT notification_id, title, message, type, is_read, created_at
            FROM notification
            WHERE user_id = ?
        `;
        const params = [userId];

        if (unreadOnly) {
            query += ` AND is_read = 0`;
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(limit);

        const [notifications] = await db.execute(query, params);
        return notifications;
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
    }
};

// Mark notification as read
exports.markAsRead = async (notificationId) => {
    try {
        const [result] = await db.execute(
            `UPDATE notification SET is_read = 1 WHERE notification_id = ?`,
            [notificationId]
        );
        return result.affectedRows > 0;
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return false;
    }
};

// Mark all notifications as read for user
exports.markAllAsRead = async (userId) => {
    try {
        const [result] = await db.execute(
            `UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        return result.affectedRows;
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        return 0;
    }
};

// Get unread count
exports.getUnreadCount = async (userId) => {
    try {
        const [result] = await db.execute(
            `SELECT COUNT(*) as unread_count FROM notification WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        return result[0]?.unread_count || 0;
    } catch (err) {
        console.error('Error getting unread count:', err);
        return 0;
    }
};

// Delete old notifications (older than 30 days)
exports.cleanupOldNotifications = async (daysOld = 30) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM notification WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [daysOld]
        );
        console.log(`🧹 Cleaned up ${result.affectedRows} old notifications`);
        return result.affectedRows;
    } catch (err) {
        console.error('Error cleaning up notifications:', err);
        return 0;
    }
};

// Volunteer slot reminder (for cron job)
exports.checkAndNotifyUnfilledSlots = async () => {
    try {
        // Get all volunteer tasks ending in 3 days
        const [volunteerTasks] = await db.execute(`
            SELECT t.task_id, t.title, t.event_id, e.event_name,
                   COUNT(ta.assignment_id) as volunteer_count
            FROM task t
            JOIN event e ON t.event_id = e.event_id
            LEFT JOIN task_assignment ta ON t.task_id = ta.task_id 
                AND ta.status IN ('Assigned', 'In_Progress', 'Submitted', 'Verified')
            WHERE t.is_volunteer_opportunity = 1
                AND t.deadline IS NOT NULL
                AND DATE(t.deadline) = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                AND t.status != 'Verified'
            GROUP BY t.task_id
            HAVING volunteer_count < 3
        `);

        let notifiedCount = 0;

        for (const task of volunteerTasks) {
            // Get all OC members for this event
            const [ocMembers] = await db.execute(
                `SELECT DISTINCT user_id FROM event_coordinator WHERE event_id = ?`,
                [task.event_id]
            );

            if (ocMembers.length > 0) {
                for (const ocMember of ocMembers) {
                    await db.execute(
                        `INSERT INTO notification (user_id, title, message, type) 
                         VALUES (?, ?, ?, 'TASK')`,
                        [
                            ocMember.user_id,
                            'Volunteer Task Reminder',
                            `Task "${task.title}" in "${task.event_name}" has only ${task.volunteer_count} volunteers. Deadline is in 3 days.`
                        ]
                    );
                    notifiedCount++;
                }
            }
        }

        console.log(`📢 Volunteer slot reminder: Notified for ${volunteerTasks.length} unfilled tasks`);
        return { tasksChecked: volunteerTasks.length, notificationsCreated: notifiedCount };
    } catch (err) {
        console.error('Error checking volunteer slots:', err);
        return { error: err.message };
    }
};
