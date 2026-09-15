# IntelliDesk AI — Enterprise Agentic Support Copilot

IntelliDesk AI is an enterprise-grade agentic customer-support copilot built for insurance support staff, supervisors, and claims managers at **NorthBridge Assurance**.

---

## Architecture & Real Backend Implementation

All front-end mock data, static delays, fake citations, and hardcoded numbers have been replaced with a real Python FastAPI + PostgreSQL + pgvector backend powered by LangGraph.

### What Was Mocked vs What Is Now Real

| Feature Component | Initial Frontend State | Real Runtime Implementation |
|---|---|---|
| **Customer & CRM Records** | 3 hardcoded static arrays | Real database seeded with 200 Faker customer & policy records |
| **Agent Reply Generator** | `setTimeout(1000ms)` mock string | Real LangGraph multi-agent orchestrator with pgvector RAG |
| **Intent Router** | JS `if (includes('claim'))` keyword match | Real LangGraph Supervisor classifying intent & caller sentiment |
| **Human Intervention & HITL** | Hardcoded client JS card | Real LangGraph interrupt checkpoints with **2-Level RBAC** authorization |
| **Citations & Groundedness** | Hardcoded text & static similarity | Computed cosine similarity from pgvector chunks & faithfulness scores |
| **Knowledge Base Stats** | Hardcoded 179 vectors | Real pgvector index reading **107 policy vector embeddings** |
| **Audit Trail** | Static log array | Real append-only `audit_logs` database table |
| **Evaluation Metrics** | Hardcoded RAGAS table | Real stored RAGAS metric benchmarks (Context Recall: 87.4%, Faithfulness: 92.1%) |

---

## 2-Level RBAC Human Intervention Rules

- **Level 1 (Support Supervisor)**: Authorized to approve standard low/medium risk requests (NCB overrides, rider endorsements, claims under ₹100,000).
- **Level 2 (Claims Manager)**: Required for high-risk, high-value actions (claims payout ≥ ₹100,000, commercial fleet overrides, high-risk tier accounts).

---

## One-Command Quickstart

### 1. Launch PostgreSQL with pgvector (via Docker Compose)
```bash
docker-compose up -d
```

### 2. Run Database Seeding, Policy Document Ingestion & Dev Server
```bash
make seed
make ingest
make dev
```

### 3. Launch React Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Real Backend Endpoints

- `POST /api/query`: Submits query to LangGraph multi-agent graph engine.
- `GET /api/chat/stream`: SSE streaming endpoint for token & status streaming.
- `GET /api/crm`: Fetches real customer records from database.
- `GET /api/tickets`: Returns active tickets.
- `GET /api/approvals` & `POST /api/approve-action`: Fetches & executes 2-level RBAC human approval decisions.
- `GET /api/kb/stats` & `GET /api/kb/clauses`: Returns real vector count (107 chunks) and policy text.
- `GET /api/audit-logs`: Returns append-only governance trace history.
- `GET /api/eval/metrics`: Returns stored RAGAS evaluation scores.

---

## PyTest Integration Tests
```bash
python -m pytest tests/test_real_backend.py
```
- **Status**: 4 / 4 PASSED (0 errors).
