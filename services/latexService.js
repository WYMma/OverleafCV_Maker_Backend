const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require('../config/database');

const checkDocker = () => {
  return new Promise((resolve) => {
    exec("docker --version", (error) => {
      resolve(!error);
    });
  });
};

const compileLatex = async (latexCode) => {
  if (!latexCode) {
    throw new Error("LaTeX code is required");
  }

  const jobId = uuidv4();
  const tempDir = path.join(__dirname, '..', config.tempDir);
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
      throw new Error("Docker not available. Please install Docker and ensure it is running");
    }

    // Write LaTeX code to file
    fs.writeFileSync(texFile, latexCode);

    // Use Windows-compatible Docker command
    const dockerCommand = `docker run --rm -v "${tempDir.replace(/\\\\/g, "/")}:/miktex/work" miktex/miktex:essential pdflatex -interaction=nonstopmode -output-directory=/miktex/work ${jobId}.tex`;
    
    console.log("Executing:", dockerCommand);
    
    return new Promise((resolve, reject) => {
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
          
          return reject(new Error(`${errorMessage}: ${errorDetails}`));
        }

        // Check if PDF was created
        if (fs.existsSync(pdfFile)) {
          try {
            // Read the generated PDF
            const pdfBuffer = fs.readFileSync(pdfFile);
            
            // Convert to base64 for sending to frontend
            const pdfBase64 = pdfBuffer.toString("base64");
            
            cleanup();
            
            resolve({
              success: true,
              pdf: pdfBase64,
              message: "LaTeX compiled successfully using Docker MiKTeX"
            });
          } catch (readError) {
            cleanup();
            reject(new Error(`Failed to read generated PDF: ${readError.message}`));
          }
        } else {
          cleanup();
          reject(new Error("PDF generation failed: No PDF file was created. Check LaTeX syntax or Docker output."));
        }
      });
    });

  } catch (error) {
    cleanup();
    throw new Error(`Server error during compilation: ${error.message}`);
  }
};

module.exports = {
  compileLatex,
  checkDocker
};
