import { AIInsight, ResumeContent, UserProfile } from "../types";
import { AIInsightSchema, ResumeContentSchema } from "../schemas";

const API_BASE_URL = (process.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

export const openaiService = {
  async generateBaseResume(profile: UserProfile): Promise<ResumeContent> {
    const resumeText = [
      `${profile.firstName} ${profile.lastName}`,
      profile.summary || "",
      ...profile.experience.map((e) => `${e.title} at ${e.company}: ${e.description}`),
      ...profile.education.map((e) => `${e.degree} in ${e.field} - ${e.school}`),
      ...profile.skills.technical,
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await postJson<any>("/api/ai/parse-resume", { resumeText });

    return ResumeContentSchema.parse({
      basics: {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        phone: profile.phone,
        summary: parsed.summary || profile.summary || "Professional candidate",
        location: profile.location,
      },
      work: profile.experience.map((exp) => ({
        name: exp.company,
        position: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        summary: exp.description,
      })),
      education: profile.education.map((edu) => ({
        institution: edu.school,
        area: edu.field,
        studyType: edu.degree,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      skills: [
        { name: "Technical", keywords: profile.skills.technical },
        { name: "Soft", keywords: profile.skills.soft },
      ],
      projects: profile.projects.map((project) => ({
        name: project.name,
        description: project.description,
        keywords: project.technologies,
        date: project.date,
        url: project.url,
      })),
      coursework: profile.coursework,
    });
  },

  async tailorResume(baseContent: ResumeContent, jobDescription: string): Promise<{ content: ResumeContent; notes: string }> {
    const payload = await postJson<{ content: ResumeContent; notes: string }>("/api/ai/tailor-resume", {
      baseContent,
      jobDescription,
    });

    return {
      content: ResumeContentSchema.parse(payload.content),
      notes: payload.notes,
    };
  },

  async generateCoverLetter(resume: ResumeContent, jobDescription: string): Promise<string> {
    const payload = await postJson<{ coverLetter: string }>("/api/ai/cover-letter", {
      resume,
      jobDescription,
    });

    return payload.coverLetter;
  },

  async analyzeMatch(resume: ResumeContent, jobDescription: string) {
    return postJson("/api/ai/match-analysis", {
      resume,
      jobDescription,
    });
  },

  async generateInsights(profile: UserProfile, applications: any[], resumes: any[]): Promise<AIInsight[]> {
    const payload = await postJson<{ insights: AIInsight[] }>("/api/ai/insights", {
      profileSummary: profile.summary || "",
      applicationCount: applications.length,
      resumeCount: resumes.length,
      statuses: applications.map((a) => a.status),
    });

    return (payload.insights || []).map((item) => AIInsightSchema.parse(item));
  },
};
