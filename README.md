# Backend LaTeX Compilation Service

This backend service provides local LaTeX compilation using pdflatex for the CV generator application.

## Prerequisites

### Install LaTeX Distribution

You need to install a LaTeX distribution on your system:

**Windows:**
- Download and install [MiKTeX](https://miktex.org/download) or [TeX Live](https://www.tug.org/texlive/)
- Make sure `pdflatex` is available in your PATH

**macOS:**
- Install MacTeX: `brew install --cask mactex` or download from [MacTeX](https://www.tug.org/mactex/)

**Linux:**
- Ubuntu/Debian: `sudo apt-get install texlive-full`
- Fedora: `sudo dnf install texlive-scheme-full`
- Arch: `sudo pacman -S texlive-most`

## Setup Instructions

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **The server will start on port 3001**

## API Endpoints

### POST /compile
Compiles LaTeX code to PDF

**Request:**
```json
{
  "latexCode": "\\documentclass{article}..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "pdf": "base64-encoded-pdf-data",
  "message": "LaTeX compiled successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "message": "LaTeX compilation service is running",
  "pdflatex": "Available"
}
```

## Features

- **Local LaTeX compilation** using pdflatex
- **Automatic cleanup** of temporary files
- **Error handling** with detailed error messages
- **CORS enabled** for frontend integration
- **Base64 PDF encoding** for easy frontend consumption

## Troubleshooting

### pdflatex not found
If you get "pdflatex command not found" error:
1. Ensure LaTeX is installed
2. Add pdflatex to your system PATH
3. Restart the backend server

### Compilation errors
Common LaTeX compilation errors:
- Missing packages: Install required LaTeX packages
- Syntax errors: Check LaTeX code syntax
- File permissions: Ensure temp directory is writable

### Port conflicts
If port 3001 is in use, change the PORT environment variable:
```bash
PORT=3002 npm start
```

## Security Notes

- The backend only accepts POST requests to /compile
- Temporary files are automatically cleaned up
- Input validation is performed on LaTeX code
- CORS is configured for development environment

## Integration with Frontend

The frontend automatically detects if the backend is running:
- **Green indicator**: Backend available, full PDF preview and download
- **Red indicator**: Backend unavailable, manual Overleaf method
- **Loading spinner**: Checking backend availability

The frontend will fallback to manual Overleaf compilation if the backend is not available.
