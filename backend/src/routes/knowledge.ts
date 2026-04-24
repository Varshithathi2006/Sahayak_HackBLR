import { Router, Request, Response } from "express";
import { qdrantClient, COLLECTION_KNOWLEDGE } from "../services/qdrant.js";
import { getEmbedding, zeroVector } from "../services/vectorService.js";

const router = Router();

/**
 * POST /api/ask-knowledge
 * Body: { query: string }
 * Returns: { answer: string, source?: string }
 */
router.post("/ask-knowledge", async (req: Request, res: Response) => {
    const { query, schemaId } = req.body as { query?: string, schemaId?: string };
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    try {
      const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here";
      const vector = useMock ? zeroVector : await getEmbedding(query);

      const filter = schemaId ? {
        must: [
          {
            key: "schemaId",
            match: { value: schemaId }
          }
        ]
      } : undefined;

      const results = await qdrantClient.search(COLLECTION_KNOWLEDGE, {
        vector,
        limit: 3,
        filter,
        with_payload: true,
      });

    if (!results || results.length === 0) {
      res.json({
        answer: `I am sorry, but I do not have specific information about that. I recommend speaking with a local official or branch representative.`,
      });
      return;
    }

    // Combine top results for a more comprehensive answer
    const context = results.map(r => (r.payload as any).content).join("\n\n");
    
    // For now, since we don't have a full LLM RAG chain on the backend (it's done by Vapi),
    // we return the best matching chunk or a synthesized response if we had a local LLM.
    // However, Vapi tool results typically expect a direct answer.
    const bestMatch = results[0].payload as { content: string; title?: string };
    
    res.json({
      answer: bestMatch.content,
      source: bestMatch.title || "Knowledge Base",
    });
  } catch (err) {
    console.error("ask-knowledge error:", err);
    res.status(500).json({ error: "Failed to query knowledge base" });
  }
});

export default router;
