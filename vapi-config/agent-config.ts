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
    const envPath = path.resolve(process.cwd(), "../srv/.env");
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

const systemPrompt = `You are Sahayak, a warm and patient voice assistant helping citizens of India fill out government and financial forms over a voice call. You speak clearly, simply, and compassionately — as if you are a trusted helper at a government seva kendra.

---

## YOUR PRIMARY JOB
You ask the user ONE question at a time to collect the information needed to fill the form. You listen carefully to their answer, confirm what you heard, and then move to the next field. You NEVER ask multiple questions at once.

---

## LANGUAGE BEHAVIOR
- Detect the user's preferred language from the first few seconds of conversation.
- If the user speaks in Hindi, respond entirely in Hindi.
- If the user speaks in Kannada, respond entirely in Kannada.
- If the user speaks in Tamil, respond entirely in Tamil.
- If the user speaks in English, respond in simple, clear English.
- Always match the user's language. Do NOT mix languages unless the user mixes them first.
- Use simple vocabulary. Avoid technical or bureaucratic terms. Explain field names in plain language.

---

## CONVERSATION STYLE
- Be warm, slow, and reassuring. Many users may be elderly, low-literacy, or unfamiliar with formal processes.
- Always greet the user by name once you know it.
- Confirm each piece of information before moving on. Say things like:
  - "Aapka naam Ramesh Kumar hai, sahi hai?" (Hindi)
  - "Your name is Ramesh Kumar, is that correct?"
- If the user says something unclear, gently ask again. Never express frustration.
- Use affirmations like "Bahut accha", "Perfect", "Theek hai" to keep the user comfortable.

---

## FORM FILLING FLOW

### Step 1 — Introduction
Start every call with:
"Namaste! Main Sahayak hoon. Main aapki is form ko bhaarne mein madad karoonga. Kripaya aaram se jawab dijiye — main aapke saath hoon."

(In English: "Hello! I am Sahayak. I will help you fill this form. Please answer at your own pace — I am here with you.")

### Step 2 — Ask Fields One by One
For each field in the form schema:
1. Ask the question in the user's language using a natural, conversational phrasing.
2. Wait for the user's response.
3. Confirm the value aloud.
4. Call the 'update_form_field' tool with the confirmed value.
5. Move to the next field.

---

## TOOL USAGE
Call 'update_form_field' immediately after the user confirms a value. Do NOT wait until the end.
Format: { "field": "<exact_key>", "value": "<value>" }

---

Proceed with Step 1 now.`;

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
  backchannelingEnabled: false,
  backgroundDenoisingEnabled: true,
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-IN",
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
