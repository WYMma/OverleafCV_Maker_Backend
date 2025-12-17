const express = require("express");
const config = require('./config/database');
const setupMiddleware = require('./middleware/setup');

// Routes
const compileRoutes = require('./routes/compile');
const generateCVRoutes = require('./routes/generateCV');
const enhanceRoutes = require('./routes/enhance');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = config.port;

// Setup middleware
setupMiddleware(app);

// Register routes
app.use('/compile', compileRoutes);
app.use('/api/generate-cv', generateCVRoutes);
app.use('/api/extract-cv', require('./routes/extractCV'));
app.use('/api/enhance', enhanceRoutes);
app.use('/health', healthRoutes);

app.listen(PORT, () => {
  console.log(`LaTeX compilation server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log("Using pdflatex for compilation");
});
