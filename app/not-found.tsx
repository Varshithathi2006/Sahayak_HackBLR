"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "#070612", color: "#fff", fontFamily: "sans-serif" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
      >
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">404 — Page Not Found</h1>
      <p className="text-white/40 max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved within the NeuroNova registry.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "linear-gradient(135deg, #a78bfa, #818cf8)",
          color: "#fff",
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
