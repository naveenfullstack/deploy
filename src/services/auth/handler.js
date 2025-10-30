const authController = require('./controller');

module.exports = {
  login: authController.login,
  register: authController.register
};