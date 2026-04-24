import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const COLLECTION_GLOSSARY = process.env.QDRANT_COLLECTION_GLOSSARY || "terms_glossary";
const COLLECTION_KNOWLEDGE = process.env.QDRANT_COLLECTION_KNOWLEDGE || "knowledge_base";
const COLLECTION_MEMORY = process.env.QDRANT_COLLECTION_MEMORY || "user_memory";
const VECTOR_SIZE = 384; // Xenova/all-MiniLM-L6-v2 (Local Modeling)

export const qdrantClient = new QdrantClient({ 
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

export async function initCollections(): Promise<void> {
  const existing = await qdrantClient.getCollections();
  const names = existing.collections.map((c) => c.name);

  // Initialize all required collections
  const collections = [COLLECTION_GLOSSARY, COLLECTION_KNOWLEDGE, COLLECTION_MEMORY];

  for (const name of collections) {
    if (!names.includes(name)) {
      await createAndInit(name);
    } else {
      // Check dimensions
      const info = await qdrantClient.getCollection(name);
      const existingSize = (info.config.params.vectors as any).size;
      if (existingSize !== VECTOR_SIZE) {
        console.log(`⚠️ Dimension mismatch in ${name} (${existingSize} != ${VECTOR_SIZE}). Recreating...`);
        await qdrantClient.deleteCollection(name);
        await createAndInit(name);
      } else {
        console.log(`✔ Collection exists with correct dimensions: ${name}`);
      }
    }
  }
}

async function createAndInit(name: string) {
  await qdrantClient.createCollection(name, {
    vectors: {
      size: VECTOR_SIZE,
      distance: "Cosine",
    },
  });
  console.log(`✅ Created collection: ${name}`);
}

export { COLLECTION_GLOSSARY, COLLECTION_KNOWLEDGE, COLLECTION_MEMORY };
