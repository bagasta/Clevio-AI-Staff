"use client";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { hasUsedTrialEmail } from "@/lib/trialGuard";
import toast, { Toaster } from 'react-hot-toast';

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

// Google Sign-In base URL (ngrok for testing)
const GOOGLE_AUTH_BASE_URL = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;

function RegisterContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTrialUsedModal, setShowTrialUsedModal] = useState(false);
  const [trialBlockedEmail, setTrialBlockedEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsTrial = searchParams?.get("trial") === "1";

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`${GOOGLE_AUTH_BASE_URL}/api/v1/auth/google/login`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast.error("Failed to initiate Google Sign-In", {
          style: {
            background: '#FFFFFF',
            color: '#2D2216',
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1px solid #E0D4BC',
            boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
      toast.error("Failed to connect to Google Sign-In", {
        style: {
          background: '#FFFFFF',
          color: '#2D2216',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #E0D4BC',
          boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
          fontSize: '14px',
          fontWeight: '600',
        },
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!wantsTrial) {
      setShowTrialUsedModal(false);
      setTrialBlockedEmail("");
    }
  }, [wantsTrial]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        style: {
          background: '#FFFFFF',
          color: '#2D2216',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #E0D4BC',
          boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
          fontSize: '14px',
          fontWeight: '600',
        },
      });
      return;
    }

    const normalizedInputEmail = normalizeEmail(email);
    if (
      wantsTrial &&
      typeof window !== "undefined" &&
      hasUsedTrialEmail(normalizedInputEmail)
    ) {
      setTrialBlockedEmail(normalizedInputEmail);
      setShowTrialUsedModal(true);
      return;
    }

    setLoading(true);
    try {
      const registerResponse = await apiService.register(email, password);

      const userId =
        registerResponse?.user_id ||
        registerResponse?.id ||
        registerResponse?.userId;
      const normalizedEmail = registerResponse?.email || email;

      if (!userId || !normalizedEmail) {
        throw new Error("Unable to capture user information for payment.");
      }

      if (wantsTrial && typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            "trialRegistrationCredentials",
            JSON.stringify({
              email: normalizedEmail,
              password,
              createdAt: Date.now(),
            }),
          );
        } catch (storageError) {
          console.warn(
            "[Register] Failed to persist trial credentials for activation",
            storageError
          );
        }
      }

      toast.success("Registration successful! Redirecting to payment...", {
        duration: 3000,
        style: {
          background: '#FFFFFF',
          color: '#2D2216',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #E0D4BC',
          boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
          fontSize: '14px',
          fontWeight: '600',
        },
      });
      
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      apiService.clearLastOrderId();
      
      setTimeout(() => {
        const params = new URLSearchParams({
          user_id: String(userId),
          email: String(normalizedEmail),
        });
        if (wantsTrial) {
          params.set("plan", "TRIAL");
          params.set("source", "trial-flow");
        }
        router.push(`/payment?${params.toString()}`);
      }, 1000);
    } catch (err) {
      let message = "Registration failed";
      if (err && typeof err === "object" && "message" in err && err.message) {
        message = String(err.message);
      }
      toast.error(message, {
        duration: 5000,
        style: {
          background: '#FFFFFF',
          color: '#2D2216',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #E0D4BC',
          boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
          fontSize: '14px',
          fontWeight: '600',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Toaster position="top-center" />
      
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
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E0D4BC] text-[#2D2216] text-sm font-semibold mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Buat Akun Baru
          </div>
          <h1 className="text-4xl font-bold text-[#2D2216] mb-2 tracking-tight">
            Mulai Perjalanan AI
          </h1>
          <p className="text-[#5D4037] text-base font-medium">
            Bangun & kelola staff AI untuk bisnis
          </p>
        </motion.div>

        {/* Registration Card */}
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

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8D7F71] group-focus-within:text-[#E68A44] transition-colors" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="contoh@email.com"
                    className="w-full rounded-2xl border border-[#E0D4BC] bg-white/50 py-3.5 pl-12 pr-4 text-[#2D2216] placeholder:text-[#B5A79B] transition-all duration-200 focus:border-[#E68A44] focus:bg-white focus:shadow-[0_0_0_4px_rgba(230,138,68,0.08)] outline-none font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-xs text-[#8D7F71] font-medium ml-1">
                  Gunakan email yang valid
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8D7F71] group-focus-within:text-[#E68A44] transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-2xl border border-[#E0D4BC] bg-white/50 py-3.5 pl-12 pr-12 text-[#2D2216] placeholder:text-[#B5A79B] transition-all duration-200 focus:border-[#E68A44] focus:bg-white focus:shadow-[0_0_0_4px_rgba(230,138,68,0.08)] outline-none font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    minLength={8}
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

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wide">
                  Konfirmasi Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8D7F71] group-focus-within:text-[#E68A44] transition-colors" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Masukkan ulang password"
                    className="w-full rounded-2xl border border-[#E0D4BC] bg-white/50 py-3.5 pl-12 pr-12 text-[#2D2216] placeholder:text-[#B5A79B] transition-all duration-200 focus:border-[#E68A44] focus:bg-white focus:shadow-[0_0_0_4px_rgba(230,138,68,0.08)] outline-none font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                     className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8D7F71] hover:text-[#5D4037] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </button>

              {/* OR Divider */}
              <div className="flex items-center gap-4 mt-6">
                <div className="flex-1 h-px bg-[#E0D4BC]"></div>
                <span className="text-xs font-bold text-[#8D7F71] uppercase tracking-wide">atau</span>
                <div className="flex-1 h-px bg-[#E0D4BC]"></div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-white border-2 border-[#E0D4BC] hover:border-[#5D4037] hover:bg-[#FAF6F1] text-[#2D2216] font-bold rounded-2xl py-3.5 text-base shadow-[0_2px_8px_rgba(45,34,22,0.06)] hover:shadow-[0_4px_16px_rgba(45,34,22,0.12)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Daftar dengan Google</span>
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-[#8D7F71] text-sm font-medium">
                Sudah punya akun?{" "}
                <a
                  href="/login"
                  className="font-bold text-[#E68A44] hover:text-[#D87A36] transition-colors"
                >
                  Masuk di sini
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trial Used Modal */}
      {showTrialUsedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
          onClick={() => setShowTrialUsedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-[28px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.24)] border border-white/60">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]">
                    <AlertCircle className="h-7 w-7 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2D2216]">Trial Limit Reached</h3>
                  <p className="text-sm text-[#5D4037] font-medium leading-relaxed">
                    {trialBlockedEmail
                      ? `${trialBlockedEmail} has already used the free trial.`
                      : "This device has already activated a free trial."}
                    <br />
                    Upgrade to PRO or sign in with your existing account.
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowTrialUsedModal(false)}
                      className="flex-1 rounded-2xl border-2 border-[#E0D4BC] bg-white text-[#5D4037] hover:bg-[#FAF6F1] font-bold py-3 shadow-sm hover:shadow-md transition-all"
                    >
                      Got it
                    </button>
                    <button
                      onClick={() => router.push("/login")}
                      className="flex-1 rounded-2xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white hover:from-[#1A1410] hover:to-[#0D0A08] font-bold py-3 shadow-md hover:shadow-lg transition-all"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#E68A44] border-t-transparent" />
            <p className="mt-4 text-sm text-[#5D4037] font-medium">Preparing registration…</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
