const db = require('../config/db');

/**
 * Notification Helper Module
 * Contains all notification triggers for the IMSSA Management System
 * No database schema changes required - uses existing notification table
 */

// Notification types matching the existing enum
const NOTIFICATION_TYPES = {
    TASK: 'TASK',
    EVENT: 'EVENT',
    SYSTEM: 'SYSTEM'
};

/**
 * Create a notification for a single user
 */
async function createNotification(userId, type, title, message) {
    try {
        await db.execute(
            `INSERT INTO notification (user_id, type, title, message, is_read, created_at) 
             VALUES (?, ?, ?, ?, 0, NOW())`,
            [userId, type, title, message]
        );
        console.log(`[Notification] Sent to user ${userId}: ${title}`);
        return true;
    } catch (err) {
        console.error('[Notification] Error creating notification:', err);
        return false;
    }
}

/**
 * Create notifications for multiple users
 */
async function createNotificationsForUsers(userIds, type, title, message) {
    const promises = userIds.map(userId => createNotification(userId, type, title, message));
    await Promise.all(promises);
}

/**
 * Get all Executive Board members
 */
async function getExecutiveBoardMembers() {
    try {
        const [rows] = await db.execute(
            `SELECT user_id FROM user 
             WHERE user_type IN ('Executive', 'executive', 'Executive_Board')
                OR role_name IN ('Executive', 'Executive_Board', 'President', 'Junior_Treasurer')`
        );
        return rows.map(r => r.user_id);
    } catch (err) {
        console.error('[Notification] Error getting Exec members:', err);
        return [];
    }
}

/**
 * Get OC members for a specific event
 */
async function getOCMembersForEvent(eventId) {
    try {
        const [rows] = await db.execute(
            `SELECT DISTINCT et.user_id 
             FROM event_team et
             JOIN user u ON et.user_id = u.user_id
             WHERE et.event_id = ? 
               AND (u.user_type = 'Organizing_Committee' OR u.user_type = 'oc' OR u.role_name = 'Organizing_Committee')`,
            [eventId]
        );
        return rows.map(r => r.user_id);
    } catch (err) {
        console.error('[Notification] Error getting OC members:', err);
        return [];
    }
}

/**
 * Get user details (name, role)
 */
async function getUserDetails(userId) {
    try {
        const [rows] = await db.execute(
            `SELECT name, user_type, role_name FROM user WHERE user_id = ?`,
            [userId]
        );
        return rows[0] || null;
    } catch (err) {
        console.error('[Notification] Error getting user details:', err);
        return null;
    }
}

/**
 * Get task details
 */
async function getTaskDetails(taskId) {
    try {
        const [rows] = await db.execute(
            `SELECT t.task_id, t.title, t.event_id, e.title as event_title, ta.assigned_to, ta.status
             FROM task t 
             JOIN event e ON t.event_id = e.event_id
             LEFT JOIN task_assignment ta ON t.task_id = ta.task_id
             WHERE t.task_id = ?`,
            [taskId]
        );
        return rows[0] || null;
    } catch (err) {
        console.error('[Notification] Error getting task details:', err);
        return null;
    }
}

/**
 * Get all users with a specific role
 */
async function getUsersByRole(roleName) {
    try {
        const [rows] = await db.execute(
            `SELECT user_id FROM user WHERE role_name = ? OR user_type = ?`,
            [roleName, roleName]
        );
        return rows.map(r => r.user_id);
    } catch (err) {
        console.error('[Notification] Error getting users by role:', err);
        return [];
    }
}

// ==========================================
// 1. GLOBAL ANNOUNCEMENTS
// ==========================================

/**
 * 1A. New Event Created - Notify all users
 */
async function notifyNewEventCreated(eventId, eventName, createdByUserId) {
    try {
        // Get all users except the creator
        const [allUsers] = await db.execute(
            `SELECT user_id FROM user WHERE user_id != ?`,
            [createdByUserId]
        );
        
        const creator = await getUserDetails(createdByUserId);
        const creatorName = creator ? creator.name : 'Someone';
        
        await createNotificationsForUsers(
            allUsers.map(u => u.user_id),
            NOTIFICATION_TYPES.EVENT,
            'New Event Created',
            `A new event "${eventName}" has been created by ${creatorName}!`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyNewEventCreated:', err);
    }
}

/**
 * 1B. Term Handover - Notify all users
 */
async function notifyTermHandover() {
    try {
        const [allUsers] = await db.execute(`SELECT user_id FROM user`);
        
        await createNotificationsForUsers(
            allUsers.map(u => u.user_id),
            NOTIFICATION_TYPES.SYSTEM,
            'Term Handover',
            'The current term has ended. Welcome to the new Executive Board!'
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTermHandover:', err);
    }
}

/**
 * 1C. Event Timeline Reminder - Notify relevant OC and Exec
 */
async function notifyEventTimelinePhase(eventId, eventName, phaseName) {
    try {
        const ocMembers = await getOCMembersForEvent(eventId);
        const execMembers = await getExecutiveBoardMembers();
        const allRecipients = [...new Set([...ocMembers, ...execMembers])];
        
        await createNotificationsForUsers(
            allRecipients,
            NOTIFICATION_TYPES.EVENT,
            'Event Timeline Update',
            `Reminder: ${eventName} is now entering the ${phaseName} stage.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyEventTimelinePhase:', err);
    }
}

// ==========================================
// 2. TASK & VOLUNTEER ENGINE
// ==========================================

/**
 * 2A. Someone Volunteered - Notify OC and Exec
 */
async function notifyVolunteerApplied(taskId, volunteerUserId) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task) return;
        
        const volunteer = await getUserDetails(volunteerUserId);
        const volunteerName = volunteer ? volunteer.name : 'Someone';
        
        const ocMembers = await getOCMembersForEvent(task.event_id);
        const execMembers = await getExecutiveBoardMembers();
        const allRecipients = [...new Set([...ocMembers, ...execMembers])];
        
        await createNotificationsForUsers(
            allRecipients,
            NOTIFICATION_TYPES.TASK,
            'New Volunteer Application',
            `${volunteerName} has volunteered for "${task.title}". Please review.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyVolunteerApplied:', err);
    }
}

/**
 * 2B. Volunteer Assigned - Notify the member
 */
async function notifyVolunteerAssigned(taskId, assignedUserId, assignedByUserId) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task) return;
        
        const assigner = await getUserDetails(assignedByUserId);
        const assignerName = assigner ? assigner.name : 'An OC member';
        
        await createNotification(
            assignedUserId,
            NOTIFICATION_TYPES.TASK,
            'Task Assignment',
            `You have been officially assigned to "${task.title}" by ${assignerName}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyVolunteerAssigned:', err);
    }
}

/**
 * 2C. Task Deadline Reminder - Notify assigned member
 */
async function notifyTaskDeadlineReminder(taskId, daysRemaining) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task || !task.assigned_to) return;
        
        const dayText = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
        
        await createNotification(
            task.assigned_to,
            NOTIFICATION_TYPES.TASK,
            'Deadline Reminder',
            `Friendly reminder: Your task "${task.title}" is due in ${dayText}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTaskDeadlineReminder:', err);
    }
}

/**
 * 2D. Unfilled Task Alert - Notify OC when no volunteers 3 days before
 */
async function notifyUnfilledTaskAlert(taskId, daysUntilStart) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task) return;
        
        const ocMembers = await getOCMembersForEvent(task.event_id);
        
        await createNotificationsForUsers(
            ocMembers,
            NOTIFICATION_TYPES.TASK,
            'URGENT: Task Needs Volunteers',
            `Action Required: The task "${task.title}" starts in ${daysUntilStart} days and has no volunteers yet!`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyUnfilledTaskAlert:', err);
    }
}

/**
 * 2E. Task Submitted - Notify OC and Exec
 */
async function notifyTaskSubmitted(taskId, submittedByUserId) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task) return;
        
        const submitter = await getUserDetails(submittedByUserId);
        const submitterName = submitter ? submitter.name : 'A member';
        
        const ocMembers = await getOCMembersForEvent(task.event_id);
        const execMembers = await getExecutiveBoardMembers();
        const allRecipients = [...new Set([...ocMembers, ...execMembers])];
        
        await createNotificationsForUsers(
            allRecipients,
            NOTIFICATION_TYPES.TASK,
            'Task Submitted for Review',
            `Task "${task.title}" has been submitted by ${submitterName} and is waiting for your approval.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTaskSubmitted:', err);
    }
}

/**
 * 2F. Task Schedule Changed - Notify assigned member
 */
async function notifyTaskScheduleChanged(taskId, changeType) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task || !task.assigned_to) return;
        
        await createNotification(
            task.assigned_to,
            NOTIFICATION_TYPES.TASK,
            'Task Schedule Updated',
            `The ${changeType} for "${task.title}" have been updated. Please check the new details.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTaskScheduleChanged:', err);
    }
}

/**
 * 2G. Task Status Outcome - Notify member when approved/rejected
 */
async function notifyTaskStatusOutcome(taskId, status, feedback = '') {
    try {
        const task = await getTaskDetails(taskId);
        if (!task || !task.assigned_to) return;
        
        const statusText = status === 'Verified' || status === 'Approved' ? 'Approved' : 'Rejected';
        const emoji = status === 'Verified' || status === 'Approved' ? '✅' : '❌';
        const feedbackText = feedback ? ` Feedback: ${feedback}` : '';
        
        await createNotification(
            task.assigned_to,
            NOTIFICATION_TYPES.TASK,
            `Task ${statusText}`,
            `${emoji} Your submission for "${task.title}" has been ${statusText.toLowerCase()} by the Organizing Committee.${feedbackText}`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTaskStatusOutcome:', err);
    }
}

/**
 * 2H. New Task Comment - Notify relevant parties
 */
async function notifyTaskComment(taskId, commenterUserId, assignmentId) {
    try {
        const task = await getTaskDetails(taskId);
        if (!task) return;
        
        const commenter = await getUserDetails(commenterUserId);
        const commenterName = commenter ? commenter.name : 'Someone';
        
        // Get OC and Exec members
        const ocMembers = await getOCMembersForEvent(task.event_id);
        const execMembers = await getExecutiveBoardMembers();
        
        // Get assigned member if exists
        const assignedUserId = task.assigned_to;
        
        // Combine all recipients except commenter
        let allRecipients = [...ocMembers, ...execMembers];
        if (assignedUserId && assignedUserId !== commenterUserId) {
            allRecipients.push(assignedUserId);
        }
        
        // Remove duplicates and commenter
        allRecipients = [...new Set(allRecipients)].filter(id => id !== commenterUserId);
        
        await createNotificationsForUsers(
            allRecipients,
            NOTIFICATION_TYPES.TASK,
            'New Comment on Task',
            `💬 New comment on "${task.title}" by ${commenterName}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTaskComment:', err);
    }
}

// ==========================================
// 3. ACADEMIC & ADMINISTRATIVE
// ==========================================

/**
 * 3A. Anonymous Feedback Submitted - Notify Academic Staff and Senior Treasurer
 */
async function notifyAnonymousFeedbackSubmitted() {
    try {
        const academicStaff = await getUsersByRole('Academic_Staff');
        const seniorTreasurers = await getUsersByRole('Senior_Treasurer');
        const allRecipients = [...new Set([...academicStaff, ...seniorTreasurers])];
        
        await createNotificationsForUsers(
            allRecipients,
            NOTIFICATION_TYPES.SYSTEM,
            'New Anonymous Feedback',
            'New anonymous feedback has been submitted to the system.'
        );
    } catch (err) {
        console.error('[Notification] Error in notifyAnonymousFeedbackSubmitted:', err);
    }
}

/**
 * 3B. Recommendation Letter Requested - Notify specific lecturer and Senior Treasurer
 */
async function notifyRecommendationLetterRequested(studentUserId, lecturerUserId, companyName) {
    try {
        const student = await getUserDetails(studentUserId);
        const studentName = student ? student.name : 'A student';
        
        const seniorTreasurers = await getUsersByRole('Senior_Treasurer');
        
        // Notify the specific lecturer
        await createNotification(
            lecturerUserId,
            NOTIFICATION_TYPES.SYSTEM,
            'Recommendation Letter Request',
            `${studentName} has requested a recommendation letter for ${companyName}.`
        );
        
        // Also notify Senior Treasurer for oversight
        await createNotificationsForUsers(
            seniorTreasurers,
            NOTIFICATION_TYPES.SYSTEM,
            'Recommendation Letter Request (Oversight)',
            `${studentName} has requested a recommendation letter from a lecturer for ${companyName}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyRecommendationLetterRequested:', err);
    }
}

/**
 * 3C. Recommendation Letter Outcome - Notify student
 */
async function notifyRecommendationLetterOutcome(studentUserId, lecturerName, status) {
    try {
        const statusText = status === 'Completed' ? 'Completed' : 'Rejected';
        
        await createNotification(
            studentUserId,
            NOTIFICATION_TYPES.SYSTEM,
            'Recommendation Letter Update',
            `Your recommendation letter request to ${lecturerName} has been marked as ${statusText}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyRecommendationLetterOutcome:', err);
    }
}

// ==========================================
// 4. FINANCIAL OPERATIONS
// ==========================================

/**
 * 4A. Transaction Recorded - Notify Senior Treasurer
 */
async function notifyTransactionRecorded(eventId, eventName, amount, recordedByUserId) {
    try {
        const recorder = await getUserDetails(recordedByUserId);
        const recorderName = recorder ? recorder.name : 'Junior Treasurer';
        
        const seniorTreasurers = await getUsersByRole('Senior_Treasurer');
        
        await createNotificationsForUsers(
            seniorTreasurers,
            NOTIFICATION_TYPES.SYSTEM,
            'New Transaction Recorded',
            `${recorderName} has recorded a new transaction of $${amount} for ${eventName}. It is awaiting your verification.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTransactionRecorded:', err);
    }
}

/**
 * 4B. Transaction Verified - Notify Junior Treasurer
 */
async function notifyTransactionVerified(eventId, eventName, verifiedByUserId, juniorTreasurerId) {
    try {
        const verifier = await getUserDetails(verifiedByUserId);
        const verifierName = verifier ? verifier.name : 'Senior Treasurer';
        
        await createNotification(
            juniorTreasurerId,
            NOTIFICATION_TYPES.SYSTEM,
            'Transaction Verified',
            `Your recorded transaction for ${eventName} has been verified by ${verifierName}.`
        );
    } catch (err) {
        console.error('[Notification] Error in notifyTransactionVerified:', err);
    }
}

module.exports = {
    // Global Announcements
    notifyNewEventCreated,
    notifyTermHandover,
    notifyEventTimelinePhase,
    
    // Task & Volunteer Engine
    notifyVolunteerApplied,
    notifyVolunteerAssigned,
    notifyTaskDeadlineReminder,
    notifyUnfilledTaskAlert,
    notifyTaskSubmitted,
    notifyTaskScheduleChanged,
    notifyTaskStatusOutcome,
    notifyTaskComment,
    
    // Academic & Administrative
    notifyAnonymousFeedbackSubmitted,
    notifyRecommendationLetterRequested,
    notifyRecommendationLetterOutcome,
    
    // Financial Operations
    notifyTransactionRecorded,
    notifyTransactionVerified,
    
    // Utilities
    createNotification,
    createNotificationsForUsers,
    getExecutiveBoardMembers,
    getOCMembersForEvent,
    getUserDetails,
    getTaskDetails,
    getUsersByRole,
    NOTIFICATION_TYPES
};
