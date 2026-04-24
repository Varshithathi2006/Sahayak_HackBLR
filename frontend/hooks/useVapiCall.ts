"use client";

import { useCallback, useRef, useEffect } from "react";
import { useFormStore } from "@/lib/formStore";
import { useAuthStore } from "@/lib/authStore";
import { getVapiClient } from "@/lib/vapiClient";
import { getLanguageConfig } from "@/lib/localizations";

// Stable ID generator for bubbles
const generateBubbleId = () => `bubble-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useVapiCall() {
  const { 
    setCallActive, callActive, 
    setError, setRawError, selectedLanguage, 
    setVapiCallId 
  } = useFormStore();
  
  const vapiRef = useRef<any>(null);

  // Initialize and attach listeners once
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (!vapiRef.current) {
      vapiRef.current = getVapiClient();
    }

    const vapi = vapiRef.current;
    if (!vapi) return;

    vapi.removeAllListeners();

    let lastRole: string | null = null;
    let currentMsgId = "";

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.role && msg.transcript) {
        const isRoleChange = msg.role !== lastRole;
        if (isRoleChange || !currentMsgId) {
          currentMsgId = generateBubbleId();
          lastRole = msg.role;
        }

        useFormStore.getState().updateLatestTranscript({
          id: currentMsgId,
          role: msg.role === "assistant" ? "assistant" : "user",
          text: msg.transcript.trim(),
          timestamp: Date.now(),
        });

        if (msg.transcriptType === "final") {
          currentMsgId = "";
        }
      }
    });

    vapi.on("call-start", () => {
      console.log("🟢 Vapi Call Started");
      setCallActive(true);
    });

    vapi.on("call-end", () => {
      console.log("🔴 Vapi Call Ended");
      setCallActive(false);
      setVapiCallId(null);
    });

    vapi.on("error", (err: any) => {
      console.error("🔴 VAPI_ERROR_EVENT:", err);
      let msg = "Communication session error.";
      if (typeof err === "string") msg = err;
      else if (err?.message && typeof err.message === "string") msg = err.message;
      else if (err?.error?.message && typeof err.error.message === "string") msg = err.error.message;
      else if (err?.error && typeof err.error === "string") msg = err.error;
      else msg = JSON.stringify(err);

      setError(msg);
      setRawError(err);
      setCallActive(false);
      setVapiCallId(null);
    });
  }, [setCallActive, setError, setRawError, setVapiCallId]);

  const startCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi || callActive) return;

    setError(null);
    setRawError(null);

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const langConfig = getLanguageConfig(selectedLanguage);

    if (!publicKey || publicKey === "your_vapi_public_key_here") {
      setError("Vapi Public Key is not set in .env.local");
      return;
    }

    if (!assistantId) {
      setError("Vapi Assistant ID is not set in .env.local");
      return;
    }

    // ─── Step 1: Auto-sync Vapi webhook URL and dynamic tools ───
    const currentSessionId = useFormStore.getState().sessionId;
    const activeSchema = useFormStore.getState().activeSchema;
    const user = useAuthStore.getState().user;

    try {
      console.log("🔄 Syncing Vapi assistant configuration...");
      const syncResp = await fetch(`${apiUrl}/api/sync-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assistantId, 
          fields: activeSchema?.fields || [],
          name: activeSchema?.name,
          description: activeSchema?.description
        }),
      });
      const syncData = await syncResp.json();
      if (syncData.success) {
        console.log(`✅ Assistant config synced.`);
      } else {
        console.warn("⚠️ Config sync failed:", syncData.error);
      }
    } catch (err) {
      console.warn("⚠️ Could not sync assistant config:", err);
    }

    // ─── Step 2: Register this session with the backend ───
    try {
      await fetch(`${apiUrl}/api/register-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });
      console.log(`📋 Session registered: ${currentSessionId}`);
    } catch (err) {
      console.warn("⚠️ Session registration failed:", err);
    }

    // ─── Step 3: Generate Assistant Overrides ───
    const assistantOverrides = { 
      metadata: { 
        sessionId: currentSessionId,
        schemaId: activeSchema?._id,
        userId: user?.id
      },
      // Note: We no longer override 'model' here to avoid 'missing provider' errors.
      // All model-level changes (prompt, tools) are handled by the backend sync-webhook patch.
      firstMessage: langConfig.firstMessage || `Namaste! I am Sahayak. I will help you fill out the ${activeSchema?.name} form. May I know your name?`,
    };

    console.log("🚀 Starting Vapi call with overrides:", assistantOverrides);

    try {
      const call = await vapi.start(assistantId, assistantOverrides);
      console.log("📞 Vapi call object:", call);
      if (call?.id) {
        setVapiCallId(call.id);
        // Also tell the backend about this call<->session link
        try {
          await fetch(`${apiUrl}/api/link-call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId: call.id, sessionId: currentSessionId }),
          });
          console.log(`🔗 Call linked: ${call.id} -> ${currentSessionId}`);
        } catch (err) {
          console.warn("⚠️ Call link failed:", err);
        }
      }
    } catch (err: any) {
      console.error("🔴 VAPISTART_FATAL_ERROR:", err);
      setRawError(err);
      const msg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
      setError(`Failed to start: ${msg}`);
      setCallActive(false);
    }
  }, [callActive, setCallActive, setError, setRawError, selectedLanguage, setVapiCallId]);

  const stopCall = useCallback(() => {
    vapiRef.current?.stop();
    setCallActive(false);
  }, [setCallActive]);

  const setAssistantOverrides = useCallback((overrides: any) => {
    vapiRef.current?.setAssistantOverrides(overrides);
  }, []);

  return { startCall, stopCall, setAssistantOverrides, callActive };
}
