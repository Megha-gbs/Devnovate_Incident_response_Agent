# OPSMIND --- AI-Powered Incident Response Agent

> **Incident Intelligence for faster, safer, and more explainable
> incident resolution.**

OPSMIND is an AI-powered incident response platform that helps operators
move from an incoming alert to investigation, evidence-backed analysis,
controlled remediation, verification, resolution, and an auditable
incident report.

## Live Application

**OPSMIND:** https://devnovate-incident-response-agent.vercel.app/

## Repository

**Source Code:**
https://github.com/Megha-gbs/Devnovate_Incident_response_Agent

**Backend Documentation:**
https://github.com/Megha-gbs/Devnovate_Incident_response_Agent/blob/main/backend/README.md

------------------------------------------------------------------------

## ✨ What OPSMIND Does

OPSMIND brings the incident investigation workflow into one structured
system:

``` text
Alert / Incident
       ↓
Incident Intake
       ↓
Investigation
       ↓
Evidence Collection
       ↓
AI Analysis
       ↓
Recommended Action
       ↓
Human Approval
       ↓
Controlled Execution
       ↓
Verification
       ↓
Resolution
       ↓
Report + Audit Timeline
```

The AI does not directly execute arbitrary commands or independently
modify infrastructure. Recommended remediation actions pass through an
explicit human approval step before execution.

## 🧠 Core Capabilities

### Incident Intelligence

-   Create and manage incidents
-   Track incident lifecycle and severity
-   View incident details and current state
-   Maintain a structured incident timeline

### AI-Assisted Investigation

-   Collect simulated operational evidence
-   Analyze logs and metrics
-   Produce structured analysis
-   Distinguish observed evidence from inferred information and
    hypotheses
-   Generate recommended remediation actions

### Human-in-the-Loop Remediation

``` text
Recommendation
      ↓
AWAITING_APPROVAL
      ↓
Approve / Reject
      ↓
Execute approved action
      ↓
Verify recovery
```

### Verification & Resolution

After an approved action is executed, OPSMIND verifies the simulated
environment and moves the incident toward resolution when recovery is
confirmed.

### Auditability

The system maintains a timeline of agent and operator events so the
incident journey can be reviewed after resolution.

### Knowledge & Intelligence

The frontend includes an organizational intelligence experience for
presenting historical incident context and memory-oriented information.

------------------------------------------------------------------------

## 🏗️ Architecture

``` text
┌───────────────────────────────────────────────┐
│                  OPSMIND UI                   │
│              Next.js / React / UI             │
└───────────────────────┬───────────────────────┘
                        │ REST
                        ▼
┌───────────────────────────────────────────────┐
│                  FastAPI                      │
│              /api/* endpoints                 │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                IncidentAgent                 │
│                                               │
│ Investigator → Analyzer → Responder →         │
│ Reporter                                       │
└───────┬───────────────┬───────────────┬───────┘
        │               │               │
        ▼               ▼               ▼
     Tools           Groq /          Reports &
  Logs / Metrics      Fallback        Timeline
  Deployments
        │
        ▼
┌───────────────────────────────────────────────┐
│              SQLAlchemy + SQLite              │
│          PostgreSQL-compatible via URL        │
└───────────────────────────────────────────────┘
```

Secrets stay in environment variables and are never returned in API
responses.

------------------------------------------------------------------------

## 🔄 Incident Lifecycle

``` text
NEW
 ↓
ACKNOWLEDGED
 ↓
INVESTIGATING
 ↓
ANALYZING
 ↓
AWAITING_APPROVAL
 ↓
REMEDIATING
 ↓
VERIFYING
 ↓
RESOLVED
```

Additional states:

``` text
ESCALATED
FAILED
```

Evidence is classified as: - **Observed** --- directly supported by
collected evidence - **Inferred** --- derived from available evidence -
**Hypothesis** --- suspected but not confirmed

------------------------------------------------------------------------

## 🧩 Technology Stack

  Layer                  Technology
  ---------------------- ----------------------------------
  Frontend               Next.js / React
  Styling                Tailwind CSS
  Backend                FastAPI
  Language               Python 3.11
  Database               SQLAlchemy + SQLite
  Production DB Option   PostgreSQL
  Validation             Pydantic v2
  AI                     Groq with deterministic fallback
  Realtime               Server-Sent Events (SSE)
  Testing                pytest + FastAPI TestClient
  Frontend Deployment    Vercel

------------------------------------------------------------------------

## 📁 Project Structure

``` text
Devnovate_Incident_response_Agent/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── agents/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── db/
│   │   ├── core/
│   │   └── utils/
│   ├── data/
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
└── frontend/
    └── ...
```

------------------------------------------------------------------------

# 🚀 Quick Start

## Backend

``` bash
cd backend
python -m venv .venv
```

### Windows

``` bash
.venv\Scripts\activate
```

### macOS / Linux

``` bash
source .venv/bin/activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Create environment configuration:

### Windows

``` bash
copy .env.example .env
```

### macOS / Linux

``` bash
cp .env.example .env
```

Start the backend:

``` bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

``` text
http://127.0.0.1:8000
```

API documentation:

``` text
http://127.0.0.1:8000/docs
```

------------------------------------------------------------------------

# 🔐 Environment Configuration

  Variable                  Purpose
  ------------------------- ------------------------------------
  `GROQ_API_KEY`            Groq API key
  `GROQ_MODEL`              Groq model identifier
  `DATABASE_URL`            Database connection URL
  `CORS_ORIGINS`            Allowed frontend origins
  `AUTO_APPROVE_LOW_RISK`   Remediation approval configuration

Default local database:

``` text
sqlite:///./incident_agent.db
```

Never commit `.env` or real credentials.

The deterministic analysis fallback can drive the structured incident
workflow when Groq is unavailable.

------------------------------------------------------------------------

# 🔌 API

  Method   Endpoint                                            Purpose
  -------- --------------------------------------------------- -----------------------------
  GET      `/api/health`                                       Service health
  POST     `/api/incidents`                                    Create incident
  GET      `/api/incidents`                                    List incidents
  GET      `/api/incidents/{id}`                               Get incident
  PATCH    `/api/incidents/{id}`                               Update incident
  POST     `/api/alerts`                                       Convert alert into incident
  POST     `/api/incidents/{id}/investigate`                   Collect evidence
  POST     `/api/incidents/{id}/analyze`                       Generate analysis
  GET      `/api/incidents/{id}/analysis`                      Retrieve analysis
  GET      `/api/incidents/{id}/actions`                       Retrieve actions
  POST     `/api/incidents/{id}/actions/{action_id}/approve`   Approve
  POST     `/api/incidents/{id}/actions/{action_id}/reject`    Reject
  POST     `/api/incidents/{id}/actions/{action_id}/execute`   Execute
  GET      `/api/incidents/{id}/timeline`                      Audit timeline
  POST     `/api/incidents/{id}/resolve`                       Resolve/escalate
  GET      `/api/incidents/{id}/report`                        Final report
  GET      `/api/incidents/{id}/events`                        SSE status stream
  GET      `/api/demo/scenarios`                               Demo scenarios
  POST     `/api/demo/scenarios/{id}/start`                    Start demo

Responses use:

``` json
{
  "success": true,
  "data": {},
  "error": null
}
```

The live OpenAPI documentation at `/docs` is the authoritative HTTP
contract.

------------------------------------------------------------------------

# 🎬 Demo Scenario

Start the Payment API scenario:

``` bash
curl -X POST http://127.0.0.1:8000/api/demo/scenarios/payment-api-outage/start
```

The scenario creates an incident, investigates it, analyzes it, and
stops at human approval.

``` text
Start Scenario
      ↓
Incident Created
      ↓
Investigation
      ↓
AI Analysis
      ↓
Recommended Action
      ↓
AWAITING_APPROVAL
      ↓
Human Approval
      ↓
Execute
      ↓
Verification
      ↓
RESOLVED
      ↓
Report + Timeline
```

Approve the recommended action:

``` bash
curl -X POST http://127.0.0.1:8000/api/incidents/INCIDENT_ID/actions/ACTION_ID/approve ^
  -H "Content-Type: application/json" ^
  -d "{\"approved_by\":\"operator\",\"comment\":\"Approved\"}"
```

Then execute:

``` bash
curl -X POST http://127.0.0.1:8000/api/incidents/INCIDENT_ID/actions/ACTION_ID/execute
```

------------------------------------------------------------------------

# 🧪 Testing

``` bash
cd backend
pytest -q
```

Coverage includes incident creation and retrieval, validation, lifecycle
transitions, structured analysis, investigation tools, approval gates,
remediation execution, failure handling, and the end-to-end lifecycle:

``` text
Alert
 ↓
Investigate
 ↓
Analyze
 ↓
Approve
 ↓
Execute
 ↓
Verify
 ↓
Resolve
 ↓
Report
```

------------------------------------------------------------------------

# 🖥️ Frontend

Live application:

**https://devnovate-incident-response-agent.vercel.app/**

The interface provides:

-   Dashboard
-   Incident management
-   Incident intelligence
-   Historical/memory-oriented information
-   AI analysis
-   Investigation workflow
-   Recommended actions
-   Approval workflow
-   Resolution visibility
-   Operational status

The frontend communicates with the backend through the documented REST
API.

------------------------------------------------------------------------

# 🔒 Safety & Security

### Human approval

Recommended remediation actions require explicit approval before
execution.

### Allowlisted actions

Remediation operations are restricted to known actions.

### No arbitrary shell execution

The AI layer does not directly execute arbitrary shell commands.

### Secret protection

API keys remain in environment variables and are not returned through
API responses.

### Structured AI output

LLM output is validated using Pydantic schemas.

### Audit trail

Agent and operator actions are recorded in the incident timeline.

------------------------------------------------------------------------

# 📊 Example Incident

``` text
Incident:
Payment API error rate > 40%

Severity:
CRITICAL

Affected Service:
payment-api

Observed evidence:
- Payment API failures
- Database connection errors
- Connection pool exhaustion indicators

AI analysis:
Payment requests are failing because the database
connection pool is exhausted.

Recommended action:
Increase database connection pool capacity.

Risk:
MEDIUM

Approval:
REQUIRED
```

The workflow deliberately separates:

``` text
Observed Evidence
        ↓
Inference
        ↓
Hypothesis
        ↓
Recommended Action
        ↓
Human Approval
        ↓
Execution
        ↓
Verification
```

------------------------------------------------------------------------

# 🌐 Deployment

Current frontend deployment:

**https://devnovate-incident-response-agent.vercel.app/**

For local development, configure the frontend to use:

``` text
http://127.0.0.1:8000/api
```

For production, configure the frontend API base URL to point to the
deployed backend.

Never expose backend credentials or AI API keys through public frontend
configuration.

------------------------------------------------------------------------

# 🛠️ Troubleshooting

### Backend does not start

Verify Python:

``` bash
python --version
```

Python 3.11 is recommended.

Then:

``` bash
pip install -r requirements.txt
```

### CORS errors

Check `CORS_ORIGINS` and ensure the frontend origin is allowed.

### AI uses fallback mode

Check:

``` text
GROQ_API_KEY
GROQ_MODEL
```

### Frontend cannot reach backend

Verify:

``` text
http://127.0.0.1:8000/api/health
```

Then check the frontend API base URL.

### Action cannot execute

Remediation is intentionally approval-gated:

``` text
Recommendation
→ Approve
→ Execute
→ Verify
```

------------------------------------------------------------------------

# 🗺️ Roadmap

Potential future improvements:

-   Real log backends such as Loki or CloudWatch
-   PostgreSQL with Alembic migrations
-   Operator authentication
-   Slack / PagerDuty integrations
-   Expanded organizational memory
-   More incident scenarios
-   Safer dry-run automation
-   Deeper analytics and incident trends

------------------------------------------------------------------------

## OPSMIND

**Incident Intelligence**

From:

``` text
Alert → Guess → Fix → Document
```

to:

``` text
Alert
  ↓
Investigate
  ↓
Understand
  ↓
Recommend
  ↓
Approve
  ↓
Act
  ↓
Verify
  ↓
Resolve
  ↓
Learn
```

---

# 📝 Engineering Deep Dive

A detailed engineering write-up about the incident-memory architecture and the system's behavior when Hindsight is unavailable is available on DEV Community:

**I let first principles take over when Hindsight is unavailable**  
https://dev.to/mohith_kumarkinthada_29e/i-let-first-principles-take-over-when-hindsight-is-unavailable-57gj

The article explains several important design principles behind OPSMIND, including:

- Treating Hindsight recall as a dependency with explicit success, empty-result, and error states
- Building retrieval queries from structured incident fields
- Keeping retrieved-memory provenance outside the language model
- Preventing the model from inventing memory identifiers or citations
- Retaining useful post-incident lessons rather than raw incident volume
- Sanitizing retained content before it enters long-term memory
- Keeping the investigation useful even when Hindsight is unavailable
- Using a deterministic first-principles baseline when memory or model reasoning is unavailable
- Separating current incident evidence from historical context so prior incidents inform an investigation without being treated as proof

This engineering approach is central to OPSMIND's goal of making AI-assisted incident investigation more reliable, inspectable, and resilient.
