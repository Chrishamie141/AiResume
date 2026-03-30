export interface JobSearchFilters {
  remote?: boolean;
  salaryMin?: number;
  fullTime?: boolean;
}

export interface JobSearchParams {
  keywords: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
  filters?: JobSearchFilters;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  type?: string;
  source: "Adzuna";
  url: string;
  createdAt: string;
}

export interface JobSearchResponse {
  jobs: JobListing[];
  page: number;
  resultsPerPage: number;
  total: number;
  hasMore: boolean;
}
