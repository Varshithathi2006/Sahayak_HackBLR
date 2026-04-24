require("dotenv").config();

async function checkAssistant() {
  const vapiKey = process.env.VAPI_API_KEY;
  const assistantId = "7c116dd7-282e-4edf-8b6a-cb0bcf735ef1";

  if (!vapiKey) {
    console.error("VAPI_API_KEY is missing");
    return;
  }

  try {
    const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: { Authorization: `Bearer ${vapiKey}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkAssistant();
