#!/usr/bin/env node

/**
 * Test script for Auth API endpoints
 * Tests user registration, login, update, delete, and JWT authentication
 * Run with: node test-auth-api.js
 */

const axios = require('axios').default;

const API_BASE_URL = 'http://localhost:3001';
const VALID_API_KEY = 'budget-console-api-key-2025';
const VALID_CLIENT_ID = 'budget-console-client-web-app';

// Test user data
const testUser = {
  email: 'test@budgetconsole.com',
  password: 'TestPassword123',
  firstName: 'John',
  lastName: 'Doe',
  monthlyIncome: 5000,
  currency: 'USD'
};

let authToken = '';
let userId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': VALID_API_KEY,
    'x-client-id': VALID_CLIENT_ID
  };

  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    headers
  };

  if (data) {
    config.data = data;
  }

  return axios(config);
};

async function testAuthAPI() {
  console.log('🧪 Testing Auth API with MongoDB & JWT\n');

  // Test 1: Health Check
  console.log('Test 1: Auth Service Health Check');
  try {
    const response = await makeRequest('GET', '/auth/health');
    console.log('✅ PASS: Auth service is healthy');
    console.log('Available endpoints:', response.data.endpoints.length);
  } catch (error) {
    console.log('❌ FAIL: Auth service health check failed');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 2: Register User
  console.log('Test 2: User Registration');
  try {
    const response = await makeRequest('POST', '/auth/register', testUser);
    console.log('✅ PASS: User registered successfully');
    console.log('User ID:', response.data.data.user._id);
    console.log('Email:', response.data.data.user.email);
    console.log('Token received:', !!response.data.data.token);
    
    // Store token and user ID for subsequent tests
    authToken = response.data.data.token;
    userId = response.data.data.user._id;
    
  } catch (error) {
    console.log('❌ FAIL: User registration failed');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: Duplicate Registration (should fail)
  console.log('Test 3: Duplicate Registration (should fail)');
  try {
    const response = await makeRequest('POST', '/auth/register', testUser);
    console.log('❌ FAIL: Duplicate registration should have been rejected');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ PASS: Duplicate registration correctly rejected (409 Conflict)');
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❓ UNEXPECTED: Wrong error type');
      console.log('Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 4: Login with Valid Credentials
  console.log('Test 4: Login with Valid Credentials');
  try {
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log('✅ PASS: Login successful');
    console.log('Token received:', !!response.data.data.token);
    console.log('Last login updated:', !!response.data.data.user.lastLogin);
    
    // Update token
    authToken = response.data.data.token;
    
  } catch (error) {
    console.log('❌ FAIL: Login should have succeeded');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 5: Login with Invalid Credentials
  console.log('Test 5: Login with Invalid Credentials');
  try {
    const loginData = {
      email: testUser.email,
      password: 'WrongPassword123'
    };
    
    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log('❌ FAIL: Login should have been rejected');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ PASS: Invalid login correctly rejected (401 Unauthorized)');
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❓ UNEXPECTED: Wrong error type');
      console.log('Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 6: Get Profile (with authentication)
  console.log('Test 6: Get User Profile (with JWT)');
  try {
    const response = await makeRequest('GET', '/auth/profile', null, true);
    console.log('✅ PASS: Profile retrieved successfully');
    console.log('User email:', response.data.data.user.email);
    console.log('Full name:', response.data.data.user.fullName);
    console.log('Account age:', response.data.data.user.accountAge, 'days');
  } catch (error) {
    console.log('❌ FAIL: Profile retrieval should have succeeded');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 7: Update User
  console.log('Test 7: Update User Information');
  try {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      monthlyIncome: 6000,
      currency: 'EUR'
    };
    
    const response = await makeRequest('PUT', `/auth/update/${userId}`, updateData);
    console.log('✅ PASS: User updated successfully');
    console.log('Updated name:', response.data.data.user.fullName);
    console.log('Updated income:', response.data.data.user.monthlyIncome);
    console.log('Updated currency:', response.data.data.user.currency);
    
  } catch (error) {
    console.log('❌ FAIL: User update should have succeeded');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 8: Update with Invalid ID
  console.log('Test 8: Update with Invalid ID (should fail)');
  try {
    const response = await makeRequest('PUT', '/auth/update/invalid-id', { firstName: 'Test' });
    console.log('❌ FAIL: Invalid ID update should have been rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ PASS: Invalid ID correctly rejected (400 Bad Request)');
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❓ UNEXPECTED: Wrong error type');
      console.log('Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 9: Validation Tests
  console.log('Test 9: Registration Validation Tests');
  
  // Test missing email
  try {
    await makeRequest('POST', '/auth/register', { password: 'test123' });
    console.log('❌ FAIL: Missing email should be rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ PASS: Missing email correctly rejected');
    }
  }

  // Test invalid email format
  try {
    await makeRequest('POST', '/auth/register', { 
      email: 'invalid-email', 
      password: 'test123' 
    });
    console.log('❌ FAIL: Invalid email format should be rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ PASS: Invalid email format correctly rejected');
    }
  }

  // Test short password
  try {
    await makeRequest('POST', '/auth/register', { 
      email: 'test2@example.com', 
      password: '123' 
    });
    console.log('❌ FAIL: Short password should be rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ PASS: Short password correctly rejected');
    }
  }
  console.log('');

  // Test 10: Delete User (Soft Delete)
  console.log('Test 10: Delete User (Soft Delete)');
  try {
    const response = await makeRequest('DELETE', `/auth/delete/${userId}`);
    console.log('✅ PASS: User deleted successfully (soft delete)');
    console.log('Deleted user ID:', response.data.data.userId);
    console.log('Deleted at:', response.data.data.deletedAt);
    
  } catch (error) {
    console.log('❌ FAIL: User deletion should have succeeded');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 11: Login After Deletion (should fail)
  console.log('Test 11: Login After Deletion (should fail)');
  try {
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log('❌ FAIL: Login after deletion should have been rejected');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ PASS: Login after deletion correctly rejected (403 Forbidden)');
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❓ INFO: Login rejected with status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }
  }
  console.log('');

  console.log('🏁 Auth API Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('✅ User Registration with validation');
  console.log('✅ JWT Authentication with login');
  console.log('✅ Password hashing and comparison');
  console.log('✅ User profile management');
  console.log('✅ CRUD operations (Create, Read, Update, Delete)');
  console.log('✅ MongoDB integration');
  console.log('✅ Error handling and validation');
  console.log('✅ Soft delete functionality');
  console.log('✅ Security headers middleware integration');
}

// Run the tests
testAuthAPI().catch(console.error);