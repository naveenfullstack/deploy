/**
 * Expense Handler
 * Serverless handler for expense API endpoints
 */

const { withDatabaseConnection } = require('../../database/mainDb');
const {
  getAllExpenses,
  getExpensesByUserId,
  getExpensesByUserAndBudget,
  createExpense,
  updateExpense,
  deleteExpense
} = require('./controller');

/**
 * Route expense requests to appropriate controller functions
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const routeExpenseRequest = async (event, context) => {
  const { httpMethod, path, pathParameters } = event;
  
  console.log(`💰 Expense Handler: Routing ${httpMethod} ${path}`, { pathParameters });

  try {
    // Handle different HTTP methods and paths
    switch (httpMethod) {
      case 'GET':
        // Check if we have both userId and budgetId in path
        if (pathParameters?.userId && pathParameters?.budgetId) {
          // GET /expenses/user/:userId/budget/:budgetId - Get expenses for specific user and budget
          return await getExpensesByUserAndBudget(event, context);
        } else if (pathParameters?.id) {
          // GET /expenses/user/:id - Get expenses for specific user ID
          return await getExpensesByUserId(event, context);
        } else {
          // GET /expenses - Get all expenses
          return await getAllExpenses(event, context);
        }

      case 'POST':
        // POST /expenses
        return await createExpense(event, context);

      case 'PUT':
        if (pathParameters?.id) {
          // PUT /expenses/:id
          return await updateExpense(event, context);
        }
        break;

      case 'DELETE':
        if (pathParameters?.id) {
          // DELETE /expenses/:id
          return await deleteExpense(event, context);
        }
        break;

      case 'OPTIONS':
        // Handle CORS preflight requests
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Max-Age': '3600'
          },
          body: ''
        };

      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Method Not Allowed',
            message: `HTTP method ${httpMethod} is not supported for this endpoint`,
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          })
        };
    }

    // If no route matched
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${httpMethod} ${path} not found`,
        availableRoutes: [
          'GET /expenses',
          'GET /expenses/user/:userId',
          'GET /expenses/user/:userId/budget/:budgetId',
          'POST /expenses',
          'PUT /expenses/:id',
          'DELETE /expenses/:id'
        ]
      })
    };

  } catch (error) {
    console.error('❌ Expense Handler Routing Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process expense request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Main expense handler with middleware
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const expenseHandler = async (event, context) => {
  try {
    console.log('💰 Expense Handler: Processing request', {
      method: event.httpMethod,
      path: event.path,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters
    });

    // Route the request
    const response = await routeExpenseRequest(event, context);
    
    console.log('✅ Expense Handler: Request processed successfully', {
      statusCode: response.statusCode,
      method: event.httpMethod,
      path: event.path
    });

    return response;

  } catch (error) {
    console.error('❌ Expense Handler Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Expense service encountered an error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export handler with database connection only (no headers middleware for demo)
module.exports.expenseHandler = withDatabaseConnection(expenseHandler);

// Export individual functions for testing
module.exports.routeExpenseRequest = routeExpenseRequest;