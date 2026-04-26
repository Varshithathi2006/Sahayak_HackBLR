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
import { initCollections } from "./services/qdrant.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
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
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
    console.log("✅ MongoDB connection established.");

    console.log("📡 Initializing Qdrant collections...");
    await initCollections();
    console.log("✅ Qdrant collections ready.");
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
    const BASE_PROMPT = `You are Sahayak, an intelligent and compassionate voice assistant helping a user with the **{{SCHEME_NAME}}**.

---

## 🛑 STRICT LANGUAGE COMPLIANCE 🛑
- The user's primary language is **{{LANGUAGE_NAME}}**.
- **MANDATORY**: You must respond ONLY in **{{LANGUAGE_NAME}}**.
- Even if the user speaks to you in English, you MUST translate your response back into **{{LANGUAGE_NAME}}**.
- DO NOT use English words unless there is no equivalent in **{{LANGUAGE_NAME}}**.
- Use simple, culturally appropriate vocabulary for rural India.
- Your goal is to make the user feel comfortable in their native tongue.

---

## YOUR PRIMARY JOB
Follow this 3-phase flow strictly for **{{SCHEME_NAME}}**.

PHASE 1 — POLICY BRIEFING (30 seconds max)
Summarize the **{{SCHEME_NAME}}** and its benefits in **{{LANGUAGE_NAME}}**.

PHASE 2 — USER CONSENT
Wait for the user to say "Yes" or ask a question about **{{SCHEME_NAME}}** in **{{LANGUAGE_NAME}}**.

PHASE 3 — DYNAMIC FORM FILLING
Ask for the fields in the 'FORM SCHEMA' one by one in **{{LANGUAGE_NAME}}**.

---

## INTELLIGENCE & AUTOCORRECT
1. **Field Knowledge**: Understand what you are asking. If you ask for 'Phone Number' and hear 'John', gently explain the error in **{{LANGUAGE_NAME}}**.
2. **Format Verification**: Proactively check if the user's answer makes sense for the field.
3. **Conversational Editing**: If the user says "Wait, change that" or "I meant X, not Y", IMMEDIATELY call 'update_form_field' for that specific field.
4. **Natural Suggesstions**: If the user is unsure, explain why it's needed based on the **{{SCHEME_NAME}}** policy doc in **{{LANGUAGE_NAME}}**.

---

## TOOL USAGE
- Call 'update_form_field' for EVERY confirmation or change.
- Format: { "field": "<exact_key>", "value": "<value>" }

---

## INJECTED CONTEXT

### SCHEME NAME:
{{SCHEME_NAME}}

### POLICY DOCUMENT:
{{POLICY_DOCUMENT_TEXT}}

### FORM SCHEMA:
{{FORM_SCHEMA_JSON}}

---

Proceed with Phase 1 for **{{SCHEME_NAME}}** now.`;

    // ─── 3. Inject Context ───
    const languageMap: Record<string, string> = {
      'en-IN': 'English',
      'hi-IN': 'Hindi',
      'kn-IN': 'Kannada',
      'te-IN': 'Telugu',
      'ta-IN': 'Tamil'
    };
    const langName = languageMap[language] || 'the user\'s preferred language';

    const policyText = description || "This scheme provides support for eligible citizens to access government benefits.";
    const finalPrompt = BASE_PROMPT
      .replace(/{{SCHEME_NAME}}/g, name || "the selected scheme")
      .replace('{{POLICY_DOCUMENT_TEXT}}', policyText)
      .replace('{{FORM_SCHEMA_JSON}}', schemaText)
      .replace(/{{LANGUAGE_NAME}}/g, langName);

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
    // First message based on language
    const firstMessages: Record<string, string> = {
      "en-IN": "Namaste! I am Sahayak, your helper for filling out your government form. May I know your name, and have you spoken with me before?",
      "hi-IN": "नमस्ते! मैं सहायक हूँ, आपका सरकारी फॉर्म भरने में मददगार। क्या मैं आपका नाम जान सकता हूँ, और क्या आपने पहले मुझसे बात की है?",
      "kn-IN": "ನಮಸ್ಕಾರ! ನಾನು ಸಹಾಯಕ, ನಿಮ್ಮ ಸರ್ಕಾರಿ ಫಾರ್ಮ್ ತುಂಬಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಯಬಹುದೇ ಮತ್ತು ನೀವು ಈ ಹಿಂದೆ ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಿದ್ದೀರಾ?",
      "te-IN": "నమస్కారం! నేను సహాయక్, మీ ప్రభుత్వ ఫారమ్‌ను పూరించడంలో సహాయపడతాను. నేను మీ పేరు తెలుసుకోవచ్చా, మరియు మీరు ఇంతకు ముందు నాతో మాట్లాడారా?",
      "ta-IN": "வணக்கம்! நான் சகாயக், உங்கள் அரசு விண்ணப்பப் படிவத்தைப் பூர்த்தி செய்ய உதவுகிறேன். உங்கள் பெயரை நான் தெரிந்து கொள்ளலாமா, இதற்கு முன்பு என்னிடம் பேசியிருக்கிறீர்களா?"
    };

    const firstMsg = firstMessages[language] || "Namaste! Main Sahayak hoon — aapka digital sahayak. Kya aap Hindi mein baat karna chahenge, ya English mein?";

    await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${vapiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        serverUrl: webhookUrl, 
        firstMessage: firstMsg,
        silenceTimeoutSeconds: 30,
        backchannelingEnabled: false,
        backgroundDenoisingEnabled: false,
        fillerWordsEnabled: false,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: language?.split('-')[0] || 'en',
          smartFormat: true
        },
        voice: {
          provider: "11labs",
          voiceId: "EXAVITQu4vr4xnSDxM6t" // Sarah - Professional Female Voice
        },
        model: {
          provider: "groq",
          model: "llama3-70b-8192",
          systemPrompt: finalPrompt,
          tools,
          temperature: 0.1 // Lowered for more precise extraction
        },
        metadata: {
          schemaId: _req.body.assistantId, // Using assistantId as a proxy or direct schemaId if available
          userId: _req.body.userId
        } 
      }),
    });

    res.json({ success: true, webhookUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Error Handling ──────────────────────────────────────────────────────────
// 404 for API
app.use("/api", (req: any, res: any) => {
  res.status(404).json({ error: `API Route ${req.method} ${req.originalUrl} not found` });
});

// Global catch-all
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 Server Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ─── Start (Standard Node Only) ───────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend running at http://0.0.0.0:${PORT}`);
  });
}

export default app;
