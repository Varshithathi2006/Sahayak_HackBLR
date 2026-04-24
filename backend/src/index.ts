import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initCollections } from "./services/qdrant.js";
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
// Allow multiple origins (local dev + any deployed frontend)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (SSE, server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all in development
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/bank", bankRouter);
app.use("/api/client", clientRouter);
app.use("/api", vapiRouter);           // /api/form-events (SSE), /api/webhook/vapi (webhook)
app.use("/api", knowledgeRouter);      // /api/ask-knowledge
app.use("/api/user-memory", memoryRouter); // /api/user-memory/*

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Auto-Sync Vapi Webhook URL ───────────────────────────────────────────────
// Ensures the Vapi assistant always points to the current ngrok/backend URL.
// Called by the frontend before starting a voice session.
app.post("/api/sync-webhook", async (_req, res) => {
  const { assistantId, fields, name, description } = _req.body;
  const vapiKey = process.env.VAPI_API_KEY;
  const backendUrl = process.env.BACKEND_URL;

  if (!assistantId || !vapiKey || !backendUrl) {
    res.status(400).json({ 
      error: "Missing config", 
      details: { assistantId: !!assistantId, vapiKey: !!vapiKey, backendUrl: !!backendUrl } 
    });
    return;
  }

    const webhookUrl = `${backendUrl}/api/webhook/vapi`;
    const fieldEnums = fields ? fields.map((f: any) => f.key) : [];

    console.log(`🔄 Syncing Vapi Assistant [${assistantId}] for "${name}" registry.`);
    console.log(`📋 Fields: ${fieldEnums.join(", ")}`);

    try {
      // Fetch current assistant config first to avoid overwriting model settings
      const getResp = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        headers: { Authorization: `Bearer ${vapiKey}` },
      });
      
      if (!getResp.ok) {
        const errText = await getResp.text();
        throw new Error(`Failed to fetch assistant: ${getResp.status} ${errText}`);
      }

      const assistant = await getResp.json() as any;

      const systemPrompt = `You are Sahayak, an AI helper helping users fill out the "${name}" form. 
${description ? `Context: ${description}` : ""}
CORE RULE: ALWAYS call update_form_field *immediately* when you extract any piece of information. 
The available fields are: ${fieldEnums.join(", ")}.
Proceed field by field, confirming softly as you go. 
Respond in the language the user is using.`;

      console.log(`📝 Prompt: ${systemPrompt.substring(0, 100)}...`);

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
              value: { type: "string", description: "The value to set" },
            },
            required: ["field", "value"],
          },
        },
        server: { url: webhookUrl }
      },
      {
        type: "function",
        function: {
          name: "ask_knowledge_base",
          description: "Fetches info from the knowledge base related to this form.",
          parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
          },
        },
        server: { url: webhookUrl }
      }
    ];

    // Patch assistant with new URLs, dynamic tools, and specific system prompt
    const patchResp = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${vapiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverUrl: webhookUrl,
        model: { 
          ...assistant.model,
          systemPrompt,
          tools,
        },
      }),
    });

    if (!patchResp.ok) {
      const errText = await patchResp.text();
      throw new Error(`Failed to patch assistant: ${patchResp.status} ${errText}`);
    }

    console.log(`✅ Vapi Assistant [${assistantId}] successfully patched.`);
    res.json({ success: true, webhookUrl });
  } catch (err: any) {
    console.error("❌ Sync failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start (Local Only) ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  async function start() {
    try {
      console.log("🔧 Initializing Qdrant collections (Required)...");
      await initCollections();
      console.log("✅ Qdrant connection established.");
      
      console.log("🍃 Connecting to MongoDB...");
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/sahayak";
      await mongoose.connect(mongoUri);
      console.log("✅ MongoDB connection established.");
    } catch (err) {
      console.error("❌ CRITICAL ERROR: Database connection failed.");
      console.error(err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
  }
  start();
}

export default app;
