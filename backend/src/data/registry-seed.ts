import mongoose from "mongoose";
import { FormSchema } from "../models/FormSchema.js";
import { User } from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const SAMPLE_SCHEMAS = [
  {
    name: "PM-Kisan Samman Nidhi",
    description: "Income support scheme for all landholding farmer families in India. Provides ₹6,000 per year in three installments.",
    fields: [
      { key: "aadhaar", label: "Aadhaar Number", type: "text", placeholder: "12-digit Aadhaar", icon: "CreditCard" },
      { key: "khasra_no", label: "Khasra Number", type: "text", placeholder: "Land record number", icon: "Map" },
      { key: "land_size", label: "Land Size (Acres)", type: "number", placeholder: "e.g. 2.5", icon: "Maximize" },
      { key: "bank_acc", label: "Bank Account Number", type: "text", placeholder: "Account for subsidy transfer", icon: "Library" },
      { key: "ifsc", label: "IFSC Code", type: "text", placeholder: "11-character code", icon: "Code" }
    ]
  },
  {
    name: "Kisan Credit Card (KCC)",
    description: "Specialized credit for farmers to meet their agricultural and other needs. Low interest rates and flexible repayment.",
    fields: [
      { key: "full_name", label: "Full Name", type: "text", placeholder: "As per Aadhaar", icon: "User" },
      { key: "crop_type", label: "Primary Crop", type: "select", options: ["Paddy", "Wheat", "Cotton", "Sugarcane", "Other"], icon: "Sprout" },
      { key: "loan_amount", label: "Requested Amount", type: "number", placeholder: "e.g. 50000", icon: "IndianRupee" },
      { key: "village", label: "Village Name", type: "text", placeholder: "Enter your village", icon: "Home" }
    ]
  },
  {
    name: "PDS Ration Card Update",
    description: "Update your family details or register for a new Public Distribution System card for subsidized food grains.",
    fields: [
      { key: "family_head", label: "Family Head Name", type: "text", placeholder: "Eldest female preferred", icon: "Users" },
      { key: "member_count", label: "Total Family Members", type: "number", placeholder: "e.g. 4", icon: "Hash" },
      { key: "income_cert", label: "Annual Income", type: "number", placeholder: "Family income per year", icon: "FileText" },
      { key: "category", label: "Category", type: "select", options: ["BPL (Below Poverty Line)", "APL (Above Poverty Line)", "Antyodaya"], icon: "Tag" }
    ]
  }
];

async function seed() {
  try {
    console.log("🌱 Seeding sample registries...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sahayak");
    
    // Find or create a system user
    let user = await User.findOne({ email: "admin@sahayak.gov.in" });
    if (!user) {
      user = new User({
        email: "admin@sahayak.gov.in",
        password: "hashed_password_here", // Not used for login here
        name: "Sahayak Administrator",
        role: "bank"
      });
      await user.save();
      console.log("👤 Created System Admin user.");
    }

    // Clear existing schemas (optional, but good for clean sample)
    // await FormSchema.deleteMany({});

    for (const schemaData of SAMPLE_SCHEMAS) {
      const existing = await FormSchema.findOne({ name: schemaData.name });
      if (!existing) {
        const schema = new FormSchema({
          ...schemaData,
          createdBy: user._id
        });
        await schema.save();
        console.log(`✅ Seeded registry: ${schemaData.name}`);
      } else {
        console.log(`⏩ Registry already exists: ${schemaData.name}`);
      }
    }

    console.log("\n✨ Registry seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
