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

        // 1. Check current balance if it's an expense
        if (type === 'Expense') {
            const [accRows] = await connection.execute(
                'SELECT current_balance FROM financial_account WHERE account_id = ? FOR UPDATE',
                [account_id]
            );
            
            if (accRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Account not found' });
            }

            const currentBalance = parseFloat(accRows[0].current_balance);
            if (currentBalance < parseFloat(amount)) {
                await connection.rollback();
                return res.status(400).json({ message: `Insufficient funds. Current balance is Rs. ${currentBalance.toLocaleString()}` });
            }
        }

        // 2. Insert Transaction
        const recordedById = req.user ? req.user.id : 1;
        const [result] = await connection.execute(
            `INSERT INTO transaction 
            (transaction_date, description, transaction_type, amount, account_id, event_id, bill_proof_url, missing_proof_reason, recorded_by_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [date, description, type, amount, account_id, event_id || null, proof_url || null, notes || null, recordedById]
        );

        // 3. Update Account Balance
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
        const { event_id, account_id } = req.query;
        let query = `
            SELECT t.*, e.event_name, a.account_name 
            FROM transaction t
            LEFT JOIN event e ON t.event_id = e.event_id
            LEFT JOIN financial_account a ON t.account_id = a.account_id
        `;
        let params = [];
        let conditions = [];

        if (event_id) {
            conditions.push('t.event_id = ?');
            params.push(event_id);
        }
        if (account_id) {
            conditions.push('t.account_id = ?');
            params.push(account_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY t.transaction_date DESC';

        const [transactions] = await db.execute(query, params);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
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

// Update Transaction
exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { date, description, type, amount, account_id, event_id, proof_url, notes } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Old Transaction Data
        const [oldRows] = await connection.execute('SELECT * FROM transaction WHERE transaction_id = ?', [id]);
        if (oldRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }
        const oldTx = oldRows[0];

        // 2. Revert Old Balance
        const oldSignedAmount = oldTx.transaction_type === 'Income' ? parseFloat(oldTx.amount) : -parseFloat(oldTx.amount);
        await connection.execute(
            'UPDATE financial_account SET current_balance = current_balance - ? WHERE account_id = ?',
            [oldSignedAmount, oldTx.account_id]
        );

        // 3. Check New Balance (Validation)
        // Benefit: We check after revert to see if the new amount is okay
        const [accRows] = await connection.execute(
            'SELECT current_balance FROM financial_account WHERE account_id = ? FOR UPDATE',
            [account_id]
        );
        const currentBalanceAfterRevert = parseFloat(accRows[0].current_balance);
        const newSignedAmount = type === 'Income' ? parseFloat(amount) : -parseFloat(amount);

        if (currentBalanceAfterRevert + newSignedAmount < 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Insufficient funds for this update' });
        }

        // 4. Update Transaction
        await connection.execute(
            `UPDATE transaction SET 
            transaction_date = ?, description = ?, transaction_type = ?, amount = ?, 
            account_id = ?, event_id = ?, bill_proof_url = ?, missing_proof_reason = ? 
            WHERE transaction_id = ?`,
            [date, description, type, amount, account_id, event_id || null, proof_url || null, notes || null, id]
        );

        // 5. Apply New Balance
        await connection.execute(
            'UPDATE financial_account SET current_balance = current_balance + ? WHERE account_id = ?',
            [newSignedAmount, account_id]
        );

        await connection.commit();
        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Failed to update transaction' });
    } finally {
        connection.release();
    }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Transaction Data
        const [rows] = await connection.execute('SELECT * FROM transaction WHERE transaction_id = ?', [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }
        const tx = rows[0];

        // 2. Revert Balance
        const signedAmount = tx.transaction_type === 'Income' ? parseFloat(tx.amount) : -parseFloat(tx.amount);
        
        // Before reverting, if it was an income, check if removing it makes balance negative
        if (tx.transaction_type === 'Income') {
            const [acc] = await connection.execute('SELECT current_balance FROM financial_account WHERE account_id = ?', [tx.account_id]);
            if (parseFloat(acc[0].current_balance) - parseFloat(tx.amount) < 0) {
                 await connection.rollback();
                 return res.status(400).json({ message: 'Cannot delete this income; it would result in a negative balance.' });
            }
        }

        await connection.execute(
            'UPDATE financial_account SET current_balance = current_balance - ? WHERE account_id = ?',
            [signedAmount, tx.account_id]
        );

        // 3. Delete Transaction
        await connection.execute('DELETE FROM transaction WHERE transaction_id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Failed to delete transaction' });
    } finally {
        connection.release();
    }
};

// Approve Transaction
exports.approveTransaction = async (req, res) => {
    const { id } = req.params;
    const approverId = req.body.user_id || req.body.approved_by;
    
    console.log(`[Finance] Approval attempt for Transaction ID: ${id} by User: ${approverId}`);

    try {
        // 1. Verify existence and get metadata for notifications
        const [rows] = await db.execute(
            `SELECT t.*, e.event_name 
             FROM transaction t 
             LEFT JOIN event e ON t.event_id = e.event_id 
             WHERE t.transaction_id = ?`,
            [id]
        );
        
        if (rows.length === 0) {
            console.error(`[Finance] Transaction ${id} not found for approval`);
            return res.status(404).json({ message: 'Transaction not found or already deleted' });
        }

        const transaction = rows[0];

        // 2. Perform Update
        const [result] = await db.execute(
            "UPDATE transaction SET status = 'Approved' WHERE transaction_id = ?",
            [id]
        );
        
        console.log(`[Finance] Update result for ${id}:`, result.affectedRows, "rows affected");

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to update transaction status' });
        }
        
        // 3. Optional Notification (Non-blocking)
        if (transaction.recorded_by_id) {
            try {
                await notificationHelper.notifyTransactionVerified(
                    transaction.event_id, 
                    transaction.event_name || 'General Association', 
                    approverId || 1,
                    transaction.recorded_by_id
                );
            } catch (notifyErr) {
                console.error('[Finance] Notification error (silent):', notifyErr);
            }
        }
        
        return res.json({ message: 'Transaction successfully approved' });
    } catch (error) {
        console.error('[Finance] Critical Approval Error:', error);
        return res.status(500).json({ message: 'Internal server error during approval' });
    }
};

// Reject Transaction
exports.rejectTransaction = async (req, res) => {
    const { id } = req.params;
    const { reason, user_id } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM transaction WHERE transaction_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaction not found' });
        
        const transaction = rows[0];

        await db.execute(
            "UPDATE transaction SET status = 'Rejected', missing_proof_reason = ? WHERE transaction_id = ?",
            [reason || 'Rejected by Senior Treasurer', id]
        );

        res.json({ message: 'Transaction rejected' });
    } catch (error) {
        console.error('Reject Error:', error);
        res.status(500).json({ message: 'Failed to reject' });
    }
};

// Get Report Data
exports.getReportData = async (req, res) => {
    const { start_date, end_date, event_id } = req.query;
    try {
        let sql = `
            SELECT t.*, e.event_name, a.account_name 
            FROM transaction t
            LEFT JOIN event e ON t.event_id = e.event_id
            LEFT JOIN financial_account a ON t.account_id = a.account_id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            sql += ' AND t.transaction_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND t.transaction_date <= ?';
            params.push(end_date);
        }
        if (event_id && event_id !== 'all') {
            sql += ' AND t.event_id = ?';
            params.push(event_id);
        }

        sql += ' ORDER BY t.transaction_date ASC';

        const [transactions] = await db.execute(sql, params);

        // Metrics Helper
        const calcTotal = (list, type, statusList) => {
            return list
                .filter(t => t.transaction_type === type && statusList.includes(t.status))
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        };

        // Confirmed Metrics (Approved or Verified)
        const confirmedStatus = ['Approved', 'Verified'];
        const totalIncome = calcTotal(transactions, 'Income', confirmedStatus);
        const totalExpense = calcTotal(transactions, 'Expense', confirmedStatus);

        // Pending Metrics (Under Review)
        const pendingStatus = ['Pending'];
        const pendingIncome = calcTotal(transactions, 'Income', pendingStatus);
        const pendingExpense = calcTotal(transactions, 'Expense', pendingStatus);

        // Group by Event (Confirmed only)
        const eventSummary = transactions.filter(t => confirmedStatus.includes(t.status)).reduce((acc, t) => {
            const key = t.event_name || 'General / Membership';
            if (!acc[key]) acc[key] = { income: 0, expense: 0, name: key };
            if (t.transaction_type === 'Income') acc[key].income += parseFloat(t.amount || 0);
            else acc[key].expense += parseFloat(t.amount || 0);
            return acc;
        }, {});

        res.json({ 
            transactions,
            metrics: {
                totalIncome,
                totalExpense,
                netBalance: totalIncome - totalExpense,
                pendingIncome,
                pendingExpense,
                projectedBalance: (totalIncome + pendingIncome) - (totalExpense + pendingExpense),
                transactionCount: transactions.length,
                pendingCount: transactions.filter(t => t.status === 'Pending').length
            },
            eventSummary: Object.values(eventSummary)
        });
    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

