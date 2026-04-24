import { Router, Request, Response } from "express";
import { qdrantClient, COLLECTION_MEMORY } from "../services/qdrant.js";
import { getEmbedding, zeroVector } from "../services/vectorService.js";
import type { UserProfile, AgriSubsidyForm } from "../types.js";

const router = Router();

/**
 * POST /api/user-memory/save
 */
router.post("/save", async (req: Request, res: Response) => {
  const { userId, form } = req.body as { userId?: string; form?: Partial<AgriSubsidyForm> };
  if (!userId || !form) {
    res.status(400).json({ error: "userId and form are required" });
    return;
  }

  try {
    const profileText = buildProfileText(form);
    const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here";
    const vector = useMock ? zeroVector : await getEmbedding(profileText);

    const profile: UserProfile = {
      userId,
      form,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const numericId = Math.abs(hashCode(userId));

    await qdrantClient.upsert(COLLECTION_MEMORY, {
      points: [
        {
          id: numericId,
          vector,
          payload: profile as unknown as Record<string, unknown>,
        },
      ],
    });

    res.json({ success: true, userId });
  } catch (err) {
    console.error("user-memory save error:", err);
    res.status(500).json({ error: "Failed to save user memory" });
  }
});

/**
 * GET /api/user-memory/:userId
 */
router.get("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here";
    const vector = useMock ? zeroVector : await getEmbedding(`User ID: ${userId}`);

    const results = await qdrantClient.search(COLLECTION_MEMORY, {
      vector,
      limit: 1,
      with_payload: true,
    });

    if (!results || results.length === 0 || (results[0].score ?? 0) < 0.7) {
      res.json({ found: false, profile: null });
      return;
    }

    const profile = results[0].payload as unknown as UserProfile;
    if (profile.userId !== userId) {
      res.json({ found: false, profile: null });
      return;
    }

    res.json({ found: true, profile });
  } catch (err) {
    console.error("user-memory retrieve error:", err);
    res.status(500).json({ error: "Failed to retrieve user memory" });
  }
});

function buildProfileText(form: Partial<AgriSubsidyForm>): string {
  const parts: string[] = [];
  if (form.fullName) parts.push(`Name: ${form.fullName}`);
  if (form.village) parts.push(`Village: ${form.village}`);
  if (form.district) parts.push(`District: ${form.district}`);
  if (form.state) parts.push(`State: ${form.state}`);
  if (form.cropType) parts.push(`Crop: ${form.cropType}`);
  if (form.landSizeAcres) parts.push(`Land: ${form.landSizeAcres} acres`);
  if (form.annualIncome) parts.push(`Income: ₹${form.annualIncome}`);
  return parts.join(", ") || "New user";
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

export default router;
