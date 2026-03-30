-- Supabase schema for AiResume

create table if not exists public.users (
  uid uuid primary key,
  email text not null,
  display_name text not null default '',
  photo_url text not null default '',
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  location text,
  links jsonb not null default '{}'::jsonb,
  summary text,
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  coursework jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  skills jsonb not null default '{"technical":[],"soft":[]}'::jsonb,
  preferences jsonb not null default '{"industries":[],"titles":[],"locations":[],"workType":"","yearsOfExperience":0}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content jsonb not null,
  template_id text,
  style text,
  is_base boolean not null default false,
  is_tailored boolean not null default false,
  target_job text,
  tailoring_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter_id uuid,
  status text not null check (status in ('saved','ready','applied','interview','rejected','offer')),
  notes text,
  applied_at timestamptz,
  job_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_id text,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.job_applications enable row level security;
alter table public.cover_letters enable row level security;

create policy "users own row" on public.users for all using (auth.uid() = uid) with check (auth.uid() = uid);
create policy "profiles own row" on public.user_profiles for all using (auth.uid() = uid) with check (auth.uid() = uid);
create policy "resumes own rows" on public.resumes for all using (auth.uid() = uid) with check (auth.uid() = uid);
create policy "applications own rows" on public.job_applications for all using (auth.uid() = uid) with check (auth.uid() = uid);
create policy "cover letters own rows" on public.cover_letters for all using (auth.uid() = uid) with check (auth.uid() = uid);
