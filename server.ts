import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import jobRoutes from "./backend/routes/jobRoutes.ts";
import adminRoutes from "./backend/routes/adminRoutes.ts";
import { initDb } from "./backend/lib/db.ts";
import { ingestionService } from "./backend/services/ingestionService.ts";
import { connectRedis } from "./backend/lib/redis.ts";
import logger from "./backend/lib/logger.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development iframe compatibility
  }));
  app.use(cookieParser());

  // Logging Middleware
  app.use((req, res, next) => {
    logger.info(`Incoming Request: ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Job and Admin Routes
  app.use("/api/jobs", jobRoutes);
  app.use("/api/admin", adminRoutes);

  // Initialize DB, Redis and start ingestion
  try {
    await initDb();
    await connectRedis();
    ingestionService.start();
    logger.info("Database initialized, Redis connected, and ingestion service started.");
  } catch (error) {
    logger.error("Failed to initialize database, Redis, or start ingestion:", error);
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error("Unhandled Backend Error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
