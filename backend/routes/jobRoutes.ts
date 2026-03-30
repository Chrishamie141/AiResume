import { Router } from "express";
import { jobService } from "../services/jobService.ts";

const router = Router();

/**
 * GET /api/jobs/search
 * Searches for jobs across all adapters and the internal database.
 */
router.get("/search", async (req, res) => {
  try {
    const { query, location, limit, offset } = req.query;
    const jobs = await jobService.searchJobs({
      query: query as string,
      location: location as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(jobs);
  } catch (error) {
    console.error("Job search failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/jobs/:id
 * Gets details for a specific job.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // This would fetch from DB by internal ID
    // Placeholder for now
    res.status(404).json({ error: "Not implemented" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
