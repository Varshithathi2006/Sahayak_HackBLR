"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  FileText,
  LogOut,
  User as UserIcon,
  Mic,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ClientDashboard() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "client") {
      router.push("/auth/login");
    } else {
      fetchSchemas();
    }
  }, [user]);

  const fetchSchemas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/schemas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSchemas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = schemas.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#070612", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top Navigation ── */}
      <nav
        className="h-16 sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12"
        style={{
          background: "rgba(7,6,18,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}
          >
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Sahayak</span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider">Authenticated</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 pr-5" style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}
            >
              <UserIcon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-white/40">Client Portal</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push("/auth/login"); }}
            className="flex items-center gap-2 text-xs font-medium text-white/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 tracking-widest uppercase">Voice Enrollment</span>
          </div>
          <h1 className="text-3xl font-medium text-white mb-2">Available Registries</h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xl">
            Select a registry below to begin your voice-assisted enrollment. Speak naturally — Sahayak fills the form for you.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-8 max-w-sm"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search registries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </motion.div>

        {/* Schema Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((schema, i) => (
              <motion.div
                key={schema._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at top left, rgba(167,139,250,0.08), transparent 60%)" }}
                />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}
                    >
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                      }}
                    >
                      Ready
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-violet-300 transition-colors">
                    {schema.name}
                  </h3>
                  <p className="text-sm text-white/40 mb-6 line-clamp-2 leading-relaxed flex-1">
                    {schema.description || "Authorized enrollment registry for voice-assisted processing."}
                  </p>

                  <Link
                    href={`/form/${schema._id}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.2)",
                      color: "#a78bfa",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.1)";
                    }}
                  >
                    Start Voice Session
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && !loading && (
              <div
                className="col-span-full py-24 flex flex-col items-center justify-center rounded-2xl"
                style={{ border: "2px dashed rgba(255,255,255,0.08)" }}
              >
                <FileText className="w-10 h-10 text-white/15 mb-4" />
                <p className="text-white/30 text-sm font-medium">No registries found</p>
                <p className="text-white/20 text-xs mt-1">Contact your administrator to enable enrollment schemas.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-5 px-6 lg:px-12 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-white/25 text-xs">© 2026 Team NeuroNova · Sahayak Portal</p>
        <div className="flex items-center gap-4 text-white/20 text-xs">
          <span>Vapi · Deepgram · ElevenLabs</span>
        </div>
      </footer>
    </div>
  );
}
