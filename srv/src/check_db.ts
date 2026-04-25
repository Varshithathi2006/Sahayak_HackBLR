import mongoose from 'mongoose';

async function checkSchemas() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sahayak');
  const SchemaModel = mongoose.model('FormSchema', new mongoose.Schema({}, { strict: false }));
  const schemas = await SchemaModel.find({});
  console.log(JSON.stringify(schemas, null, 2));
  process.exit();
}

checkSchemas();
