require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  tempDir: 'temp'
};

module.exports = config;
