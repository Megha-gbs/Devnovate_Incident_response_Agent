You are the lead backend and AI-agent engineer for our hackathon project.

We are building an **AI-powered Incident Response Agent**. I am responsible for the complete backend and agent/AI layer. Another teammate is building the UI/UX separately. Later, we will use Antigravity to integrate the frontend and backend and prepare the final hackathon-ready product.

Your job is to design and implement a **production-quality, hackathon-demo-ready backend** that is modular, reliable, easy to understand, and easy for another developer/frontend team to integrate.

IMPORTANT:

* Do NOT blindly generate code.
* First inspect the existing repository completely.
* Understand the current files, dependencies, and project structure.
* If the repository is empty, create the architecture from scratch.
* Reuse existing working code when possible.
* Do not unnecessarily introduce complicated technologies.
* Prefer simple, robust, explainable implementations.
* Every major design decision should support our incident-response use case.
* The application must be runnable locally.
* Never hard-code API keys, passwords, tokens, or secrets.
* Use environment variables and provide a `.env.example`.
* Do not commit `.env`.
* Add proper error handling and validation.
* Write clean, beginner-readable code because I need to understand and explain the implementation during the hackathon.

==================================================

1. FIRST: UNDERSTAND THE PROJECT
   ==================================================

Before writing substantial code:

1. Inspect the entire repository.
2. Identify:

   * existing frontend/backend
   * programming languages
   * frameworks
   * package managers
   * existing APIs
   * databases
   * configuration
   * README/documentation
   * existing datasets/mock data
3. Determine what can be reused.
4. Identify missing backend components.
5. Create a concise architecture plan.
6. Show me the proposed folder structure.
7. Show me the API design.
8. Show me the agent workflow.
9. Show me the database/data model.
10. Only after this understanding, begin implementation.

Do not destroy or overwrite useful existing work.

==================================================
2. RECOMMENDED BACKEND ARCHITECTURE
===================================

Use a modular architecture similar to:

backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── incidents.py
│   │   ├── alerts.py
│   │   ├── analysis.py
│   │   ├── actions.py
│   │   ├── reports.py
│   │   └── health.py
│   │
│   ├── agents/
│   │   ├── incident_agent.py
│   │   ├── analyzer.py
│   │   ├── investigator.py
│   │   ├── responder.py
│   │   └── reporter.py
│   │
│   ├── services/
│   │   ├── groq_service.py
│   │   ├── incident_service.py
│   │   ├── log_service.py
│   │   ├── action_service.py
│   │   └── notification_service.py
│   │
│   ├── tools/
│   │   ├── log_search.py
│   │   ├── service_status.py
│   │   ├── system_metrics.py
│   │   └── remediation.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── db/
│   ├── core/
│   └── utils/
│
├── data/
│   ├── sample_incidents/
│   ├── sample_logs/
│   └── sample_alerts/
│
├── tests/
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md

Modify this structure if the existing project requires a better organization.

==================================================
3. CORE INCIDENT RESPONSE WORKFLOW
==================================

Implement the following logical workflow:

ALERT
↓
Incident Intake
↓
Normalize Incident
↓
Classify / Prioritize
↓
Collect Context
↓
Investigate
↓
Analyze Logs / Signals
↓
Identify Possible Root Cause
↓
Generate Response Plan
↓
Human Approval
↓
Execute Approved Action
↓
Verify Result
↓
Resolve / Escalate
↓
Generate Incident Report

The agent must maintain state throughout the incident lifecycle.

Possible states:

NEW
ACKNOWLEDGED
INVESTIGATING
ANALYZING
AWAITING_APPROVAL
REMEDIATING
VERIFYING
RESOLVED
ESCALATED
FAILED

==================================================
4. INCIDENT DATA MODEL
======================

Create a clean incident model containing appropriate fields such as:

* incident_id
* title
* description
* source
* severity
* priority
* category
* status
* created_at
* updated_at
* affected_service
* affected_resources
* alerts
* logs
* observations
* suspected_root_cause
* root_cause_confidence
* recommended_actions
* approved_action
* execution_result
* verification_result
* timeline
* agent_analysis
* resolution_summary

Use proper validation.

Severity should support something like:

LOW
MEDIUM
HIGH
CRITICAL

==================================================
5. API DESIGN
=============

Build clean REST APIs.

At minimum implement:

POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/{incident_id}
PATCH  /api/incidents/{incident_id}

POST   /api/incidents/{incident_id}/analyze
GET    /api/incidents/{incident_id}/analysis

POST   /api/incidents/{incident_id}/investigate

GET    /api/incidents/{incident_id}/actions

POST   /api/incidents/{incident_id}/actions/{action_id}/approve
POST   /api/incidents/{incident_id}/actions/{action_id}/execute

GET    /api/incidents/{incident_id}/timeline

POST   /api/incidents/{incident_id}/resolve

GET    /api/incidents/{incident_id}/report

GET    /api/health

Use appropriate HTTP status codes.

Add request/response schemas.

Return consistent JSON responses.

==================================================
6. AI / GROQ INTEGRATION
========================

Integrate Groq through an isolated service layer.

IMPORTANT:

Never call Groq directly from random API files.

Use:

API
↓
Agent
↓
Groq Service
↓
LLM
↓
Structured Agent Result

The API key must come from:

GROQ_API_KEY

The model must be configurable through:

GROQ_MODEL

Do not hard-code the model name unnecessarily.

Create a `.env.example` such as:

GROQ_API_KEY=
GROQ_MODEL=
DATABASE_URL=
HACKWITHHYD_API_KEY=
HACKWITHHYD_BASE_URL=

The HackWithHyd variables may remain empty because credentials have not yet been provided.

==================================================
7. STRUCTURED AI OUTPUT
=======================

Do NOT allow the LLM to return arbitrary uncontrolled text when the backend needs to make decisions.

Design structured outputs such as:

{
"summary": "...",
"incident_type": "...",
"severity": "HIGH",
"observations": [],
"suspected_root_cause": "...",
"confidence": 0.0,
"evidence": [],
"recommended_actions": [],
"risks": [],
"requires_human_approval": true
}

Validate the response before using it.

If the LLM response is malformed, handle the failure safely.

==================================================
8. AGENT DESIGN
===============

Create an Incident Response Agent that can perform:

1. Incident understanding
2. Alert classification
3. Context gathering
4. Log analysis
5. Correlation of evidence
6. Root-cause hypothesis generation
7. Response recommendation
8. Risk assessment
9. Human approval request
10. Approved action execution
11. Verification
12. Incident summary/report generation

Do NOT pretend the LLM actually knows information that was not provided.

The agent must distinguish between:

* observed evidence
* inferred information
* hypotheses
* recommended actions

For example:

Observed:
"Payment API returned 503 errors 42 times in the last 5 minutes."

Hypothesis:
"The service may be experiencing dependency or resource exhaustion."

Do not present the hypothesis as a confirmed root cause.

==================================================
9. TOOL-BASED AGENT
===================

Implement a safe tool layer.

Potential tools:

* search_logs()
* get_service_status()
* get_recent_metrics()
* get_incident_history()
* get_deployment_info()
* restart_service()
* rollback_deployment()
* scale_service()

Initially, tools can use mock/simulated data.

IMPORTANT:

The LLM must NEVER directly execute arbitrary shell commands.

All actions must pass through explicit backend functions.

Example:

LLM:
"restart payment-api"

Backend:
→ validate action
→ verify service exists
→ verify action is allowed
→ require approval if necessary
→ execute tool
→ record result
→ return result to agent

==================================================
10. HUMAN-IN-THE-LOOP
=====================

This is extremely important.

The AI should recommend potentially dangerous remediation actions but should not automatically execute them unless explicitly configured as safe.

For example:

AI recommendation:

{
"action": "restart_service",
"target": "payment-api",
"reason": "...",
"risk": "medium",
"requires_approval": true
}

Frontend should be able to show:

Recommended Action
↓
Reason
↓
Risk
↓
Expected Result
↓
[Approve]
[Reject]

Backend then handles approval and execution.

==================================================
11. MOCK INCIDENT SIMULATION
============================

Because external HackWithHyd credentials may not be available initially, create realistic simulated incidents.

Include examples such as:

1. Payment API outage
2. Database connection exhaustion
3. High CPU service
4. Memory leak
5. Authentication failure spike
6. Suspicious login activity
7. API latency spike
8. Deployment failure

Create realistic:

* alerts
* logs
* timestamps
* services
* metrics
* dependencies
* possible root causes
* remediation actions

The mock system should allow us to demonstrate the entire agent workflow without requiring external infrastructure.

==================================================
12. DEMO SCENARIO
=================

Create at least one polished end-to-end scenario.

Example:

Payment API starts returning 503 errors.

The system receives:

ALERT:
"Payment API error rate > 40%"

Agent:

1. Creates incident.
2. Assigns severity.
3. Collects relevant logs.
4. Detects repeated database connection failures.
5. Correlates the evidence.
6. Produces a root-cause hypothesis.
7. Recommends remediation.
8. Requests human approval.
9. Executes the approved mock action.
10. Verifies recovery.
11. Marks incident resolved.
12. Generates a final incident report.

This scenario must be easy to demonstrate from the frontend.

==================================================
13. DATABASE
============

Choose a simple database appropriate for the project.

For local development, SQLite is acceptable if there is no existing database requirement.

Design the system so that PostgreSQL can be used later without major architectural changes.

Separate:

* database models
* schemas
* services
* API routes

Do not put database queries everywhere.

==================================================
14. REAL-TIME UPDATES
=====================

If useful for the UI, provide a clean mechanism for incident status updates.

Prefer a simple approach such as:

* Server-Sent Events

or

* WebSocket

Only implement this if it provides meaningful value.

The frontend should eventually be able to display:

Incident detected
↓
Agent investigating
↓
Logs collected
↓
Root cause identified
↓
Action recommended
↓
Awaiting approval
↓
Action executed
↓
Recovery verified
↓
Resolved

==================================================
15. SECURITY
============

Implement basic security practices:

* environment variables
* input validation
* safe error messages
* no secret leakage
* no API keys in source code
* no arbitrary command execution
* action allowlisting
* approval checks
* logging/auditing of actions

Never expose secrets through API responses.

==================================================
16. LOGGING / AUDIT TRAIL
=========================

Every important agent operation should be traceable.

Record:

* timestamp
* incident_id
* actor
* event
* action
* result
* metadata

Example:

{
"timestamp": "...",
"incident_id": "INC-001",
"actor": "incident-agent",
"event": "ACTION_RECOMMENDED",
"action": "restart_service",
"target": "payment-api"
}

This will also be useful for the UI timeline.

==================================================
17. TESTING
===========

Write tests for:

* incident creation
* incident retrieval
* validation
* incident state transitions
* AI response parsing
* mock tools
* action approval
* action execution
* failed execution
* incident resolution

At least one complete end-to-end test should cover:

incident → analysis → recommendation → approval → execution → verification → resolution

==================================================
18. FRONTEND INTEGRATION
========================

The frontend developer is working independently.

Therefore:

* document every API
* provide example request/response JSON
* use consistent response structures
* enable CORS for local development
* provide a clear base API URL
* document environment variables
* create an API documentation section in README

Do not tightly couple backend internals to the frontend.

==================================================
19. README
==========

Create a professional README containing:

1. Project overview
2. Problem being solved
3. Architecture
4. Agent workflow
5. Technology stack
6. Folder structure
7. Setup instructions
8. Environment variables
9. Running the backend
10. API endpoints
11. Example requests
12. Example responses
13. Mock incident scenarios
14. AI/Groq configuration
15. Security considerations
16. Testing
17. Frontend integration instructions
18. Future improvements

Make the README suitable for hackathon judges and developers.

==================================================
20. CODE QUALITY
================

Follow these rules:

* clean naming
* small functions
* modular architecture
* type hints where appropriate
* meaningful comments
* no unnecessary abstraction
* no duplicated logic
* proper exception handling
* validation at boundaries
* predictable API responses

Do not create giant files.

Do not put the entire agent in one Python file.

==================================================
21. DEVELOPMENT STRATEGY
========================

Implement in stages.

STAGE 1
Understand repository and architecture.

STAGE 2
Create backend foundation.

STAGE 3
Create incident models and database.

STAGE 4
Create incident APIs.

STAGE 5
Create mock incident/log system.

STAGE 6
Create agent orchestration.

STAGE 7
Integrate Groq.

STAGE 8
Implement investigation tools.

STAGE 9
Implement human approval and remediation.

STAGE 10
Implement verification and resolution.

STAGE 11
Implement reporting and audit timeline.

STAGE 12
Testing.

STAGE 13
Documentation.

STAGE 14
Prepare frontend integration.

Do not jump ahead and create incomplete features everywhere.

After completing each stage:

* run tests
* verify the application starts
* fix errors
* update documentation
* summarize what changed

==================================================
22. IMPORTANT HACKATHON REQUIREMENT
===================================

The final product should feel like a real autonomous incident-response platform, NOT simply:

"User enters a prompt → LLM gives an answer."

The system should demonstrate:

EVENT
→ DETECTION
→ INVESTIGATION
→ EVIDENCE
→ REASONING
→ RECOMMENDATION
→ HUMAN APPROVAL
→ ACTION
→ VERIFICATION
→ RESOLUTION
→ AUDIT REPORT

The AI should be the intelligence layer inside a real software system.

==================================================
23. BEFORE CODING
=================

Start by giving me:

A. Current repository analysis
B. Recommended architecture
C. Folder structure
D. Technology choices
E. Database design
F. Agent workflow
G. API list
H. Integration plan with the separate frontend
I. Implementation phases

Then begin Stage 1.

Do not skip repository inspection.

Do not fabricate requirements that are not present.

If something is ambiguous, make the simplest reasonable assumption, clearly document it, and continue rather than blocking the entire implementation.
