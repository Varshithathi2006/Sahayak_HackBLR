import mongoose from 'mongoose';

async function updateVotersSchema() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/sahayak');
    console.log("Connected to MongoDB");

    const SchemaModel = mongoose.model('FormSchema', new mongoose.Schema({}, { strict: false }));
    
    const voters = await SchemaModel.findOne({ name: /voters/i });
    if (!voters) {
      console.log("Voters schema not found");
      process.exit(1);
    }

    const newFields = [
      ...voters.fields,
      {
        key: "aadhaarNumber",
        label: "Aadhaar Number",
        type: "number",
        placeholder: "1234 5678 9012",
        icon: "fingerprint"
      },
      {
        key: "phone",
        label: "Phone Number",
        type: "number",
        placeholder: "9876543210",
        icon: "phone"
      },
      {
        key: "district",
        label: "District",
        type: "text",
        placeholder: "e.g. Bangalore Urban",
        icon: "map-pin"
      },
      {
        key: "village",
        label: "Village/Town",
        type: "text",
        placeholder: "e.g. Hebbal",
        icon: "home"
      }
    ];

    await SchemaModel.updateOne(
      { _id: voters._id },
      { $set: { fields: newFields } }
    );

    console.log("✅ Voters schema updated with new fields!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateVotersSchema();
