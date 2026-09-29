# OPSMIND & Incident Response Agent — Integration Guide

This repository contains the complete **OPSMIND** platform:
1. **`frontend/`**: Next.js 14 / TypeScript enterprise SRE control room and AI investigation workspace ("Midnight Operations" design language).
2. **`incident_response_agent/`**: The AI-powered Incident Response Agent cloned from [`Megha-gbs/Devnovate_Incident_response_Agent`](https://github.com/Megha-gbs/Devnovate_Incident_response_Agent), featuring FastAPI backend, Groq LLM reasoning, Hindsight memory recall, and 30 historical incident post-mortems.

---

## Workspace Structure

```
dev_aton/
├── package.json                   # Root monorepo scripts
├── INTEGRATION.md                 # This integration guide
├── frontend/                      # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/                   # App Router pages and internal API routes
│   │   ├── components/            # UI components (dashboard, incident, memory graph)
│   │   ├── hooks/                 # React hooks (useIncident, useInvestigation)
│   │   └── lib/api/               # Universal API client with auto-normalizer
│   ├── .env.example               # Frontend environment template
│   └── package.json
└── incident_response_agent/       # AI Incident Response Agent & Backend
    ├── backend/                   # FastAPI REST API (port 8000)
    │   ├── app/
    │   │   ├── api/               # Incidents, alerts, analysis, reports endpoints
    │   │   ├── agents/            # IncidentAgent orchestrator
    │   │   └── core/              # Config, logging, exceptions
    │   └── requirements.txt
    ├── agent/                     # Core agent logic and reasoning prompts
    ├── hindsight/                 # Hindsight memory vector recall engine
    ├── data/                      # 30 historical incidents, postmortems, eval scenarios
    ├── evaluation/                # Test harness and validation scenarios
    ├── demo.py                    # End-to-end CLI demonstration
    └── README.md
```

---

## Quickstart

### 1. Start the Backend (`incident_response_agent`)

```bash
cd incident_response_agent/backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env

# Run FastAPI on port 8000
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- API Base URL: `http://127.0.0.1:8000/api`

---

### 2. Start the Frontend (`frontend`)

```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) (or port configured in Next.js).

---

## Connecting Frontend to Backend

In `frontend/.env.local`:

```env
# Point directly to the FastAPI backend API prefix
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Disable mock fallback to communicate exclusively with the live backend
NEXT_PUBLIC_USE_MOCK_API=false
```

### Standalone Mode (No Backend Needed)
If you want to run the frontend independently without spinning up Python/FastAPI:
- Leave `NEXT_PUBLIC_API_BASE_URL=` empty or set `NEXT_PUBLIC_USE_MOCK_API=true`.
- The frontend includes built-in Next.js route handlers (`src/app/api/v1/*`) and mock data with 100% working interactive features.

---

## Root Monorepo Commands

From the workspace root (`dev_aton`):

```bash
# Start frontend
npm run dev:frontend

# Build frontend production bundle
npm run build:frontend

# Start backend
npm run dev:backend

# Run agent CLI demo scenario
npm run demo:agent

# Run dataset evaluation harness
npm run eval:agent
```

---

## Architectural Data Flow

```
[ Engineer in OPSMIND UI ]
          │
          │ HTTP REST (normalized envelope)
          ▼
[ FastAPI Backend /api/incidents ]
          │
          ▼
[ IncidentAgent Orchestrator ]
    ├── Investigator  ──► Diagnostic Tools & Logs
    ├── Memory Recall ──► Hindsight Vector Store (30 historical incidents)
    ├── Analyzer      ──► Groq LLM (Structured Hypotheses & Citations)
    └── Responder     ──► Actionable Investigation Steps (Approval-Gated)
          │
          ▼
[ Operational Memory Loop ]
    Incident Resolved ──► Post-Mortem Form ──► Approved & Retained in Hindsight
```
