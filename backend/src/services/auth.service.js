const crypto = require("crypto");
const adminRepo = require("../repositories/admin.repository");
const passwordResetRepo = require("../repositories/passwordReset.repository");
const emailService = require("./emailService");
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

async function forgotPassword(email) {
  // Check 60s cooldown for resend requests
  const lastCreated = await passwordResetRepo.getLastOtpCreatedTime(email);
  if (lastCreated) {
    const elapsedSeconds = (Date.now() - new Date(lastCreated).getTime()) / 1000;
    if (elapsedSeconds < 60) {
      const remaining = Math.ceil(60 - elapsedSeconds);
      const error = new Error(`Please wait ${remaining} seconds before requesting another OTP.`);
      error.status = 429;
      throw error;
    }
  }

  const admin = await adminRepo.findByEmail(email);

  if (admin && admin.isActive) {
    // Invalidate prior unexpired OTPs
    await passwordResetRepo.invalidateExistingOtps(email);

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP using bcrypt
    const otpHash = await hashPassword(otp);

    // 10 minutes expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await passwordResetRepo.createOtpRecord({
      adminId: admin.id,
      email,
      otpHash,
      expiresAt,
    });

    // Send Email via Brevo SMTP
    await emailService.sendOtpEmail({ to: email, otp });
  }

  // Always return generic response to prevent email enumeration
  return { message: "If the email is registered, a password reset OTP has been sent." };
}

async function resendResetOtp(email) {
  return forgotPassword(email);
}

async function verifyResetOtp(email, otp) {
  const record = await passwordResetRepo.findLatestUnverifiedOtp(email);

  if (!record) {
    const error = new Error("OTP has expired or is invalid. Please request a new OTP.");
    error.status = 400;
    throw error;
  }

  if (record.attemptCount >= 5) {
    await passwordResetRepo.invalidateOtpById(record.id);
    const error = new Error("Too many incorrect attempts. This OTP has been invalidated. Please request a new one.");
    error.status = 400;
    throw error;
  }

  const isValid = await comparePassword(otp, record.otpHash);

  if (!isValid) {
    await passwordResetRepo.incrementAttemptCount(record.id);
    const remainingAttempts = 5 - (record.attemptCount + 1);

    if (remainingAttempts <= 0) {
      await passwordResetRepo.invalidateOtpById(record.id);
      const error = new Error("Maximum verification attempts exceeded. This OTP has been invalidated. Please request a new one.");
      error.status = 400;
      throw error;
    }

    const error = new Error(`Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`);
    error.status = 400;
    throw error;
  }

  // Generate short-lived reset token (15 mins)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await passwordResetRepo.markOtpVerified({
    id: record.id,
    resetTokenHash,
    resetTokenExpiresAt,
  });

  return { resetToken };
}

async function resetPassword(resetToken, newPassword) {
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const record = await passwordResetRepo.findValidResetToken(resetTokenHash);

  if (!record) {
    const error = new Error("Invalid or expired password reset token. Please restart the password reset process.");
    error.status = 400;
    throw error;
  }

  const newHash = await hashPassword(newPassword);
  await adminRepo.updatePassword(record.adminId, newHash);
  await passwordResetRepo.invalidateResetToken(record.id);

  return { message: "Password reset successfully. Please login with your new password." };
}

module.exports = {
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resendResetOtp,
  verifyResetOtp,
  resetPassword,
};

