# Incident Response Agent — Backend

AI-powered incident response backend for our hackathon. It is a real IR workflow with state, evidence, human approval, mock remediation, verification, and an audit trail — not a chatbot wrapped in an API.

The frontend is built separately. This service is the integration contract.

**Local API base URL:** `http://127.0.0.1:8000/api`  
**Interactive docs:** `http://127.0.0.1:8000/docs`

---

## 1. Project overview

Operators get flooded with alerts. They still have to search logs, guess a root cause, pick a fix, and write the report. This backend automates that loop:

1. Ingest an alert (or start a mock scenario).
2. Open an incident and keep it in a strict lifecycle.
3. Collect logs, metrics, deployments, and related history via **tools**.
4. Ask Groq (or a heuristic fallback) for a **structured** analysis.
5. Recommend an allowlisted action.
6. Wait for a human to approve or reject.
7. Execute the mock action, verify recovery, resolve, and emit a report.

The LLM never runs shell commands and never talks to the database by itself.

---

## 2. Problem being solved

Incident response is slow because investigation, reasoning, and change control live in different tools. We combine them:

| Gap today | What this system does |
| --- | --- |
| Alerts without context | Normalizes alerts into incidents |
| Manual log diving | Tool-based investigation |
| Unstructured LLM chat | Validated JSON analysis |
| Risky auto-remediation | Human-in-the-loop approval |
| No audit | Timeline of every agent/operator event |

---

## 3. Architecture

```
Frontend (separate)
        │  REST + optional SSE
        ▼
FastAPI  /api/*
        │
        ▼
IncidentAgent (orchestrator)
   ├── Investigator  → tools (logs, status, metrics, deploys)
   ├── Analyzer      → GroqService → Groq LLM  (or heuristic fallback)
   ├── Responder     → recommended actions (always approval-gated)
   └── Reporter      → report from stored state
        │
        ▼
SQLAlchemy  (SQLite now, PostgreSQL later via DATABASE_URL)
```

Secrets stay in environment variables. API keys are never returned in JSON.

---

## 4. Agent workflow

```
ALERT
  → Incident intake (NEW)
  → Acknowledge
  → Investigate (tools collect evidence)
  → Analyze (structured LLM / fallback)
  → Recommend action
  → AWAITING_APPROVAL  ← UI shows Approve / Reject
  → Execute allowlisted mock action
  → Verify metrics
  → RESOLVED (or ESCALATED / FAILED)
  → Report + timeline
```

**States:** `NEW` → `ACKNOWLEDGED` → `INVESTIGATING` → `ANALYZING` → `AWAITING_APPROVAL` → `REMEDIATING` → `VERIFYING` → `RESOLVED`  
Also: `ESCALATED`, `FAILED`.

Illegal transitions return **409**.

The agent labels evidence as **observed**, **inferred**, or **hypothesis**. A suspected root cause is never treated as a confirmed fact.

---

## 5. Technology stack

| Layer | Choice | Why |
| --- | --- | --- |
| API | FastAPI | Fast, typed, auto OpenAPI for the frontend |
| DB | SQLAlchemy 2 + SQLite | Simple locally; swap URL for Postgres |
| Validation | Pydantic v2 | Request schemas + LLM output schemas |
| LLM | Groq (`GROQ_API_KEY`, `GROQ_MODEL`) | Isolated in `groq_service.py` |
| Realtime | SSE `GET /api/incidents/{id}/events` | Status feed for the UI |
| Tests | pytest + TestClient | Lifecycle coverage without Groq |

---

## 6. Folder structure

```
backend/
  app/
    main.py                 # FastAPI app, CORS, error handlers
    api/                    # HTTP routes only
    agents/                 # IR orchestration (no raw SQL)
    services/               # Groq, persistence, simulation, events
    tools/                  # Allowlisted investigation + remediation
    models/                 # SQLAlchemy
    schemas/                # Request/response + analysis contract
    db/                     # Engine, sessions, create_all
    core/                   # Settings, security allowlist
    utils/
  data/                     # Sample alerts / logs / incidents
  tests/
  .env.example
  requirements.txt
  README.md
```

---

## 7. Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env    # Windows
# cp .env.example .env    # macOS / Linux
```

Put your Groq key in `.env` if you have one. **The demo works without it** (heuristic fallback).

Never commit `.env`.

---

## 8. Environment variables

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq API key (optional for demo) |
| `GROQ_MODEL` | Groq model id |
| `DATABASE_URL` | Default `sqlite:///./incident_agent.db` |
| `HACKWITHHYD_API_KEY` | Reserved; leave empty for now |
| `HACKWITHHYD_BASE_URL` | Reserved; leave empty for now |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `AUTO_APPROVE_LOW_RISK` | Kept `false`; remediations still require approval |

Postgres later:

```
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/incident_agent
```

---

## 9. Running the backend

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check:

```bash
curl http://127.0.0.1:8000/api/health
```

---

## 10. API endpoints

All responses look like:

```json
{ "success": true, "data": {}, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": "Incident INC-NOPE not found" }
```

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness + whether Groq is configured |
| POST | `/api/incidents` | Create incident |
| GET | `/api/incidents` | List (`?status=NEW`) |
| GET | `/api/incidents/{id}` | Detail |
| PATCH | `/api/incidents/{id}` | Update fields / legal status |
| POST | `/api/alerts` | Ingest alert → incident |
| POST | `/api/incidents/{id}/investigate` | Collect logs/metrics |
| POST | `/api/incidents/{id}/analyze` | Structured analysis + recommendations |
| GET | `/api/incidents/{id}/analysis` | Stored analysis |
| GET | `/api/incidents/{id}/actions` | Recommended actions |
| POST | `/api/incidents/{id}/actions/{action_id}/approve` | Human approve |
| POST | `/api/incidents/{id}/actions/{action_id}/reject` | Human reject |
| POST | `/api/incidents/{id}/actions/{action_id}/execute` | Run allowlisted mock action |
| GET | `/api/incidents/{id}/timeline` | Audit trail |
| POST | `/api/incidents/{id}/resolve` | Resolve or escalate |
| GET | `/api/incidents/{id}/report` | Final report |
| GET | `/api/incidents/{id}/events` | SSE status stream |
| GET | `/api/demo/scenarios` | Mock scenarios |
| POST | `/api/demo/scenarios/{id}/start` | Create + investigate + analyze (stops for approval) |

---

## 11. Example requests

**Start the polished Payment API demo (recommended for UI):**

```bash
curl -X POST http://127.0.0.1:8000/api/demo/scenarios/payment-api-outage/start
```

**Approve then execute** (replace IDs from the response):

```bash
curl -X POST http://127.0.0.1:8000/api/incidents/INC-XXXXXXXX/actions/ACT-XXXXXXXX/approve ^
  -H "Content-Type: application/json" ^
  -d "{\"approved_by\": \"sre\", \"comment\": \"Approved for demo\"}"

curl -X POST http://127.0.0.1:8000/api/incidents/INC-XXXXXXXX/actions/ACT-XXXXXXXX/execute
```

**Create an incident manually:**

```json
POST /api/incidents
{
  "title": "Payment API outage",
  "description": "Checkout failing",
  "severity": "CRITICAL",
  "priority": "P1",
  "affected_service": "payment-api",
  "scenario_id": "payment-api-outage"
}
```

---

## 12. Example responses

**Create / start scenario (trimmed):**

```json
{
  "success": true,
  "data": {
    "incident_id": "INC-A1B2C3D4",
    "title": "Payment API error rate > 40%",
    "status": "AWAITING_APPROVAL",
    "severity": "CRITICAL",
    "affected_service": "payment-api",
    "observations": [
      "Observed ERROR/FATAL log lines. Example: payment-api: Unable to obtain database connection"
    ],
    "suspected_root_cause": "payment-api is failing because the payments-db connection pool is exhausted...",
    "root_cause_confidence": 0.72,
    "recommended_actions": [
      {
        "id": "ACT-11111111",
        "action_type": "increase_db_pool",
        "target": "payments-db",
        "risk": "medium",
        "requires_approval": true,
        "status": "pending"
      }
    ],
    "agent_analysis": {
      "summary": "...",
      "evidence": [
        { "kind": "observed", "statement": "...", "source": "logs" },
        { "kind": "hypothesis", "statement": "...", "source": "heuristic-analyzer" }
      ],
      "requires_human_approval": true,
      "fallback_used": true
    }
  },
  "error": null
}
```

After execute, `status` becomes `RESOLVED`, and `verification_result.healthy` is `true`.

---

## 13. Mock incident scenarios

| ID | Story |
| --- | --- |
| `payment-api-outage` | **Demo scenario.** 503s caused by DB pool exhaustion |
| `db-connection-exhaustion` | orders-api scaled out and starved Postgres |
| `high-cpu` | search-api CPU 97% |
| `memory-leak` | worker RSS after deploy 1.9.0 |
| `auth-failure-spike` | 401s after secret rotation |
| `suspicious-logins` | admin brute force |
| `api-latency-spike` | catalog p99 + Redis evictions |
| `deployment-failure` | billing-api canary missing env |

`POST /api/demo/scenarios/{id}/start` loads simulated logs/metrics and runs the agent until **approval**.

---

## 14. AI / Groq configuration

- All LLM calls go through `app/services/groq_service.py`.
- Model comes from `GROQ_MODEL`.
- Output must match `AgentAnalysis` (Pydantic). Invalid JSON → heuristic fallback.
- If `GROQ_API_KEY` is missing, the same fallback runs so judges still see the full lifecycle.

The fallback **does not invent services**. It uses the simulated world’s logs and metrics.

---

## 15. Security considerations

- No secrets in source or API bodies.
- Remediation allowlist in `app/core/security.py`.
- LLM cannot execute shell or invent a new tool name.
- Execution requires `approved` status.
- Action audit events on the timeline.
- Input validation via Pydantic.
- Generic 4xx messages; Groq errors never include the API key.

---

## 16. Testing

```bash
cd backend
pytest -q
```

Coverage includes create/get/validation, illegal transitions, JSON parsing, tools, approval gates, failed mock execution, and a full e2e path:

`alert → investigate → analyze → approve → execute → verify → resolve → report`

---

## 17. Frontend integration

1. Base URL: `http://127.0.0.1:8000/api` (Vite proxy optional).
2. CORS allows localhost / 127.0.0.1 on any port in development.
3. Use `/docs` as the live contract (OpenAPI).
4. Suggested UI flow:
   - List scenarios → `POST /demo/scenarios/payment-api-outage/start`
   - Show observations vs hypothesis vs recommended action
   - Buttons: Approve / Reject
   - On approve: `execute`, then show verification + report
   - Optional: EventSource on `/incidents/{id}/events`
5. Envelope is always `{ success, data, error }`.
6. Do not depend on Python internals — only this HTTP API.

Demo one-click path for judges:

1. Start scenario  
2. Show `AWAITING_APPROVAL`  
3. Approve  
4. Execute  
5. Show `RESOLVED` + report timeline  

---

## 18. Future improvements

- Wire `HACKWITHHYD_*` when credentials exist
- Real log backends (Loki / CloudWatch)
- PostgreSQL + Alembic migrations
- AuthN for operators
- Slack/PagerDuty via `notification_service`
- Auto-approve only for explicitly safe, dry-run actions

---

## Assumption log

- The git repo was **empty**, so this backend was created from scratch.
- SQLite is the local database; Postgres is a URL change, not a rewrite.
- External HackWithHyd APIs are stubbed until keys are provided.
- All remediations are **simulated** and require human approval.
- Without Groq, a deterministic heuristic analyzer still drives the demo.
