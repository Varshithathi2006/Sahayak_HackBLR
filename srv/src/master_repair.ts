// Using global fetch from Node 22

const VAPI_API_KEY = "f876ac72-c51f-4e36-8fdb-aa4d122aa310";
const ASSISTANT_ID = "f8e91536-c40e-4df3-b393-c17e71020100";
const WEBHOOK_URL = "https://31bb-122-171-18-80.ngrok-free.app/api/webhook/vapi";

async function masterRepair() {
  const systemPrompt = `You are Sahayak, a high-performance voice assistant. 

---

## YOUR PRIMARY JOB
1. Describe the MMVY scheme briefly.
2. Ask for consent.
3. Once approved, collect exactly these 6 fields.

## FIELDS & KEYS (STRICT ADHERENCE REQUIRED)
- Residency: 'residency'
- Class 12 Marks: 'class_12_marks'
- Family Income: '_family_income'
- Course Enrollment: 'course_enrollment'
- Entrance Exam: 'entrance_exam_'
- Identification: 'identification'

## TOOL USAGE RULE
CRITICAL: You MUST call the 'update_form_field' tool IMMEDIATELY after the user provides a value. 
Confirm softly ("Got it") and call the tool at the SAME TIME.

---

Proceed with briefing now.`;

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
              enum: ["residency", "class_12_marks", "_family_income", "course_enrollment", "entrance_exam_", "identification"] 
            },
            value: { type: "string" },
          },
          required: ["field", "value"],
        },
      },
      server: { url: WEBHOOK_URL }
    }
  ];

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      voice: {
        provider: "vapi",
        voiceId: "Rohan"
      },
      model: {
        provider: "groq",
        model: "llama3-70b-8192",
        systemPrompt: systemPrompt,
        temperature: 0.1,
        tools: tools
      }
    })
  });

  if (response.ok) {
    console.log("✅ MASTER REPAIR COMPLETE: Tools reconnected and keys synchronized!");
  } else {
    const err = await response.text();
    console.error("❌ Repair Failed:", err);
  }
}

masterRepair();
