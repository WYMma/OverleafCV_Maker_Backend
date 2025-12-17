const { GoogleGenAI, Type } = require("@google/genai");
const config = require('../config/database');

const genAI = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, maxRetries = 5, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Broader check for 503/Overloaded
      const errString = error.toString() + (error.message || '') + JSON.stringify(error);
      const isTransient =
        error.status === 503 ||
        error.status === 429 ||
        errString.includes('503') ||
        errString.includes('overloaded') ||
        errString.includes('UNAVAILABLE');

      if (!isTransient) throw error;

      console.log(`Gemini API overloaded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
};

const improveText = async (text, context) => {
  if (!genAI) return text;

  return retryOperation(async () => {
    try {
      const response = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error; // Re-throw for retry
    }
  });
};

const generateSampleCV = async (jobTitle) => {
  if (!genAI) throw new Error("API Key not found");

  const prompt = `Generate a comprehensive, realistic sample CV data for a "${jobTitle}".
  
  Requirements:
  - Create a plausible candidate name and contact information
  - Include realistic, detailed work experience with descriptions using line breaks (not bullet points)
  - Add relevant education background
  - Include certifications, projects, languages, and skills appropriate for the role
  - Make the data specific and impressive but believable
  - Include technologies, employment types, and dates
  - Add extracurricular activities that complement the professional profile
  - For experience and activity descriptions, use line breaks between points instead of bullet points (•)
  
  Return the response in strict JSON format matching this schema (do not include markdown code blocks):
  
  {
    "fullName": "Full Name",
    "title": "${jobTitle}",
    "email": "professional.email@example.com",
    "phone": "+1-555-0123",
    "website": "https://portfolio.example.com",
    "linkedin": "linkedin.com/in/professionalprofile",
    "github": "github.com/username",
    "summary": "Comprehensive professional summary highlighting key achievements and qualifications...",
    "skills": "Skill 1, Skill 2, Skill 3, Skill 4, Skill 5",
    "experience": [
      {
        "company": "Company Name",
        "role": "Role Name",
        "employmentType": "Full-time",
        "location": "City, State",
        "startDate": "YYYY-MM",
        "endDate": "Present",
        "isCurrent": true,
        "technologies": "Technology 1, Technology 2, Technology 3",
        "description": "Achieved specific measurable result\\nLed initiative that impacted business metrics\\nCollaborated with cross-functional teams\\nImplemented innovative solutions"
      }
    ],
    "education": [
      {
        "institution": "University Name",
        "degree": "Degree Type",
        "speciality": "Field of Study",
        "location": "City, State",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM",
        "isCurrent": false,
        "year": "YYYY",
        "details": "GPA: 3.8/4.0, Magna Cum Laude, Dean's List"
      }
    ],
    "certifications": [
      {
        "name": "Certification Name",
        "provider": "Certifying Organization",
        "date": "YYYY-MM",
        "details": "Level or Specialization"
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech 1, Tech 2, Tech 3",
        "link": "https://github.com/username/project",
        "description": "Detailed project description showcasing skills and impact"
      }
    ],
    "extracurricularActivities": [
      {
        "organization": "Organization Name",
        "location": "City, State",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM",
        "isCurrent": false,
        "description": "Leadership role and responsibilities\\nKey achievements and contributions"
      }
    ],
    "languages": [
      {
        "name": "English",
        "proficiency": "Native"
      },
      {
        "name": "Spanish",
        "proficiency": "Fluent"
      }
    ]
  }
  
  Make sure all dates are consistent and realistic. The experience should show career progression. Skills should be relevant to the job title. Technologies should be current and industry-standard.`;

  return retryOperation(async () => {
    try {
      const response = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              title: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              website: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              github: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    employmentType: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    technologies: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["company", "role", "location", "startDate", "endDate", "description"]
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    speciality: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    year: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ["institution", "degree", "location", "year"]
                }
              },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    provider: { type: Type.STRING },
                    date: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ["name", "provider", "date"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    technologies: { type: Type.STRING },
                    link: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              extracurricularActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    organization: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    description: { type: Type.STRING }
                  },
                  required: ["organization", "description"]
                }
              },
              languages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    proficiency: { type: Type.STRING }
                  },
                  required: ["name", "proficiency"]
                }
              }
            },
            required: ["fullName", "title", "summary", "skills"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Sample Gen Error:", error);
      throw error;
    }
  });
};

const extractCVData = async (userPrompt) => {
  if (!genAI) throw new Error("API Key not found");

  const prompt = `Extract structured CV information from the following user description.
  
  User Description:
  "${userPrompt}"
  
  Requirements:
  - Extract all relevant information provided by the user.
  - If specific fields (like email, phone, dates) are missing, leave them empty or use reasonable placeholders (e.g. "YYYY-MM") only if context implies them.
  - Do NOT invent specific experiences or skills not mentioned or strongly implied by the user.
  - Return the response in strict JSON format matching the schema below.
  `;

  return retryOperation(async () => {
    try {
      const response = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              title: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              website: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              github: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    employmentType: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    technologies: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["company", "role", "description"]
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    speciality: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    year: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ["institution", "degree"]
                }
              },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    provider: { type: Type.STRING },
                    date: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    technologies: { type: Type.STRING },
                    link: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              extracurricularActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    organization: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    description: { type: Type.STRING }
                  },
                  required: ["organization"]
                }
              },
              languages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    proficiency: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["fullName", "summary"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      throw error;
    }
  });
};

module.exports = {
  improveText,
  generateSampleCV,
  extractCVData,
  isConfigured: !!genAI
};
