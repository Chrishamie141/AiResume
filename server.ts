import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createApp } from "./backend/app.ts";
import logger from "./backend/lib/logger.ts";

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
