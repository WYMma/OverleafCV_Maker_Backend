const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const config = require('../config/database');

const setupMiddleware = (app) => {
  // Middleware
  app.use(cors({
    origin: ['http://localhost:3000', 'https://overleafcv-maker-backend.onrender.com'],
    credentials: true
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.static(config.tempDir));

  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, '..', config.tempDir);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
};

module.exports = setupMiddleware;
