/**
 * Budget Routes
 * Defines all API routes for budget management
 */

const express = require('express');
const {
  getAllBudgets,
  getBudgetsByUserId,
  createBudget,
  updateBudget,
  deleteBudget
} = require('./controller');

const router = express.Router();

/**
 * @route   GET /budgets
 * @desc    Get all budgets (no authentication required for demo)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    // Convert Express request to Lambda event format
    const event = {
      httpMethod: 'GET',
      path: '/budgets',
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await getAllBudgets(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /budgets/:id
 * @desc    Get all budgets for a specific user ID
 * @access  Private (requires JWT token)
 * @param   {string} id - User ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: `/budgets/${req.params.id}`,
      pathParameters: { id: req.params.id },
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await getBudgetsByUserId(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /budgets
 * @desc    Create new budget
 * @access  Private (requires JWT token)
 * @body    {object} budget - Budget object
 * @body    {string} budget.budgetName - Name of the budget (required)
 * @body    {number} budget.budgetAmount - Budget amount (required)
 * @body    {string} budget.currency - Currency code (optional, default: USD)
 * @body    {string} budget.category - Budget category (optional, default: Miscellaneous)
 * @body    {string} budget.description - Budget description (optional)
 * @body    {string} budget.startDate - Start date (required, YYYY-MM-DD)
 * @body    {string} budget.endDate - End date (required, YYYY-MM-DD)
 * @body    {number} budget.alertThreshold - Alert threshold percentage (optional, default: 80)
 * @body    {boolean} budget.isAlertEnabled - Enable alerts (optional, default: true)
 * @body    {array} budget.tags - Budget tags (optional)
 * @body    {string} budget.notes - Additional notes (optional)
 */
router.post('/', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'POST',
      path: '/budgets',
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body)
    };

    const context = {};
    
    const result = await createBudget(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /budgets/:id
 * @desc    Update budget by ID
 * @access  Private (requires JWT token)
 * @param   {string} id - Budget ID
 * @body    {object} budget - Budget update object (same fields as create)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'PUT',
      path: `/budgets/${req.params.id}`,
      pathParameters: { id: req.params.id },
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body)
    };

    const context = {};
    
    const result = await updateBudget(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /budgets/:id
 * @desc    Delete budget by ID
 * @access  Private (requires JWT token)
 * @param   {string} id - Budget ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'DELETE',
      path: `/budgets/${req.params.id}`,
      pathParameters: { id: req.params.id },
      queryStringParameters: req.query,
      headers: req.headers,
      body: null
    };

    const context = {};
    
    const result = await deleteBudget(event, context);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    next(error);
  }
});



/**
 * Error handling middleware for budget routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Budget Routes Error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred processing your budget request',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;