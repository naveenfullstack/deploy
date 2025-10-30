const userController = require('./controller');

module.exports = {
  getUserProfile: userController.getUserProfile,
  getUserSettings: userController.getUserSettings
};