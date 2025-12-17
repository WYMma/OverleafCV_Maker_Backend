const express = require('express');
const router = express.Router();
const { generateSampleCV, isConfigured } = require('../services/geminiService');

router.post('/', async (req, res) => {
  const { jobTitle } = req.body;

  if (!isConfigured) {
    return res.status(500).json({
      error: "Gemini AI not configured",
      details: "Server missing GEMINI_API_KEY"
    });
  }

  try {
    const cvData = await generateSampleCV(jobTitle);
    res.json({
      success: true,
      data: cvData
    });
  } catch (error) {
    console.error("Gemini API error in generate-cv:", error); // Explicit log
    res.status(500).json({
      error: "Failed to generate CV data",
      details: error.message
    });
  }
});

module.exports = router;
