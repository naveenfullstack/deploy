// User Controller - handles user related business logic
const getUserProfile = (req, res) => {
  return res.status(200).json({
    message: "Hello, this is user profile route!",
    service: "user-service",
    route: "/user/profile",
    data: {
      userId: req.params.id || "sample-user-123",
      profile: {
        name: "Sample User",
        email: "user@example.com"
      }
    },
    timestamp: new Date().toISOString()
  });
};

const getUserSettings = (req, res) => {
  return res.status(200).json({
    message: "Hello, this is user settings route!",
    service: "user-service", 
    route: "/user/settings",
    data: {
      userId: req.params.id || "sample-user-123",
      settings: {
        theme: "dark",
        notifications: true,
        language: "en"
      }
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getUserProfile,
  getUserSettings
};