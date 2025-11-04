/**
 * Simple Budget Handler - Direct connection for testing
 * Bypasses middleware to test direct database connection
 */

const mongoose = require('mongoose');
const Budget = require('../../modules/Budget');
require('dotenv').config();

// Cache connection
let cachedConnection = null;

/**
 * Get database connection
 */
async function getConnection() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('📦 Using cached connection');
    return cachedConnection;
  }

  console.log('📦 Creating new connection');
  
  const options = {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 10000,
    bufferCommands: false,
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    cachedConnection = mongoose.connection;
    console.log('✅ Connected to database');
    return cachedConnection;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    throw error;
  }
}

/**
 * Simple budget handler
 */
const simpleBudgetHandler = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log('🚀 Simple Budget Handler: Starting');
    
    // Connect to database
    await getConnection();
    
    // Simple query
    console.log('📊 Executing query...');
    const budgets = await Budget.find({}).limit(5).lean().select('budgetName budgetAmount userId createdAt');
    
    console.log(`✅ Retrieved ${budgets.length} budgets`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: { budgets, count: budgets.length },
        message: `Retrieved ${budgets.length} budgets via simple handler`
      })
    };

  } catch (error) {
    console.error('❌ Simple handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Database Error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

module.exports.simpleBudgetHandler = simpleBudgetHandler;