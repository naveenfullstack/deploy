# Headers Middleware Documentation

## Overview
The headers middleware validates that all API requests contain two required headers with specific values defined in environment variables.

## Required Environment Variables

Add these to your `.env` file:

```env
REQUIRED_API_KEY="budget-console-api-key-2025"
REQUIRED_CLIENT_ID="budget-console-client-web-app"
```

## Required Headers

All API requests must include these headers:

| Header Name | Environment Variable | Description |
|-------------|---------------------|-------------|
| `x-api-key` | `REQUIRED_API_KEY` | API authentication key |
| `x-client-id` | `REQUIRED_CLIENT_ID` | Client application identifier |

## Usage

### 1. Basic Usage

```javascript
const { headersMiddleware } = require('./middleware/headers');

// Wrap your handler with the middleware
const myHandler = async (event, context) => {
  // Your handler logic here
  // Headers are already validated at this point
  
  // Access validated headers
  const { apiKey, clientId } = event.validatedHeaders;
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};

module.exports = {
  myEndpoint: headersMiddleware(myHandler)
};
```

### 2. Multiple Endpoints

```javascript
const { headersMiddleware } = require('./middleware/headers');
const controller = require('./controller');

module.exports = {
  login: headersMiddleware(controller.login),
  register: headersMiddleware(controller.register),
  getUserProfile: headersMiddleware(controller.getUserProfile)
};
```

## HTTP Responses

### Success (Headers Valid)
- Proceeds to your handler
- Adds `event.validatedHeaders` object with validated header values

### Missing Headers (400 Bad Request)
```json
{
  "error": "Bad Request",
  "message": "Missing required headers: x-api-key, x-client-id",
  "requiredHeaders": ["x-api-key", "x-client-id"],
  "timestamp": "2025-10-31T10:30:00.000Z"
}
```

### Invalid Headers (401 Unauthorized)
```json
{
  "error": "Unauthorized", 
  "message": "Invalid authentication headers",
  "timestamp": "2025-10-31T10:30:00.000Z"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "error": "Internal Server Error",
  "message": "Server configuration error",
  "timestamp": "2025-10-31T10:30:00.000Z"
}
```

## CORS Support

The middleware automatically handles CORS preflight (OPTIONS) requests:

- **Allowed Origins**: `*` (all origins)
- **Allowed Headers**: `Content-Type, x-api-key, x-client-id, Authorization`
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Max Age**: 24 hours

## Client-Side Usage

### JavaScript/Fetch
```javascript
const response = await fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'budget-console-api-key-2025',
    'x-client-id': 'budget-console-client-web-app'
  },
  body: JSON.stringify({ email, password })
});
```

### cURL
```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: budget-console-api-key-2025" \
  -H "x-client-id: budget-console-client-web-app" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Axios
```javascript
const axios = require('axios');

const response = await axios.post('https://api.example.com/login', 
  { email, password },
  {
    headers: {
      'x-api-key': 'budget-console-api-key-2025',
      'x-client-id': 'budget-console-client-web-app'
    }
  }
);
```

## Utility Functions

### Manual Header Validation
```javascript
const { validateHeadersSync } = require('./middleware/headers');

const headers = {
  'x-api-key': 'some-key',
  'x-client-id': 'some-client'
};

const result = validateHeadersSync(headers);
if (!result.valid) {
  console.log('Validation errors:', result.errors);
}
```

### Get Required Headers List
```javascript
const { getRequiredHeaders } = require('./middleware/headers');

const requiredHeaders = getRequiredHeaders();
console.log('Required headers:', requiredHeaders);
// Output: ['x-api-key', 'x-client-id']
```

## Security Features

1. **Case-insensitive header matching** - Works with different header casing
2. **Environment-based configuration** - Header values stored securely in .env
3. **Detailed error messages** - Clear feedback for debugging
4. **Request logging** - Logs validation attempts for monitoring
5. **Error handling** - Graceful handling of unexpected errors

## Testing

### Valid Request
```javascript
const event = {
  headers: {
    'x-api-key': 'budget-console-api-key-2025',
    'x-client-id': 'budget-console-client-web-app'
  }
};
```

### Invalid Request (Missing Header)
```javascript
const event = {
  headers: {
    'x-api-key': 'budget-console-api-key-2025'
    // Missing x-client-id
  }
};
```

### Invalid Request (Wrong Value)
```javascript
const event = {
  headers: {
    'x-api-key': 'wrong-key',
    'x-client-id': 'budget-console-client-web-app'
  }
};
```

## Important Notes

1. **Environment Variables**: Ensure `.env` file is properly loaded
2. **Header Names**: Use lowercase header names for consistency
3. **CORS**: Middleware handles CORS automatically
4. **Logging**: Check CloudWatch logs for validation details
5. **Performance**: Minimal overhead, validates headers quickly

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure `.env` file contains `REQUIRED_API_KEY` and `REQUIRED_CLIENT_ID`
   - Check that `dotenv` is properly configured

2. **Headers not found**
   - Verify header names are correct (`x-api-key`, `x-client-id`)
   - Check for typos in header values

3. **CORS issues**
   - Middleware handles CORS automatically
   - Ensure client sends preflight requests for complex requests

4. **Case sensitivity**
   - Middleware handles case-insensitive headers
   - Use lowercase header names for consistency