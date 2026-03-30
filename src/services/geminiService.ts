import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, ResumeContent, AIInsight } from "../types";
import { ResumeContentSchema, AIInsightSchema } from "../schemas";

// Initialize the Gemini AI client
// The platform automatically injects GEMINI_API_KEY into the process.env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const RESUME_CONTENT_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    basics: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        label: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        url: { type: Type.STRING },
        summary: { type: Type.STRING },
        location: { type: Type.STRING },
        profiles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              network: { type: Type.STRING },
              username: { type: Type.STRING },
              url: { type: Type.STRING }
            }
          }
        }
      },
      required: ["name", "email", "summary"]
    },
    work: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          position: { type: Type.STRING },
          url: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          summary: { type: Type.STRING },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "position", "startDate", "summary"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          url: { type: Type.STRING },
          area: { type: Type.STRING },
          studyType: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          score: { type: Type.STRING },
          courses: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["institution", "area", "studyType", "startDate"]
      }
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          level: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
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
          description: { type: Type.STRING },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          date: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
    },
    coursework: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name"]
      }
    }
  },
  required: ["basics", "work", "education", "skills"]
};

/**
 * Helper to handle retries for Gemini API calls
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err.message?.toLowerCase() || "";
      const isRateLimit = errorMessage.includes('429') || err.status === 429 || err.error?.code === 429;
      const isServerError = errorMessage.includes('500') || err.status === 500 || err.error?.code === 500;
      const isRpcError = errorMessage.includes('rpc failed') || errorMessage.includes('xhr error') || errorMessage.includes('deadline exceeded');
      
      // Retry on rate limits, server errors, or transient RPC failures
      if ((isRateLimit || isServerError || isRpcError) && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1500 + Math.random() * 1000;
        console.warn(`Gemini API error (${err.status || 'RPC'}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const geminiService = {
  /**
   * Generates a structured resume from user profile data
   */
  async generateBaseResume(profile: UserProfile): Promise<ResumeContent> {
    return withRetry(async () => {
      const prompt = `
        Create a professional, ATS-friendly resume for the following person.
        Return the data in a strict structured JSON format.
        
        User Profile:
        ${JSON.stringify(profile, null, 2)}
        
        Requirements:
        1. Use professional language and action verbs.
        2. Ensure it is optimized for ATS systems.
        3. Map the profile data to the ResumeContent schema.
        4. The summary should be a compelling professional overview.
        5. Experience highlights should be bullet points of achievements.
        6. PROJECTS: If projects exist in the profile, include them. Rewrite descriptions to be results-driven, emphasizing technical skills, impact, and measurable outcomes. Format as professional bullet points.
        7. COURSEWORK: If coursework exists, include it only if it's highly relevant to the user's career field or if they have limited work experience. Prioritize technical or specialized courses.
        8. OMISSION: If Projects or Coursework data is not present in the input, completely omit those sections from the JSON output.
        9. IMPORTANT: Do not include any meta-commentary, thinking text, or internal instructions in any of the JSON fields.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional resume writer. Your output must be ONLY the requested JSON. Do not include any meta-commentary, thinking, or explanations inside or outside the JSON fields. Strictly follow the provided schema. Do not hallucinate links or content not present in the input.",
          responseMimeType: "application/json",
          responseSchema: RESUME_CONTENT_GEMINI_SCHEMA
        }
      });

      const result = JSON.parse(response.text || "{}");
      return ResumeContentSchema.parse(result);
    });
  },

  /**
   * Tailors a resume for a specific job description
   */
  async tailorResume(baseContent: ResumeContent, jobDescription: string): Promise<{ content: ResumeContent; notes: string }> {
    return withRetry(async () => {
      const prompt = `
        Tailor the following structured resume for the provided job description.
        
        Base Resume Content:
        ${JSON.stringify(baseContent, null, 2)}
        
        Job Description:
        ${jobDescription}
        
        Requirements:
        1. Analyze the job description for key skills and keywords.
        2. Reorder or emphasize relevant experience.
        3. PROJECTS: Tailor project descriptions to match the job role. Emphasize technical skills used, impact, and measurable outcomes relevant to the target job.
        4. COURSEWORK: Include coursework only if it is relevant to the selected job or if the user has limited experience. Prioritize technical or specialized courses.
        5. DO NOT invent false experience.
        6. Optimize for ATS.
        7. Return the tailored content in the same ResumeContent schema.
        8. Provide brief summary of changes as "notes".
        9. OMISSION: If Projects or Coursework data is not present in the input, completely omit those sections from the JSON output.
        10. IMPORTANT: Do not include any meta-commentary, thinking text, or internal instructions in any of the JSON fields.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional resume optimizer. Your output must be ONLY the requested JSON. Do not include any meta-commentary, thinking, or explanations inside or outside the JSON fields. Strictly follow the provided schema. Do not hallucinate links or content not present in the input.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: RESUME_CONTENT_GEMINI_SCHEMA,
              notes: { type: Type.STRING }
            },
            required: ["content", "notes"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        content: ResumeContentSchema.parse(result.content),
        notes: result.notes
      };
    });
  },

  /**
   * Generates a cover letter for a specific job description
   */
  async generateCoverLetter(resume: ResumeContent, jobDescription: string): Promise<string> {
    return withRetry(async () => {
      const prompt = `
        Write a compelling, professional cover letter based on the following resume and job description.
        
        Resume:
        ${JSON.stringify(resume, null, 2)}
        
        Job Description:
        ${jobDescription}
        
        Requirements:
        1. Keep it professional and concise (under 400 words).
        2. Highlight specific skills and experiences that match the job description.
        3. Use a standard business letter format.
        4. DO NOT invent false experience.
        5. Return ONLY the text of the cover letter.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional career coach. Your output must be ONLY the text of the cover letter. Do not include any meta-commentary or thinking text.",
        }
      });

      return response.text || "";
    });
  },

  /**
   * Generates AI insights from real user data
   */
  async generateInsights(profile: UserProfile, applications: any[], resumes: any[]): Promise<AIInsight[]> {
    return withRetry(async () => {
      const prompt = `
        Analyze the user's job search progress and profile to provide 3 actionable AI insights.
        
        User Data:
        - Profile: ${JSON.stringify(profile.summary)}
        - Applications: ${applications.length}
        - Resumes: ${resumes.length}
        - Application Statuses: ${JSON.stringify(applications.map(a => a.status))}
        
        Requirements:
        1. Provide 3 insights.
        2. Each insight should have a title, content, type (tip, alert, success, info), and an optional score.
        3. Insights must be realistic and based on the provided data.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional career advisor. Your output must be ONLY the requested JSON array. Do not include any meta-commentary or thinking text.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["tip", "alert", "success", "info"] },
                score: { type: Type.NUMBER }
              },
              required: ["title", "content", "type"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      return result.map((i: any) => AIInsightSchema.parse(i));
    });
  },

  /**
   * Gets company insights using Google Search grounding
   */
  async getCompanyInsights(companyName: string): Promise<string> {
    return withRetry(async () => {
      const prompt = `Provide detailed insights about ${companyName}. Include recent news, company culture, and common interview tips. Use Google Search to find the most up-to-date information.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a corporate researcher. Provide concise, factual insights based on search results. Use markdown for formatting.",
        }
      });

      return response.text || "No insights available for this company.";
    });
  },

  /**
   * Gets nearby office locations or amenities using Google Maps grounding
   */
  async getNearbyLocations(companyName: string, userLocation?: { lat: number; lng: number }): Promise<any[]> {
    return withRetry(async () => {
      const prompt = `Find office locations for ${companyName} and nearby amenities like coffee shops or transit hubs.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined
            }
          },
          systemInstruction: "You are a local guide. Find and list relevant locations with their names and addresses.",
        }
      });

      return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    });
  }
};
