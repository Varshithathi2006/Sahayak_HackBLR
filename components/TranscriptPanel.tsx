"use client";

import { useFormStore } from "@/lib/formStore";
import { useEffect, useRef } from "react";

export default function TranscriptPanel() {
  const { transcript, callActive } = useFormStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin pb-4">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Awaiting Signal...</p>
          </div>
        ) : (
          transcript.map((line, index) => {
            const isAssistant = line.role === "assistant";
            return (
              <div 
                key={line.id || index} 
                className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"} animate-slide-in`}
              >
                <div className={`max-w-[85%] flex flex-col gap-1.5 ${isAssistant ? "items-start" : "items-end"}`}>
                  {/* Identity Label */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">
                      {isAssistant ? "Sahayak Agent" : "Verification Subject"}
                    </span>
                  </div>

                  {/* Chat Bubble */}
                  <div className={`
                    relative px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-lg
                    ${isAssistant 
                      ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50" 
                      : "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20"
                    }
                  `}>
                    {line.text}
                    
                    {/* Time Indicator */}
                    <div className={`
                      text-[8px] mt-1 opactiy-50 font-medium
                      ${isAssistant ? "text-slate-500" : "text-blue-200"}
                    `}>
                      {new Date(line.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
