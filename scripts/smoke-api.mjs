const base = process.env.API_BASE_URL || 'http://localhost:3000';

async function hit(path, options = {}) {
  const res = await fetch(`${base}${path}`, options);
  const bodyText = await res.text();
  console.log(`${res.status} ${path}`);
  if (!res.ok) {
    console.error(bodyText.slice(0, 240));
  }
}

async function run() {
  await hit('/api/health');
  await hit('/api/jobs/search?keywords=software%20engineer');
  await hit('/api/ai/parse-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: 'Software engineer with 5 years of TypeScript, React, Node.js, and API development experience across startups and enterprise teams.',
    }),
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
