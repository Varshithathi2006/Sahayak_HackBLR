/**
 * Vapi Agent Configuration & Creation Script
 *
 * SELF-SUFFICIENT VERSION: Automatically detects your ngrok URL from backend/.env
 *
 * Run this:
 *   npx tsx agent-config.ts
 */

import fs from "fs";
import path from "path";

function getEnvValue(key: string): string | null {
  try {
    const envPath = path.resolve(process.cwd(), "../backend/.env");
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : null;
  } catch (err) {
    return null;
  }
}

const VAPI_API_KEY = process.env.VAPI_API_KEY || getEnvValue("VAPI_API_KEY") || "";
const BACKEND_URL = process.env.BACKEND_URL || getEnvValue("BACKEND_URL") || "http://localhost:4000";

console.log(`📡 Using VAPI_API_KEY: ${VAPI_API_KEY.slice(0, 8)}...`);
console.log(`🔗 Using BACKEND_URL: ${BACKEND_URL}`);

if (!VAPI_API_KEY || VAPI_API_KEY === "your_vapi_api_key_here") {
  console.error("❌ ERROR: VAPI_API_KEY not found in backend/.env or environment.");
  process.exit(1);
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const tools = [
  {
    type: "function",
    function: {
      name: "update_form_field",
      description: "Updates a specific form field in real-time.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: [
              "fullName", "age", "gender", "aadhaarNumber",
              "village", "district", "state",
              "landSizeAcres", "cropType", "irrigationType",
              "annualIncome", "bankAccountNumber", "hasBusiness",
              "businessName", "businessType", "businessIncome",
            ],
          },
          value: { type: "string", description: "The value to set (send as string, e.g. '25' for age)" },
        },
        required: ["field", "value"],
      },
    },
    server: { url: `${BACKEND_URL}/api/webhook/vapi` },
  },
  {
    type: "function",
    function: {
      name: "ask_knowledge_base",
      description: "Fetches info from the Sahayak knowledge base.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
    server: { url: `${BACKEND_URL}/api/webhook/vapi` },
  },
];

// ─── System Prompt ────────────────────────────────────────────────────────────

const systemPrompt = `You are Sahayak, an AI helper helping farmers fill out forms. 
CORE RULE: ALWAYS call update_form_field *immediately* when you extract any piece of information (name, age, etc.). Do NOT wait for the user to confirm everything. Do NOT wait for the end of the conversation. 
Proceed field by field, confirming softly as you go, but ensure the registry is updated in real-time. 
Respond in the language the user is using (Hindi, Kannada, etc.).`;

// ─── Full Assistant Config ────────────────────────────────────────────────────

export const assistantConfig = {
  name: "Sahayak Agri Form Assistant",
  voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
  model: {
    provider: "groq", 
    model: "llama3-70b-8192", 
    systemPrompt,
    tools,
    temperature: 0.3,
  },
  firstMessage: "Namaste! I am Sahayak. May I know your name?",
  serverUrl: `${BACKEND_URL}/api/webhook/vapi`,
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "multi",
    smartFormat: true,
  },
};

// ─── Create Assistant via Vapi REST API ───────────────────────────────────────

async function createAssistant() {
  try {
    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assistantConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi API error ${response.status}: ${error}`);
    }

    const assistant = await response.json() as { id: string; name: string };
    console.log("✅ Vapi assistant created successfully!\n");
    console.log(`   Assistant ID: ${assistant.id}`);
    console.log(`   Name: ${assistant.name}`);
    console.log("\n📋 IMPORTANT: Copy the ID below and restart your frontend dev server.");
    console.log(`   NEXT_PUBLIC_VAPI_ASSISTANT_ID=${assistant.id}`);
  } catch (err) {
    console.error("❌ Failed to create assistant:", err);
  }
}

createAssistant();
