import crypto from "crypto";
import { Job, JobSearchParams } from "../models/job.ts";

export interface SearchResult {
  jobs: Job[];
  total: number;
}

export abstract class BaseJobAdapter {
  abstract sourceName: string;
  abstract sourceType: "aggregator" | "direct" | "ats";

  abstract searchJobs(params: JobSearchParams): Promise<SearchResult>;
  abstract getJobDetails(externalId: string): Promise<Partial<Job> | null>;
  abstract healthCheck(): Promise<boolean>;

  protected abstract normalizeResponse(raw: any): Job;

  protected generateCanonicalKey(title: string, company: string, location: string): string {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${clean(title)}|${clean(company)}|${clean(location)}`;
  }

  protected generateDedupeHash(job: Partial<Job>): string {
    const data = `${job.title}|${job.company}|${job.locationRaw}|${job.applicationUrl}`;
    return crypto.createHash("md5").update(data).digest("hex");
  }
}
