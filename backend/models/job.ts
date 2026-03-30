import { z } from "zod";

export const VerificationStatus = z.enum([
  "unverified",
  "aggregator_only",
  "verified_direct_source",
  "stale",
  "inactive",
]);

export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const JobSchema = z.object({
  internalJobId: z.string().uuid(),
  externalJobId: z.string(),
  sourceName: z.string(),
  sourceType: z.enum(["aggregator", "direct", "ats"]),
  title: z.string(),
  company: z.string(),
  locationRaw: z.string(),
  locationNormalized: z.string().optional(),
  remoteType: z.enum(["remote", "hybrid", "on-site", "unknown"]).default("unknown"),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship", "unknown"]).default("unknown"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  descriptionHtml: z.string().optional(),
  descriptionText: z.string().optional(),
  postedAt: z.string().datetime(),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  applicationUrl: z.string().url(),
  jobUrl: z.string().url().optional(),
  companyCareerUrl: z.string().url().optional(),
  dedupeHash: z.string(),
  canonicalJobKey: z.string(),
  verificationStatus: VerificationStatus.default("unverified"),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Job = z.infer<typeof JobSchema>;

export interface JobSearchParams {
  query?: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
  minSalary?: number;
  limit?: number;
  offset?: number;
}
