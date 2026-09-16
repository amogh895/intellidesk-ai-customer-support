import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio

from src.db_pg import get_db, init_db
from src.models import CustomerModel, PolicyModel, ClaimModel, TicketModel, ApprovalQueueModel, AuditLogModel, PolicyChunkModel, EvaluationMetricModel, CustomerConversationModel
from src.agent.real_graph import real_agent_graph

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("intellidesk")

app = FastAPI(
    title="IntelliDesk AI Enterprise Backend",
    description="Real LangGraph Multi-Agent Backend with PostgreSQL + pgvector, 2-Level RBAC, and RAGAS Evaluation",
    version="2.4.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("IntelliDesk Database tables initialized.")

# Request / Response Models
class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Customer Service Manager (CSM)"

class QueryRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None
    customer_id: Optional[str] = None
    autonomy: Optional[bool] = True

class ActionApprovalRequest(BaseModel):
    thread_id: str
    approval_id: Optional[str] = None
    approved: bool
    user_role: Optional[str] = "Customer Service Manager (CSM)"
    edited_content: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "IntelliDesk Real Agentic Backend Gateway",
        "database": "PostgreSQL + pgvector Engine",
        "version": "2.4.0"
    }

@app.get("/health")
def health_check(db=Depends(get_db)):
    vector_count = db.query(PolicyChunkModel).count()
    customer_count = db.query(CustomerModel).count()
    return {
        "status": "healthy",
        "database": "connected",
        "vector_embeddings": vector_count,
        "customers_seeded": customer_count
    }

# ─── AUTHENTICATION ───
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    return {
        "access_token": "bearer_token_" + uuid.uuid4().hex[:12],
        "token_type": "bearer",
        "user": {
            "name": req.email.split("@")[0].replace(".", " ").title(),
            "email": req.email,
            "role": req.role or "Customer Service Manager (CSM)"
        }
    }

# ─── REAL AGENT QUERY & SSE CHAT STREAMING ───
@app.post("/api/query")
async def run_agent_query(req: QueryRequest):
    """
    Submits query to real LangGraph Multi-Agent Engine.
    Executes intent classification, pgvector retrieval, CRM lookups, and 2-Level RBAC HITL interrupts.
    """
    result = real_agent_graph.process_query(
        query=req.query,
        customer_id=req.customer_id,
        thread_id=req.thread_id,
        autonomy=req.autonomy if req.autonomy is not None else True
    )
    return result

@app.get("/api/chat/stream")
async def stream_agent_query(q: str, customer_id: Optional[str] = None, thread_id: Optional[str] = None):
    """
    Server-Sent Events (SSE) streaming endpoint for live agent token & status streaming.
    """
    async def event_generator():
        result = real_agent_graph.process_query(query=q, customer_id=customer_id, thread_id=thread_id)
        
        yield f"event: status\ndata: {json.dumps({'agent': result['activeAgent'], 'sentiment': result.get('sentiment', 'neutral')})}\n\n"
        await asyncio.sleep(0.1)

        yield f"event: data\ndata: {json.dumps(result)}\n\n"
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ─── APPROVALS & 2-LEVEL RBAC ───
@app.get("/api/approvals")
async def get_pending_approvals(db=Depends(get_db)):
    """Fetch pending human-in-the-loop approvals from PostgreSQL queue"""
    approvals = db.query(ApprovalQueueModel).filter(ApprovalQueueModel.status == "pending").all()
    return [
        {
            "id": a.id,
            "thread_id": a.thread_id,
            "customer_id": a.customer_id,
            "customer_name": a.customer_name,
            "action_type": a.action_type,
            "amount": a.amount,
            "requestor": a.requestor,
            "risk_tier": a.risk_tier,
            "confidence": a.confidence,
            "details": a.details,
            "required_level": a.required_level,
            "required_role": a.required_role,
            "timestamp": a.timestamp
        }
        for a in approvals
    ]

@app.post("/api/approve-action")
async def approve_agent_action(req: ActionApprovalRequest, db=Depends(get_db)):
    """
    Approve or reject pending action with 2-Level RBAC enforcement.
    Level 1: Support Supervisor
    Level 2: Customer Service Manager (CSM) (Required for payout >= 100,000 or High Risk)
    """
    appr = None
    if req.approval_id:
        appr = db.query(ApprovalQueueModel).filter(ApprovalQueueModel.id == req.approval_id).first()
    if not appr and req.thread_id:
        appr = db.query(ApprovalQueueModel).filter(ApprovalQueueModel.thread_id == req.thread_id, ApprovalQueueModel.status == "pending").first()

    if not appr:
        raise HTTPException(status_code=404, detail="Approval request not found or already processed.")

    user_role = req.user_role or "Customer Service Manager (CSM)"
    
    # 2-Level RBAC Role Enforcement
    if appr.required_level == 2 and user_role not in ["Customer Service Manager (CSM)", "Admin"]:
        raise HTTPException(
            status_code=403,
            detail=f"RBAC Authorization Failure: Action requires Level 2 ({appr.required_role}) approval. Your current role is '{user_role}'."
        )

    if req.approved:
        appr.status = "approved"
        # Log Audit Trail
        audit = AuditLogModel(
            trace_id=appr.thread_id,
            actor=f"{user_role} ({req.user_role})",
            role=user_role,
            action="APPROVE_ACTION",
            intent="grant_approval",
            status="EXECUTED",
            compliance=f"RBAC LEVEL {appr.required_level} PASSED",
            details=f"Approved action {appr.id} ({appr.action_type}) for amount ₹{appr.amount:,.2f}."
        )
        db.add(audit)
        db.commit()
        return {"status": "completed", "message": f"Action {appr.id} approved and executed successfully."}
    else:
        appr.status = "rejected"
        audit = AuditLogModel(
            trace_id=appr.thread_id,
            actor=f"{user_role} ({req.user_role})",
            role=user_role,
            action="REJECT_ACTION",
            intent="deny_approval",
            status="CANCELLED",
            compliance=f"RBAC LEVEL {appr.required_level} REJECTED",
            details=f"Rejected action {appr.id} ({appr.action_type})."
        )
        db.add(audit)
        db.commit()
        return {"status": "rejected", "message": f"Action {appr.id} rejected and cancelled."}

# ─── REAL CRM CUSTOMER RECORDS ───
@app.get("/api/crm")
async def get_all_customers(q: Optional[str] = None, db=Depends(get_db)):
    """Fetch real customer records from PostgreSQL"""
    query_builder = db.query(CustomerModel)
    if q:
        query_builder = query_builder.filter(
            (CustomerModel.name.ilike(f"%{q}%")) |
            (CustomerModel.id.ilike(f"%{q}%")) |
            (CustomerModel.policy_number.ilike(f"%{q}%"))
        )
    customers = query_builder.limit(50).all()
    
    result = []
    for c in customers:
        claims = db.query(ClaimModel).filter(ClaimModel.customer_id == c.id).all()
        result.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "policy_number": c.policy_number,
            "policy_type": c.policy_type,
            "status": c.status,
            "premium": c.premium,
            "risk_tier": c.risk_tier,
            "coverage_details": c.coverage_details,
            "claims_history": [
                {
                    "claim_id": clm.claim_id,
                    "date": clm.date,
                    "amount": clm.amount,
                    "status": clm.status,
                    "reason": clm.reason
                }
                for clm in claims
            ]
        })
    return result

@app.get("/api/crm/{customer_id}")
async def get_customer(customer_id: str, db=Depends(get_db)):
    c = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found in database.")
    claims = db.query(ClaimModel).filter(ClaimModel.customer_id == c.id).all()
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "policy_number": c.policy_number,
        "policy_type": c.policy_type,
        "status": c.status,
        "premium": c.premium,
        "risk_tier": c.risk_tier,
        "coverage_details": c.coverage_details,
        "claims_history": [
            {
                "claim_id": clm.claim_id,
                "date": clm.date,
                "amount": clm.amount,
                "status": clm.status,
                "reason": clm.reason
            }
            for clm in claims
        ]
    }

# ─── TICKETS ───
@app.get("/api/tickets")
async def get_tickets(db=Depends(get_db)):
    tickets = db.query(TicketModel).limit(50).all()
    return [
        {
            "ticket_id": t.ticket_id,
            "customer_id": t.customer_id,
            "customer_name": t.customer_name,
            "policy_number": t.policy_number,
            "issue_type": t.issue_type,
            "priority": t.priority,
            "risk_tier": t.risk_tier,
            "status": t.status,
            "created_at": t.created_at
        }
        for t in tickets
    ]

# ─── AUDIT LOGS ───
@app.get("/api/audit-logs")
async def get_audit_logs(db=Depends(get_db)):
    logs = db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(100).all()
    return [
        {
            "trace_id": l.trace_id,
            "timestamp": l.timestamp,
            "actor": l.actor,
            "role": l.role,
            "action": l.action,
            "intent": l.intent,
            "status": l.status,
            "compliance": l.compliance,
            "details": l.details
        }
        for l in logs
    ]

# ─── CENTRALIZED CONVERSATION & CALL LEDGER (RESTRICTED TO SUPERVISOR & CLAIMS MANAGER) ───
@app.get("/api/conversations")
async def get_conversations(
    user_role: Optional[str] = Query("Customer Service Manager (CSM)"),
    customer_id: Optional[str] = Query(None),
    db=Depends(get_db)
):
    """
    Centralized DB ledger storing all customer-tier 3 agent call/conversation transcripts.
    RBAC Restriction: Exclusive to 'Technical Support Specialist (Senior CSR)' (Tier 2) and 'Customer Service Manager (CSM)' (Tier 1).
    Support Agents (Tier 3) receive 403 Forbidden.
    """
    if user_role not in ["Technical Support Specialist (Senior CSR)", "Customer Service Manager (CSM)", "Admin"]:
        raise HTTPException(
            status_code=403,
            detail=f"RBAC Access Denied: Centralized Call Ledger is restricted to Technical Support Specialists (Senior CSR) and Customer Service Managers (CSM). Support Agents cannot access this database. Your current role is '{user_role}'."
        )

    query_builder = db.query(CustomerConversationModel)
    if customer_id:
        query_builder = query_builder.filter(CustomerConversationModel.customer_id == customer_id)

    convs = query_builder.order_by(CustomerConversationModel.timestamp.desc()).limit(100).all()
    return [
        {
            "id": c.id,
            "customer_id": c.customer_id,
            "customer_name": c.customer_name,
            "agent_id": c.agent_id,
            "agent_name": c.agent_name,
            "channel": c.channel,
            "caller_sentiment": c.caller_sentiment,
            "transcript": c.transcript,
            "ai_copilot_response": c.ai_copilot_response,
            "resolution_status": c.resolution_status,
            "timestamp": c.timestamp
        }
        for c in convs
    ]

# ─── KNOWLEDGE BASE ───
@app.get("/api/kb/stats")
async def get_kb_stats(db=Depends(get_db)):
    vector_count = db.query(PolicyChunkModel).count()
    return {
        "vector_database": "PostgreSQL + pgvector Store",
        "total_embeddings": vector_count,
        "chunk_strategy": "500 Characters (Overlap: 100)"
    }

@app.get("/api/kb/clauses")
async def get_kb_clauses(db=Depends(get_db)):
    chunks = db.query(PolicyChunkModel).limit(20).all()
    return [
        {
            "clause": c.clause_title,
            "content": c.chunk_text,
            "doc": c.document_name
        }
        for c in chunks
    ]

# ─── EVALUATION & RAGAS BENCHMARKS ───
@app.get("/api/eval/metrics")
async def get_eval_metrics(db=Depends(get_db)):
    metrics = db.query(EvaluationMetricModel).all()
    return [
        {
            "metric_name": m.metric_name,
            "score": m.score,
            "chunk_size_config": m.chunk_size_config,
            "benchmark_status": m.benchmark_status,
            "timestamp": m.timestamp
        }
        for m in metrics
    ]
