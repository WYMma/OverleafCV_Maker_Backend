const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("temp"));

// Create temp directory if it doesn"t exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Check if Docker is available
const checkDocker = () => {
  return new Promise((resolve) => {
    exec("docker --version", (error) => {
      resolve(!error);
    });
  });
};

// LaTeX compilation endpoint using Docker MiKTeX
app.post("/compile", async (req, res) => {
  const { latexCode } = req.body;
  
  if (!latexCode) {
    return res.status(400).json({ error: "LaTeX code is required" });
  }

  const jobId = uuidv4();
  const texFile = path.join(tempDir, `${jobId}.tex`);
  const pdfFile = path.join(tempDir, `${jobId}.pdf`);
  const logFile = path.join(tempDir, `${jobId}.log`);

  // Define cleanup function
  const cleanup = () => {
    try {
      if (fs.existsSync(texFile)) fs.unlinkSync(texFile);
      if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
      if (fs.existsSync(pdfFile)) fs.unlinkSync(pdfFile);
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  try {
    // Check if Docker is available
    const dockerAvailable = await checkDocker();
    if (!dockerAvailable) {
      cleanup();
      return res.status(500).json({
        success: false,
        error: "Docker not available",
        details: "Please install Docker and ensure it is running"
      });
    }

    // Write LaTeX code to file
    fs.writeFileSync(texFile, latexCode);

    // Use Windows-compatible Docker command
    const dockerCommand = `docker run --rm -v "${tempDir.replace(/\\\\/g, "/")}:/miktex/work" miktex/miktex:essential pdflatex -interaction=nonstopmode -output-directory=/miktex/work ${jobId}.tex`;
    
    console.log("Executing:", dockerCommand);
    
    exec(dockerCommand, { cwd: tempDir }, (error, stdout, stderr) => {
      console.log("Docker stdout:", stdout);
      console.log("Docker stderr:", stderr);
      console.log("Docker error:", error);
      
      if (error) {
        cleanup();
        let errorMessage = "LaTeX compilation failed";
        let errorDetails = stderr || stdout || error.message;
        
        if (stderr.includes("permission denied") || stderr.includes("access denied")) {
          errorMessage = "Docker permission error";
          errorDetails = "Please ensure Docker has proper permissions. On Windows, run Docker Desktop as administrator.";
        } else if (stderr.includes("command not found") || stderr.includes("docker:")) {
          errorMessage = "Docker command error";
          errorDetails = "Docker command failed. Please ensure Docker is running properly.";
        }
        
        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: errorDetails
        });
      }

      // Check if PDF was created
      if (fs.existsSync(pdfFile)) {
        try {
          // Read the generated PDF
          const pdfBuffer = fs.readFileSync(pdfFile);
          
          // Convert to base64 for sending to frontend
          const pdfBase64 = pdfBuffer.toString("base64");
          
          cleanup();
          
          res.json({
            success: true,
            pdf: pdfBase64,
            message: "LaTeX compiled successfully using Docker MiKTeX"
          });
        } catch (readError) {
          cleanup();
          res.status(500).json({
            success: false,
            error: "Failed to read generated PDF",
            details: readError.message
          });
        }
      } else {
        cleanup();
        res.status(500).json({
          success: false,
          error: "PDF generation failed",
          details: "No PDF file was created. Check LaTeX syntax or Docker output."
        });
      }
    });

  } catch (error) {
    cleanup();
    res.status(500).json({
      success: false,
      error: "Server error during compilation",
      details: error.message
    });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  const dockerAvailable = await checkDocker();
  res.json({ 
    status: "OK", 
    message: "LaTeX compilation service is running",
    docker: dockerAvailable ? "Available" : "Not available",
    miktex: dockerAvailable ? "Available via Docker" : "Docker required"
  });
});

app.listen(PORT, () => {
  console.log(`LaTeX compilation server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log("Using Docker MiKTeX for compilation");
});
