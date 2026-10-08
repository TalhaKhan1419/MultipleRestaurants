import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import {
  UtensilsCrossed,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Countdown timer for Resend OTP (60s)
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (step === 2 && resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleResetStateAndClose = () => {
    setStep(1);
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setInfoMessage(null);
    setResendTimer(60);
    setCanResend(false);
    onClose();
  };

  // STEP 1: Request OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.forgotPassword({ email: trimmedEmail });
      setInfoMessage(response?.message || "If the email is registered, a password reset OTP has been sent.");
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const response = await api.auth.resendResetOtp({ email: email.trim() });
      setInfoMessage(response?.message || "A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      if (pasted.length > 0) {
        const newOtp = [...otp];
        pasted.forEach((char, i) => {
          if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        const nextIdx = Math.min(pasted.length, 5);
        if (otpInputRefs.current[nextIdx]) {
          otpInputRefs.current[nextIdx].focus();
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6 || !/^\d{6}$/.test(fullOtp)) {
      setError("Please enter the complete 6-digit numeric OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.verifyResetOtp({
        email: email.trim(),
        otp: fullOtp,
      });
      setResetToken(response.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.resetPassword({
        resetToken,
        newPassword,
      });
      setInfoMessage(response?.message || "Password reset successfully. Please login with your new password.");
      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#fffdf8] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-orange-200 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleResetStateAndClose}
          className="absolute top-4 right-4 text-[#87644a] hover:text-[#3b2618] p-1.5 rounded-xl hover:bg-orange-100/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            {step === 3 ? (
              <Lock className="w-5 h-5" />
            ) : step === 4 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <KeyRound className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#3b2618]">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify Email OTP"}
              {step === 3 && "Create New Password"}
              {step === 4 && "Password Reset Successful"}
            </h2>
            <p className="text-xs text-[#87644a]">
              {step === 1 && "Enter your registered email address."}
              {step === 2 && `We sent a verification code to ${email}`}
              {step === 3 && "Enter your new password below."}
              {step === 4 && "Your account password has been changed successfully."}
            </p>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && step !== 4 && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-1.5">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurant.com"
                  className="w-full bg-[#fffaf0] border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#3b2618] placeholder:text-[#b7997c] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResetStateAndClose}
                className="text-xs text-[#87644a] hover:text-orange-700 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-2 text-center">Enter 6-Digit OTP</label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold bg-[#fffaf0] border border-orange-200 rounded-xl text-[#3b2618] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend OTP section */}
            <div className="flex items-center justify-between text-xs text-[#87644a] pt-2 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-orange-700 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className={`font-semibold inline-flex items-center gap-1 transition-colors ${
                  canResend
                    ? "text-orange-600 hover:text-orange-700 cursor-pointer"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {canResend ? "Resend OTP" : `Resend OTP (${resendTimer}s)`}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#fffaf0] border border-orange-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#3b2618] placeholder:text-[#b7997c] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#fffaf0] border border-orange-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#3b2618] placeholder:text-[#b7997c] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3b2618]">Password Reset Successful ✅</h3>
              <p className="text-xs text-[#87644a] mt-1">
                Your password has been changed successfully.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetStateAndClose}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
