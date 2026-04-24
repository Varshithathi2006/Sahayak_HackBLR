"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { ArrowRight, Loader2, Mic, User as UserIcon, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "client" as "client" | "bank",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Signup failed");

      setAuth(data.user, data.token);
      router.push(data.user.role === "bank" ? "/bank" : "/client");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "client", label: "Client", icon: UserIcon, desc: "Fill forms via voice" },
    { id: "bank", label: "Bank / Org", icon: Building2, desc: "Manage schemas" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#070612", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
          >
            <Mic className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-white mb-1">Create your account</h1>
          <p className="text-white/40 text-sm">Join the Sahayak ecosystem</p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-3">
              {roles.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: id as any })}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl transition-all"
                  style={{
                    background:
                      formData.role === id
                        ? "rgba(167,139,250,0.12)"
                        : "rgba(255,255,255,0.03)",
                    border:
                      formData.role === id
                        ? "1px solid rgba(167,139,250,0.35)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: formData.role === id ? "#a78bfa" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-white/25">{desc}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-medium ml-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                placeholder="Ramesh Kumar"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-medium ml-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-medium ml-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-400"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all group"
              style={{
                background: loading
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #a78bfa, #818cf8)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-white/30">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-white/20">
          © 2026 Team NeuroNova · Sahayak
        </p>
      </motion.div>
    </div>
  );
}
