import { Router } from "express";
import {
  CoverLetterSchema,
  InsightsSchema,
  MatchAnalysisSchema,
  ResumeTextSchema,
  TailorResumeSchema,
} from "../schemas/aiSchemas.ts";
import { openAIAiService, OpenAIConfigError } from "../services/openaiAiService.ts";
import logger from "../lib/logger.ts";

type AiServiceLike = {
  parseResume: typeof openAIAiService.parseResume;
  tailorResume: typeof openAIAiService.tailorResume;
  generateCoverLetter: typeof openAIAiService.generateCoverLetter;
  analyzeMatch: typeof openAIAiService.analyzeMatch;
  generateInsights: typeof openAIAiService.generateInsights;
};

export function createAiRoutes(aiService: AiServiceLike = openAIAiService) {
  const router = Router();

  function handleError(res: any, error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown AI error.";

    if (error instanceof OpenAIConfigError) {
      return res.status(500).json({ error: message });
    }

    if (message.toLowerCase().includes("rate limit")) {
      return res.status(429).json({ error: message });
    }

    logger.error("AI route failure", { message });
    return res.status(502).json({ error: message });
  }

  router.post("/parse-resume", async (req, res) => {
    const parsed = ResumeTextSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    try {
      const data = await aiService.parseResume(parsed.data);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  router.post("/tailor-resume", async (req, res) => {
    const parsed = TailorResumeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    try {
      const data = await aiService.tailorResume(parsed.data);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  router.post("/cover-letter", async (req, res) => {
    const parsed = CoverLetterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    try {
      const data = await aiService.generateCoverLetter(parsed.data);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  router.post("/match-analysis", async (req, res) => {
    const parsed = MatchAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    try {
      const data = await aiService.analyzeMatch(parsed.data);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  router.post("/insights", async (req, res) => {
    const parsed = InsightsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    try {
      const data = await aiService.generateInsights(parsed.data);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  return router;
}

export default createAiRoutes();
