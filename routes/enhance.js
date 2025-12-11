const express = require('express');
const router = express.Router();
const { improveText, isConfigured } = require('../services/geminiService');

router.post('/', async (req, res) => {
  const { text, context } = req.body;
  
  if (!isConfigured) {
    return res.status(500).json({ 
      error: "Gemini AI not configured",
      details: "Server missing GEMINI_API_KEY"
    });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ 
      error: "Text is required",
      details: "Please provide text to enhance"
    });
  }

  if (!context || !context.trim()) {
    return res.status(400).json({ 
      error: "Context is required",
      details: "Please provide context for the enhancement"
    });
  }
  
  try {
    const enhancedText = await improveText(text, context);
    res.json({ 
      success: true, 
      data: { 
        originalText: text,
        enhancedText: enhancedText 
      }
    });
  } catch (error) {
    console.error("Gemini enhance API error:", error);
    res.status(500).json({ 
      error: "Failed to enhance text", 
      details: error.message 
    });
  }
});

module.exports = router;
