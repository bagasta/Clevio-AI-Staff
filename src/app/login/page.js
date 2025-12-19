"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hasSettlementQuery =
      searchParams.get("settlement") === "1" ||
      searchParams.get("settlement") === "true";

    if (hasSettlementQuery) {
      setInfoMessage(
        "Payment settled. Please sign in with your registered email or phone number and password."
      );
    }

    const queryIdentifier =
      searchParams.get("identifier") ||
      searchParams.get("email") ||
      searchParams.get("phone");

    if (queryIdentifier) {
      setFormData((prev) => ({
        ...prev,
        identifier: prev.identifier || queryIdentifier,
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const identifier = formData.identifier.trim();
    if (!identifier) {
      setError("Please enter your email address or phone number.");
      setLoading(false);
      return;
    }

    try {
      const result = await login(identifier, formData.password);

      if (result.success) {
        if (result.is_active) {
          router.push("/dashboard");
        } else {
          setError(
            "Account not activated. Please complete payment using the link sent after registration."
          );
        }
      } else {
        setError(
          result.error || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle gradient orbs - NO BLUE */}
      <div className="absolute top-[-5%] right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-[#E68A44]/10 to-[#D87A36]/5 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-[#2D2216]/5 to-transparent rounded-full blur-3xl opacity-30"></div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E0D4BC] text-[#5D4037] text-sm font-semibold mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Welcome Back
          </div>
          <h1 className="text-4xl font-bold text-[#2D2216] mb-2 tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-[#5D4037] text-base font-medium">
            Kelola staff AI anda dengan mudah
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-10 shadow-[0_8px_30px_rgba(45,34,22,0.08),0_2px_8px_rgba(45,34,22,0.04)] border border-white/60 relative overflow-hidden">
            
            {/* Binder Holes Decoration */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-[#E8E3DB] to-[#D4CFCA] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]"
                ></div>
              ))}
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-3xl p-4 flex items-center gap-3 shadow-sm"
              >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            {infoMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-3xl p-4 flex items-center gap-3 shadow-sm"
              >
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">{infoMessage}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="identifier" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wide">
                  Email / No. HP
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8D7F71] group-focus-within:text-[#E68A44] transition-colors" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="contoh@email.com atau 628..."
                    className="w-full rounded-2xl border border-[#E0D4BC] bg-white/50 py-3.5 pl-12 pr-4 text-[#2D2216] placeholder:text-[#B5A79B] transition-all duration-200 focus:border-[#E68A44] focus:bg-white focus:shadow-[0_0_0_4px_rgba(230,138,68,0.08)] outline-none font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    value={formData.identifier}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetInfo(true)}
                    className="text-xs font-bold text-[#E68A44] hover:text-[#D87A36] transition-colors uppercase tracking-wide"
                  >
                    Lupa?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8D7F71] group-focus-within:text-[#E68A44] transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="w-full rounded-2xl border border-[#E0D4BC] bg-white/50 py-3.5 pl-12 pr-12 text-[#2D2216] placeholder:text-[#B5A79B] transition-all duration-200 focus:border-[#E68A44] focus:bg-white focus:shadow-[0_0_0_4px_rgba(230,138,68,0.08)] outline-none font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8D7F71] hover:text-[#5D4037] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08] text-white font-bold rounded-2xl py-4 text-base shadow-[0_4px_16px_rgba(45,34,22,0.24),0_1px_4px_rgba(45,34,22,0.12)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32),0_2px_8px_rgba(45,34,22,0.16)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sign in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-[#8D7F71] text-sm font-medium">
                Belum punya akun?{" "}
                <a
                  href="/register"
                  className="font-bold text-[#E68A44] hover:text-[#D87A36] transition-colors"
                >
                  Daftar di sini
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reset Password Modal */}
      {showResetInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
          onClick={() => setShowResetInfo(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-[28px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.24)] border border-white/60">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FAF6F1] to-[#F0EBE4] flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]">
                    <Lock className="h-7 w-7 text-[#5D4037]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2D2216]">Reset Password</h3>
                  <p className="text-sm text-[#5D4037] font-medium leading-relaxed">
                    Untuk reset password, silakan hubungi admin atau tim support kami untuk bantuan lebih lanjut.
                  </p>
                  <button
                    onClick={() => setShowResetInfo(false)}
                    className="w-full mt-6 rounded-2xl border-2 border-[#E0D4BC] bg-white text-[#5D4037] hover:bg-[#FAF6F1] font-bold py-3.5 shadow-sm hover:shadow-md transition-all"
                  >
                    Mengerti
                  </button>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
