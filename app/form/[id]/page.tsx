"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { useFormStore } from "@/lib/formStore";
import { useSSEFormUpdates } from "@/hooks/useSSEFormUpdates";
import VoiceButton from "@/components/VoiceButton";
import LiveForm from "@/components/LiveForm";
import TranscriptPanel from "@/components/TranscriptPanel";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Send,
  Mic,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";

export default function VoiceFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { callActive, error, form, sseStatus, setSchema, activeSchema } = useFormStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useSSEFormUpdates();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchSchema();
  }, [id, user]);

  const fetchSchema = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/schemas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSchema(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldsCollected = Object.keys(form).length;

  const handleSubmit = async () => {
    if (!activeSchema?._id || Object.keys(form).length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schemaId: activeSchema._id, data: form }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#070612" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading registry...</p>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (!activeSchema) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "#070612" }}
      >
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Registry Not Found</h1>
        <button
          onClick={() => router.push("/client")}
          className="mt-4 text-violet-400 text-sm hover:text-violet-300 transition-colors"
        >
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  const sseColor =
    sseStatus === "connected"
      ? "#34d399"
      : sseStatus === "connecting"
      ? "#fbbf24"
      : "#f87171";

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "#070612", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top Nav ── */}
      <nav
        className="h-16 sticky top-0 z-50 flex items-center justify-between px-6 lg:px-10"
        style={{
          background: "rgba(7,6,18,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/client")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}
            >
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">{activeSchema.name}</span>
              <p className="text-[10px] text-white/40 -mt-0.5">Active Enrollment Session</p>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: callActive ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${callActive ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: callActive ? "#34d399" : "rgba(255,255,255,0.4)",
          }}
        >
          {callActive ? (
            <>
              <Activity className="w-3 h-3 animate-pulse" /> Live
            </>
          ) : (
            <>
              <Radio className="w-3 h-3" /> Idle
            </>
          )}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-6 grid grid-cols-12 gap-6">

        {/* ── Left Sidebar ── */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-5 sticky top-24 lg:h-[calc(100vh-theme(spacing.32))] overflow-hidden">

          {/* Voice Control Card */}
          <section
            className="flex flex-col items-center text-center gap-6 p-8 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div>
              <h2 className="text-base font-semibold text-white mb-1">Voice Enrollment</h2>
              <p className="text-xs text-white/40 leading-relaxed max-w-[260px]">
                Initiate the session and speak naturally. Sahayak will fill the registry for you.
              </p>
            </div>

            <VoiceButton />

            {error && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl w-full text-left"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-0.5">Error</p>
                  <p className="text-xs text-red-300/70">{error}</p>
                </div>
              </div>
            )}

            <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

            <div className="grid grid-cols-2 w-full gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] text-white/30 uppercase font-medium mb-1">Status</p>
                <p className="text-xs font-mono text-white/70">AUTHORIZED</p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] text-white/30 uppercase font-medium mb-1">Mode</p>
                <p className="text-xs font-mono text-white/70">DYNAMIC</p>
              </div>
            </div>
          </section>

          {/* Transcript Panel */}
          <section
            className="flex-1 flex flex-col overflow-hidden rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3 className="text-xs font-semibold text-white/60">Communication Log</h3>
              <span className="text-[10px] text-white/25">Encrypted · Live</span>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <TranscriptPanel />
            </div>
          </section>
        </aside>

        {/* ── Right: Registry Monitor ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          <section
            className="flex-1 flex flex-col overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "2px solid #a78bfa",
            }}
          >
            {/* Section header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <h2 className="text-sm font-semibold text-white">Registry Monitor</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <p className="text-[11px] text-white/40">
                    Live Population · {fieldsCollected} fields verified
                  </p>
                </div>
              </div>

              {/* SSE status */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{
                  background: `${sseColor}12`,
                  border: `1px solid ${sseColor}40`,
                  color: sseColor,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: sseColor }}
                />
                Link: {sseStatus}
              </div>
            </div>

            {/* Form area */}
            <div className="flex-1 overflow-y-auto p-6">
              <LiveForm />
            </div>

            {/* Submit bar */}
            <div
              className="px-6 py-4 flex items-center justify-between gap-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(7,6,18,0.5)" }}
            >
              <p className="text-xs text-white/35">
                {fieldsCollected === 0
                  ? "Start the voice session to collect fields."
                  : `${fieldsCollected} field${fieldsCollected !== 1 ? "s" : ""} collected — ready to submit.`}
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-emerald-400"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Submitted Successfully
                </motion.div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  {submitError && (
                    <p className="text-[10px] text-red-400">{submitError}</p>
                  )}
                  <motion.button
                    id="submit-enrollment-btn"
                    onClick={handleSubmit}
                    disabled={submitting || fieldsCollected === 0 || callActive}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:cursor-not-allowed"
                    style={{
                      background:
                        submitting || fieldsCollected === 0 || callActive
                          ? "rgba(255,255,255,0.06)"
                          : "linear-gradient(135deg,#a78bfa,#818cf8)",
                      color:
                        submitting || fieldsCollected === 0 || callActive
                          ? "rgba(255,255,255,0.25)"
                          : "#fff",
                    }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? "Submitting..." : "Submit Enrollment"}
                  </motion.button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
