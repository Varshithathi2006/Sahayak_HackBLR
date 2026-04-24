import { Router, Request, Response } from "express";
import type { FormUpdateEvent } from "../types.js";
import { FormUpdate } from "../models/FormUpdate.js";
import { Submission } from "../models/Submission.js";
import { qdrantClient, COLLECTION_KNOWLEDGE } from "../services/qdrant.js";
import { getEmbedding, zeroVector } from "../services/vectorService.js";

const router = Router();

// ─── SSE Client Registry ──────────────────────────────────────────────────────
// Maps sessionId → Express Response (SSE stream)
export const sseClients = new Map<string, Response>();

// Mapping of Vapi Call ID to Browser Session ID for robust data routing
// This handles cases where Vapi metadata might be missing in some webhook triggers
const callIdToSessionId = new Map<string, string>();

// FALLBACK: The most recently registered browser session.
// When Vapi fails to forward metadata (which happens often), we route to this session.
let lastRegisteredSession: string | null = null;

/**
 * POST /api/register-session
 * Frontend calls this before starting a Vapi call to register the active session.
 */
router.post("/register-session", (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (sessionId) {
    lastRegisteredSession = sessionId;
    console.log(`📋 Session registered as active: ${sessionId}`);
    console.log(`📡 Active SSE clients: [${Array.from(sseClients.keys()).join(", ") || "NONE"}]`);
  }
  res.json({ success: true, sessionId });
});

/**
 * POST /api/link-call
 * Frontend calls this after Vapi returns a call ID to create the explicit mapping.
 */
router.post("/link-call", (req: Request, res: Response) => {
  const { callId, sessionId } = req.body;
  if (callId && sessionId) {
    callIdToSessionId.set(callId, sessionId);
    lastRegisteredSession = sessionId;
    console.log(`🔗 Explicit link: Call [${callId}] → Session [${sessionId}]`);
  }
  res.json({ success: true });
});

/**
 * GET /api/form-events?sessionId=xxx
 * Establishes an SSE stream for the frontend to listen to form updates.
 */
router.get("/form-events", (req: Request, res: Response) => {
  const sessionId = (req.query.sessionId as string) || "default";

  // Explicit CORS headers for SSE
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Keep-alive heartbeat (every 15s)
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  // Connection Warmup - sending some bypass data to trigger browser processing
  res.write(": warmup\n\n");
  res.flushHeaders();

  // Register client AFTER warm-up
  sseClients.set(sessionId, res);
  console.log(`📡 [SSE] NEW CONNECTION: ${sessionId} (Active: ${sseClients.size})`);

  // Immediate confirmation event
  sendSSE(res, { type: "status", message: "connected", sessionId });

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(sessionId);
    console.log(`📡 [SSE] CLOSED: ${sessionId}`);
  });
});

/**
 * POST /webhook/vapi
 * Receives function call events from Vapi and dispatches SSE updates.
 */
router.post("/webhook/vapi", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const type = body.type || body.message?.type || "Unknown";
    const message = body.message || body;
    const callId = body.callId || message?.call?.id || body?.call?.id;
    const metadata = message?.metadata || body?.metadata || body?.message?.metadata || message?.call?.metadata || body?.call?.metadata;
    
    console.log(`📡 Vapi Event: [${type}] - Call: ${callId}`);
    if (type === "end-of-call-report") console.log(`🛑 Call Ended Reason: ${body.endedReason || body.message?.endedReason || "unknown"}`);

    if (body.transcript) console.log(`📝 Transcript: ${body.transcript}`);
    if (body.toolCalls) console.log(`🛠️ Tool Calls: ${JSON.stringify(body.toolCalls)}`);
    if (message?.transcript) console.log(`📝 Msg Transcript: ${message.transcript}`);
    if (message?.toolCalls) console.log(`🛠️ Msg Tool Calls: ${JSON.stringify(message.toolCalls)}`);

    let sessionId = metadata?.sessionId || lastRegisteredSession;
    if (callId && !sessionId) {
      sessionId = callIdToSessionId.get(callId);
    }
    sessionId = sessionId || "default";

    // ─── Phase 2: Tool Calls ──────────────────────────────────────────────────
    if (type === "function-call" || type === "tool-calls") {
      console.log(`🛠️ Processing Tool Calls for session: ${sessionId}`);
      const calls = type === "tool-calls" ? (message?.toolCalls || []) : [message?.functionCall];
      const results: any[] = [];

      for (const call of calls) {
        const functionName = type === "tool-calls" ? call?.function?.name : call?.name;
        const callId = type === "tool-calls" ? call?.id : null;
        
        let rawParameters: any = {};
        try {
          const args = type === "tool-calls" ? call?.function?.arguments : call?.parameters;
          rawParameters = typeof args === "string" ? JSON.parse(args) : (args || {});
        } catch (e) {
          console.error(`     ❌ Error parsing tool arguments for ${functionName}:`, e);
          rawParameters = {};
        }

        console.log(`🛠️  Tool: ${functionName} for Session: ${sessionId}`);
        let toolResult: any = { success: true };

        try {
          if (functionName === "update_form_field") {
            const { field, value } = rawParameters;
            if (field) {
              // Normalize boolean values
              let normalizedValue = value;
              if (typeof value === "string") {
                if (value.toLowerCase() === "true") normalizedValue = true;
                if (value.toLowerCase() === "false") normalizedValue = false;
              }
              toolResult = await handleFormFieldUpdate(sessionId, field, normalizedValue);
            }
          } else if (functionName === "ask_knowledge_base") {
            const { query } = rawParameters;
            const schemaId = message?.call?.metadata?.schemaId || body?.call?.metadata?.schemaId;
            
            // NO MORE DYNAMIC IMPORTS
            
            const vector = process.env.OPENAI_API_KEY ? await getEmbedding(query || "") : zeroVector;
            const filter = schemaId ? { must: [{ key: "schemaId", match: { value: schemaId } }] } : undefined;

            const searchResults = await qdrantClient.search(COLLECTION_KNOWLEDGE, { vector, limit: 1, filter, with_payload: true });
            toolResult = searchResults.length > 0 ? { answer: (searchResults[0].payload as any).content } : { answer: "No matching info found." };
          }
        } catch (err: any) {
          console.error(`❌ Tool Execution Error [${functionName}]:`, err.message);
          toolResult = { error: err.message || "Execution failed" };
        }

        if (type === "tool-calls") {
          results.push({ toolCallId: callId, result: toolResult });
        } else {
          results.push(toolResult);
        }
      }

      return res.status(200).json(type === "tool-calls" ? { results } : { result: results[0] });
    }

    // Handle end-of-call report
    if (type === "end-of-call-report") {
      try {
        const schemaId = body?.call?.metadata?.schemaId;
        const userId = body?.call?.metadata?.userId;
        const formData = body?.analysis?.structuredData || {};

        if (schemaId && userId) {
          await new Submission({ userId, schemaId, data: formData, status: "pending" }).save();
          console.log(`✅ Submission saved.`);
        }
      } catch (err) {
        console.error("❌ Save failed:", err);
      }
    }

    return res.status(200).json({ received: true });
  } catch (globalErr: any) {
    console.error("🚨 GLOBAL WEBHOOK FATAL ERROR:", globalErr);
    return res.status(200).json({ error: "Internal processing error", details: globalErr.message });
  }
});

/**
 * POST /api/test-link
 */
router.post("/test-link", async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId || !sseClients.has(sessionId)) {
    return res.status(404).json({ error: "No active session found" });
  }
  await handleFormFieldUpdate(sessionId, "fullName", "DIAGNOSTIC_LINK_OK");
  res.json({ success: true });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * GET /api/form-updates/:sessionId
 * Fallback polling route for environments where SSE is unstable (like Vercel).
 */
router.get("/form-updates/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { lastSeen } = req.query; // Optional timestamp to only get new ones
  
  try {
    const query: any = { sessionId };
    if (lastSeen) query.createdAt = { $gt: new Date(lastSeen as string) };
    
    const updates = await FormUpdate.find(query).sort({ createdAt: 1 });
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch updates" });
  }
});

async function handleFormFieldUpdate(
  sessionId: string,
  field: string,
  value: string | number | boolean
): Promise<{ success: boolean }> {
  // 1. Dispatch to active SSE clients (if any in this instance)
  const client = sseClients.get(sessionId);
  if (client) {
    console.log(`✅ Dispatching SSE update for ${field} to session ${sessionId}: ${value}`);
    sendSSE(client, { type: "form_update", field, value, sessionId });
  }

  // 2. Persist to DB for cross-instance polling (Critical for Vercel/Serverless)
  try {
    await new FormUpdate({ sessionId, field, value }).save();
    console.log(`💾 Persisted update to DB for polling: ${field}`);
  } catch (err) {
    console.error("❌ Failed to persist form update:", err);
  }

  return { success: true };
}

function sendSSE(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export { sendSSE };
export default router;
