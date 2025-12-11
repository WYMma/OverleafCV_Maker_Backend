const express = require('express');
const router = express.Router();
const { checkPdflatex } = require('../services/latexService');

router.get('/', async (req, res) => {
  const pdflatexAvailable = await checkPdflatex();
  res.json({ 
    status: "OK", 
    message: "LaTeX compilation service is running",
    pdflatex: pdflatexAvailable ? "Available" : "Not available",
    latex: pdflatexAvailable ? "Available directly" : "pdflatex required"
  });
});

module.exports = router;
