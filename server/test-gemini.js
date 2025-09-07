const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say hello in one sentence',
    });
    console.log('Success! Response:', response.text);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

test();