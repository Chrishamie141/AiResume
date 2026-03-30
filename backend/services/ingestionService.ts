import cron from "node-cron";
import { jobService } from "./jobService.ts";
import { AdzunaAdapter } from "../adapters/adzuna.ts";

export class IngestionService {
  private adapters = [new AdzunaAdapter()];

  /**
   * Starts the ingestion scheduler.
   */
  start() {
    // Run every hour
    cron.schedule("0 * * * *", async () => {
      console.log("Starting hourly job ingestion...");
      await this.ingestAll();
    });

    // Run a quick ingestion on start
    this.ingestAll().catch(console.error);
  }

  /**
   * Ingests jobs from all configured adapters.
   */
  async ingestAll() {
    for (const adapter of this.adapters) {
      try {
        console.log(`Ingesting jobs from ${adapter.sourceName}...`);
        const result = await adapter.searchJobs({ query: "", limit: 50 });
        
        for (const job of result.jobs) {
          await jobService.upsertJob(job);
        }
        
        console.log(`Successfully ingested ${result.jobs.length} jobs from ${adapter.sourceName}.`);
      } catch (error) {
        console.error(`Failed to ingest jobs from ${adapter.sourceName}:`, error);
      }
    }
  }
}

export const ingestionService = new IngestionService();
