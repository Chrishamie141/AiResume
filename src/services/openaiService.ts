import { AIInsight, ResumeContent, UserProfile } from '../types';
import { AIInsightSchema, ResumeContentSchema } from '../schemas';
import { apiPost } from './apiClient';

export const openaiService = {
  async generateBaseResume(profile: UserProfile): Promise<ResumeContent> {
    const resumeText = [
      `${profile.firstName} ${profile.lastName}`,
      profile.summary || '',
      ...profile.experience.map((e) => `${e.title} at ${e.company}: ${e.description}`),
      ...profile.education.map((e) => `${e.degree} in ${e.field} - ${e.school}`),
      ...profile.skills.technical,
    ]
      .filter(Boolean)
      .join('\n');

    const parsed = await apiPost<any>('/api/ai/parse-resume', { resumeText });

    return ResumeContentSchema.parse({
      basics: {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        phone: profile.phone,
        summary: parsed.summary || profile.summary || 'Professional candidate',
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
        { name: 'Technical', keywords: profile.skills.technical },
        { name: 'Soft', keywords: profile.skills.soft },
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
    const payload = await apiPost<{ content: ResumeContent; notes: string }>('/api/ai/tailor-resume', {
      baseContent,
      jobDescription,
    });

    return {
      content: ResumeContentSchema.parse(payload.content),
      notes: payload.notes,
    };
  },

  async generateCoverLetter(resume: ResumeContent, jobDescription: string): Promise<string> {
    const payload = await apiPost<{ coverLetter: string }>('/api/ai/cover-letter', {
      resume,
      jobDescription,
    });

    return payload.coverLetter;
  },

  async analyzeMatch(resume: ResumeContent, jobDescription: string) {
    return apiPost('/api/ai/match-analysis', {
      resume,
      jobDescription,
    });
  },

  async generateInsights(profile: UserProfile, applications: any[], resumes: any[]): Promise<AIInsight[]> {
    const payload = await apiPost<{ insights: AIInsight[] }>('/api/ai/insights', {
      profileSummary: profile.summary || '',
      applicationCount: applications.length,
      resumeCount: resumes.length,
      statuses: applications.map((a) => a.status),
    });

    return (payload.insights || []).map((item) => AIInsightSchema.parse(item));
  },
};
