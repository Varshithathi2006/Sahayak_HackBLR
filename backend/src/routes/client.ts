import { Router, Request, Response } from "express";
import { FormSchema } from "../models/FormSchema.js";
import { Submission } from "../models/Submission.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/client/schemas
 * List all available schemas for clients
 */
router.get("/schemas", authenticate, async (req: Request, res: Response) => {
  try {
    const schemas = await FormSchema.find().select("name description createdAt");
    res.json(schemas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/client/schemas/:id
 */
router.get("/schemas/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const schema = await FormSchema.findById(req.params.id);
    if (!schema) {
      res.status(404).json({ error: "Schema not found" });
      return;
    }
    res.json(schema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/client/submissions
 * Submit form data
 */
router.post("/submissions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { schemaId, data } = req.body;
    const submission = new Submission({
      userId: req.user?.id,
      schemaId,
      data,
      status: "pending",
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
