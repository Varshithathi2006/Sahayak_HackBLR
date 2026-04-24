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
  const { assistantId, fields, name, description } = _req.body;
  const vapiKey = process.env.VAPI_API_KEY;
  const backendUrl = process.env.BACKEND_URL;

  if (!assistantId || !vapiKey || !backendUrl) {
    return res.status(400).json({ error: "Missing config" });
  }

  const webhookUrl = `${backendUrl}/api/webhook/vapi`;
  const fieldEnums = fields ? fields.map((f: any) => f.key) : [];

  try {
    const getResp = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: { Authorization: `Bearer ${vapiKey}` },
    });
    const assistant = await getResp.json() as any;

    const systemPrompt = `You are NeuroNova, an AI helper helping users fill out the "${name}" form. 
CORE RULE: ALWAYS call update_form_field *immediately* when you extract any piece of information. 
Available fields: ${fieldEnums.join(", ")}.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "update_form_field",
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

    await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${vapiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ serverUrl: webhookUrl, model: { ...assistant.model, systemPrompt, tools } }),
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
