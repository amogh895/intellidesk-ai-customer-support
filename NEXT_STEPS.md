# Project Status & Interview Blueprint: IntelliDesk AI

This document provides a summary of what has been constructed, how the architecture works, how to run and test it, and interview-readiness talking points for technical interviews.

---

## 1. Project Progress Status

- [x] **Phase 0 — Foundation**: Directory setup, `requirements.txt`, `.gitignore`, `.env.example`
- [x] **Phase 1 — Discovery**: Enterprise client brief (`docs/client-brief.md`), detailed system design and flowcharts (`docs/solution-design.md`)
- [x] **Phase 2 — Knowledge Base**: Synthetic markdown datasets under `data/`, ingestion framework (`ingest.py`)
- [x] **Phase 3 — Core RAG**: Vector DB queries with confidence scoring, formatted citations, and fallback constraints (`src/retrieval/retriever.py`) using the `google-genai` SDK (`src/llm/gemini_client.py`)
- [x] **Phase 4 — LangGraph Agent**: Router routing, intent classification schemas, CRM lookups, mail drafting, and Human-in-the-Loop checkpointer interrupt state execution (`src/agent/graph.py`)
- [x] **Phase 5 — Evaluation Harness**: Golden dataset testing and comparison across 300/50, 500/100, and 800/150 configurations (`evaluation/evaluator.py`)
- [x] **Phase 6 — Governance Framework**: AI safety guidelines, prompt injection defense, audit trails, and PII masking policies (`docs/governance.md`)
- [x] **Phase 7 — FastAPI & Streamlit UI**: Multi-view dashboard UI (`app/streamlit_app.py`) integrated with FastAPI API (`src/main.py`)
- [x] **Phase 8 & 9 — Docker & Deployment**: Fully containerized environment files (`Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`, `.dockerignore`)

---

## 2. System Architecture Blueprint

```text
                               ┌─────────────────────────┐
                               │    Vite-React UI        │
                               └────────────┬────────────┘
                                            │ HTTP (Port 5173)
                                            ▼
                               ┌─────────────────────────┐
                               │   FastAPI Backend API   │
                               └────────────┬────────────┘
                                            │ 
                                            ▼
                              ┌───────────────────────────┐
                              │ LangGraph State Machine   │
                              └─────────────┬─────────────┘
                                            │
        ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
        ▼                   ▼               ▼               ▼                   ▼
┌──────────────┐    ┌──────────────┐┌──────────────┐┌──────────────┐    ┌──────────────┐
│Intent Router │    │  RAG Search  ││  CRM Search  ││Email Drafts  │    │ Supervisor   │
│(Gemini LLM)  │    │(Chroma Vector)││  (Mock DB)  ││ (HITL Gate)  │    │ Escalations  │
└──────────────┘    └──────────────┘└──────────────┘└──────────────┘    └──────────────┘
```

---

## 3. How to Execute Locally

### Step A: Setup environment variables
Rename `.env.example` to `.env` and fill in your Google Gemini API key:
```bash
cp .env.example .env
# Edit .env and enter: GEMINI_API_KEY=your_real_gemini_key
```

### Step B: Database Ingestion
Build the Chroma vector database by running:
```bash
python ingest.py
```

### Step C: Run Evaluation Harness
Run the performance comparison script to evaluate chunking strategies:
```bash
python -m evaluation.evaluator
```

### Step D: Launch Servers
1. Start the FastAPI backend API:
   ```bash
   python -m uvicorn src.main:app --reload --port 8000
   ```
2. Start the React frontend client (Vite) in a separate terminal:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` to use the application.

---

## 4. Run via Docker Compose

Spin up both backend and frontend applications within container networks (with SQLite vector DB persistent volumes):
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:8501`
- Backend Swagger API Docs: `http://localhost:8000/docs`

---

## 5. Interview Q&A 

### Q1: How did you implement Human-in-the-Loop (HITL) in your agentic system?
- **Answer**: I used **LangGraph's state machine compile option `interrupt_before=["execute_action"]`**. When a transactional intent (like email draft or escalation) is classified, the graph runs the node `prepare_action` to format parameters, transitions to `execute_action`, but gets paused by the MemorySaver checkpointer. The thread ID status becomes `"suspended"`. The frontend retrieves the state, displays the parameters, and lets the user review. Clicking "Approve" triggers a backend POST to `/api/approve-action`, which calls `graph.update_state` injecting `is_approved = True` and resumes execution.

### Q2: Why use sentence-transformers local embeddings instead of OpenAI/Gemini embeddings?
- **Answer**: Local embeddings via `sentence-transformers/all-MiniLM-L6-v2` run offline, saving substantial token API costs and reducing latency during high-volume document ingestion. It offers an excellent trade-off between performance and compute resources.

### Q3: How does your agent prevent hallucination?
- **Answer**: 
  1. We enforce strict system instructions forcing Gemini to reply using ONLY the provided chunk context.
  2. If the retriever relevance score falls below a threshold ($0.35$), the system triggers a default fallback response: *"I don't have enough information to answer that confidently."*
  3. We validate response grounding through our evaluation audit harness.
