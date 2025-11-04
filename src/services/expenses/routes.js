/**
 * Expense Routes
 * Defines all API routes for expense management
 */

const express = require('express');
const {
  getAllExpenses,
  getExpensesByUserId,
  getExpensesByUserAndBudget,
  createExpense,
  updateExpense,
  deleteExpense
} = require('./controller');

const router = express.Router();

/**
 * @route   GET /expenses
 * @desc    Get all expenses (no authentication required for demo)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    // Convert Express request to Lambda event format
    const event = {
      httpMethod: 'GET',
      path: '/expenses',
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await getAllExpenses(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /expenses/user/:userId
 * @desc    Get all expenses for a specific user ID
 * @access  Public
 * @param   {string} userId - User ID
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: `/expenses/user/${req.params.userId}`,
      pathParameters: { id: req.params.userId },
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await getExpensesByUserId(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /expenses/user/:userId/budget/:budgetId
 * @desc    Get expenses for specific user and budget
 * @access  Public
 * @param   {string} userId - User ID
 * @param   {string} budgetId - Budget ID
 */
router.get('/user/:userId/budget/:budgetId', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: `/expenses/user/${req.params.userId}/budget/${req.params.budgetId}`,
      pathParameters: { 
        userId: req.params.userId,
        budgetId: req.params.budgetId 
      },
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await getExpensesByUserAndBudget(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /expenses
 * @desc    Create new expense
 * @access  Public
 * @body    {object} expense - Expense object
 * @body    {string} expense.expenseName - Name of the expense (required)
 * @body    {number} expense.expenseAmount - Expense amount (required)
 * @body    {string} expense.userId - User ID (required)
 * @body    {string} expense.budgetId - Budget ID (required)
 * @body    {string} expense.category - Expense category (optional, default: Miscellaneous)
 * @body    {string} expense.currency - Currency code (optional, default: USD)
 * @body    {string} expense.description - Expense description (optional)
 * @body    {string} expense.expenseDate - Expense date (optional, default: current date)
 * @body    {string} expense.paymentMethod - Payment method (optional, default: Cash)
 * @body    {string} expense.vendor - Vendor name (optional)
 * @body    {string} expense.location - Location (optional)
 * @body    {array} expense.tags - Expense tags (optional)
 * @body    {string} expense.notes - Additional notes (optional)
 * @body    {boolean} expense.isReimbursable - Is reimbursable (optional, default: false)
 */
router.post('/', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'POST',
      path: '/expenses',
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body)
    };

    const context = {};
    
    const result = await createExpense(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /expenses/:id
 * @desc    Update expense by ID
 * @access  Public
 * @param   {string} id - Expense ID
 * @body    {object} expense - Expense update object
 */
router.put('/:id', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'PUT',
      path: `/expenses/${req.params.id}`,
      pathParameters: { id: req.params.id },
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body)
    };

    const context = {};
    
    const result = await updateExpense(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /expenses/:id
 * @desc    Delete expense by ID
 * @access  Public
 * @param   {string} id - Expense ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'DELETE',
      path: `/expenses/${req.params.id}`,
      pathParameters: { id: req.params.id },
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await deleteExpense(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * Error handling middleware for expense routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Expense Routes Error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred processing your expense request',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;