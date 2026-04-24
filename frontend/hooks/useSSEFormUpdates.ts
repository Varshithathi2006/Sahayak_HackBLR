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

      console.log("-----------------------------------------");
      console.log(`📡 SSE: Connecting to ${API_URL}`);
      console.log(`🆔 Session ID: ${sessionId}`);
      console.log("-----------------------------------------");

      setSSEStatus("connecting");

      // Use absolute URL to avoid any relative path confusion
      const url = `${API_URL}/api/form-events?sessionId=${sessionId}`;
      
      // EventSource with explicit credentials handling
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = (e) => {
        if (!mountedRef.current) return;
        console.log("✅ SSE Connection Established for:", sessionId);
        setSSEStatus("connected");
      };

      // Listen for all messages
      es.addEventListener("message", (event) => {
        if (!mountedRef.current) return;
        
        // Handle heartbeats/warmups (non-JSON data)
        if (event.data.startsWith(":")) {
          return;
        }

        try {
          const data: SSEEvent = JSON.parse(event.data);
          console.log("📥 SSE DATA RECEIVED:", data);

          if (data.type === "form_update" && data.field && data.value !== undefined) {
             console.log(`💎 STORE UPDATE TRIGGER: [${data.field}] -> [${data.value}]`);
             // Access the updateField action directly from the store's state
             const store = useFormStore.getState();
             store.updateField(data.field, data.value);
             
             // Extra safety: log the state after update (on next tick)
             setTimeout(() => {
               const newState = useFormStore.getState();
               console.log("🔍 NEW FORM STATE:", newState.form);
             }, 50);
          } else if (data.type === "status") {
             console.log("ℹ️ SYSTEM STATUS:", data.message);
          }
        } catch (err) {
          console.warn("❌ SSE Parse Error. Raw data:", event.data, err);
        }
      });

      es.onerror = (err) => {
        if (!mountedRef.current) return;
        console.warn("⚠️ SSE Stream Error - Connection may be lost. Retrying in 3s...", err);
        setSSEStatus("disconnected");
        es.close();
        eventSourceRef.current = null;

        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      console.log("🛑 SSE: Hook unmounting, closing connection");
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [sessionId, setSSEStatus]);
}
