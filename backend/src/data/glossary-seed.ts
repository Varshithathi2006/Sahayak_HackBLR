import { qdrantClient, COLLECTION_GLOSSARY } from "../services/qdrant.js";
import { getEmbedding } from "../services/vectorService.js";
import type { GlossaryEntry } from "../types.js";
import dotenv from "dotenv";
dotenv.config();

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: "APR",
    simpleExplanation:
      "APR stands for Annual Percentage Rate. It tells you how much extra money you pay back in one full year when you borrow money. For example, if you borrow ₹1,000 at 12% APR, you pay back ₹1,120 at the end of the year.",
    example: "₹1,000 borrowed at 12% APR → pay back ₹1,120 after one year",
  },
  {
    term: "collateral",
    simpleExplanation:
      "Collateral is something valuable — like your land, gold, or a vehicle — that you promise to give the bank if you cannot repay the loan. It is security for the lender. If you repay the loan fully, you keep your asset.",
    example: "Promising your 2-acre farm as security for a ₹50,000 loan",
  },
  {
    term: "KYC",
    simpleExplanation:
      "KYC means Know Your Customer. It is a process where the bank or government office checks your identity using your Aadhaar card, PAN card, or voter ID. It just means proving who you are.",
    example: "Showing your Aadhaar card at the bank counter",
  },
  {
    term: "subsidy",
    simpleExplanation:
      "A subsidy is extra money the government gives you to reduce your cost. For example, if a bag of fertilizer costs ₹1,000, the government might pay ₹400 on your behalf, so you only pay ₹600.",
    example: "Government paying part of your fertilizer cost",
  },
  {
    term: "microfinance",
    simpleExplanation:
      "Microfinance means very small loans given to poor families or farmers who cannot access regular banks. The loans are small — maybe ₹5,000 to ₹50,000 — and you repay in small weekly or monthly amounts.",
    example: "A ₹10,000 loan with ₹500 monthly repayments",
  },
  {
    term: "interest rate",
    simpleExplanation:
      "Interest rate is the extra amount you pay for borrowing money. If the interest rate is 10%, and you borrowed ₹1,000, you pay ₹100 extra. Higher rate means you pay back more.",
    example: "Borrowing ₹1,000 at 10% → pay ₹100 more = ₹1,100 total",
  },
  {
    term: "IFSC code",
    simpleExplanation:
      "IFSC code is like your bank branch's address in numbers and letters. Every bank branch in India has a unique 11-character IFSC code. You need it to receive money transfers directly to your account.",
    example: "SBIN0001234 is an SBI branch IFSC code",
  },
  {
    term: "PM Kisan",
    simpleExplanation:
      "PM Kisan is a government scheme where farmer families with small land receive ₹6,000 per year — sent in three equal payments of ₹2,000 directly to their bank account.",
    example: "Three payments of ₹2,000 every 4 months",
  },
  {
    term: "crop insurance",
    simpleExplanation:
      "Crop insurance protects you if your crop is damaged by floods, drought, or pests. You pay a small premium, and if your crop fails, the government or insurance company pays you compensation.",
    example: "Paying ₹200 to protect a ₹20,000 crop from monsoon failure",
  },
  {
    term: "beneficiary",
    simpleExplanation:
      "A beneficiary is the person who receives the money or benefit from a scheme. When you apply for a government scheme, you are the beneficiary — the scheme is helping you.",
    example: "You are the beneficiary when you receive PM Kisan money",
  },
  {
    term: "khasra number",
    simpleExplanation:
      "Khasra number is a special number given to your piece of agricultural land by the government. It is like a house number but for your farm. You find it on your land records (khatauni).",
    example: "Khasra No. 456 identifies your specific farm plot",
  },
  {
    term: "income certificate",
    simpleExplanation:
      "An income certificate is an official document issued by a government officer (Tehsildar) that confirms how much money your family earns in a year. Many subsidy schemes require this to check if you qualify.",
    example: "Certificate saying your annual income is ₹80,000",
  },
  {
    term: "SHG",
    simpleExplanation:
      "SHG stands for Self-Help Group. It is a group of 10 to 20 people — usually women — from the same village who save money together every month and give small loans to each other when needed.",
    example: "20 women each saving ₹100 per month, then lending to members in need",
  },
  {
    term: "EMI",
    simpleExplanation:
      "EMI means Equated Monthly Installment. It is the fixed amount you pay every month to repay your loan. The bank calculates one easy amount that includes a portion of the loan and interest.",
    example: "A ₹60,000 loan at 12% over 12 months → ₹5,333 EMI per month",
  },
  {
    term: "bank passbook",
    simpleExplanation:
      "A bank passbook is a small booklet given by the bank. It records every money you put in and take out. It also shows your account number. You often need to show it when applying for government schemes.",
    example: "Taking your passbook to the gram panchayat office as proof of account",
  },
];

async function seedGlossary() {
  console.log("🌱 Seeding glossary terms into Qdrant...\n");
  let successCount = 0;

  for (let i = 0; i < GLOSSARY_ENTRIES.length; i++) {
    const entry = GLOSSARY_ENTRIES[i];
    try {
      const text = `${entry.term}: ${entry.simpleExplanation}`;
      const vector = await getEmbedding(text);

      await qdrantClient.upsert(COLLECTION_GLOSSARY, {
        points: [
          {
            id: i + 1,
            vector,
            payload: {
              term: entry.term,
              simpleExplanation: entry.simpleExplanation,
              example: entry.example || "",
            },
          },
        ],
      });
      console.log(`  ✅ [${i + 1}/${GLOSSARY_ENTRIES.length}] Seeded: "${entry.term}"`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed to seed "${entry.term}":`, err);
    }
  }

  console.log(`\n✅ Seeding complete: ${successCount}/${GLOSSARY_ENTRIES.length} terms upserted.`);
  process.exit(0);
}

seedGlossary().catch((err) => {
  console.error("Fatal seeding error:", err);
  process.exit(1);
});
