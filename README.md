# IntelliDesk AI — Enterprise Two-Sided Agentic Support Platform

IntelliDesk AI is a grounded, governed two-sided agentic customer support platform built for insurance customers and support staff (Support Agents, Senior CSRs, Claims Managers) at **NorthBridge Assurance**.

---

## Two-Sided System Architecture

```
┌─────────────────────────┐          ┌───────────────────────────┐
│     Customer Portal     │          │       Staff Cockpit       │
│  (Text / Voice Intake)  │          │ (Incoming Queue / Copilot)│
└────────────┬────────────┘          └─────────────▲─────────────┘
             │                                     │
    POST /api/portal/requests          SSE /api/staff/requests/stream
  (Text / Confirmed Voice)             (Real-Time Incoming Queue)
             │                                     │
             ▼                                     │
┌─────────────────────────┐                        │
│  PII Redaction Layer    │                        │
└────────────┬────────────┘                        │
             │                                     │
             ▼                                     │
┌─────────────────────────┐            ┌───────────┴───────────┐
│ SupportRequest Database ├───────────►│ LangGraph RAG Agent   │
└─────────────────────────┘            └───────────┬───────────┘
             ▲                                     │
             │                           Generates Cited Draft
             │                                     │
             │                         ┌───────────▼───────────┐
             │                         │   HITL Approval Gate  │
             │                         │   (Staff Review/Edit) │
             │                         └───────────┬───────────┘
             │                                     │
     SSE /api/portal/stream               On Staff Approval
   (Real-time Approved Reply)                      │
             │                                     │
             └─────────────────────────────────────┘
```

---

## Key Feature Capabilities

### 1. Customer Self-Service Portal (`/portal`)
- **Dual Input Channels**: Text area query input + Voice Microphone Intake via browser WebSpeech STT.
- **Confirm-Before-Submit Step**: Transcribed speech is automatically placed into an **editable confirmation box** so customers inspect and refine their query before submitting.
- **PII Governance**: All customer queries pass through `src/pii.py` redacting emails, phone numbers, credit cards, and tax IDs before LLM context ingestion or logging.
- **My Requests Ledger**: Tracks live status (`NEW`, `IN PROGRESS`, `AWAITING APPROVAL`, `ANSWERED`) and displays staff-approved answers with grounded policy citations.
- **Demo Customer Login**: One-click showcase access path as Demo Customer `CRM-101` (Rahul Verma).

### 2. 2-Realm Authentication & Role Isolation
- **Customer Realm**: Authenticates against stored bcrypt password hashes. Scopes data strictly so customers can ONLY access their own requests.
- **Staff Realm**: Enforces 3-tier RBAC (`Support Agent`, `Technical Support Specialist / Senior CSR`, `Customer Service Manager / CSM`).

### 3. Real-Time SSE Pipeline
- **Staff SSE Stream (`/api/staff/requests/stream`)**: Pushes incoming customer inquiries to the staff queue in real time without manual refreshes.
- **Customer SSE Stream (`/api/portal/requests/stream`)**: Pushes human-approved answers back to the customer portal in real time without page reloads.

### 4. Staff Queue & Mandatory HITL Approval Gate
- **Human-in-the-Loop Gate**: Every customer-facing response is drafted by the LangGraph AI copilot and MUST be reviewed, edited (if needed), and explicitly approved by a staff member before delivery to the customer.

---

## Quickstart Guide

### 1. Run Database Seeding & Ingestion
```bash
python src/seed.py
python src/ingest_pgvector.py
```

### 2. Start FastAPI Backend Server
```bash
uvicorn src.main:app --reload --port 8000
```

### 3. Start React Frontend SPA
```bash
cd frontend
npm install
npm run dev
```

---

## PyTest Automated Test Suite
```bash
python -m pytest tests/
```
- **Status**: 13 / 13 PASSED (0 errors).

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
