import { CoverLetter, JobApplication, Resume, User, UserProfile } from '../types';
import { authService } from './authService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase frontend env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

async function requireUid() {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}

async function request(path: string, options: RequestInit = {}) {
  const token = await authService.getAccessToken();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Supabase request failed (${response.status})`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const mapResume = (row: any): Resume => ({ id: row.id, uid: row.uid, title: row.title, content: row.content, templateId: row.template_id, style: row.style, isBase: row.is_base, isTailored: row.is_tailored, targetJob: row.target_job, tailoringNotes: row.tailoring_notes, createdAt: row.created_at, updatedAt: row.updated_at });
const mapApplication = (row: any): JobApplication => ({ id: row.id, uid: row.uid, jobId: row.job_id, resumeId: row.resume_id, coverLetterId: row.cover_letter_id, status: row.status, notes: row.notes, appliedAt: row.applied_at, createdAt: row.created_at, updatedAt: row.updated_at, jobSnapshot: row.job_snapshot });

export const databaseService = {
  async saveUser(user: Partial<User>) {
    const uid = await requireUid();
    await request('users?on_conflict=uid', { method: 'POST', body: JSON.stringify({ uid, email: user.email ?? '', display_name: user.displayName ?? '', photo_url: user.photoURL ?? '', plan: user.plan ?? 'free', created_at: user.createdAt ?? new Date().toISOString(), updated_at: new Date().toISOString() }) });
  },
  async getUser(uid: string): Promise<User | null> {
    const data = await request(`users?uid=eq.${uid}&select=*`);
    const row = data?.[0];
    if (!row) return null;
    return { uid: row.uid, email: row.email, displayName: row.display_name, photoURL: row.photo_url, plan: row.plan, createdAt: row.created_at };
  },
  async saveProfile(profile: UserProfile) {
    const uid = await requireUid();
    await request('user_profiles?on_conflict=uid', { method: 'POST', body: JSON.stringify({ uid, first_name: profile.firstName, last_name: profile.lastName, email: profile.email, phone: profile.phone ?? null, location: profile.location ?? null, links: profile.links, summary: profile.summary ?? null, education: profile.education, experience: profile.experience, projects: profile.projects, coursework: profile.coursework, certifications: profile.certifications, skills: profile.skills, preferences: profile.preferences, updated_at: new Date().toISOString() }) });
  },
  async getProfile(uid: string): Promise<UserProfile | null> {
    const data = await request(`user_profiles?uid=eq.${uid}&select=*`);
    const row = data?.[0];
    if (!row) return null;
    return { uid: row.uid, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone ?? undefined, location: row.location ?? undefined, links: row.links ?? {}, summary: row.summary ?? undefined, education: row.education ?? [], experience: row.experience ?? [], projects: row.projects ?? [], coursework: row.coursework ?? [], certifications: row.certifications ?? [], skills: row.skills ?? { technical: [], soft: [] }, preferences: row.preferences ?? { industries: [], titles: [], locations: [], workType: '', yearsOfExperience: 0 } };
  },
  async saveResume(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) {
    const uid = await requireUid();
    const now = new Date().toISOString();
    if (resume.isBase) {
      await request(`resumes?uid=eq.${uid}&is_base=eq.true`, { method: 'PATCH', body: JSON.stringify({ is_base: false, updated_at: now }) });
    }
    const data = await request('resumes', { method: 'POST', body: JSON.stringify({ uid, title: resume.title, content: resume.content, template_id: resume.templateId ?? null, style: resume.style ?? null, is_base: resume.isBase ?? false, is_tailored: resume.isTailored ?? false, target_job: resume.targetJob ?? null, tailoring_notes: resume.tailoringNotes ?? null, created_at: now, updated_at: now }) });
    return data[0].id as string;
  },
  async getResumeById(id: string): Promise<Resume | null> {
    const data = await request(`resumes?id=eq.${id}&select=*`);
    return data?.[0] ? mapResume(data[0]) : null;
  },
  async deleteResume(id: string) {
    const uid = await requireUid();
    await request(`resumes?id=eq.${id}&uid=eq.${uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  },
  async updateResume(id: string, updates: Partial<Resume>) {
    const uid = await requireUid();
    const now = new Date().toISOString();
    if (updates.isBase) {
      await request(`resumes?uid=eq.${uid}&is_base=eq.true&id=neq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_base: false, updated_at: now }) });
    }
    await request(`resumes?id=eq.${id}&uid=eq.${uid}`, { method: 'PATCH', body: JSON.stringify({ title: updates.title, content: updates.content, template_id: updates.templateId, style: updates.style, is_base: updates.isBase, is_tailored: updates.isTailored, target_job: updates.targetJob, tailoring_notes: updates.tailoringNotes, updated_at: now }) });
  },
  async getResumes(uid: string): Promise<Resume[]> {
    const data = await request(`resumes?uid=eq.${uid}&select=*&order=updated_at.desc`);
    return (data ?? []).map(mapResume);
  },
  async saveApplication(application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) {
    const uid = await requireUid();
    const now = new Date().toISOString();
    const data = await request('job_applications', { method: 'POST', body: JSON.stringify({ uid, job_id: application.jobId, resume_id: application.resumeId ?? null, cover_letter_id: application.coverLetterId ?? null, status: application.status, notes: application.notes ?? null, applied_at: application.appliedAt ?? null, job_snapshot: application.jobSnapshot ?? null, created_at: now, updated_at: now }) });
    return data[0].id as string;
  },
  async getApplications(uid: string): Promise<JobApplication[]> {
    const data = await request(`job_applications?uid=eq.${uid}&select=*&order=updated_at.desc`);
    return (data ?? []).map(mapApplication);
  },
  async updateApplicationStatus(id: string, status: JobApplication['status']) {
    const uid = await requireUid();
    await request(`job_applications?id=eq.${id}&uid=eq.${uid}`, { method: 'PATCH', body: JSON.stringify({ status, updated_at: new Date().toISOString() }) });
  },
  async saveCoverLetter(coverLetter: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>) {
    const uid = await requireUid();
    const now = new Date().toISOString();
    const data = await request('cover_letters', { method: 'POST', body: JSON.stringify({ uid, resume_id: coverLetter.resumeId ?? null, job_id: coverLetter.jobId ?? null, title: coverLetter.title, content: coverLetter.content, created_at: now, updated_at: now }) });
    return data[0].id as string;
  },
};
