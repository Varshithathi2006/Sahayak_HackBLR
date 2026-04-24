"use client";

import { useEffect, useRef } from "react";
import { useFormStore } from "@/lib/formStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SSEEvent {
  type: "form_update" | "status";
  field?: string;
  value?: string | number | boolean;
  message?: string;
  sessionId?: string;
}

export function useSSEFormUpdates() {
  const sessionId = useFormStore((s) => s.sessionId);
  const setSSEStatus = useFormStore((s) => s.setSSEStatus);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Clean up previous connection
    if (eventSourceRef.current) {
      console.log("🧹 SSE: Closing existing connection");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!sessionId) {
      console.warn("⚠️ SSE: No sessionId found, skipping connection");
      return;
    }

    function connect() {
      if (!mountedRef.current) return;

      console.log("📡 SSE: Connecting to", API_URL);
      setSSEStatus("connecting");

      const url = `${API_URL}/api/form-events?sessionId=${sessionId}`;
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        console.log("✅ SSE Connected");
        setSSEStatus("connected");
      };

      es.addEventListener("message", (event) => {
        if (!mountedRef.current || event.data.startsWith(":")) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "form_update" && data.field) {
            useFormStore.getState().updateField(data.field, data.value);
          }
        } catch (err) {
          console.warn("❌ SSE Parse Error:", err);
        }
      });

      es.onerror = () => {
        if (!mountedRef.current) return;
        console.warn("⚠️ SSE Disconnected. Switching to Polling Fallback...");
        setSSEStatus("disconnected");
        es.close();
        eventSourceRef.current = null;

        // Start Polling Fallback
        startPolling();
      };
    }

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let lastPollTime = new Date().toISOString();

    function startPolling() {
      if (pollInterval || !mountedRef.current) return;
      
      console.log("⏱️ POLLING STARTED for session:", sessionId);
      
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/form-updates/${sessionId}?lastSeen=${lastPollTime}`);
          const { updates } = await res.json();
          
          if (updates && updates.length > 0) {
            console.log(`📥 Polled ${updates.length} new updates`);
            const store = useFormStore.getState();
            updates.forEach((u: any) => {
              store.updateField(u.field, u.value);
              lastPollTime = u.createdAt;
            });
          }
        } catch (err) {
          console.error("❌ Polling Error:", err);
        }
      }, 2000); // Poll every 2s
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId, setSSEStatus]);
}
