const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Received process request for userId:', userId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Take one PDF file for test
    const sampleFile = fs.readdirSync(path.join(__dirname, '../uploads'))[0];
    if (!sampleFile) return res.status(400).json({ message: 'No files found to process' });

    const pdfPath = path.join(__dirname, '../uploads', sampleFile);
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64data = fileBuffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    You are a medical AI assistant.
    Summarize this patient's medical history document in structured form:
    - Main diagnosis
    - Key findings
    - Medications
    - Recommendations
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64data, mimeType: 'application/pdf' } },
    ]);

    const summary = result.response.text();
    user.medicalContext = summary;
    await user.save();

    console.log('✅ Processed and saved summary for', user.name);
    res.json({ success: true, message: 'Gemini processed successfully', summary });
  } catch (error) {
    console.error('Gemini Processing Error:', error);
    res.status(500).json({ message: 'Gemini processing failed' });
  }
});

module.exports = router;
