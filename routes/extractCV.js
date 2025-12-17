const express = require('express');
const router = express.Router();
const { extractCVData, isConfigured } = require('../services/geminiService');

router.post('/', async (req, res) => {
    const { prompt } = req.body;

    if (!isConfigured) {
        return res.status(500).json({
            error: "Gemini AI not configured",
            details: "Server missing GEMINI_API_KEY"
        });
    }

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
            error: "Invalid input",
            details: "Prompt is required and must be a string"
        });
    }

    try {
        const cvData = await extractCVData(prompt);
        res.json({
            success: true,
            data: cvData
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({
            error: "Failed to extract CV data",
            details: error.message
        });
    }
});

module.exports = router;
