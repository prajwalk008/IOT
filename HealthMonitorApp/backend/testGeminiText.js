require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use the latest working model name
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
// you can also try 'gemini-1.5-pro' or 'gemini-2.0-flash' if supported

async function testGemini() {
  try {
    console.log('🚀 Sending test prompt to Gemini...');
    
    const prompt = "Summarize this text: Artificial Intelligence is transforming industries across the globe.";
    
    const result = await model.generateContent(prompt);
    
    console.log('\n🧠 GEMINI RESPONSE:\n');
    console.log(result.response.text());
    
    console.log('\n✅ Gemini API is working!');
  } catch (error) {
    console.error('\n❌ Gemini API Error:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  }
}

testGemini();
