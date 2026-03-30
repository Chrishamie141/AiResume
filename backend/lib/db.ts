import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS jobs (
      internal_job_id UUID PRIMARY KEY,
      external_job_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location_raw TEXT NOT NULL,
      location_normalized TEXT,
      remote_type TEXT DEFAULT 'unknown',
      employment_type TEXT DEFAULT 'unknown',
      salary_min NUMERIC,
      salary_max NUMERIC,
      salary_currency TEXT DEFAULT 'USD',
      description_html TEXT,
      description_text TEXT,
      posted_at TIMESTAMPTZ NOT NULL,
      first_seen_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL,
      application_url TEXT NOT NULL,
      job_url TEXT,
      company_career_url TEXT,
      dedupe_hash TEXT NOT NULL,
      canonical_job_key TEXT NOT NULL,
      verification_status TEXT DEFAULT 'unverified',
      confidence_score NUMERIC DEFAULT 0.5,
      is_active BOOLEAN DEFAULT TRUE,
      metadata JSONB,
      UNIQUE(source_name, external_job_id)
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_canonical_job_key ON jobs(canonical_job_key);
    CREATE INDEX IF NOT EXISTS idx_jobs_dedupe_hash ON jobs(dedupe_hash);
    CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
    CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
  `);
};
