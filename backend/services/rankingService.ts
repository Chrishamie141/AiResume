import { Job } from "../models/job.ts";

export class RankingService {
  /**
   * Scores a job based on various criteria for ranking.
   * Higher score means higher rank.
   */
  scoreJob(job: Job, query?: string): number {
    let score = 0;

    // 1. Relevance (Query match)
    if (query) {
      const q = query.toLowerCase();
      if (job.title.toLowerCase().includes(q)) score += 50;
      if (job.company.toLowerCase().includes(q)) score += 20;
      if (job.descriptionText?.toLowerCase().includes(q)) score += 10;
    }

    // 2. Verified Direct Source (ATS)
    if (job.sourceType === "ats" || job.sourceType === "direct") {
      score += 40;
    }

    // 3. Freshness (postedAt)
    const postedAt = new Date(job.postedAt).getTime();
    const now = Date.now();
    const daysOld = (now - postedAt) / (1000 * 60 * 60 * 24);
    if (daysOld < 1) score += 30;
    else if (daysOld < 3) score += 20;
    else if (daysOld < 7) score += 10;

    // 4. Salary Completeness
    if (job.salaryMin && job.salaryMax) score += 15;
    else if (job.salaryMin || job.salaryMax) score += 5;

    // 5. Description Quality
    if (job.descriptionText && job.descriptionText.length > 500) score += 10;

    // 6. Verification Status
    if (job.verificationStatus === "verified_direct_source") score += 25;

    return score;
  }

  /**
   * Ranks a list of jobs based on their scores.
   */
  rankJobs(jobs: Job[], query?: string): Job[] {
    return jobs.sort((a, b) => this.scoreJob(b, query) - this.scoreJob(a, query));
  }
}

export const rankingService = new RankingService();
