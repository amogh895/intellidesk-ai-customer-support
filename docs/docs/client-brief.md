# Client Brief: IntelliDesk AI Knowledge & Support Assistant

**Client:** NorthBridge Insurance (fictional, mid-sized P&C insurer)
**Engagement Type:** AI advisory + prototype build
**Prepared by:** Senior AI Consultant, AI Solutions Group
**Date:** July 18, 2026
**Status:** Scoped / Approved

---

## 1. Executive Summary & Background
NorthBridge Insurance operates a customer support center with 200+ agents handling complex policy, claims, and billing queries. Currently, agents must search across four disparate information silos (policy handbook, claims manual, underwriting FAQ, billing guidelines). This leads to long query times and high compliance risks due to inconsistent answers.

## 2. Problem Statement
- **Time Inefficiency:** Average information-retrieval time per ticket is **12–15 minutes**.
- **Compliance Risk:** Tribal knowledge and out-of-date guidelines lead to inaccurate answers, posing regulatory and customer-trust risks.
- **Onboarding Overhead:** Training new agents takes several months due to knowledge fragmentation.

## 3. Business Objective
To design and build **IntelliDesk**, an enterprise AI assistant that retrieves accurate, source-cited answers from the internal knowledge base, looks up customer details from mock CRM databases, drafts customer replies, and manages escalations. Sensitive actions require human authorization.

## 4. Success Metrics
- **Avg. Search Time:** Reduce information-retrieval time by $\ge 50\%$ (Target: $\le 6$ minutes per ticket).
- **Retrieval Accuracy:** $\ge 85\%$ context precision and recall on the golden evaluation set.
- **Faithfulness:** $\ge 90\%$ answer faithfulness (factual grounding), with hallucination rate below $5\%$.
- **Traceability:** $100\%$ of generated answers must include precise source citations.

## 5. Scope Boundaries
### In Scope
- Core RAG pipeline with document ingestion and embedding in ChromaDB.
- LangGraph agent workflow routing queries, retrieving info, and calling mockup tools.
- Human-in-the-loop (HITL) gate for drafting/approving emails and customer actions.
- RAGAS evaluation harness comparing chunking sizes.
- Streamlit multi-page interface.
- Docker container setup for backend and frontend.

### Out of Scope (Phase 1 Prototype)
- Live connection to production core-insurance databases.
- Enterprise Single Sign-On (SSO) and RBAC integration.
- Voice channels or customer-facing live chat.
