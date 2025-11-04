/**
 * Auth Controller - handles authentication related business logic
 * Implements JWT authentication with MongoDB
 */

const User = require('../../modules/User');
const jwt = require('jsonwebtoken');
const { withDatabaseConnection } = require('../../database/mainDb');

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, monthlyIncome, currency } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      monthlyIncome: monthlyIncome || 0,
      currency: currency || 'USD'
    };

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      data: {
        token,
        user: user.getPublicProfile(),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Register Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by email (including password for authentication)
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Return success response
    res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile(),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user by ID
 * PUT /auth/update/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: 'User updated successfully',
      data: {
        user: user.getPublicProfile()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update User Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid user ID format',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user by ID
 * DELETE /auth/delete/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    // Find and delete user (soft delete by setting isActive to false)
    const user = await User.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      data: {
        userId: user._id,
        email: user.email,
        deletedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid user ID format',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get current user profile (requires authentication)
 * GET /auth/profile
 */
const getProfile = async (req, res) => {
  try {
    // This would typically be populated by authentication middleware
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Please login to access your profile',
        timestamp: new Date().toISOString()
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: {
        user: user.getPublicProfile()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve profile',
      timestamp: new Date().toISOString()
    });
  }
};

// Export all controllers wrapped with database connection
module.exports = {
  login: withDatabaseConnection(login),
  register: withDatabaseConnection(register),
  updateUser: withDatabaseConnection(updateUser),
  deleteUser: withDatabaseConnection(deleteUser),
  getProfile: withDatabaseConnection(getProfile)
};