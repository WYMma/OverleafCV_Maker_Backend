const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const config = require('../config/database');

const setupMiddleware = (app) => {
  // Middleware
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000']; // Default fallback
  
  app.use(cors({
    origin: corsOrigins,
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
