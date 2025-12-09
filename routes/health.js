const express = require('express');
const router = express.Router();
const { checkDocker } = require('../services/latexService');

router.get('/', async (req, res) => {
  const dockerAvailable = await checkDocker();
  res.json({ 
    status: "OK", 
    message: "LaTeX compilation service is running",
    docker: dockerAvailable ? "Available" : "Not available",
    miktex: dockerAvailable ? "Available via Docker" : "Docker required"
  });
});

module.exports = router;
