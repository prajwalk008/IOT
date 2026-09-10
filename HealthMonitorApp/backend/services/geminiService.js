const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


// Generic processor for PDFs, PNGs, JPGs, etc.
async function processDocument(filePath, mimeType) {
  try {
    console.log("🧩 Processing document:", filePath);
    const fileBuffer = fs.readFileSync(path.resolve(filePath));

    const prompt = `
      You are a medical report analyzer.
      Extract and summarize the following from this document:
      - Diseases or diagnoses
      - Allergies
      - Surgeries or operations
      - Medications
      - Key dates
      - Summary of medical history
      Return a valid JSON in this format:
      {
        "diseases": [],
        "allergies": [],
        "operations": [],
        "medications": [],
        "summary": "..."
      }
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: fileBuffer.toString('base64'), mimeType } },
    ]);

    const text = result.response.text();
    console.log("🧠 Gemini raw response:", text);

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("❌ Gemini processing failed:", error.message);
    return { error: error.message };
  }
}

module.exports = { processDocument };
