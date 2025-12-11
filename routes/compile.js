const express = require('express');
const router = express.Router();
const { compileLatex } = require('../services/latexService');

router.post('/', async (req, res) => {
  try {
    const { latexCode, fullName } = req.body;
    const result = await compileLatex(latexCode, fullName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.message
    });
  }
});

module.exports = router;
