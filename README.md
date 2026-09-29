# OPSMIND — Autonomous Incident Intelligence Platform

> **End-to-End Integrated SRE Incident Response Platform powered by Hindsight Organizational Memory and AI Diagnostic Reasoning.**

OPSMIND unifies historical incident post-mortems, real-time telemetry, semantic similarity recall, and human-in-the-loop remediation into a single enterprise-grade SRE platform.

---

## Architecture Overview

```
                           +-----------------------------------------------+
                           |          OPSMIND Next.js 14 Frontend          |
                           |   (Midnight Operations Design System)         |
                           +-----------------------+-----------------------+
                                                   | HTTP / REST (Fetch API)
                                                   v
                           +-----------------------------------------------+
                           |            FastAPI Backend Gateway            |
                           |         (/api and /api/v1 dual routes)        |
                           +-------+-------------------------------+-------+
                                   |                               |
                   +---------------+                               +---------------+
                   v                                                               v
+---------------------------------------+                       +---------------------------------------+
|        Mohith's AI Reasoning          |                       |         Smruthi's Remediation         |
|             Agent Engine              |                       |           Lifecycle Engine            |
|  - Groq Llama-3.3-70B                 |                       |  - Human Approval Gateway             |
|  - Deterministic Diagnostic Fallback  |                       |  - Action Verification (Rollbacks,    |
|  - Multi-hypothesis ranking           |                       |    Thread/Connection Pool Scaling)    |
|  - Actionable steps recommendation    |                       |  - SQLite / PostgreSQL Persistence   |
+------------------+--------------------+                       +-------------------+-------------------+
                   |                                                                |
                   v                                                                v
+-------------------------------------------------------------------------------------------------------+
|                                Hindsight Organizational Memory Layer                                  |
|  - Dual-mode architecture:                                                                            |
|      1. Hindsight Cloud Client (when HINDSIGHT_API_KEY is present)                                    |
|      2. In-Memory Semantic Store loaded with Yashwanth's 30 Curated SRE Incidents                     |
|  - Real Jaccard & keyword token overlap similarity calculation (0.0 to 1.0)                           |
|  - Runtime post-mortem learning loop (newly retained incidents immediately searchable in memory)      |
+-------------------------------------------------------------------------------------------------------+
```

---

## Integrated Team Contributions

1. **Mohith (Agent + Hindsight):** `agent/` and `hindsight/` modules implementing recall query building, memory sanitization, prompt context engineering, and post-mortem retention.
2. **Smruthi (FastAPI Backend + Database):** Canonical SQLite/PostgreSQL models, state machine transitions, REST API endpoints, and safe automated remediation actions with approval gates.
3. **Yashwanth (Dataset + Evaluation):** 30 production incident schemas across 8 real-world failure scenarios (`data/historical/incidents/`) + evaluation benchmark harness (`evaluation/run_eval.py`).
4. **Meghana (Next.js 14 Frontend):** Enterprise dark-mode SRE dashboard, dynamic incident workspace, interactive investigation steps checklist, memory visualization cards, and postmortem authoring interface.
5. **Sireesha (Integration & Verification):** Comprehensive smoke test suite (`scripts/smoke_test.py`) proving the complete 11-step lifecycle and continuous organizational learning loop.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ (tested on Node v20/v24)
- npm 9+

### 2. Setup Virtual Environment & Dependencies
```bash
# Setup Python virtual environment
python -m venv .venv
.venv\Scripts\activate       # On Windows
# source .venv/bin/activate  # On macOS/Linux

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```
*(No API keys are required to run offline. OPSMIND includes an indexed semantic memory engine over Yashwanth's 30 historical incidents and deterministic diagnostic fallbacks when `GROQ_API_KEY` or `HINDSIGHT_API_KEY` are not set).*

### 4. Run the Full Application

**Start Backend (Terminal 1):**
```bash
npm run dev:backend
# Runs FastAPI on http://localhost:8000 (API Docs: http://localhost:8000/docs)
```

**Start Frontend (Terminal 2):**
```bash
npm run dev:frontend
# Runs Next.js UI on http://localhost:3000
```

---

## Verification & Test Commands

OPSMIND features a unified monorepo test runner:

| Command | Description | Status |
| :--- | :--- | :--- |
| `npm run test:e2e` | Runs the 11-step end-to-end integration and learning loop verification | **PASSED (11/11)** |
| `npm run test:backend` | Runs Smruthi's FastAPI & remediation pytest suite (`backend/tests/`) | **PASSED (22/22)** |
| `npm run test:unit` | Runs Mohith's Agent & Hindsight pytest suite (`tests/`) | **PASSED (27 passed, 1 skipped)** |
| `npm run demo:agent` | Runs Mohith's full CLI investigation & memory demo | **PASSED** |
| `npm run eval:agent` | Runs Yashwanth's 8 evaluation scenarios benchmark harness | **PASSED** |
| `npm run build:frontend` | Compiles and builds production Next.js bundle | **PASSED (Code 0)** |

---

## The 10-Step Incident Lifecycle & Learning Loop

1. **System Health:** Endpoint `/api/v1/health` confirms operational status and 30 indexed historical incidents.
2. **Incident Creation:** Operator or alert system logs an incident (`POST /api/v1/incidents`).
3. **Workspace Retrieval:** SRE views the incident workspace at `/incidents/[id]`.
4. **Trigger AI Analysis:** Operator clicks **"Analyze Incident"** (`POST /api/v1/incidents/[id]/analyze`).
5. **Memory Recall:** Hindsight correlates symptoms with historical incidents, ranking similarity and providing technical explanations.
6. **Hypothesis Generation:** AI generates ranked root-cause hypotheses with citations to historical incidents.
7. **Actionable Steps:** Recommended investigation actions appear in an interactive checklist.
8. **Step Execution:** Operator toggles step status ("WORKED", "FAILED") with notes, appending directly to the vertical audit timeline.
9. **Resolution & Post-Mortem:** Incident is transitioned to RESOLVED; root cause, impact, and action items are saved.
10. **Knowledge Retention:** Operator clicks **"Retain Knowledge into Memory"** (`POST /api/v1/incidents/[id]/retain`).
11. **Learning Loop Proof:** When a similar incident occurs later, the newly retained incident is **recalled first** in the memory panel with full remediation context!
