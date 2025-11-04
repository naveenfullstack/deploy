/**
 * Database Test Script
 * Quick test to verify database connection and budget operations
 */

const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');

    // Fast connection options
    const options = {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 2000,
      bufferCommands: false,
    };

    const startTime = Date.now();
    await mongoose.connect(process.env.MONGODB_URI, options);
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Connected to MongoDB in ${connectionTime}ms`);
    console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
    
    // Test budget collection
    const Budget = require('./src/modules/Budget');
    const budgetCount = await Budget.countDocuments();
    console.log(`📊 Budget collection has ${budgetCount} documents`);

    // Test user collection
    const User = require('./src/modules/User');
    const userCount = await User.countDocuments();
    console.log(`👤 User collection has ${userCount} documents`);

    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

testConnection();