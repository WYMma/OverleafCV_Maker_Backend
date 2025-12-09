const { GoogleGenAI } = require("@google/genai");
const config = require('../config/database');

const genAI = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

const generateCV = async (jobTitle) => {
  if (!genAI) {
    throw new Error("Gemini AI not configured");
  }
  
  if (!jobTitle || !jobTitle.trim()) {
    throw new Error("Job title is required");
  }

  try {
    console.log("Generating CV for job title:", jobTitle);
    
    const prompt = `Generate a comprehensive CV data for a ${jobTitle}. Return ONLY a JSON object with this exact structure:
{
  "fullName": "John Doe",
  "title": "${jobTitle}",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "location": "New York, NY",
  "website": "https://johndoe.com",
  "linkedin": "https://linkedin.com/in/johndoe",
  "summary": "Professional summary here...",
  "experience": [
    {
      "company": "Company Name",
      "position": "${jobTitle}",
      "startDate": "2022-01",
      "endDate": "2024-01",
      "isCurrent": false,
      "employmentType": "Full-time",
      "technologies": "React, Node.js, MongoDB",
      "description": "Job description and achievements..."
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2018-09",
      "endDate": "2022-05",
      "isCurrent": false,
      "gpa": "3.8"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "2023-06",
      "credentialId": "ID123456"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description...",
      "technologies": "React, Node.js",
      "startDate": "2023-01",
      "endDate": "2023-06"
    }
  ],
  "extracurricularActivities": [
    {
      "organization": "Organization Name",
      "position": "Member",
      "startDate": "2020-01",
      "endDate": "2022-01",
      "isCurrent": false,
      "description": "Activity description..."
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    }
  ]
}

Make it realistic and detailed for a ${jobTitle}. Ensure all dates are logical and consistent.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate CV data: " + error.message);
  }
};

module.exports = {
  generateCV,
  isConfigured: !!genAI
};
