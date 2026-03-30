import { Router } from "express";
import {
  adzunaJobService,
  AdzunaConfigError,
  JobSearchValidationError,
} from "../services/adzunaJobService.ts";

type JobServiceLike = {
  search: typeof adzunaJobService.search;
};

export function createJobRoutes(jobService: JobServiceLike = adzunaJobService) {
  const router = Router();

  router.get("/search", async (req, res) => {
    try {
      const { keywords, query, location, page, results_per_page, remote, salary_min, full_time } =
        req.query;

      const results = await jobService.search({
        keywords: String(keywords || query || ""),
        location: location ? String(location) : undefined,
        page: page ? Number(page) : undefined,
        resultsPerPage: results_per_page ? Number(results_per_page) : undefined,
        filters: {
          remote: remote === "true" || remote === "1",
          salaryMin: salary_min ? Number(salary_min) : undefined,
          fullTime: full_time === "true" || full_time === "1",
        },
      });

      res.json(results);
    } catch (error) {
      if (error instanceof JobSearchValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof AdzunaConfigError) {
        return res.status(500).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Unknown search error.";

      if (message.toLowerCase().includes("rate limit")) {
        return res.status(429).json({ error: message });
      }

      return res.status(502).json({ error: message });
    }
  });

  return router;
}

export default createJobRoutes();
