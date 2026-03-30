import axios, { AxiosError } from "axios";
import type {
  JobListing,
  JobSearchParams,
  JobSearchResponse,
} from "../types/jobSearch.ts";

class AdzunaConfigError extends Error {}
class JobSearchValidationError extends Error {}

export class AdzunaJobService {
  private readonly appId = process.env.ADZUNA_APP_ID;
  private readonly appKey = process.env.ADZUNA_APP_KEY;
  private readonly country = (process.env.ADZUNA_COUNTRY || "us").toLowerCase();

  private readonly maxResultsPerPage = 50;

  private ensureConfig() {
    if (!this.appId || !this.appKey) {
      throw new AdzunaConfigError(
        "Missing Adzuna API configuration. Set ADZUNA_APP_ID and ADZUNA_APP_KEY.",
      );
    }
  }

  private validateParams(params: JobSearchParams): Required<JobSearchParams> {
    const page = params.page ?? 1;
    const resultsPerPage = params.resultsPerPage ?? 10;

    if (!params.keywords?.trim()) {
      throw new JobSearchValidationError("keywords is required.");
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new JobSearchValidationError("page must be an integer >= 1.");
    }

    if (
      !Number.isInteger(resultsPerPage) ||
      resultsPerPage < 1 ||
      resultsPerPage > this.maxResultsPerPage
    ) {
      throw new JobSearchValidationError(
        `resultsPerPage must be an integer between 1 and ${this.maxResultsPerPage}.`,
      );
    }

    if (params.filters?.salaryMin !== undefined && params.filters.salaryMin < 0) {
      throw new JobSearchValidationError("salaryMin must be >= 0.");
    }

    return {
      keywords: params.keywords.trim(),
      location: params.location?.trim() || "",
      page,
      resultsPerPage,
      filters: params.filters || {},
    };
  }

  async search(params: JobSearchParams): Promise<JobSearchResponse> {
    this.ensureConfig();
    const normalized = this.validateParams(params);

    try {
      const response = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/${this.country}/search/${normalized.page}`,
        {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            what: normalized.keywords,
            where: normalized.location,
            results_per_page: normalized.resultsPerPage,
            salary_min: normalized.filters.salaryMin,
            full_time: normalized.filters.fullTime ? 1 : undefined,
            content_type: "application/json",
          },
          timeout: 12000,
        },
      );

      const rawResults = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      let jobs = rawResults.map((raw) => this.normalizeJob(raw));

      if (normalized.filters.remote) {
        jobs = jobs.filter((job) => {
          const haystack = `${job.title} ${job.description} ${job.location}`.toLowerCase();
          return haystack.includes("remote");
        });
      }

      const total = Number(response.data?.count || jobs.length);

      return {
        jobs,
        page: normalized.page,
        resultsPerPage: normalized.resultsPerPage,
        total,
        hasMore: normalized.page * normalized.resultsPerPage < total,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      if (status === 429) {
        throw new Error("Adzuna rate limit reached. Please retry shortly.");
      }

      if (status === 401 || status === 403) {
        throw new Error("Adzuna credentials are invalid or unauthorized.");
      }

      throw new Error(
        `Adzuna search failed${status ? ` (HTTP ${status})` : ""}.`,
      );
    }
  }

  private normalizeJob(raw: any): JobListing {
    const salaryMin = typeof raw.salary_min === "number" ? raw.salary_min : undefined;
    const salaryMax = typeof raw.salary_max === "number" ? raw.salary_max : undefined;

    const salary =
      salaryMin !== undefined || salaryMax !== undefined
        ? `${salaryMin ? `$${Math.round(salaryMin).toLocaleString()}` : "$?"}${
            salaryMax ? ` - $${Math.round(salaryMax).toLocaleString()}` : ""
          }`
        : undefined;

    return {
      id: String(raw.id || `${raw.redirect_url || raw.title}-${Date.now()}`),
      title: raw.title || "Untitled role",
      company: raw.company?.display_name || "Unknown company",
      location: raw.location?.display_name || "Location not listed",
      description: raw.description || "",
      salary,
      type: raw.contract_time || raw.contract_type || "Not specified",
      source: "Adzuna",
      url: raw.redirect_url || raw.adref || "",
      createdAt: raw.created || new Date().toISOString(),
    };
  }
}

export const adzunaJobService = new AdzunaJobService();
export { AdzunaConfigError, JobSearchValidationError };
