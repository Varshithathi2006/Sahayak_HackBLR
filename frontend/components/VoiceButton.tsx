"use client";

import { useVapiCall } from "@/hooks/useVapiCall";
import { useFormStore } from "@/lib/formStore";
import LanguageSelector from "./LanguageSelector";
import { Mic, Square, Power } from "lucide-react";

export default function VoiceButton() {
  const { startCall, stopCall, callActive } = useVapiCall();
  const { resetForm } = useFormStore();

  const handleClick = () => {
    if (callActive) {
      stopCall();
    } else {
      // Clear previous form data but keep the same sessionId 
      // so the SSE connection stays alive
      resetForm();
      console.log("🔄 Form reset. Starting new voice session with existing SSE link.");
      startCall();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full px-4">
      <LanguageSelector />

      {/* Heavy Industrial Toggle */}
      <button
        id="voice-btn"
        onClick={handleClick}
        className={`
          relative w-full h-14 rounded border flex items-center justify-center gap-3
          transition-all duration-200 uppercase text-xs font-bold tracking-widest
          ${callActive
            ? "bg-red-600/90 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : "bg-blue-600/90 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-600"
          }
          active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 
          ${callActive ? "focus:ring-red-500" : "focus:ring-blue-500"}
        `}
      >
        {callActive ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            Terminate Communication
          </>
        ) : (
          <>
            <Power className="w-4 h-4" strokeWidth={3} />
            Initialize Link
          </>
        )}
      </button>

      {/* Meter / Status indicator */}
      <div className="flex items-center gap-3 w-full opacity-60">
        <div className="h-0.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${callActive ? "bg-emerald-500 w-full animate-progress" : "bg-slate-700 w-0"}`}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tabular-nums">
          {callActive ? "Connected" : "Standby"}
        </span>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; opacity: 0.3; }
          50% { width: 100%; opacity: 1; }
          100% { width: 0%; opacity: 0.3; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Hidden Diagnostic Button (Shift+Click 'Standby' to see, or just click small dot) */}
      <div className="mt-4 flex flex-col items-center">
        <button 
          onClick={async () => {
            const { sessionId } = useFormStore.getState();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            console.log("🧪 Triggering manual diagnostic test for:", sessionId);
            try {
              await fetch(`${API_URL}/api/test-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId })
              });
            } catch (e) {
              console.error("❌ Test Trigger Failed:", e);
            }
          }}
          className="text-[9px] text-slate-800 hover:text-slate-600 uppercase font-black tracking-tighter transition-colors"
        >
          [ Manual Pipe Test ]
        </button>
      </div>
    </div>
  );
}
