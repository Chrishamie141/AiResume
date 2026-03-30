import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import logger from "./lib/logger.ts";
import { createJobRoutes } from "./routes/jobRoutes.ts";
import { createAiRoutes } from "./routes/aiRoutes.ts";
import { requireFirebaseAuth } from "./lib/requireFirebaseAuth.ts";

type AppOverrides = {
  jobService?: Parameters<typeof createJobRoutes>[0];
  aiService?: Parameters<typeof createAiRoutes>[0];
};

export function createApp(overrides: AppOverrides = {}) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(cors());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());

  const requestWindowMs = 60_000;
  const maxRequestsPerWindow = 120;
  const counters = new Map<string, { count: number; resetAt: number }>();

  app.use("/api", (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const current = counters.get(key);

    if (!current || now > current.resetAt) {
      counters.set(key, { count: 1, resetAt: now + requestWindowMs });
      return next();
    }

    if (current.count >= maxRequestsPerWindow) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }

    current.count += 1;
    counters.set(key, current);
    return next();
  });

  app.use((req, _res, next) => {
    logger.info("Incoming Request", { method: req.method, path: req.path });
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", jobProvider: "Adzuna", aiProvider: "OpenAI" });
  });

  app.use("/api/jobs", requireFirebaseAuth, createJobRoutes(overrides.jobService));
  app.use("/api/ai", requireFirebaseAuth, createAiRoutes(overrides.aiService));

  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error("Unhandled Backend Error", {
      message: err?.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    });

    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
