const serverless = require("serverless-http");
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// Import headers middleware
const { validateHeadersSync } = require('./src/middleware/headers');

// Import service routes
const userRoutes = require('./src/services/user/routes');
const authRoutes = require('./src/services/auth/routes');
const budgetRoutes = require('./src/services/budget/routes');
const expenseRoutes = require('./src/services/expenses/routes');

// Middleware for parsing JSON
app.use(express.json());

// Headers validation middleware for all API routes
const headersValidationMiddleware = (req, res, next) => {
  // Skip header validation for static files and non-API routes
  if (req.path.startsWith('/_next/') || 
      req.path.startsWith('/public/') || 
      req.path.endsWith('.html') || 
      req.path.endsWith('.css') || 
      req.path.endsWith('.js') || 
      req.path.endsWith('.ico') ||
      req.path === '/' ||
      req.method === 'OPTIONS') {
    return next();
  }

  // Only validate headers for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/user') || req.path.startsWith('/auth')) {
    console.log('Headers Middleware - Validating request headers');
    console.log('Path:', req.path);
    console.log('Method:', req.method);

    // Check for missing environment variables
    if (!process.env.REQUIRED_API_KEY || !process.env.REQUIRED_CLIENT_ID) {
      console.error('Headers Middleware - Missing required environment variables');
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Server configuration error',
        timestamp: new Date().toISOString()
      });
    }

    // Validate headers using the existing function
    const validation = validateHeadersSync(req.headers);
    
    if (!validation.valid) {
      console.warn('Headers Middleware - Header validation failed:', validation.errors);
      
      // Check if headers are missing vs invalid
      const missingHeaders = validation.errors.filter(error => error.includes('Missing header'));
      const invalidHeaders = validation.errors.filter(error => error.includes('Invalid header'));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required headers: x-api-key, x-client-id',
          requiredHeaders: ['x-api-key', 'x-client-id'],
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authentication headers',
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('Headers Middleware - Headers validated successfully');
    
    // Add validated headers to request object
    req.validatedHeaders = {
      apiKey: req.headers['x-api-key'],
      clientId: req.headers['x-client-id']
    };
  }

  next();
};

// CORS middleware for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-client-id, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  
  next();
});

// Apply headers validation middleware globally
app.use(headersValidationMiddleware);

// Serve static files from Next.js build
app.use('/_next', express.static(path.join(__dirname, 'ui/.next')));
app.use('/public', express.static(path.join(__dirname, 'ui/public')));
app.use(express.static(path.join(__dirname, 'ui/out')));

// API routes (must come before catch-all route)
app.get("/api", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from Microservices API!",
    services: ["user-service", "auth-service", "budget-service", "expense-service"],
    availableRoutes: [
      "GET /user/profile - User profile information",
      "GET /user/settings - User settings",
      "POST /auth/login - User authentication", 
      "POST /auth/register - User registration",
      "GET /budgets - Get all budgets",
      "GET /budgets/:id - Get budget by ID",
      "POST /budgets - Create new budget",
      "PUT /budgets/:id - Update budget",
      "DELETE /budgets/:id - Delete budget",
      "GET /expenses - Get all expenses",
      "GET /expenses/user/:userId - Get expenses by user",
      "GET /expenses/user/:userId/budget/:budgetId - Get expenses by user and budget",
      "POST /expenses - Create new expense",
      "PUT /expenses/:id - Update expense",
      "DELETE /expenses/:id - Delete expense"
    ],
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      API_VERSION: process.env.API_VERSION,
      STAGE: process.env.STAGE
    }
  });
});

// Service routes
app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/budgets', budgetRoutes);
app.use('/expenses', expenseRoutes);

// Serve Next.js app for all other routes (catch-all)
app.get('*', (req, res) => {
  // First try to serve from Next.js static export
  const indexPath = path.join(__dirname, 'ui/out/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if Next.js build doesn't exist
    res.status(200).json({
      message: "Next.js App Not Built",
      instructions: "Please run 'cd ui && npm run build' to build the Next.js application",
      availableRoutes: [
        "GET /api - API information",
        "GET /api/health - API health check",
        "GET /user/profile - User profile",
        "GET /user/settings - User settings", 
        "POST /auth/login - Login",
        "POST /auth/register - Register",
        "GET /budgets - Get budgets",
        "POST /budgets - Create budget"
      ]
    });
  }
});

// 404 handler
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Route Not Found",
    message: `The route ${req.method} ${req.path} does not exist`,
    availableRoutes: [
      "GET / - API information",
      "GET /health - Health check",
      "GET /user/profile - User profile",
      "GET /user/settings - User settings", 
      "POST /auth/login - Login",
      "POST /auth/register - Register",
      "GET /budgets - Get budgets",
      "POST /budgets - Create budget"
    ]
  });
});

exports.handler = serverless(app);
