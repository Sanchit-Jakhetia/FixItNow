import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { FiAlertCircle, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getProviderDocuments } from "../../services/api";
import UnifiedPageShell from "../../components/UnifiedPageShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const result = await authLogin({ email, password });

      if (!result.success) {
        setError(result.error || "Login failed");
        setLoading(false);
        return;
      }

      const loginUser = result.user;

      if (loginUser?.role === "PROVIDER") {
        try {
          const providerId = loginUser.id;
          const providerDocsRes = await getProviderDocuments(providerId);
          const providerDocs = Array.isArray(providerDocsRes.data) ? providerDocsRes.data : [];

          const rejectedDoc = providerDocs.find((doc) => doc.rejected);
          if (rejectedDoc) {
            setError(`Your account has been rejected. Reason: ${rejectedDoc.rejectionReason}`);
            localStorage.removeItem("token");
            setLoading(false);
            return;
          }

          if (!loginUser?.verified) {
            setError("Your account is pending admin verification. Please wait for approval.");
            localStorage.removeItem("token");
            setLoading(false);
            return;
          }
        } catch (docErr) {
          console.error("Error checking provider docs:", docErr);
        }
      }

      if (loginUser?.role === "PROVIDER") {
        navigate("/provider-dashboard", { replace: true });
      } else if (loginUser?.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else if (loginUser?.role === "CUSTOMER") {
        navigate("/customer-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      const serverMsg = err?.response?.data?.message || "";
      const status = err?.response?.status;

      if (status === 401 || serverMsg.toLowerCase().includes("invalid")) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 404 || serverMsg.toLowerCase().includes("not found")) {
        setError("Email not found. Please create an account first.");
      } else if (err.message === "Network Error") {
        setError("Network error. Please check your connection.");
      } else {
        setError(serverMsg || "Login failed. Please try again.");
      }
    }
  };

  return (
    <UnifiedPageShell
      gridClassName="lg:grid-cols-[1.02fr_0.98fr]"
      contentClassName="lg:[&>section]:order-2 lg:[&>aside]:order-1"
      topActions={
        <>
          <button
            onClick={() => navigate("/")}
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/register")}
            className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/20 transition hover:-translate-y-0.5 hover:bg-[#1740b8]"
          >
            Create account
          </button>
        </>
      }
      rightContent={
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              FixItNow secure access
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
              Sign in to continue with bookings, chats, and provider activity.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Fast access to your dashboard",
                "Role-based routing after sign in",
                "Simple and secure account access",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white/85">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-white/90" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-col justify-center py-2 lg:max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 space-y-4 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-[#1d4ed8]">
            <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
            Welcome back to FixItNow
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Sign in to your account</h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-500">
              Use your email and password to continue to FixItNow.
            </p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleLogin}
          className="space-y-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
            >
              <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
              <p className="text-sm leading-relaxed text-rose-700">{error}</p>
            </motion.div>
          )}

          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FiCheckCircle className="text-[#1d4ed8]" />
              Account Access
            </div>

            <Field label="Email address">
              <TextInput
                icon={<HiOutlineMail className="text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />}
                type="email"
                placeholder="worker01@localfixconnect.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field label="Password">
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-colors group-focus-within:text-[#1d4ed8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                >
                  {showPassword ? <HiOutlineEyeOff className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1d4ed8] px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-[#1d4ed8]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1740b8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-slate-500">
            New here?{" "}
            <Link to="/register" className="font-semibold text-[#1d4ed8] transition hover:text-[#1740b8]">
              Create your account
            </Link>
          </div>
        </motion.form>
      </div>
    </UnifiedPageShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="group block">
      <span className="mb-2 block text-sm font-medium text-slate-700 transition-colors group-focus-within:text-[#1d4ed8]">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ icon, ...props }) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 disabled:opacity-50"
      />
    </div>
  );
}
