"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Mic,
  Brain,
  Globe,
  Zap,
  Database,
  Server,
  Layers,
  Activity,
  Code2,
  Wind,
} from "lucide-react";

/* ─── Helpers ─── */

function AnimatedWords({
  text,
  baseDelay = 0,
  className = "",
  playfair = false,
}: {
  text: string;
  baseDelay?: number;
  className?: string;
  playfair?: boolean;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: baseDelay + i * 0.08 }}
          className={`inline-block mr-[0.25em] ${className} ${
            playfair ? "font-playfair italic" : ""
          }`}
          style={playfair ? { fontFamily: "'Playfair Display', serif" } : undefined}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

/* ─── Data ─── */

const TECH_STACK = [
  { icon: <Server className="w-5 h-5" />, category: "Framework", tech: "Next.js + Express" },
  { icon: <Mic className="w-5 h-5" />, category: "Voice AI", tech: "Vapi.ai" },
  { icon: <Brain className="w-5 h-5" />, category: "LLM", tech: "Groq Llama 3 70B" },
  { icon: <Globe className="w-5 h-5" />, category: "Speech-to-Text", tech: "Deepgram" },
  { icon: <Zap className="w-5 h-5" />, category: "Text-to-Speech", tech: "ElevenLabs" },
  { icon: <Database className="w-5 h-5" />, category: "Database", tech: "MongoDB" },
  { icon: <Layers className="w-5 h-5" />, category: "Vector DB", tech: "Qdrant" },
  { icon: <Activity className="w-5 h-5" />, category: "Realtime", tech: "Server-Sent Events" },
  { icon: <Code2 className="w-5 h-5" />, category: "State", tech: "Zustand" },
  { icon: <Wind className="w-5 h-5" />, category: "Styling", tech: "Tailwind CSS" },
  { icon: <Brain className="w-5 h-5" />, category: "Embeddings", tech: "@xenova/transformers" },
  { icon: <Sparkles className="w-5 h-5" />, category: "Animations", tech: "Framer Motion" },
];

const TEAM = [
  {
    name: "Varshitha Thilak Kumar",
    role: "Team Lead",
    initials: "VT",
    gradient: "from-violet-500 to-indigo-600",
    badgeColor: "#a78bfa",
  },
  {
    name: "Shreya Arun",
    role: "Web Designer",
    initials: "SA",
    gradient: "from-pink-500 to-rose-600",
    badgeColor: "#f472b6",
  },
  {
    name: "Siri Sanjana S",
    role: "Developer",
    initials: "SS",
    gradient: "from-cyan-500 to-blue-600",
    badgeColor: "#22d3ee",
  },
  {
    name: "Anagha Menon",
    role: "Tester",
    initials: "AM",
    gradient: "from-emerald-500 to-teal-600",
    badgeColor: "#34d399",
  },
];

const HLS_URL =
  "https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8";

/* ─── Page ─── */

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use dynamic import for Hls to prevent build-time SSR errors
    import("hls.js").then((res) => {
      const Hls = res.default;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(HLS_URL);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = HLS_URL;
      }
    });
  }, []);

  return (
    <main style={{ background: "#070612" }}>
      {/* ════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════ */}
      <section
        className="relative h-screen w-full overflow-hidden flex items-center"
        style={{ background: "#070612" }}
      >
        {/* Background Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 h-full object-cover z-0"
          style={{
            marginLeft: "200px",
            transform: "scaleX(1.2)",
            transformOrigin: "left",
          }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #070612, transparent)",
          }}
        />

        {/* Left-side vignette for readability */}
        <div
          className="absolute top-0 left-0 h-full w-2/3 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #070612 30%, rgba(7,6,18,0.7) 60%, transparent 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="flex flex-col gap-6 max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm w-fit"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Sparkles className="w-3 h-3 text-white/80" />
              <span className="text-sm font-medium text-white/80">
                Voice-Powered AI Form Assistant
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight lg:leading-[1.2] text-white">
              <span className="block">
                <AnimatedWords text="Speak Your Story," baseDelay={0.1} />
              </span>
              <span className="inline">
                <AnimatedWords text="Let AI" baseDelay={0.3} />
              </span>{" "}
              <span className="inline">
                <AnimatedWords
                  text="Fill the Form."
                  baseDelay={0.44}
                  playfair
                  className="text-violet-300"
                />
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/70 text-lg font-normal leading-relaxed max-w-xl"
            >
              Sahayak helps rural citizens enroll in government schemes — just
              speak in Hindi, Kannada, Telugu, or Tamil, and watch the form fill
              itself in real time.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-4 flex-wrap mt-6"
            >
              <Link
                href="/client"
                className="flex items-center gap-2 bg-white text-[#070612] font-medium rounded-full px-5 py-3 hover:bg-white/90 transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="bg-white/10 backdrop-blur-sm text-white font-medium rounded-full px-8 py-3 border border-white/20 hover:bg-white/20 transition-colors"
              >
                Create Account
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — ABOUT
      ════════════════════════════════════════ */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-4 block">
              About
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-8 leading-snug">
              What is Sahayak?
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-5">
              <strong className="text-white/90">Sahayak</strong> (meaning{" "}
              <em>"helper"</em> in Hindi) is a multilingual AI-powered voice
              assistant designed to help rural citizens — farmers, daily-wage workers,
              and families with low digital literacy — fill government enrollment
              forms hands-free, in their own language.
            </p>
            <p className="text-white/60 text-lg leading-relaxed">
              Users simply speak naturally in Hindi, Kannada, Telugu, or Tamil. The
              AI listens, understands, and populates a government scheme form in
              real time — no typing, no navigation, no barriers. Built for{" "}
              <strong className="text-white/90">HackBLR</strong> by{" "}
              <strong className="text-white/90">Team NeuroNova</strong>, Sahayak
              bridges the gap between complex bureaucratic paperwork and citizens
              who need it most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — TECH STACK
      ════════════════════════════════════════ */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-4 block">
              Technology
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-white leading-snug">
              Built With
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_STACK.map((item, i) => (
              <motion.div
                key={item.tech}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex items-center gap-4 rounded-2xl p-6 border border-white/10 hover:border-violet-500/40 hover:bg-white/[0.06] transition-all duration-300 group"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-violet-400 group-hover:text-violet-300 transition-colors"
                  style={{ background: "rgba(167,139,250,0.1)" }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-0.5">
                    {item.category}
                  </p>
                  <p className="text-white font-medium text-sm">{item.tech}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — TEAM
      ════════════════════════════════════════ */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-4"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-4 block">
              The Team
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-2 leading-snug">
              Meet the Builders
            </h2>
            <p className="text-white/50 text-base">
              Built with ❤️ at HackBLR by Team NeuroNova
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {/* Avatar */}
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-5 bg-gradient-to-br ${member.gradient}`}
                >
                  {member.initials}
                </div>

                {/* Name */}
                <h3 className="text-white font-semibold text-base leading-snug mb-2">
                  {member.name}
                </h3>

                {/* Role badge */}
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: `${member.badgeColor}18`,
                    color: member.badgeColor,
                    border: `1px solid ${member.badgeColor}40`,
                  }}
                >
                  {member.role}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2026 Team NeuroNova · Built at HackBLR
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/client"
              className="text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
