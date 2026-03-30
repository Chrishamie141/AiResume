# Endpoint Test Plan

| Route | Method | Expected Input | Expected Output / Status | Edge Cases | Failure Cases |
|---|---|---|---|---|---|
| `/api/health` | GET | none | `200`, `{status:"ok", jobProvider, aiProvider}` | n/a | n/a |
| `/api/jobs/search` | GET | `keywords` required; optional `location,page,results_per_page,remote,salary_min,full_time` | `200`, `{jobs,page,total,hasMore}` | `results_per_page` bounds, empty results | missing keywords -> `400`; upstream Adzuna error -> `502`; rate limit -> `429` |
| `/api/ai/parse-resume` | POST | `{ resumeText }` | `200` parsed profile JSON | long text up to cap | invalid body -> `400`; OpenAI config missing -> `500`; upstream failure -> `502/429` |
| `/api/ai/tailor-resume` | POST | `{ baseContent, jobDescription }` | `200`, `{ content, notes }` | very long job description | invalid body -> `400`; upstream failure -> `502/429` |
| `/api/ai/cover-letter` | POST | `{ resume, jobDescription }` | `200`, `{ coverLetter }` | concise/long JD | invalid body -> `400`; upstream failure -> `502/429` |
| `/api/ai/match-analysis` | POST | `{ resume, jobDescription }` | `200`, `{score,strengths,gaps,recommendations}` | borderline scores | invalid body -> `400`; upstream failure -> `502/429` |
| `/api/ai/insights` | POST | `{ profileSummary, applicationCount, resumeCount, statuses }` | `200`, `{ insights:[...] }` | zero applications | invalid body -> `400`; upstream failure -> `502/429` |

## Automated coverage
- See `tests/api/run-endpoint-tests.mjs` for happy path, validation, and upstream failure behavior.

## Manual smoke checks
- Run `npm run smoke:api` to ping health, jobs, and AI routes with local server URL.
