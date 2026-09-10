const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sex: { type: String },
  age: { type: Number },
  medicalContext: { type: String }, // Gemini processed data
});

module.exports = mongoose.model('User', userSchema);
