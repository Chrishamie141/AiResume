import { GoogleGenAI, Type } from "@google/genai";
import { JobListing } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface JobProvider {
  search(query: string, location?: string, filters?: any): Promise<JobListing[]>;
  getById(id: string): Promise<JobListing | null>;
  getRecommendations(query: string): Promise<string[]>;
  getLocationRecommendations(query: string): Promise<string[]>;
}

/**
 * Uses Gemini with Google Search Grounding to find actual job listings from the web.
 */
export class GeminiJobProvider implements JobProvider {
  async search(query: string, location?: string): Promise<JobListing[]> {
    const prompt = `
      Find 10 ACTUAL, CURRENT job listings for "${query}" in "${location || 'Anywhere'}".
      These must be real jobs that currently exist on the web.
      
      Requirements:
      1. Use the search tool to find real job postings from sites like LinkedIn, Indeed, Glassdoor, or company career pages.
      2. Include the actual company name, location, and a summary of the description.
      3. Provide a real URL to the job posting if possible.
      4. Return the data as a JSON array of JobListing objects.
      
      JobListing structure:
      {
        id: string (unique),
        title: string,
        company: string,
        location: string,
        description: string,
        salary: string,
        type: string,
        source: string,
        url: string,
        createdAt: string (ISO date)
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                salary: { type: Type.STRING },
                type: { type: Type.STRING },
                source: { type: Type.STRING },
                url: { type: Type.STRING },
                createdAt: { type: Type.STRING }
              },
              required: ["id", "title", "company", "location", "description", "salary", "type", "source", "url", "createdAt"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini job search failed:", error);
      return [];
    }
  }

  async getById(id: string): Promise<JobListing | null> {
    return null;
  }

  async getRecommendations(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    const prompt = `Provide 5 common job title recommendations starting with or related to "${query}". Return as a JSON array of strings.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return [];
    }
  }

  async getLocationRecommendations(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    const prompt = `Provide 5 common city/location recommendations starting with or related to "${query}". Return as a JSON array of strings.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return [];
    }
  }
}

/**
 * Uses the internal backend API to fetch job listings (which aggregates Adzuna and others).
 */
export class AdzunaJobProvider implements JobProvider {
  async search(query: string, location?: string): Promise<JobListing[]> {
    try {
      const url = `/api/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || "")}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend API error: ${response.statusText}`);
      
      const data = await response.json();
      // Map internal Job model to frontend JobListing type
      return data.map((job: any) => ({
        id: job.internalJobId,
        title: job.title,
        company: job.company,
        location: job.locationRaw,
        description: job.descriptionText || job.descriptionHtml || "",
        salary: job.salaryMin ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax?.toLocaleString()}` : "Competitive",
        type: job.employmentType === "full-time" ? "Full-time" : "Contract",
        source: job.sourceName,
        url: job.applicationUrl,
        createdAt: job.postedAt
      }));
    } catch (error) {
      console.error("Backend job search failed:", error);
      return [];
    }
  }

  async getById(id: string): Promise<JobListing | null> {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) return null;
      const job = await response.json();
      return {
        id: job.internalJobId,
        title: job.title,
        company: job.company,
        location: job.locationRaw,
        description: job.descriptionText || job.descriptionHtml || "",
        salary: job.salaryMin ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax?.toLocaleString()}` : "Competitive",
        type: job.employmentType === "full-time" ? "Full-time" : "Contract",
        source: job.sourceName,
        url: job.applicationUrl,
        createdAt: job.postedAt
      };
    } catch (error) {
      return null;
    }
  }

  async getRecommendations(query: string): Promise<string[]> {
    return [];
  }

  async getLocationRecommendations(query: string): Promise<string[]> {
    return [];
  }
}

/**
 * Combines multiple providers, preferring structured APIs but falling back to Gemini Search.
 */
export class CompositeJobProvider implements JobProvider {
  private providers: JobProvider[];

  constructor() {
    this.providers = [
      new AdzunaJobProvider(),
      new GeminiJobProvider()
    ];
  }

  async search(query: string, location?: string): Promise<JobListing[]> {
    // Try Adzuna first if keys are present
    const adzuna = this.providers[0];
    const adzunaResults = await adzuna.search(query, location);
    
    if (adzunaResults.length > 0) {
      return adzunaResults;
    }

    // Fallback to Gemini with Search Grounding
    return this.providers[1].search(query, location);
  }

  async getById(id: string): Promise<JobListing | null> {
    return null;
  }

  async getRecommendations(query: string): Promise<string[]> {
    return this.providers[1].getRecommendations(query);
  }

  async getLocationRecommendations(query: string): Promise<string[]> {
    return this.providers[1].getLocationRecommendations(query);
  }
}

export const jobProvider = new CompositeJobProvider();
