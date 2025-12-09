const express = require('express');
const router = express.Router();
const { generateCV, isConfigured } = require('../services/geminiService');

router.post('/', async (req, res) => {
  const { jobTitle } = req.body;
  
  if (!isConfigured) {
    return res.status(500).json({ 
      error: "Gemini AI not configured",
      details: "Server missing GEMINI_API_KEY"
    });
  }
  
  try {
    const cvData = await generateCV(jobTitle);
    res.json({ 
      success: true, 
      data: cvData 
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ 
      error: "Failed to generate CV data", 
      details: error.message 
    });
  }
});

module.exports = router;
