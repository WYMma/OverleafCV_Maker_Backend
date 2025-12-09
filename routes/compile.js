const express = require('express');
const router = express.Router();
const { compileLatex } = require('../services/latexService');

router.post('/', async (req, res) => {
  try {
    const result = await compileLatex(req.body.latexCode);
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
