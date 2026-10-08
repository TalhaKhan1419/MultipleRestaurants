const nodemailer = require("nodemailer");
const { getEnv } = require("../config/env");

let smtpTransporter = null;

function getSmtpTransporter() {
  const env = getEnv();
  if (!smtpTransporter && env.smtp && env.smtp.user && env.smtp.pass) {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtp.host || "smtp-relay.brevo.com",
      port: env.smtp.port || 587,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return smtpTransporter;
}

async function sendOtpEmail({ to, otp }) {
  const env = getEnv();
  const smtp = getSmtpTransporter();

  const senderEmail = env.mailFrom || "1419khantalha@gmail.com";
  const fromAddress = `GourmetOS <${senderEmail}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #ea580c; margin-bottom: 12px;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #444;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #444;">We received a request to reset your password for your <strong>GourmetOS</strong> account.</p>
      <p style="font-size: 14px; line-height: 1.5; color: #444;">Your One-Time Password (OTP) is:</p>
      <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 16px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #c2410c; margin: 24px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; line-height: 1.5; color: #444;">This OTP will expire in <strong>10 minutes</strong>.</p>
      <p style="font-size: 14px; line-height: 1.5; color: #444;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; line-height: 1.4;">Regards,<br /><strong>GourmetOS Team</strong></p>
    </div>
  `;

  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: fromAddress,
        to,
        subject: "Password Reset OTP - GourmetOS",
        html,
      });
      return info;
    } catch (error) {
      console.error("Failed to send OTP email via Brevo SMTP:", error.message);
      throw new Error("Failed to send OTP email. Please check Brevo SMTP credentials.");
    }
  }

  // Development Fallback Mode (Log notification if SMTP credentials not configured in .env)
  console.log(`[EmailService Dev Mode] Brevo SMTP credentials not set in .env. Request for ${to} processed.`);
  return { success: true, devMode: true };
}

module.exports = { sendOtpEmail };
