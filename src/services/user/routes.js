const express = require('express');
const router = express.Router();
const userHandler = require('./handler');

// Route: GET /user/profile
router.get('/profile', userHandler.getUserProfile);

// Route: GET /user/settings  
router.get('/settings', userHandler.getUserSettings);

module.exports = router;