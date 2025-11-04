const express = require('express');
const router = express.Router();
const authHandler = require('./handler');

// Authentication Routes
router.post('/login', authHandler.login);
router.post('/register', authHandler.register);

// User Management Routes
router.put('/update/:id', authHandler.updateUser);
router.delete('/delete/:id', authHandler.deleteUser);
router.get('/profile', authHandler.getProfile);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Auth service is healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /auth/login - User login',
      'POST /auth/register - User registration',
      'PUT /auth/update/:id - Update user by ID',
      'DELETE /auth/delete/:id - Delete user by ID',
      'GET /auth/profile - Get current user profile',
      'GET /auth/health - Service health check'
    ]
  });
});

module.exports = router;