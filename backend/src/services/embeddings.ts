import { getCachedEmbedding, setCachedEmbedding } from "./cache.js";

/**
 * Local Embedding Engine (Transformers.js)
 * Uses Xenova/all-MiniLM-L6-v2 (384 dimensions)
 */

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    console.log("📥 Loading local embedding model (Xenova/all-MiniLM-L6-v2)...");
    
    // VERCEL CRITICAL FIX: Use eval('import') to bypass transpilers that 
    // convert dynamic imports back to require(), which causes the ERR_REQUIRE_ESM crash.
    const { pipeline, env } = await (eval('import("@xenova/transformers")') as Promise<any>);
    
    // Configure cache for /tmp
    env.cacheDir = "/tmp/.transformers_cache";
    env.allowRemoteModels = true;
    
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Local model loaded.");
  }
  return extractor;
}

/**
 * Generate an embedding vector for the given text using local Transformers.js.
 * Zero OpenAI credits required.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  
  // Check cache first to save CPU
  const cached = getCachedEmbedding(cleanText);
  if (cached) {
    console.log(`[Cache Hit] Serving local embedding for: "${cleanText.substring(0, 20)}..."`);
    return cached;
  }

  try {
    const pipe = await getExtractor();
    const output = await pipe(cleanText, { pooling: "mean", normalize: true });
    
    // Convert Float32Array to number[]
    const vector = Array.from(output.data) as number[];
    
    // Store in cache
    setCachedEmbedding(cleanText, vector);
    
    return vector;
  } catch (err: any) {
    console.error("Local Embedding Error:", err?.message || err);
    throw new Error("Critical Failure: Unable to generate local embedding.");
  }
}

/**
 * Fallback 384-dimensional zero vector for cases where search fails.
 */
export const zeroVector = new Array(384).fill(0);
