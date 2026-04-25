import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vapiRouter from "./routes/vapi.js";
import knowledgeRouter from "./routes/knowledge.js";
import memoryRouter from "./routes/memory.js";
import authRouter from "./routes/auth.js";
import bankRouter from "./routes/bank.js";
import clientRouter from "./routes/client.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow in development
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database Connection Logic (Serverless Optimized) ─────────────────────────
let isConnected = false;

async function connectToDatabases() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI is not defined");

    console.log("🍃 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("✅ Database connection established.");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
}

// Middleware to ensure DB is connected before processing requests
app.use(async (_req, _res, next) => {
  try {
    await connectToDatabases();
    next();
  } catch (err) {
    _res.status(500).json({ error: "Database connection failed" });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/bank", bankRouter);
app.use("/api/client", clientRouter);
app.use("/api", vapiRouter);           
app.use("/api", knowledgeRouter);      
app.use("/api/user-memory", memoryRouter);

// ─── Health Check & Root ──────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ 
    message: "NeuroNova API — Production Environment", 
    status: isConnected ? "active" : "connecting",
    version: "1.0.0"
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Auto-Sync Vapi Webhook URL ───────────────────────────────────────────────
app.post("/api/sync-webhook", async (_req, res) => {
  const { assistantId, fields, name, description, language } = _req.body;
  const vapiKey = process.env.VAPI_API_KEY;
  const backendUrl = process.env.BACKEND_URL;

  if (!assistantId || !vapiKey || !backendUrl) {
    return res.status(400).json({ error: "Missing config" });
  }

  const webhookUrl = `${backendUrl}/api/webhook/vapi`;
  const fieldEnums = fields ? fields.map((f: any) => f.key) : [];
  console.log(`🔑 Syncing schema "${name}" with keys:`, fieldEnums);

  try {
    // ─── 1. Build Schema String ───
    const schemaText = fields
      .map((f: any, i: number) => `${i + 1}. ${f.key} (${f.type}) — ${f.label}`)
      .join('\n');

    // ─── 2. Define Base Prompt Template ───
    const BASE_PROMPT = `You are Sahayak, a warm and patient voice assistant helping citizens of India fill out government and financial forms over a voice call. 

---

## YOUR PRIMARY JOB
You have been given a policy document for a specific government scheme. Your job has THREE phases:

PHASE 1 — POLICY BRIEFING (30 seconds max)
PHASE 2 — USER CONSENT
PHASE 3 — FORM FILLING (one field at a time)

---

## PHASE 1 — POLICY BRIEFING
When the call begins, greet the user and immediately give a CRISP summary (3 points) of the policy document provided below.
Once finished, ask: "Kya aap samjhe? Aur kya aap is yojana ke liye apply karna chahte hain?"

---

## PHASE 2 — USER CONSENT
- IF the user says YES, proceed to PHASE 3.
- IF they ask a question, answer concisely from the policy document and ask for consent again.

---

## PHASE 3 — FORM FILLING
ONLY ask for the fields listed in the 'FORM SCHEMA' section below. 
1. Ask one field at a time.
2. Confirm the value softly.
3. Call 'update_form_field' immediately after confirmation.
4. Move to the next field.

---

## TOOL USAGE — CRITICAL RULE
- ONLY use the keys listed in the 'FORM SCHEMA' section.
- Match exact casing and spelling.
- Format: { "field": "<exact_key>", "value": "<value>" }

---

## INJECTED CONTEXT

### POLICY DOCUMENT:
{{POLICY_DOCUMENT_TEXT}}

### FORM SCHEMA:
{{FORM_SCHEMA_JSON}}

---

Proceed with Phase 1 now.`;

    // ─── 3. Inject Context ───
    const policyText = description || "This scheme provides support for eligible citizens to access government benefits.";
    const finalPrompt = BASE_PROMPT
      .replace('{{POLICY_DOCUMENT_TEXT}}', policyText)
      .replace('{{FORM_SCHEMA_JSON}}', schemaText);

    const tools = [
      {
        type: "function",
        function: {
          name: "update_form_field",
          description: "Updates a specific form field in real-time.",
          parameters: {
            type: "object",
            properties: {
              field: { type: "string", enum: fieldEnums },
              value: { type: "string" },
            },
            required: ["field", "value"],
          },
        },
        server: { url: webhookUrl }
      }
    ];

    // ─── 4. Patch Vapi Assistant ───
    const firstMsg = "Namaste! Main Sahayak hoon — aapka digital sahayak. Kya aap Hindi mein baat karna chahenge, ya English mein?";

    await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${vapiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        serverUrl: webhookUrl, 
        firstMessage: firstMsg,
        silenceTimeoutSeconds: 30,
        backchannelingEnabled: false,
        backgroundDenoisingEnabled: true,
        fillerWordsEnabled: false,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: language?.split('-')[0] || 'en',
          smartFormat: true
        },
        voice: {
          provider: "11labs",
          voiceId: "pNInz6obpg8ndEao7m8B" // Adam - High-quality male voice
        },
        model: {
          provider: "groq",
          model: "llama3-70b-8192",
          systemPrompt: finalPrompt,
          tools,
          temperature: 0.1 // Lowered for more precise extraction
        } 
      }),
    });

    res.json({ success: true, webhookUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start (Standard Node Only) ───────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend running at http://0.0.0.0:${PORT}`);
  });
}

export default app;
