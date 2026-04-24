import { qdrantClient, COLLECTION_KNOWLEDGE } from "../services/qdrant.js";
import { getEmbedding } from "../services/vectorService.js";
import dotenv from "dotenv";
dotenv.config();

const KNOWLEDGE_DOCS = [
  {
    title: "About Sahayak & NeuroNova",
    content: "Sahayak is an AI CASeworker designed to help rural families and farmers in India access financial services. It works alongside NeuroNova, a voice-based banking platform, to simplify complex government forms and microfinance applications through natural conversation in local languages.",
  },
  {
    title: "Microfinance Basics",
    content: "Microfinance refers to small-scale financial services, primarily loans, provided to individuals or small businesses who lack access to conventional banking. Loans typically range from ₹5,000 to ₹1,00,000 and are used for income-generating activities like buying seeds, livestock, or setting up a small shop.",
  },
  {
    title: "Understanding Aadhaar in Banking",
    content: "Aadhaar is a 12-digit unique identity number issued by UIDAI. In banking, it is used for e-KYC (Electronic Know Your Customer), allowing you to open bank accounts and receive government subsidies (DBT) directly without building up physical paperwork.",
  },
  {
    title: "PM-Kisan Scheme Details",
    content: "Under the PM-Kisan scheme, small and marginal farmer families receive ₹6,000 per year in three installments of ₹2,000 every four months. The money is transferred directly to the Aadhaar-linked bank account of the beneficiary.",
  },
  {
    title: "Crop Insurance - PMFBY",
    content: "Pradhan Mantri Fasal Bima Yojana (PMFBY) is a government-sponsored crop insurance scheme. It provides financial support to farmers in case of crop failure due to natural calamities, pests, or diseases. Farmers pay a very low premium (1.5% to 5%) while the government covers the rest.",
  },
  {
    title: "Kisan Credit Card (KCC)",
    content: "Theisan Credit Card (KCC) scheme provides farmers with timely credit for their cultivation needs as well as non-farm activities. It offers lower interest rates (as low as 4% after government subvention) compared to traditional moneylenders.",
  },
  {
    title: "Digital Security Tips",
    content: "Never share your Bank OTP, PIN, or Aadhaar OTP with anyone over the phone. NeuroNova and Sahayak will never ask for your secret PIN. Always verify that you are speaking to the official assistant before sharing personal details.",
  },
  {
    title: "Loan Repayment & EMI",
    content: "Repaying your loan on time is crucial for building a good credit score. A good score helps you get larger loans in the future at lower interest rates. EMI (Equated Monthly Installment) is the fixed amount you pay back each month.",
  },
  {
    title: "Self-Help Groups (SHG) Benefits",
    content: "Self-Help Groups are village-level financial committees usually made of 10-20 local women. Members save small amounts regularly and provide low-interest loans to each other for emergencies or starting small businesses like tailoring or dairy farming.",
  },
  {
    title: "Irrigation Subsidies",
    content: "The government provides subsidies for installing drip irrigation, sprinklers, and solar pumps through schemes like PM-KUSUM. This reduces the dependency on monsoon rains and lowers electricity costs for farmers.",
  },
];

async function seedKnowledge() {
  console.log("🌱 Seeding general knowledge base into Qdrant...\n");
  let successCount = 0;

  for (let i = 0; i < KNOWLEDGE_DOCS.length; i++) {
    const doc = KNOWLEDGE_DOCS[i];
    try {
      const text = `${doc.title}: ${doc.content}`;
      const vector = await getEmbedding(text);

      await qdrantClient.upsert(COLLECTION_KNOWLEDGE, {
        points: [
          {
            id: i + 1,
            vector,
            payload: {
              title: doc.title,
              content: doc.content,
            },
          },
        ],
      });
      console.log(`  ✅ [${i + 1}/${KNOWLEDGE_DOCS.length}] Seeded: "${doc.title}"`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed to seed "${doc.title}":`, err);
    }
  }

  console.log(`\n✅ Seeding complete: ${successCount}/${KNOWLEDGE_DOCS.length} documents upserted.`);
  process.exit(0);
}

seedKnowledge().catch((err) => {
  console.error("Fatal seeding error:", err);
  process.exit(1);
});
