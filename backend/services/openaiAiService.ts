import type {
  CoverLetterInput,
  InsightsInput,
  MatchAnalysisInput,
  ResumeTextInput,
  TailorResumeInput,
} from "../schemas/aiSchemas.ts";

class OpenAIConfigError extends Error {}

class OpenAIAiService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  private ensureConfig() {
    if (!this.apiKey) {
      throw new OpenAIConfigError("OPENAI_API_KEY is missing.");
    }
  }

  private async callOpenAI(messages: Array<{ role: "system" | "user"; content: string }>, json = false) {
    this.ensureConfig();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: json ? { type: "json_object" } : undefined,
        messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) {
        throw new Error("OpenAI rate limit exceeded.");
      }
      throw new Error(`OpenAI request failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private parseJson(content: string) {
    const trimmed = content.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/```json\s*([\s\S]*?)```/i);
      if (match?.[1]) {
        return JSON.parse(match[1]);
      }
      throw new Error("OpenAI returned invalid JSON payload.");
    }
  }

  async parseResume(input: ResumeTextInput) {
    const content = await this.callOpenAI(
      [
        {
          role: "system",
          content:
            "Extract resume details and return JSON: {summary, skills:string[], workExperience:string[], education:string[], suggestedJobTitles:string[]}",
        },
        {
          role: "user",
          content: input.resumeText,
        },
      ],
      true,
    );

    return this.parseJson(content);
  }

  async tailorResume(input: TailorResumeInput) {
    const content = await this.callOpenAI(
      [
        {
          role: "system",
          content:
            "Return JSON with keys {content, notes}. content must be a tailored resume object. Do not fabricate experience.",
        },
        {
          role: "user",
          content: `Resume JSON:\n${JSON.stringify(input.baseContent)}\n\nJob description:\n${input.jobDescription}`,
        },
      ],
      true,
    );

    return this.parseJson(content);
  }

  async generateCoverLetter(input: CoverLetterInput) {
    const content = await this.callOpenAI([
      {
        role: "system",
        content:
          "Write a concise professional cover letter under 400 words. Return plain text only.",
      },
      {
        role: "user",
        content: `Resume JSON:\n${JSON.stringify(input.resume)}\n\nJob description:\n${input.jobDescription}`,
      },
    ]);

    return { coverLetter: content.trim() };
  }

  async analyzeMatch(input: MatchAnalysisInput) {
    const content = await this.callOpenAI(
      [
        {
          role: "system",
          content:
            "Return JSON: {score:number, strengths:string[], gaps:string[], recommendations:string[]}. score must be 0-100.",
        },
        {
          role: "user",
          content: `Resume JSON:\n${JSON.stringify(input.resume)}\n\nJob description:\n${input.jobDescription}`,
        },
      ],
      true,
    );

    return this.parseJson(content);
  }

  async generateInsights(input: InsightsInput) {
    const content = await this.callOpenAI(
      [
        {
          role: "system",
          content:
            "Return JSON {insights:[{title,content,type,score?}]}. type must be tip|alert|success|info. Include exactly 3 insights.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      true,
    );

    return this.parseJson(content);
  }
}

export const openAIAiService = new OpenAIAiService();
export { OpenAIConfigError };
