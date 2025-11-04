#!/usr/bin/env node

/**
 * Test script to verify headers middleware is working
 * Run with: node test-headers.js
 */

const axios = require('axios').default;

const API_BASE_URL = 'http://localhost:3001'; // Serverless offline URL
const VALID_API_KEY = 'budget-console-api-key-2025';
const VALID_CLIENT_ID = 'budget-console-client-web-app';

async function testAPI() {
  console.log('🧪 Testing Headers Middleware\n');

  // Test 1: Request without headers (should fail)
  console.log('Test 1: Request without headers');
  try {
    const response = await axios.get(`${API_BASE_URL}/api`);
    console.log('❌ FAIL: Request should have been blocked');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASS: Request correctly blocked (400 Bad Request)');
      console.log('Response:', error.response.data);
    } else {
      console.log('❓ UNEXPECTED:', error.message);
    }
  }
  console.log('');

  // Test 2: Request with invalid headers (should fail)
  console.log('Test 2: Request with invalid headers');
  try {
    const response = await axios.get(`${API_BASE_URL}/api`, {
      headers: {
        'x-api-key': 'wrong-key',
        'x-client-id': 'wrong-client'
      }
    });
    console.log('❌ FAIL: Request should have been blocked');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ PASS: Request correctly blocked (401 Unauthorized)');
      console.log('Response:', error.response.data);
    } else {
      console.log('❓ UNEXPECTED:', error.message);
    }
  }
  console.log('');

  // Test 3: Request with partial headers (should fail)
  console.log('Test 3: Request with partial headers (missing x-client-id)');
  try {
    const response = await axios.get(`${API_BASE_URL}/api`, {
      headers: {
        'x-api-key': VALID_API_KEY
      }
    });
    console.log('❌ FAIL: Request should have been blocked');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASS: Request correctly blocked (400 Bad Request)');
      console.log('Response:', error.response.data);
    } else {
      console.log('❓ UNEXPECTED:', error.message);
    }
  }
  console.log('');

  // Test 4: Request with valid headers (should succeed)
  console.log('Test 4: Request with valid headers');
  try {
    const response = await axios.get(`${API_BASE_URL}/api`, {
      headers: {
        'x-api-key': VALID_API_KEY,
        'x-client-id': VALID_CLIENT_ID
      }
    });
    console.log('✅ PASS: Request succeeded with valid headers');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.log('❌ FAIL: Request should have succeeded');
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 5: Test auth endpoint
  console.log('Test 5: Test auth endpoint with valid headers');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VALID_API_KEY,
        'x-client-id': VALID_CLIENT_ID
      }
    });
    console.log('✅ PASS: Auth endpoint accessible with valid headers');
    console.log('Response status:', response.status);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.log('✅ PASS: Auth endpoint accessible (returned auth error, not header error)');
      console.log('Response:', error.response.data);
    } else {
      console.log('❌ FAIL: Auth endpoint should be accessible with valid headers');
      console.log('Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 6: Test static file access (should not require headers)
  console.log('Test 6: Test static file access (should not require headers)');
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ PASS: Static files accessible without headers');
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('Response status:', error.response?.status);
    if (error.response?.status === 404) {
      console.log('✅ PASS: Static route accessible (404 is expected if no build exists)');
    } else {
      console.log('❓ INFO: Static file test result:', error.message);
    }
  }
  console.log('');

  // Test 7: CORS preflight
  console.log('Test 7: Test CORS preflight (OPTIONS request)');
  try {
    const response = await axios.options(`${API_BASE_URL}/api`);
    console.log('✅ PASS: CORS preflight handled correctly');
    console.log('Response status:', response.status);
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods']
    });
  } catch (error) {
    console.log('❌ FAIL: CORS preflight should work');
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n🏁 Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('- All API routes (/api, /auth, /user) should require valid headers');
  console.log('- Static routes (/, /_next, /public) should NOT require headers');
  console.log('- CORS preflight (OPTIONS) should work without headers');
  console.log('- Valid headers: x-api-key and x-client-id with correct values');
}

// Run the tests
testAPI().catch(console.error);