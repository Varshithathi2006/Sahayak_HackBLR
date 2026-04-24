/**
 * Simple in-memory cache for embeddings to reduce OpenAI API calls.
 * In a production environment, this could be replaced with Redis.
 */

const embeddingCache = new Map<string, number[]>();

export function getCachedEmbedding(text: string): number[] | null {
  const normalized = text.trim().toLowerCase();
  return embeddingCache.get(normalized) || null;
}

export function setCachedEmbedding(text: string, vector: number[]): void {
  const normalized = text.trim().toLowerCase();
  embeddingCache.set(normalized, vector);
  
  // Basic memory management: Clear cache if it exceeds 5000 entries
  if (embeddingCache.size > 5000) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) {
      embeddingCache.delete(firstKey);
    }
  }
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
