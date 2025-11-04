const authController = require('./controller');

module.exports = {
  login: authController.login,
  register: authController.register,
  updateUser: authController.updateUser,
  deleteUser: authController.deleteUser,
  getProfile: authController.getProfile
};