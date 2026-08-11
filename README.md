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

earch precision across various chunk configurations using sentence-transformers, identifying an optimal 500-character layout resulting in context recall accuracy of $\ge 85\%$.
