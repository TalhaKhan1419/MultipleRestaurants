const db = require("../config/database");

async function invalidateExistingOtps(email) {
  await db.query(
    `UPDATE password_reset_otps
     SET expires_at = NOW()
     WHERE email = ? AND verified_at IS NULL AND expires_at > NOW()`,
    [email]
  );
}

async function getLastOtpCreatedTime(email) {
  const [rows] = await db.query(
    `SELECT created_at AS createdAt
     FROM password_reset_otps
     WHERE email = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );
  return rows[0] ? rows[0].createdAt : null;
}

async function createOtpRecord({ adminId, email, otpHash, expiresAt }) {
  const [result] = await db.query(
    `INSERT INTO password_reset_otps (admin_id, email, otp_hash, expires_at, attempt_count)
     VALUES (?, ?, ?, ?, 0)`,
    [adminId || null, email, otpHash, expiresAt]
  );
  return result.insertId;
}

async function findLatestUnverifiedOtp(email) {
  const [rows] = await db.query(
    `SELECT id, admin_id AS adminId, email, otp_hash AS otpHash, expires_at AS expiresAt,
            attempt_count AS attemptCount, created_at AS createdAt
     FROM password_reset_otps
     WHERE email = ? AND verified_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function incrementAttemptCount(id) {
  const [result] = await db.query(
    `UPDATE password_reset_otps
     SET attempt_count = attempt_count + 1
     WHERE id = ?`,
    [id]
  );
  return result;
}

async function invalidateOtpById(id) {
  await db.query(
    `UPDATE password_reset_otps
     SET expires_at = NOW()
     WHERE id = ?`,
    [id]
  );
}

async function markOtpVerified({ id, resetTokenHash, resetTokenExpiresAt }) {
  await db.query(
    `UPDATE password_reset_otps
     SET verified_at = NOW(),
         reset_token_hash = ?,
         reset_token_expires_at = ?
     WHERE id = ?`,
    [resetTokenHash, resetTokenExpiresAt, id]
  );
}

async function findValidResetToken(resetTokenHash) {
  const [rows] = await db.query(
    `SELECT id, admin_id AS adminId, email, reset_token_expires_at AS resetTokenExpiresAt
     FROM password_reset_otps
     WHERE reset_token_hash = ? AND verified_at IS NOT NULL AND reset_token_expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [resetTokenHash]
  );
  return rows[0] || null;
}

async function invalidateResetToken(id) {
  await db.query(
    `UPDATE password_reset_otps
     SET reset_token_expires_at = NOW(),
         expires_at = NOW()
     WHERE id = ?`,
    [id]
  );
}

module.exports = {
  invalidateExistingOtps,
  getLastOtpCreatedTime,
  createOtpRecord,
  findLatestUnverifiedOtp,
  incrementAttemptCount,
  invalidateOtpById,
  markOtpVerified,
  findValidResetToken,
  invalidateResetToken,
};
