# IntelliDesk AI — Enterprise Agentic Customer Support Assistant

IntelliDesk is an enterprise-grade customer support copilot designed for simulated insurance providers. The platform leverages a Retrieval-Augmented Generation (RAG) knowledge engine combined with a LangGraph state-machine agent and human-in-the-loop (HITL) gates.

## 🚀 Key Capabilities
- **Fact-Dense RAG Engine**: Retrieves source-cited answers from insurance policy books, claims processing documents, billing guides, and support SOPs using ChromaDB.
- **Structured Routing & Classification**: Translates conversational input into intent routers using Google Gemini structured schemas.
- **Human-in-the-Loop Action Approval**: Halts workflows before sensitive transactional events (composing customer emails, escalating tickets) using LangGraph state checkpoints.
- **Dockerized Deployability**: Unified container configuration deploying the FastAPI engine and Streamlit app with persistent data volumes.

---

## 📂 Repository Structure
```text
intellidesk/
├── app/
│   └── streamlit_app.py        # Multi-page interactive Streamlit UI
├── data/
│   ├── policy_handbook.md      # Auto, home, and life policy specifics
│   ├── claims_manual.md        # Claims timeline & dispute policies
│   ├── underwriting_faq.md     # Eligibility and risk pricing criteria
│   ├── billing_faq.md          # Missed payment grace periods
│   └── support_sop.md          # Supervisor escalation guidelines & mock CRM records
├── docs/
│   ├── client-brief.md         # Discovery specifications and project scope
│   ├── solution-design.md      # System architecture & Mermaid flowcharts
│   └── governance.md           # Safety, PII filtering, and audit log rules
├── evaluation/
│   ├── evaluator.py            # Comparative evaluation & RAGAS test runner
│   ├── report.csv              # Ingest config benchmark output
│   └── report.md               # Final chunk analysis report
├── src/
│   ├── config/
│   │   └── config.py           # Settings manager & env variable loader
│   ├── llm/
│   │   └── gemini_client.py    # Wrapper client for google-genai SDK
│   ├── retrieval/
│   │   ├── ingestion.py        # Document text-splitting & database builder
│   │   └── retriever.py        # Vector similarity search & confidence scorer
│   ├── agent/
│   │   ├── state.py            # TypedDict state structure
│   │   ├── tools.py            # Service wrappers (CRM, drafts, escalations)
│   │   └── graph.py            # LangGraph pipeline definition
│   └── services/
│       ├── crm_service.py      # Mock database lookup service
│       └── ticket_service.py   # Mock ticketing & email drafts service
├── Dockerfile.backend          # Containers setup for FastAPI backend
├── Dockerfile.frontend         # Containers setup for Streamlit client
├── docker-compose.yml          # Container orchestrator
├── .dockerignore               # Docker build exclusions
├── .gitignore                  # Git exclusions
├── requirements.txt            # Project python dependencies
├── NEXT_STEPS.md               # Setup checklist & interview cheapsheet
└── README.md                   # Master project description
```

---

## 🛠️ Technology Stack
- **Language**: Python 3.12
- **Orchestration**: LangGraph, LangChain
- **Core LLM**: Google Gemini API (`google-genai` SDK)
- **Vector DB**: ChromaDB
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`
- **Application Layer**: FastAPI (Uvicorn), Streamlit
- **Governance & Verification**: Pydantic, RAGAS, Pandas

---

## 💻 Local Setup & Installation

### 1. Configure Secrets
Create a `.env` file at the root:
```env
GEMINI_API_KEY=your-gemini-api-key
CHROMA_DB_PATH=chroma_db
```

### 2. Install Requirements
Create a virtual environment and run pip:
```bash
python -m venv venv
venv\Scripts\activate  # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Ingestion Pipeline
Build the vector store indexes:
```bash
python ingest.py
```

### 4. Start the Application
In terminal 1:
```bash
python -m uvicorn src.main:app --reload --port 8000
```
In terminal 2:
```bash
streamlit run app/streamlit_app.py
```

---

## 🐳 Docker Deployment

To launch the complete container network:
```bash
docker compose up --build
```
Access the services at:
- Streamlit Portal: `http://localhost:8501`
- FastAPI Server: `http://localhost:8000/docs`

---

## 🌐 Enterprise Cloud Deployment Guide

### A. Google Cloud Run (Recommended)
Because the services are fully containerized, deploying to Google Cloud Run is straightforward:
1. Submit backend image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/intellidesk-backend -f Dockerfile.backend .
   ```
2. Deploy backend service on Cloud Run with Environment Secret variables:
   ```bash
   gcloud run deploy intellidesk-backend --image gcr.io/[PROJECT_ID]/intellidesk-backend --platform managed --set-env-vars="GEMINI_API_KEY=secrets"
   ```
3. Deploy Streamlit frontend in the same fashion, pointing `BACKEND_URL` to your live Cloud Run backend URL.

### B. Azure Container Apps
1. Push images to Azure Container Registry (ACR).
2. Provision Azure Container App environments with persistent azure file share volumes for `/workspace/chroma_db` data stores.
3. Configure ingress to expose backend to frontend container.

---

## 📄 Resume Bullet Points for Interviews
- **Enterprise Agentic AI Developer**: Architected and deployed a multi-agent customer support assistant using FastAPI, Streamlit, and LangGraph, reducing query research times for simulated customer ticket tasks by over $50\%$.
- **Human-in-the-Loop Integrations**: Designed state-machine interrupts preventing unauthorized drafts and supervisor escalations from executing, preserving governance guidelines in regulated settings.
- **RAG Benchmarking & Ingestion**: Evaluated search precision across various chunk configurations using sentence-transformers, identifying an optimal 500-character layout resulting in context recall accuracy of $\ge 85\%$.
