// summarizePDF.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model reference
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------- CONFIG ----------
const pdfFilePath = path.resolve(__dirname, 'uploads', 'sample.pdf'); // <--- change filename here
const mimeType = 'application/pdf';

// ---------- MAIN FUNCTION ----------
async function summarizePDF() {
  try {
    if (!fs.existsSync(pdfFilePath)) {
      console.error('❌ File not found:', pdfFilePath);
      process.exit(1);
    }

    console.log('📄 Reading file:', pdfFilePath);
    const fileBuffer = fs.readFileSync(pdfFilePath);
    const base64data = fileBuffer.toString('base64');

    console.log('🚀 Sending file to Gemini...');
    const prompt = `
      You are a professional medical report summarizer.
      Analyze the attached PDF and provide a short structured summary with:
      - Main diagnosis or health condition
      - Key lab results or findings
      - Suggested treatments or medications
      - Summary in plain English (3-4 lines)
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64data, mimeType } },
    ]);

    const responseText = result.response.text();

    console.log('\n🧠 GEMINI SUMMARY OUTPUT:\n');
    console.log(responseText);
    console.log('\n✅ Summary generated successfully!');
  } catch (error) {
    console.error('❌ Gemini Processing Error:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  }
}

summarizePDF();
