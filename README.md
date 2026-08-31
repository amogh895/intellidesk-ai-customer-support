# IntelliDesk — AI-Powered Insurance Customer Support Platform

> Real-time RAG copilot, tri-tier RBAC dashboard, 3-way voice studio, and dual-engine claims governance for NorthBridge Assurance.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-10%20passed-brightgreen.svg)](#testing)

---

## What This Project Actually Does

IntelliDesk is a full-stack enterprise contact center platform built for an insurance carrier (NorthBridge Assurance). It combines:

- **RAG-powered policy search** — agents ask questions in natural language and get cited answers from indexed insurance handbooks via ChromaDB + Gemini 1.5 Flash
- **3-Way Voice Communication Studio** — browser-based STT/TTS with switchable audio channels (Customer→Agent, Agent→Copilot, Agent→Customer) and a 36-bar real-time sound wave visualizer driven by Web Audio API `AnalyserNode`
- **Tri-tier RBAC dashboard** — separate views for Agents, Supervisors, and Claims Managers, with server-side JWT token enforcement on all protected API endpoints
- **Dual-engine persistence** — MongoDB Atlas (cloud BSON) for customer records and call logs; SQLite (ACID ledger) for financial reserves, claim decisions, and treasury deposits
- **Password-protected budget deposits** — only the Claims Manager role can add funds, with strict positive-only validation and password confirmation enforced server-side

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│  React 19 + Vite SPA                                        │
│  ├── Web Speech API (STT / TTS)                              │
│  ├── Web Audio API (AnalyserNode → 36-bar FFT visualizer)    │
│  └── Role-based view switching (Agent / Supervisor / Manager) │
├──────────────────────────────────────────────────────────────┤
│                    APPLICATION TIER                           │
│  FastAPI (async ASGI) on Render                              │
│  ├── JWT Auth + Server-side RBAC (src/auth.py)               │
│  ├── LangGraph Agent with selective HITL (src/agent/graph.py) │
│  ├── /health endpoint + structured logging                   │
│  └── OpenAPI auto-docs at /docs                              │
├──────────────────────────────────────────────────────────────┤
│                    KNOWLEDGE TIER                             │
│  Gemini 1.5 Flash (generative)                               │
│  Gemini Embeddings text-embedding-004 (zero-RAM cloud)       │
│  ChromaDB (local vector store, ~sub-10ms retrieval)          │
├──────────────────────────────────────────────────────────────┤
│                    DATA TIER                                  │
│  MongoDB Atlas M0 (customer profiles, call records)          │
│  SQLite ACID Ledger (claim_decisions, financial_reserves)    │
│  Local JSON fallback (resilience if Atlas is unreachable)    │
└──────────────────────────────────────────────────────────────┘
```

**Deployment topology**: React frontend on Vercel (static build), FastAPI backend on Render (web service), MongoDB Atlas M0 free tier (cloud persistence).

---

## Repository Structure

```text
intellidesk/
├── frontend/                    # React 19 + Vite SPA
│   ├── src/
│   │   ├── App.jsx              # Main application (~4000 lines, tri-tier dashboard)
│   │   ├── App.css              # Styling incl. voice studio animations
│   │   └── hooks/
│   │       └── useVoice.js      # Web Speech + Web Audio hook (STT/TTS/FFT)
│   └── package.json
├── src/                         # FastAPI backend
│   ├── main.py                  # API routes with JWT + RBAC enforcement
│   ├── auth.py                  # JWT token generation, validation, RoleChecker
│   ├── database.py              # Dual-engine: SQLDatabaseManager + MongoDocumentManager
│   ├── agent/
│   │   ├── graph.py             # LangGraph pipeline with interrupt gates
│   │   ├── state.py             # TypedDict state structure
│   │   └── tools.py             # CRM service, ticket service wrappers
│   ├── retrieval/
│   │   ├── ingestion.py         # Document chunking + ChromaDB indexing
│   │   └── retriever.py         # Semantic similarity search + confidence scoring
│   ├── llm/
│   │   └── gemini_client.py     # google-genai SDK wrapper
│   └── config/
│       └── config.py            # Settings manager + env variable loader
├── app/
│   └── streamlit_app.py         # Legacy Streamlit UI (archived, see note below)
├── data/                        # Insurance policy handbooks (markdown)
├── evaluation/
│   ├── evaluator.py             # RAGAS benchmark runner
│   └── report.md                # Chunk comparison results
├── tests/
│   ├── test_auth.py             # JWT + RBAC unit tests (6 tests)
│   └── test_database.py         # Financial ledger unit tests (4 tests)
├── docs/                        # Design docs, client brief, governance rules
├── .env.example                 # Environment template (no secrets committed)
├── requirements.txt             # Python dependencies
└── README.md
```

> **Note on Streamlit**: The project originally used a Streamlit frontend with local `sentence-transformers` embeddings. It was rebuilt with React 19 + Vite for production use, switching to cloud Gemini Embeddings to solve Render's 512MB RAM limit. The `app/streamlit_app.py` file is retained for reference but is not the active frontend.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fine-grained state for audio workflows, instant HMR |
| Styling | Pure CSS3 | Zero-runtime-overhead animations for 36 wave bars |
| Voice | Web Speech API + Web Audio API | Client-side STT/TTS, zero latency for local dictation |
| Backend | FastAPI (Python 3.11, async ASGI) | Native async, auto OpenAPI docs, AI/ML ecosystem |
| Auth | PyJWT + OAuth2PasswordBearer | Server-side token validation and role enforcement |
| LLM | Gemini 1.5 Flash | 1M+ token context, low latency, cost-efficient |
| Embeddings | Gemini API `text-embedding-004` | Zero RAM (cloud), vs 1.4GB for local sentence-transformers |
| Vector DB | ChromaDB | Zero-config, in-process, sub-10ms local retrieval |
| Document Store | MongoDB Atlas M0 | Cloud persistence for customer profiles and call logs |
| Financial Ledger | SQLite | ACID transactions for reserves and claim payouts |
| Agent Orchestration | LangGraph | State-machine with selective HITL — autonomy auto-sends safe drafts; escalations still interrupt |

---

## Measured Evaluation Results

Benchmarked using [RAGAS](https://docs.ragas.io/) across three chunk configurations on our insurance policy corpus:

| Chunk Size | Overlap | Retrieval Accuracy (Correct Source) | Avg Confidence | Faithfulness (Anti-Hallucination) |
|---|---|---|---|---|
| 300 | 50 | 93.33% | 40.2% | 95.0% |
| **500** | **100** | **100.0%** | **14.87%** | **75.0%** |
| 800 | 150 | 100.0% | 27.93% | 95.0% |

**Selected config**: Chunk size 500, overlap 100 — maximizes source retrieval accuracy (100%) with sufficient context preservation.

Methodology: `evaluation/evaluator.py` runs comparative RAGAS benchmarks. Test set and results in `evaluation/report.md`.

---

## Local Setup

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual GEMINI_API_KEY and MONGO_URI
```

### 2. Backend

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
python ingest.py               # Build vector store
uvicorn src.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

### 4. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Agent | sarah.connor@northbridge.com | sarah@nb123 |
| Supervisor | marcus.aurelius@northbridge.com | super@nb123 |
| Claims Manager | diana.harlow@northbridge.com | manager@nb123 |

> These are demo credentials for a simulated insurance company. In production, replace with a real identity provider (OAuth2/OIDC).

---

## Testing

```bash
python -m pytest tests/ -v
```

```
tests/test_auth.py::test_authenticate_user_valid         PASSED
tests/test_auth.py::test_authenticate_user_invalid       PASSED
tests/test_auth.py::test_token_creation_and_decoding     PASSED
tests/test_auth.py::test_token_decoding_invalid          PASSED
tests/test_auth.py::test_role_checker_allowed            PASSED
tests/test_auth.py::test_role_checker_forbidden          PASSED
tests/test_database.py::test_initial_reserves_are_zero   PASSED
tests/test_database.py::test_add_claim_budget_positive   PASSED
tests/test_database.py::test_add_claim_budget_invalid    PASSED
tests/test_database.py::test_add_claim_budget_routing    PASSED
                                              10 passed in 2.11s
```

---

## API Security (Server-Side RBAC)

All protected endpoints require a valid JWT Bearer token obtained via `POST /api/auth/login`. Role enforcement happens server-side via `Depends(RoleChecker(...))`:

| Endpoint | Required Role(s) |
|---|---|
| `GET /api/crm` | Any authenticated user |
| `POST /api/crm` (create/update) | `supervisor`, `manager` |
| `GET /api/audit-logs` | `supervisor`, `manager` |
| `POST /api/db/claim-decisions` | `manager` only |
| `POST /api/financials/budget` | `manager` only (+ password) |
| `GET /api/db/agent-directory` | `supervisor`, `manager` |
| `GET /health` | Public (no auth) |

Calling a protected endpoint without a valid token returns `401`. Calling with insufficient role returns `403`.

---

## Known Limitations

- **SQLite single-writer**: Does not support concurrent multi-writer access. Horizontal scaling requires migration to PostgreSQL.
- **Client-side TTS voice variation**: `window.speechSynthesis` voices vary by OS/browser.
- **Demo credentials hardcoded**: Production deployment should use an external IdP (Auth0, Firebase Auth, etc.).
- **No CI pipeline yet**: Tests run locally. GitHub Actions CI is planned for Phase 2.

---

## Roadmap

| Phase | Timeline | Deliverables |
|---|---|---|
| Phase 1 ✅ | Q1-Q2 2026 | RAG Copilot, 3-Way Voice Studio, MongoDB Atlas, RBAC Auth, Financial Ledger, Sound Wave Visualizer |
| Phase 2 | Q3 2026 | GitHub Actions CI, Multi-modal damage inspection (Gemini Vision), OCR for police reports |
| Phase 3 | Q4 2026 | WebRTC telephony via Twilio, Real-time supervisor call monitoring, Biometric voice auth |

---

## License

This project is developed for educational and portfolio purposes as part of a 4th-year engineering capstone.
