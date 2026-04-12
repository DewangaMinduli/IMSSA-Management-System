const db = require('../config/db');
const notificationHelper = require('../utils/notificationHelper');

// Get Dashboard Summary (Accounts & Recent Transactions)
exports.getDashboardSummary = async (req, res) => {
    try {
        // 1. Get Accounts
        const [accounts] = await db.execute('SELECT * FROM financial_account');

        // 2. Get Recent Transactions (Limit 5)
        const [transactions] = await db.execute(`
            SELECT t.*, e.event_name, a.account_name 
            FROM transaction t
            LEFT JOIN event e ON t.event_id = e.event_id
            LEFT JOIN financial_account a ON t.account_id = a.account_id
            ORDER BY t.transaction_date DESC
            LIMIT 5
        `);

        // 3. Get Events with Active Budgets (simplified)
        // Fetch events that are upcoming/ongoing
        const [events] = await db.execute('SELECT event_id, event_name, start_date as date FROM event WHERE start_date >= CURDATE()');

        res.json({ accounts, transactions, events });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Server caught error' });
    }
};

// Add Transaction
exports.addTransaction = async (req, res) => {
    const { date, description, type, amount, account_id, event_id, proof_url, notes } = req.body;

    // VALIDATION
    if (!amount || !account_id || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Transaction
        const recordedById = req.user ? req.user.id : 1; // Fallback to 1 if no auth middleware

        const [result] = await connection.execute(
            `INSERT INTO transaction 
            (transaction_date, description, transaction_type, amount, account_id, event_id, bill_proof_url, missing_proof_reason, recorded_by_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [date, description, type, amount, account_id, event_id || null, proof_url || null, notes || null, recordedById]
        );

        // 2. Update Account Balance
        const signedAmount = type === 'Income' ? parseFloat(amount) : -parseFloat(amount);
        await connection.execute(
            'UPDATE financial_account SET current_balance = current_balance + ? WHERE account_id = ?',
            [signedAmount, account_id]
        );

        await connection.commit();
        
        // Send notification to Senior Treasurer
        try {
            if (event_id && amount) {
                const [eventRows] = await db.execute(
                    'SELECT title FROM event WHERE event_id = ?',
                    [event_id]
                );
                const eventName = eventRows.length > 0 ? eventRows[0].title : 'Unknown Event';
                await notificationHelper.notifyTransactionRecorded(event_id, eventName, amount, recordedById);
            }
        } catch (notifyErr) {
            console.error('[addTransaction] Notification error:', notifyErr);
        }
        
        res.status(201).json({ message: 'Transaction recorded', id: result.insertId });

    } catch (error) {
        await connection.rollback();
        console.error('Transaction Error:', error);
        res.status(500).json({ message: 'Failed to record transaction' });
    } finally {
        connection.release();
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const [transactions] = await db.execute(`
            SELECT t.*, e.event_name, a.account_name 
            FROM transaction t
            LEFT JOIN event e ON t.event_id = e.event_id
            LEFT JOIN financial_account a ON t.account_id = a.account_id
            ORDER BY t.transaction_date DESC
        `);
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

exports.getEventBudgets = async (req, res) => {
    try {
        // budget_plan does not currently exist in the database schema.
        // Returning empty array until table is implemented, to align with DB reality.
        res.json([]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching budgets' });
    }
};

// Approve Transaction
exports.approveTransaction = async (req, res) => {
    const { id } = req.params;
    const approverId = req.body.user_id || req.body.approved_by;
    
    try {
        // Get transaction details before approving
        const [transactionRows] = await db.execute(
            `SELECT t.*, e.title as event_name 
             FROM transaction t 
             LEFT JOIN event e ON t.event_id = e.event_id 
             WHERE t.transaction_id = ?`,
            [id]
        );
        
        const transaction = transactionRows[0];
        
        const [result] = await db.execute(
            "UPDATE transaction SET status = 'Approved' WHERE transaction_id = ?",
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found or already processed' });
        }
        
        // Send notification to Junior Treasurer (who recorded the transaction)
        if (transaction && transaction.recorded_by) {
            try {
                await notificationHelper.notifyTransactionVerified(
                    transaction.event_id, 
                    transaction.event_name || 'Unknown Event', 
                    approverId,
                    transaction.recorded_by
                );
            } catch (notifyErr) {
                console.error('[approveTransaction] Notification error:', notifyErr);
            }
        }
        
        res.json({ message: 'Transaction successfully approved' });
    } catch (error) {
        console.error('Approve Transaction Error:', error);
        res.status(500).json({ message: 'Failed to approve transaction' });
    }
};
