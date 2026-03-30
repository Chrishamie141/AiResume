import { Router } from "express";
import { AdzunaAdapter } from "../adapters/adzuna.ts";
import { ingestionService } from "../services/ingestionService.ts";

const router = Router();

/**
 * GET /api/admin/sources/health
 * Checks the health of all configured sources.
 */
router.get("/sources/health", async (req, res) => {
  try {
    const adapters = [new AdzunaAdapter()];
    const health = await Promise.all(
      adapters.map(async (adapter) => ({
        source: adapter.sourceName,
        status: await adapter.healthCheck() ? "ok" : "error",
      }))
    );
    res.json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/admin/ingest
 * Triggers a manual ingestion.
 */
router.post("/ingest", async (req, res) => {
  try {
    await ingestionService.ingestAll();
    res.json({ status: "ok", message: "Ingestion triggered." });
  } catch (error) {
    console.error("Manual ingestion failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
