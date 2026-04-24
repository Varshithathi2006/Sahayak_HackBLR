import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "number", "boolean", "select"], required: true },
  options: [String], // For select type
  placeholder: String,
  icon: String,
});

const formSchemaDefinition = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  fields: [fieldSchema],
  documents: [{
    fileName: String,
    qdrantId: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FormSchema = mongoose.model("FormSchema", formSchemaDefinition);
