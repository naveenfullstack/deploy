/**
 * Headers Middleware
 * Validates required headers for all API requests
 * Requires two specific headers to be present and match environment values
 */

require('dotenv').config();

const requiredHeaders = {
  'x-api-key': process.env.REQUIRED_API_KEY,
  'x-client-id': process.env.REQUIRED_CLIENT_ID
};

/**
 * Middleware to validate required headers
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @param {Function} next - Next middleware function
 */
const validateHeaders = (handler) => {
  return async (event, context) => {
    try {
      // Get headers from event (handle both ALB and API Gateway formats)
      const headers = event.headers || {};
      
      // Convert headers to lowercase for case-insensitive comparison
      const normalizedHeaders = {};
      Object.keys(headers).forEach(key => {
        normalizedHeaders[key.toLowerCase()] = headers[key];
      });

      // Check for missing environment variables
      if (!process.env.REQUIRED_API_KEY || !process.env.REQUIRED_CLIENT_ID) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Server configuration error',
            timestamp: new Date().toISOString()
          })
        };
      }

      // Validate required headers
      const missingHeaders = [];
      const invalidHeaders = [];

      for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
        const headerValue = normalizedHeaders[headerName];
        
        if (!headerValue) {
          missingHeaders.push(headerName);
        } else if (headerValue !== expectedValue) {
          invalidHeaders.push(headerName);
        }
      }

      // Handle missing headers
      if (missingHeaders.length > 0) {
        console.warn('Headers Middleware - Missing required headers');
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required headers',
            timestamp: new Date().toISOString()
          })
        };
      }

      // Handle invalid headers
      if (invalidHeaders.length > 0) {
        console.warn('Headers Middleware - Invalid header values:', invalidHeaders);
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid authentication headers',
            timestamp: new Date().toISOString()
          })
        };
      }
      
      // Add validated headers to event for use in handlers
      event.validatedHeaders = {
        apiKey: normalizedHeaders['x-api-key'],
        clientId: normalizedHeaders['x-client-id']
      };

      // Call the original handler
      return await handler(event, context);

    } catch (error) {
      console.error('Headers Middleware - Unexpected error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        })
      };
    }
  };
};

/**
 * Middleware for OPTIONS requests (CORS preflight)
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 */
const handleCORS = (handler) => {
  return async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-client-id, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
        body: ''
      };
    }

    // For non-OPTIONS requests, proceed with header validation
    return await validateHeaders(handler)(event, context);
  };
};

/**
 * Complete middleware stack that handles CORS and header validation
 * @param {Function} handler - The Lambda handler function
 * @returns {Function} - Wrapped handler with middleware
 */
const headersMiddleware = (handler) => {
  return handleCORS(handler);
};

// Helper function to get required headers for documentation
const getRequiredHeaders = () => {
  return Object.keys(requiredHeaders);
};

// Helper function to validate headers manually (for testing)
const validateHeadersSync = (headers) => {
  const normalizedHeaders = {};
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  });

  const errors = [];
  
  for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
    const headerValue = normalizedHeaders[headerName];
    
    if (!headerValue) {
      errors.push(`Missing header: ${headerName}`);
    } else if (headerValue !== expectedValue) {
      errors.push(`Invalid header value: ${headerName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  headersMiddleware,
  validateHeaders,
  handleCORS,
  getRequiredHeaders,
  validateHeadersSync
};
