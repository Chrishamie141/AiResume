import { z } from 'zod';
import { 
  UserProfileSchema, 
  EducationSchema, 
  WorkExperienceSchema, 
  ProjectSchema, 
  CertificationSchema, 
  ResumeSchema, 
  ResumeContentSchema,
  JobListingSchema, 
  JobApplicationSchema,
  ApplicationStatus,
  DashboardStatsSchema,
  AIInsightSchema,
  ResumeAnalysisSchema,
  CoverLetterSchema
} from './schemas';

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeContent = z.infer<typeof ResumeContentSchema>;
export type JobListing = z.infer<typeof JobListingSchema>;
export type JobApplication = z.infer<typeof JobApplicationSchema>;
export type ApplicationStatusType = z.infer<typeof ApplicationStatus>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;
export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  plan: 'free' | 'pro';
  createdAt: string;
}
