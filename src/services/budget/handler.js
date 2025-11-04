/**
 * Budget Handler
 * Serverless handler for budget API endpoints
 */

const { withDatabaseConnection } = require('../../database/mainDb');
const headersMiddleware = require('../../middleware/headers');
const {
  getAllBudgets,
  getBudgetsByUserId,
  createBudget,
  updateBudget,
  deleteBudget
} = require('./controller');

/**
 * Route budget requests to appropriate controller functions
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const routeBudgetRequest = async (event, context) => {
  const { httpMethod, path, pathParameters } = event;
  const budgetId = pathParameters?.id;

  console.log(`📊 Budget Handler: Routing ${httpMethod} ${path}`, { budgetId });

  try {
    // Handle different HTTP methods and paths
    switch (httpMethod) {
      case 'GET':
        if (budgetId) {
          // GET /budgets/:id - Get all budgets for a specific user ID
          return await getBudgetsByUserId(event, context);
        } else {
          // GET /budgets - Get all budgets (no authentication required)
          return await getAllBudgets(event, context);
        }

      case 'POST':
        // POST /budgets
        return await createBudget(event, context);

      case 'PUT':
        if (budgetId) {
          // PUT /budgets/:id
          return await updateBudget(event, context);
        }
        break;

      case 'DELETE':
        if (budgetId) {
          // DELETE /budgets/:id
          return await deleteBudget(event, context);
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
          'GET /budgets',
          'GET /budgets/:id',
          'POST /budgets',
          'PUT /budgets/:id',
          'DELETE /budgets/:id'
        ]
      })
    };

  } catch (error) {
    console.error('❌ Budget Handler Routing Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process budget request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Main budget handler with middleware
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const budgetHandler = async (event, context) => {
  try {
    console.log('📊 Budget Handler: Processing request', {
      method: event.httpMethod,
      path: event.path,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters
    });

    // Route the request
    const response = await routeBudgetRequest(event, context);
    
    console.log('✅ Budget Handler: Request processed successfully', {
      statusCode: response.statusCode,
      method: event.httpMethod,
      path: event.path
    });

    return response;

  } catch (error) {
    console.error('❌ Budget Handler Error:', error);
    
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
        message: 'Budget service encountered an error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export handler with database connection only (no headers middleware for demo)
module.exports.budgetHandler = withDatabaseConnection(budgetHandler);

// Export individual functions for testing
module.exports.routeBudgetRequest = routeBudgetRequest;
