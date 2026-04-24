import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  schemaId: { type: mongoose.Schema.Types.ObjectId, ref: "FormSchema", required: true },
  data: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  bankComment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Submission = mongoose.model("Submission", submissionSchema);
