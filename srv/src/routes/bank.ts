import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { FormSchema } from "../models/FormSchema.js";
import { Submission } from "../models/Submission.js";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";
import { qdrantClient, COLLECTION_KNOWLEDGE } from "../services/qdrant.js";
import { getEmbedding } from "../services/vectorService.js";
import fs from "fs";
import crypto from "crypto";

const router = Router();
const upload = multer({ dest: "uploads/" });

/**
 * GET /api/bank/schemas
 * List schemas created by the bank user
 */
router.get("/schemas", authenticate, authorize(["bank"]), async (req: AuthRequest, res: Response) => {
  try {
    const schemas = await FormSchema.find({ createdBy: req.user?.id });
    res.json(schemas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bank/schemas
 * Create a new form schema
 */
router.post("/schemas", authenticate, authorize(["bank"]), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, fields } = req.body;
    const schema = new FormSchema({
      name,
      description,
      fields,
      createdBy: req.user?.id,
    });
    await schema.save();
    res.status(201).json(schema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/bank/schemas/:id
 * Update an existing form schema
 */
router.patch("/schemas/:id", authenticate, authorize(["bank"]), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, fields } = req.body;
    const schema = await FormSchema.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { name, description, fields, updatedAt: new Date() },
      { new: true }
    );
    if (!schema) return res.status(404).json({ error: "Schema not found" });
    res.json(schema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/bank/schemas/:id
 * Delete a form schema
 */
router.delete("/schemas/:id", authenticate, authorize(["bank"]), async (req: AuthRequest, res: Response) => {
  try {
    const schema = await FormSchema.findByIdAndDelete(new mongoose.Types.ObjectId(req.params.id));
    if (!schema) return res.status(404).json({ error: "Schema not found" });
    res.json({ success: true, message: "Schema deleted" });
  } catch (err: any) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
});

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

/**
 * POST /api/bank/schemas/:id/documents
 * Upload a document for RAG processing
 */
router.post("/schemas/:id/documents", authenticate, authorize(["bank"]), upload.single("document"), async (req: AuthRequest, res: Response) => {
  try {
    const schemaId = req.params.id;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const schema = await FormSchema.findById(schemaId);
    if (!schema) {
      res.status(404).json({ error: "Schema not found" });
      return;
    }

    // Process file (Extract text)
    let content = "";
    if (file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdf(dataBuffer);
      content = data.text;
    } else {
      content = fs.readFileSync(file.path, "utf-8");
    }

    // Simple chunking
    const chunks = content.split("\n\n").filter(c => c.trim().length > 10);
    
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      await qdrantClient.upsert(COLLECTION_KNOWLEDGE, {
        points: [{
          id: crypto.randomUUID(),
          vector: embedding,
          payload: {
            content: chunk,
            schemaId: schemaId,
            title: file.originalname,
          }
        }]
      });
    }

    schema.documents.push({
      fileName: file.originalname,
      qdrantId: schemaId,
    });
    await schema.save();

    res.json({ success: true, fileName: file.originalname });
  } catch (err: any) {
    console.error("Document upload error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

/**
 * GET /api/bank/submissions
 * List all submissions for schemas created by this bank user.
 * Falls back to ALL submissions if this bank user has no schemas (e.g. demo / seed scenario).
 */
router.get("/submissions", authenticate, authorize(["bank"]), async (req: AuthRequest, res: Response) => {
  try {
    const schemas = await FormSchema.find({ createdBy: req.user?.id }).select("_id");
    const schemaIds = schemas.map(s => s._id);

    // If this bank user has no schemas (e.g. using a different account than the seed admin),
    // return ALL submissions so the dashboard is never empty in demo mode.
    const filter = schemaIds.length > 0 ? { schemaId: { $in: schemaIds } } : {};

    const submissions = await Submission.find(filter)
      .populate("userId", "name email")
      .populate("schemaId", "name fields")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * PATCH /api/bank/submissions/:id
 * Approve/Reject a submission
 */
router.patch("/submissions/:id", authenticate, authorize(["bank"]), async (req: Request, res: Response) => {
  try {
    const { status, bankComment } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status, bankComment, updatedAt: new Date() },
      { new: true }
    );
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
