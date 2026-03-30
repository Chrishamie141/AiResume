import { Job } from "../models/job.ts";
import crypto from "crypto";

export class DedupeService {
  /**
   * Generates a stable key for identifying the job across sources.
   * This is used for cross-source deduplication.
   */
  generateCanonicalKey(job: Partial<Job>): string {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = clean(job.title || "");
    const company = clean(job.company || "");
    const location = clean(job.locationRaw || "");
    const data = `${title}|${company}|${location}`;
    return crypto.createHash("md5").update(data).digest("hex");
  }

  /**
   * Generates a hash for quick duplicate checking within a source.
   */
  generateDedupeHash(job: Partial<Job>): string {
    const data = `${job.title}|${job.company}|${job.locationRaw}|${job.applicationUrl}`;
    return crypto.createHash("md5").update(data).digest("hex");
  }

  /**
   * Merges two job objects, preferring data from the more reliable source.
   */
  mergeJobs(existing: Job, incoming: Job): Job {
    const preferred = incoming.sourceType === "direct" || incoming.sourceType === "ats" ? incoming : existing;
    const secondary = preferred === incoming ? existing : incoming;

    return {
      ...secondary,
      ...preferred,
      internalJobId: existing.internalJobId, // Keep original internal ID
      firstSeenAt: existing.firstSeenAt,
      lastSeenAt: new Date().toISOString(),
      // Merge metadata or other fields if needed
      metadata: {
        ...(existing.metadata || {}),
        ...(incoming.metadata || {}),
        originalSources: [
          ...(Array.isArray(existing.metadata?.originalSources) ? existing.metadata.originalSources : []),
          { source: incoming.sourceName, id: incoming.externalJobId }
        ]
      }
    };
  }
}

export const dedupeService = new DedupeService();
