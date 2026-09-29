const base = process.env.TEST_BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000');

async function runTests() {
  console.log(`--- Testing OPSMIND GET routes on ${base} ---`);
  const getRoutes = ['/', '/incidents', '/incidents/new', '/incidents/INC-001', '/api/v1/health', '/api/v1/incidents'];
  try {
    for (const r of getRoutes) {
      const res = await fetch(`${base}${r}`);
      console.log(`[GET ${res.status}] ${r}`);
      if (res.status !== 200) process.exit(1);
    }
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED') {
      console.error(`\n[!] Unable to connect to Next.js server at ${base}.`);
      console.error(`    Please start the frontend server first: 'npm run dev:frontend' or 'npm run build:frontend && npm --prefix frontend start'`);
      process.exit(1);
    }
    throw err;
  }

  console.log('\n--- Testing OPSMIND POST API Endpoints ---');

  // 1. Create incident
  const createRes = await fetch(`${base}/api/v1/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'E2E Validation Test Incident',
      service: 'Payment API',
      severity: 'P1',
      symptoms: '502 Bad Gateway across all endpoints\nDB Pool 99%',
      logs: 'ERROR: connection pool exhausted (connection limit 100 reached)',
    }),
  });
  const created = await createRes.json();
  console.log(`[POST ${createRes.status}] /api/v1/incidents -> Created ${created.id}`);
  if (createRes.status !== 201) process.exit(1);

  // 2. Analyze incident
  const analyzeRes = await fetch(`${base}/api/v1/incidents/${created.id}/analyze`, {
    method: 'POST',
  });
  const analyzed = await analyzeRes.json();
  console.log(`[POST ${analyzeRes.status}] /api/v1/incidents/${created.id}/analyze -> Memories retrieved: ${analyzed.memory?.length}, Hypotheses: ${analyzed.hypotheses?.length}`);
  if (analyzeRes.status !== 200) process.exit(1);

  // 3. Update step
  const stepRes = await fetch(`${base}/api/v1/incidents/${created.id}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-01',
      status: 'done',
      notes: 'Verified pool saturation resolved',
    }),
  });
  console.log(`[POST ${stepRes.status}] /api/v1/incidents/${created.id}/steps`);
  if (stepRes.status !== 200) process.exit(1);

  // 4. Resolve incident
  const resolveRes = await fetch(`${base}/api/v1/incidents/${created.id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: 'Root Cause: DB connection pool exhaustion\nResolution: Scaled pool to 250 and released connections.',
      resolvedBy: 'Lead SRE',
    }),
  });
  console.log(`[POST ${resolveRes.status}] /api/v1/incidents/${created.id}/resolve`);
  if (resolveRes.status !== 200) process.exit(1);

  // 5. Postmortem
  const pmRes = await fetch(`${base}/api/v1/incidents/${created.id}/postmortem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rootCause: 'Connection leak in payment loop',
      impact: '15 min payment delays',
      timeline: '17:00 - alert, 17:15 - resolved',
      actionItems: ['Add pool metrics alarm'],
    }),
  });
  console.log(`[POST ${pmRes.status}] /api/v1/incidents/${created.id}/postmortem`);
  if (pmRes.status !== 200) process.exit(1);

  // 6. Retain Knowledge
  const retainRes = await fetch(`${base}/api/v1/incidents/${created.id}/retain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      insight: 'Always verify connection.close() in async payment batch routines.',
      tags: ['database', 'payment-api'],
    }),
  });
  console.log(`[POST ${retainRes.status}] /api/v1/incidents/${created.id}/retain`);
  if (retainRes.status !== 200) process.exit(1);

  console.log('\n>>> ALL OPSMIND ENDPOINTS & CLOSED-LOOP WORKFLOWS PASSED WITH 100% SUCCESS! <<<');
}

runTests();
