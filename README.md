# Incident Response Agent

Hackathon project: an **AI-powered Incident Response Agent**.

- **Backend / agent (this repo):** [`backend/`](backend/README.md)
- **Frontend:** built separately; integrate later (Antigravity).

### Quick start (backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/docs`.

Polished demo:

```bash
curl -X POST http://127.0.0.1:8000/api/demo/scenarios/payment-api-outage/start
```

The service stops at **human approval**. Approve and execute to complete resolve + report.
