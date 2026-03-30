import { z } from "zod";

export const ResumeTextSchema = z.object({
  resumeText: z.string().trim().min(40).max(40000),
});

export const TailorResumeSchema = z.object({
  baseContent: z.record(z.string(), z.any()),
  jobDescription: z.string().trim().min(40).max(40000),
});

export const CoverLetterSchema = z.object({
  resume: z.record(z.string(), z.any()),
  jobDescription: z.string().trim().min(40).max(40000),
});

export const MatchAnalysisSchema = z.object({
  resume: z.record(z.string(), z.any()),
  jobDescription: z.string().trim().min(40).max(40000),
});

export const InsightsSchema = z.object({
  profileSummary: z.string().max(8000).optional().default(""),
  applicationCount: z.number().int().nonnegative().max(100000),
  resumeCount: z.number().int().nonnegative().max(100000),
  statuses: z.array(z.string()).max(500),
});

export type ResumeTextInput = z.infer<typeof ResumeTextSchema>;
export type TailorResumeInput = z.infer<typeof TailorResumeSchema>;
export type CoverLetterInput = z.infer<typeof CoverLetterSchema>;
export type MatchAnalysisInput = z.infer<typeof MatchAnalysisSchema>;
export type InsightsInput = z.infer<typeof InsightsSchema>;
