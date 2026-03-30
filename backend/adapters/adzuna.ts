import axios from "axios";
import { BaseJobAdapter, SearchResult } from "./base.ts";
import { Job, JobSchema } from "../models/job.ts";
import { v4 as uuidv4 } from "uuid";

export class AdzunaAdapter extends BaseJobAdapter {
  sourceName = "adzuna";
  sourceType = "aggregator" as const;

  private appId = process.env.ADZUNA_APP_ID;
  private appKey = process.env.ADZUNA_APP_KEY;
  private country = "us";

  async searchJobs(params: any): Promise<SearchResult> {
    if (!this.appId || !this.appKey) {
      throw new Error("Adzuna API keys not configured.");
    }

    const { query, location, limit = 10, offset = 0 } = params;
    const page = Math.floor(offset / limit) + 1;

    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${this.country}/search/${page}`;
      const response = await axios.get(url, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          results_per_page: limit,
          what: query,
          where: location,
          "content-type": "application/json",
        },
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        console.error("Adzuna API returned unexpected data format:", response.data);
        return { jobs: [], total: 0 };
      }

      const jobs = response.data.results
        .map((raw: any) => {
          try {
            return this.normalizeResponse(raw);
          } catch (e) {
            console.error("Failed to normalize Adzuna job:", raw.id, e);
            return null;
          }
        })
        .filter((job: any): job is Job => job !== null);

      return {
        jobs,
        total: response.data.count || jobs.length,
      };
    } catch (error: any) {
      console.error("Adzuna API request failed:", error.message);
      if (error.response) {
        console.error("Adzuna API error response:", error.response.status, error.response.data);
      }
      throw error;
    }
  }

  async getJobDetails(externalId: string): Promise<Partial<Job> | null> {
    return null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.searchJobs({ query: "test", limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  protected normalizeResponse(raw: any): Job {
    const title = (raw.title || "Untitled Job").replace(/<\/?[^>]+(>|$)/g, "");
    const company = raw.company?.display_name || "Unknown Company";
    const location = raw.location?.display_name || "Unknown Location";
    const now = new Date().toISOString();

    const job: Partial<Job> = {
      internalJobId: uuidv4(),
      externalJobId: (raw.id || Math.random().toString()).toString(),
      sourceName: this.sourceName,
      sourceType: this.sourceType,
      title,
      company,
      locationRaw: location,
      locationNormalized: location,
      remoteType: (raw.description || "").toLowerCase().includes("remote") ? "remote" : "unknown",
      employmentType: raw.contract_type === "full_time" ? "full-time" : "unknown",
      salaryMin: raw.salary_min,
      salaryMax: raw.salary_max,
      salaryCurrency: "USD",
      descriptionHtml: raw.description || "",
      descriptionText: (raw.description || "").replace(/<\/?[^>]+(>|$)/g, ""),
      postedAt: raw.created || now,
      firstSeenAt: now,
      lastSeenAt: now,
      applicationUrl: raw.redirect_url || "",
      dedupeHash: "",
      canonicalJobKey: this.generateCanonicalKey(title, company, location),
      verificationStatus: "aggregator_only",
      confidenceScore: 0.6,
      isActive: true,
    };

    job.dedupeHash = this.generateDedupeHash(job);
    return JobSchema.parse(job);
  }
}
