import { Job, JobSearchParams, JobSchema } from "../models/job.ts";
import { query } from "../lib/db.ts";
import { dedupeService } from "./dedupeService.ts";
import { rankingService } from "./rankingService.ts";
import { AdzunaAdapter } from "../adapters/adzuna.ts";
import logger from "../lib/logger.ts";

export class JobService {
  private adapters = [new AdzunaAdapter()];

  /**
   * Searches for jobs across all adapters and the internal database.
   */
  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    const { query: q, location, limit = 20, offset = 0 } = params;
    logger.info(`Searching jobs for query: "${q}", location: "${location}"`);

    // 1. Search in internal database first
    const dbResults = await this.searchInternal(params);

    // 2. If results are few, trigger background ingestion or search adapters directly
    // For now, let's just search adapters and merge
    const adapterPromises = this.adapters.map((adapter) => adapter.searchJobs(params));
    const adapterResults = await Promise.all(adapterPromises);

    const allJobs = [...dbResults];
    for (const result of adapterResults) {
      for (const job of result.jobs) {
        // Simple deduplication for the result set
        const existing = allJobs.find((j) => j.canonicalJobKey === job.canonicalJobKey);
        if (existing) {
          // Merge logic
          const merged = dedupeService.mergeJobs(existing, job);
          const index = allJobs.indexOf(existing);
          allJobs[index] = merged;
        } else {
          allJobs.push(job);
        }
      }
    }

    // 3. Rank and return
    return rankingService.rankJobs(allJobs, q).slice(offset, offset + limit);
  }

  /**
   * Searches for jobs in the internal PostgreSQL database.
   */
  private async searchInternal(params: JobSearchParams): Promise<Job[]> {
    const { query: q, location, limit = 20, offset = 0 } = params;
    let sql = `SELECT * FROM jobs WHERE is_active = TRUE`;
    const values: any[] = [];

    if (q) {
      values.push(`%${q}%`);
      sql += ` AND (title ILIKE $${values.length} OR company ILIKE $${values.length} OR description_text ILIKE $${values.length})`;
    }

    if (location) {
      values.push(`%${location}%`);
      sql += ` AND location_raw ILIKE $${values.length}`;
    }

    sql += ` ORDER BY posted_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows.map((row) => this.mapRowToJob(row));
  }

  /**
   * Saves or updates a job in the database.
   */
  async upsertJob(job: Job): Promise<void> {
    const sql = `
      INSERT INTO jobs (
        internal_job_id, external_job_id, source_name, source_type, title, company,
        location_raw, location_normalized, remote_type, employment_type,
        salary_min, salary_max, salary_currency, description_html, description_text,
        posted_at, first_seen_at, last_seen_at, application_url, job_url,
        company_career_url, dedupe_hash, canonical_job_key, verification_status,
        confidence_score, is_active, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (source_name, external_job_id) DO UPDATE SET
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        location_raw = EXCLUDED.location_raw,
        location_normalized = EXCLUDED.location_normalized,
        remote_type = EXCLUDED.remote_type,
        employment_type = EXCLUDED.employment_type,
        salary_min = EXCLUDED.salary_min,
        salary_max = EXCLUDED.salary_max,
        salary_currency = EXCLUDED.salary_currency,
        description_html = EXCLUDED.description_html,
        description_text = EXCLUDED.description_text,
        last_seen_at = EXCLUDED.last_seen_at,
        application_url = EXCLUDED.application_url,
        job_url = EXCLUDED.job_url,
        company_career_url = EXCLUDED.company_career_url,
        dedupe_hash = EXCLUDED.dedupe_hash,
        canonical_job_key = EXCLUDED.canonical_job_key,
        verification_status = EXCLUDED.verification_status,
        confidence_score = EXCLUDED.confidence_score,
        is_active = EXCLUDED.is_active,
        metadata = EXCLUDED.metadata;
    `;

    const values = [
      job.internalJobId, job.externalJobId, job.sourceName, job.sourceType, job.title, job.company,
      job.locationRaw, job.locationNormalized, job.remoteType, job.employmentType,
      job.salaryMin, job.salaryMax, job.salaryCurrency, job.descriptionHtml, job.descriptionText,
      job.postedAt, job.firstSeenAt, job.lastSeenAt, job.applicationUrl, job.jobUrl,
      job.companyCareerUrl, job.dedupeHash, job.canonicalJobKey, job.verificationStatus,
      job.confidenceScore, job.isActive, JSON.stringify(job.metadata || {})
    ];

    await query(sql, values);
  }

  private mapRowToJob(row: any): Job {
    return JobSchema.parse({
      internalJobId: row.internal_job_id,
      externalJobId: row.external_job_id,
      sourceName: row.source_name,
      sourceType: row.source_type,
      title: row.title,
      company: row.company,
      locationRaw: row.location_raw,
      locationNormalized: row.location_normalized,
      remoteType: row.remote_type,
      employmentType: row.employment_type,
      salaryMin: row.salary_min ? parseFloat(row.salary_min) : undefined,
      salaryMax: row.salary_max ? parseFloat(row.salary_max) : undefined,
      salaryCurrency: row.salary_currency,
      descriptionHtml: row.description_html,
      descriptionText: row.description_text,
      postedAt: row.posted_at.toISOString(),
      firstSeenAt: row.first_seen_at.toISOString(),
      lastSeenAt: row.last_seen_at.toISOString(),
      applicationUrl: row.application_url,
      jobUrl: row.job_url,
      companyCareerUrl: row.company_career_url,
      dedupeHash: row.dedupe_hash,
      canonicalJobKey: row.canonical_job_key,
      verificationStatus: row.verification_status,
      confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
      isActive: row.is_active,
      metadata: row.metadata,
    });
  }
}

export const jobService = new JobService();
