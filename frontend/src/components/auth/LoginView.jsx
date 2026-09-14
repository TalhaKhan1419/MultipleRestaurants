import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UtensilsCrossed, Shield, Store, Lock, Mail, ArrowRight, AlertCircle, Sparkles, QrCode } from "lucide-react";

export default function LoginView({ onOpenCustomerView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    login(demoEmail, demoPass).catch((err) => {
      setError(err.message || "Failed to log in");
      setLoading(false);
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#fffaf0] flex items-start sm:items-center justify-center px-4 py-8 sm:py-10 relative overflow-y-auto">
      {/* Soft decorative background accents */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-100/70 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-xl shadow-orange-500/20 mb-3 sm:mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3b2618]">GourmetOS</h1>
          <p className="text-sm text-[#87644a] mt-1">Restaurant & Multi-Tenant Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#fffdf8] rounded-2xl p-5 sm:p-8 shadow-xl shadow-orange-950/10 border border-orange-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#3b2618]">Sign In to Dashboard</h2>
            <p className="text-xs text-[#87644a] mt-1">Enter your account credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-1.5">Email Address</label>
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

            <div>
              <label className="block text-xs font-semibold text-[#5c3b24] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* One Click Demo Logins */}
          <div className="mt-7 pt-5 border-t border-orange-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#87644a] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Quick Demo Sign-in</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin@restaurant.local", "Password123!")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[11px] text-[#87644a] truncate">Platform Overview</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("owner@demorestaurant.local", "Password123!")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-0.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>Restaurant Admin</span>
                </div>
                <div className="text-[11px] text-[#87644a] truncate">Demo Restaurant</div>
              </button>
            </div>
          </div>

          {/* Customer View Link */}
          <div className="mt-4 pt-3 text-center">
            <button
              type="button"
              onClick={onOpenCustomerView}
              className="text-xs text-[#87644a] hover:text-orange-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
              <span>View Customer Table QR Menu (Public)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
