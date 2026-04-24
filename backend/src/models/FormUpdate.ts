import mongoose from "mongoose";

const formUpdateSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  field: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minute TTL
});

export const FormUpdate = mongoose.models.FormUpdate || mongoose.model("FormUpdate", formUpdateSchema);
