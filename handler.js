const serverless = require("serverless-http");
const express = require("express");
const app = express();

// Import service routes
const userRoutes = require('./src/services/user/routes');
const authRoutes = require('./src/services/auth/routes');

// Middleware for parsing JSON
app.use(express.json());

// Root route
app.get("/", (req, res, next) => {
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
