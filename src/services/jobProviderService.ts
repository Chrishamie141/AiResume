import { JobListing } from '../types';
import { apiGet } from './apiClient';

export interface JobSearchFilters {
  remote?: boolean;
  salaryMin?: number;
  fullTime?: boolean;
}

export interface JobSearchOptions {
  keywords: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
  filters?: JobSearchFilters;
}

export interface JobSearchResult {
  jobs: JobListing[];
  page: number;
  resultsPerPage: number;
  total: number;
  hasMore: boolean;
}

class AdzunaJobProvider {
  async search(options: JobSearchOptions): Promise<JobSearchResult> {
    const params = new URLSearchParams({
      keywords: options.keywords,
      location: options.location || '',
      page: String(options.page || 1),
      results_per_page: String(options.resultsPerPage || 10),
    });

    if (options.filters?.remote) params.set('remote', '1');
    if (options.filters?.salaryMin !== undefined) {
      params.set('salary_min', String(options.filters.salaryMin));
    }
    if (options.filters?.fullTime) params.set('full_time', '1');

    return apiGet<JobSearchResult>(`/api/jobs/search?${params.toString()}`);
  }
}

export const jobProvider = new AdzunaJobProvider();
