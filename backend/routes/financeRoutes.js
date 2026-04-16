const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

// All routes prefixed with /api/finance

router.get('/dashboard-summary', financeController.getDashboardSummary);
router.get('/transactions', financeController.getAllTransactions);
router.post('/transaction', financeController.addTransaction);
router.put('/transaction/:id', financeController.updateTransaction);
router.delete('/transaction/:id', financeController.deleteTransaction);
router.put('/transaction/:id/approve', financeController.approveTransaction);
router.get('/budgets', financeController.getEventBudgets);

module.exports = router;
