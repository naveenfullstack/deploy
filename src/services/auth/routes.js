const express = require('express');
const router = express.Router();
const authHandler = require('./handler');

// Route: POST /auth/login
router.post('/login', authHandler.login);

// Route: POST /auth/register
router.post('/register', authHandler.register);

module.exports = router;