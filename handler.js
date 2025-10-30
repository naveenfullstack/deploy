const serverless = require("serverless-http");
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// Import service routes
const userRoutes = require('./src/services/user/routes');
const authRoutes = require('./src/services/auth/routes');

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from Next.js build
app.use('/_next', express.static(path.join(__dirname, 'ui/.next')));
app.use('/public', express.static(path.join(__dirname, 'ui/public')));
app.use(express.static(path.join(__dirname, 'ui/out')));

// API routes (must come before catch-all route)
app.get("/api", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from Microservices API!",
    services: ["user-service", "auth-service"],
    availableRoutes: [
      "GET /user/profile - User profile information",
      "GET /user/settings - User settings",
      "POST /auth/login - User authentication", 
      "POST /auth/register - User registration"
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
        "POST /auth/register - Register"
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
      "POST /auth/register - Register"
    ]
  });
});

exports.handler = serverless(app);
