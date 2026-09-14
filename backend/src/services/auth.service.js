const adminRepo = require("../repositories/admin.repository");
const { comparePassword, hashPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

async function login({ email, password }) {
  const admin = await adminRepo.findByEmail(email);
  if (!admin) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  if (!admin.isActive) {
    const error = new Error("Account has been deactivated. Please contact support.");
    error.status = 403;
    throw error;
  }

  const isValid = await comparePassword(password, admin.passwordHash);
  if (!isValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const token = signToken({
    id: admin.id,
    role: admin.role,
    restaurantId: admin.restaurantId,
    email: admin.email,
  });

  return {
    token,
    user: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      restaurantId: admin.restaurantId,
      restaurantName: admin.restaurantName,
      restaurantSlug: admin.restaurantSlug,
    },
  };
}

async function getProfile(userId) {
  const admin = await adminRepo.findById(userId);
  if (!admin) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return admin;
}

async function changePassword(userId, currentPassword, newPassword) {
  const admin = await adminRepo.findById(userId);
  if (!admin) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const fullAdmin = await adminRepo.findByEmail(admin.email);
  const isValid = await comparePassword(currentPassword, fullAdmin.passwordHash);
  if (!isValid) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    throw error;
  }

  const newHash = await hashPassword(newPassword);
  await adminRepo.updatePassword(userId, newHash);
  return true;
}

module.exports = {
  login,
  getProfile,
  changePassword,
};
