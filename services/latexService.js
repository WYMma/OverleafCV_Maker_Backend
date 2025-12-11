const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require('../config/database');

const checkPdflatex = () => {
  return new Promise((resolve) => {
    exec("pdflatex --version", (error) => {
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
    // Check if pdflatex is available
    const pdflatexAvailable = await checkPdflatex();
    if (!pdflatexAvailable) {
      cleanup();
      throw new Error("pdflatex not available. Please install TeX Live, MiKTeX, or MacTeX");
    }

    // Write LaTeX code to file
    fs.writeFileSync(texFile, latexCode);

    // Use direct pdflatex command
    const pdflatexCommand = `pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${jobId}.tex"`;
    
    console.log("Executing:", pdflatexCommand);
    
    return new Promise((resolve, reject) => {
      exec(pdflatexCommand, { cwd: tempDir }, (error, stdout, stderr) => {
        console.log("pdflatex stdout:", stdout);
        console.log("pdflatex stderr:", stderr);
        console.log("pdflatex error:", error);
        
        if (error) {
          cleanup();
          let errorMessage = "LaTeX compilation failed";
          let errorDetails = stderr || stdout || error.message;
          
          if (stderr.includes("permission denied") || stderr.includes("access denied")) {
            errorMessage = "Permission error";
            errorDetails = "Please ensure the temp directory has proper write permissions.";
          } else if (stderr.includes("command not found") || stderr.includes("pdflatex:")) {
            errorMessage = "pdflatex command error";
            errorDetails = "pdflatex command failed. Please ensure TeX Live is properly installed.";
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
              message: "LaTeX compiled successfully using pdflatex"
            });
          } catch (readError) {
            cleanup();
            reject(new Error(`Failed to read generated PDF: ${readError.message}`));
          }
        } else {
          cleanup();
          reject(new Error("PDF generation failed: No PDF file was created. Check LaTeX syntax or pdflatex output."));
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
  checkPdflatex
};
