import { JobSearchValidationError } from "../../backend/services/adzunaJobService.ts";
import assert from 'node:assert/strict';
import { createApp } from '../../backend/app.ts';

const fakeJobService = {
  async search(params) {
    if (!params.keywords) {
      throw new JobSearchValidationError('keywords is required.');
    }
    if (params.keywords === 'upstream-error') {
      throw new Error('Adzuna search failed (HTTP 500).');
    }
    return {
      jobs: [
        {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Example Co',
          location: 'Remote',
          description: 'Build product features',
          source: 'Adzuna',
          url: 'https://example.com/job-1',
          createdAt: new Date().toISOString(),
        },
      ],
      page: 1,
      resultsPerPage: 10,
      total: 1,
      hasMore: false,
    };
  },
};

const fakeAiService = {
  async parseResume() {
    return { summary: 'Experienced engineer', skills: ['React', 'Node'] };
  },
  async tailorResume() {
    return { content: { basics: { name: 'A' }, work: [], education: [], skills: [] }, notes: 'Tailored' };
  },
  async generateCoverLetter() {
    return { coverLetter: 'Dear Hiring Manager, ...' };
  },
  async analyzeMatch() {
    return { score: 84, strengths: ['React'], gaps: ['Testing'], recommendations: ['Add CI examples'] };
  },
  async generateInsights(input) {
    if (input.profileSummary === 'trigger-rate-limit') {
      throw new Error('OpenAI rate limit exceeded.');
    }
    return {
      insights: [
        { title: 'Tip', content: 'Apply daily', type: 'tip' },
        { title: 'Alert', content: 'Add measurable impact', type: 'alert' },
        { title: 'Success', content: 'Good consistency', type: 'success' },
      ],
    };
  },
};

function logPass(name) {
  console.log(`✅ ${name}`);
}

function logFail(name, error) {
  console.error(`❌ ${name}`);
  console.error(error?.stack || error);
}

async function run() {
  const app = createApp({ jobService: fakeJobService, aiService: fakeAiService });
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      logPass(name);
    } catch (err) {
      failed += 1;
      logFail(name, err);
    }
  }

  await test('GET /api/health', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  await test('GET /api/jobs/search success', async () => {
    const res = await fetch(`${base}/api/jobs/search?keywords=engineer`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.jobs.length, 1);
  });

  await test('GET /api/jobs/search validation failure', async () => {
    const res = await fetch(`${base}/api/jobs/search`);
    assert.equal(res.status, 400);
  });

  await test('GET /api/jobs/search upstream failure', async () => {
    const res = await fetch(`${base}/api/jobs/search?keywords=upstream-error`);
    assert.equal(res.status, 502);
  });

  await test('POST /api/ai/parse-resume success', async () => {
    const res = await fetch(`${base}/api/ai/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: 'Software engineer with 5 years experience building APIs and React apps for enterprise clients.' }),
    });
    assert.equal(res.status, 200);
  });

  await test('POST /api/ai/parse-resume validation failure', async () => {
    const res = await fetch(`${base}/api/ai/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: 'short' }),
    });
    assert.equal(res.status, 400);
  });

  await test('POST /api/ai/tailor-resume success', async () => {
    const res = await fetch(`${base}/api/ai/tailor-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseContent: { basics: { name: 'A' }, work: [], education: [], skills: [] },
        jobDescription: 'Need full-stack engineer with TypeScript, React, and communication skills for product feature ownership.',
      }),
    });
    assert.equal(res.status, 200);
  });

  await test('POST /api/ai/cover-letter success', async () => {
    const res = await fetch(`${base}/api/ai/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: { basics: { name: 'A' } },
        jobDescription: 'Need strong written communication and API development for a remote team across time zones.',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.coverLetter);
  });

  await test('POST /api/ai/match-analysis success', async () => {
    const res = await fetch(`${base}/api/ai/match-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: { basics: { name: 'A' } },
        jobDescription: 'Need backend engineer with SQL and cloud API deployment and observability experience.',
      }),
    });
    assert.equal(res.status, 200);
  });

  await test('POST /api/ai/insights success', async () => {
    const res = await fetch(`${base}/api/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileSummary: 'student dev', applicationCount: 5, resumeCount: 2, statuses: ['saved'] }),
    });
    assert.equal(res.status, 200);
  });

  await test('POST /api/ai/insights rate-limit-style failure mapping', async () => {
    const res = await fetch(`${base}/api/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileSummary: 'trigger-rate-limit', applicationCount: 5, resumeCount: 2, statuses: ['saved'] }),
    });
    assert.equal(res.status, 429);
  });

  server.close();

  if (failed > 0) {
    console.error(`\n${failed} endpoint tests failed.`);
    process.exit(1);
  }

  console.log('\nAll endpoint tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
