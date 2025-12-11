require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  tempDir: process.env.TEMP_DIR || 'temp'
};

module.exports = config;
