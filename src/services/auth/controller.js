// Auth Controller - handles authentication related business logic
const login = (req, res) => {
  return res.status(200).json({
    message: "Hello, this is auth login route!",
    service: "auth-service",
    route: "/auth/login",
    data: {
      token: "sample-jwt-token-123456",
      user: {
        id: "user-123",
        username: "sampleuser"
      },
      loginTime: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
};

const register = (req, res) => {
  return res.status(201).json({
    message: "Hello, this is auth register route!",
    service: "auth-service",
    route: "/auth/register", 
    data: {
      userId: "new-user-456",
      username: "newuser",
      email: "newuser@example.com",
      registrationTime: new Date().toISOString(),
      status: "registered successfully"
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  login,
  register
};