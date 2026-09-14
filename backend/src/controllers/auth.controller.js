const authService = require("../services/auth.service");
const { loginSchema, changePasswordSchema } = require("../validators/auth.validator");
const { success } = require("../utils/response");

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    return success(res, result, "Login successful");
  } catch (error) {
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, user);
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.id, data.currentPassword, data.newPassword);
    return success(res, null, "Password updated successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  getMe,
  changePassword,
};
