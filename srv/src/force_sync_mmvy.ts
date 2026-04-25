// Using global fetch from Node 22

const VAPI_API_KEY = "f876ac72-c51f-4e36-8fdb-aa4d122aa310";
const ASSISTANT_ID = "f8e91536-c40e-4df3-b393-c17e71020100";
const WEBHOOK_URL = "https://31bb-122-171-18-80.ngrok-free.app/api/webhook/vapi";

async function forceUpdateMMVY() {
  const systemPrompt = `You are Sahayak, a warm and patient voice assistant helping citizens of India fill out government and financial forms.

---

## YOUR PRIMARY JOB
Follow this 3-phase flow strictly for the Mukhyamantri Medhavi Vidyarthi Yojana (MMVY).

PHASE 1 — POLICY BRIEFING (30 seconds max)
GREET the user. Explain MMVY:
1. Eligibility: 70% (MP Board) or 85% (CBSE) in 12th.
2. Benefit: Full tuition fee coverage.
3. Condition: Family income < 6 Lakhs.

PHASE 2 — USER CONSENT
Ask: "Kya aap samjhe? Aur kya aap is yojana ke liye apply karna chahte hain?"
Proceed ONLY if they say YES.

PHASE 3 — FORM FILLING (ONE FIELD AT A TIME)
ONLY ask for these 6 fields in this order:
1. residency (e.g. MP Resident?)
2. class_12_marks (Percentage)
3. _family_income (Annual income in Rupees)
4. course_enrollment (Which course or college?)
5. entrance_exam_ (JEE/NEET/CLAT rank if applicable)
6. identification (Aadhaar or Samagra ID)

---

## CONCISENESS RULE
- Do NOT ask for name, age, or location unless listed above.
- Be extremely brief. Once a value is heard, confirm it in 3 words and call the tool.
- Move to the next field immediately.

---

## TOOL USAGE
Call 'update_form_field' for EVERY field above.
Format: { "field": "<exact_key>", "value": "<value>" }

Proceed with Phase 1 now.`;

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      firstMessage: "Namaste! Main Sahayak hoon — aapka digital sahayak. Kya aap Hindi mein baat karna chahenge, ya English mein?",
      voice: {
        provider: "rime",
        voiceId: "hero"
      },
      model: {
        provider: "groq",
        model: "llama3-70b-8192",
        systemPrompt: systemPrompt,
        temperature: 0.1
      },
      serverUrl: WEBHOOK_URL
    })
  });

  if (response.ok) {
    console.log("✅ Sahayak is now strictly focused on MMVY fields only!");
  } else {
    const err = await response.text();
    console.error("❌ Failed to update:", err);
  }
}

forceUpdateMMVY();
