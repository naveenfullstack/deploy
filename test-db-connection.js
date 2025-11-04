#!/usr/bin/env node

/**
 * Test MongoDB Connection
 * Run with: node test-db-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection\n');
  
  // Check if URI is configured
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log('📍 MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@'));
  
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    
    const options = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
    };
    
    // Add timeout wrapper
    const connectionPromise = mongoose.connect(process.env.MONGODB_URI, options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Connection details:');
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - Port:', mongoose.connection.port);
    console.log('  - Database:', mongoose.connection.db.databaseName);
    console.log('  - Ready State:', mongoose.connection.readyState);
    
    // Test a simple operation
    console.log('\n🔍 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test ping
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful');
    
    // Test Budget query specifically
    console.log('\n📊 Testing Budget model query...');
    const Budget = require('./src/modules/Budget');
    const budgetCount = await Budget.countDocuments();
    console.log('📈 Total budgets in database:', budgetCount);
    
    if (budgetCount > 0) {
      const sampleBudgets = await Budget.find({}).limit(3).lean();
      console.log('📋 Sample budgets:', sampleBudgets.map(b => ({ 
        id: b._id, 
        name: b.budgetName, 
        amount: b.budgetAmount 
      })));
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('  1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('  2. Verify the username and password in the connection string');
      console.log('  3. Ensure the database name is correct');
      console.log('  4. Check your internet connection');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔐 Authentication error - check credentials');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

testConnection().catch(console.error);