import { z } from 'zod';

// --- Base Schemas ---

export const EducationSchema = z.object({
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
});

export const WorkExperienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  current: z.boolean().default(false),
  description: z.string().min(1, "Description is required"),
});

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  technologies: z.array(z.string()).default([]),
  date: z.string().optional(),
});

export const CourseworkSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// --- User Profile ---

export const UserProfileSchema = z.object({
  uid: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    portfolio: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
  }).default({}),
  summary: z.string().optional(),
  education: z.array(EducationSchema).default([]),
  experience: z.array(WorkExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  coursework: z.array(CourseworkSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  skills: z.object({
    technical: z.array(z.string()).default([]),
    soft: z.array(z.string()).default([]),
  }).default({ technical: [], soft: [] }),
  preferences: z.object({
    industries: z.array(z.string()).default([]),
    titles: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
    workType: z.enum(['remote', 'hybrid', 'on-site', '']).default(''),
    salary: z.string().optional(),
    visa: z.string().optional(),
    yearsOfExperience: z.number().default(0),
  }).default({ industries: [], titles: [], locations: [], workType: '', yearsOfExperience: 0 }),
});

// --- Resume ---

export const ResumeContentSchema = z.object({
  basics: z.object({
    name: z.string(),
    label: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    url: z.string().optional(),
    summary: z.string(),
    location: z.string().optional(),
    profiles: z.array(z.object({
      network: z.string(),
      username: z.string(),
      url: z.string(),
    })).optional(),
  }),
  work: z.array(z.object({
    name: z.string(),
    position: z.string(),
    url: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    summary: z.string(),
    highlights: z.array(z.string()).optional(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    url: z.string().optional(),
    area: z.string(),
    studyType: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    score: z.string().optional(),
    courses: z.array(z.string()).optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    level: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    highlights: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    date: z.string().optional(),
    url: z.string().optional(),
    roles: z.array(z.string()).optional(),
    entity: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
  coursework: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  certificates: z.array(z.object({
    name: z.string(),
    date: z.string(),
    issuer: z.string(),
    url: z.string().optional(),
  })).optional(),
});

export const ResumeSchema = z.object({
  id: z.string().optional(),
  uid: z.string(),
  title: z.string(),
  content: ResumeContentSchema,
  templateId: z.string().optional(),
  style: z.string().optional(),
  isBase: z.boolean().default(false),
  isTailored: z.boolean().default(false),
  targetJob: z.string().optional(),
  tailoringNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- Job Listing ---

export const JobListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  salary: z.string().optional(),
  type: z.string().optional(),
  source: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

// --- Job Application ---

export const ApplicationStatus = z.enum(['saved', 'ready', 'applied', 'interview', 'rejected', 'offer']);

export const JobApplicationSchema = z.object({
  id: z.string().optional(),
  uid: z.string(),
  jobId: z.string(),
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
  status: ApplicationStatus,
  notes: z.string().optional(),
  appliedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  jobSnapshot: JobListingSchema.optional(), // Snapshot for traceability
});

// --- Dashboard & Insights ---

export const DashboardStatsSchema = z.object({
  totalApplications: z.number(),
  interviewsScheduled: z.number(),
  resumesCreated: z.number(),
  successRate: z.number(),
});

export const AIInsightSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.enum(['tip', 'alert', 'success', 'info']),
  score: z.number().optional(),
});

export const ResumeAnalysisSchema = z.object({
  score: z.number(),
  feedback: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
});

// --- Cover Letter ---

export const CoverLetterSchema = z.object({
  id: z.string().optional(),
  uid: z.string(),
  resumeId: z.string().optional(),
  jobId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
