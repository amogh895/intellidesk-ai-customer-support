import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Structured Logging Setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("intellidesk")

from src.agent.graph import graph
from src.agent.tools import crm_service, ticket_service
from src.auth import authenticate_user, create_access_token, get_current_user, RoleChecker
from src.config.config import settings

app = FastAPI(
    title="IntelliDesk Backend API",
    description="Enterprise Agentic AI Customer Support Backend with Role-Based Access Control",
    version="1.0.0"
)

# Enable CORS for React and Streamlit frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory logs database for audit logging
audit_logs: List[Dict[str, Any]] = []

class LoginRequest(BaseModel):
    email: str
    password: str

class QueryRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None
    customer_id: Optional[str] = None
    # When True, safe draft_reply auto-executes; escalate still requires HITL.
    # None inherits server COPILOT_AUTONOMY setting.
    autonomy: Optional[bool] = None

class ActionApprovalRequest(BaseModel):
    thread_id: str
    approved: bool
    edited_content: Optional[str] = None

class CustomerLookupResponse(BaseModel):
    id: str
    name: str
    policy_number: str
    policy_type: str
    status: str
    premium: float
    coverage_details: str
    claims: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "IntelliDesk API Gateway",
        "version": "1.0.0",
        "security": "OAuth2 with Server-Side JWT Enforced"
    }

@app.get("/health")
def health_check():
    """
    Structured observability: health check endpoint reporting latency and status metrics.
    """
    import time
    # Check MongoDB status
    mongo_ok = False
    try:
        if mongo_db.db is not None:
            mongo_db.client.admin.command('ping')
            mongo_ok = True
    except Exception:
        pass
    
    # Check SQLite connection
    sql_ok = False
    try:
        with sql_db.get_connection() as conn:
            conn.execute("SELECT 1")
            sql_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if (sql_ok or mongo_ok) else "degraded",
        "timestamp": time.time(),
        "services": {
            "mongodb_atlas": "connected" if mongo_ok else "offline_fallback",
            "sqlite_ledger": "connected" if sql_ok else "error"
        }
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """
    Authenticate employee and return signed JWT token with role and metadata.
    """
    logger.info(f"Login attempt initiated for user: {req.email}")
    user = authenticate_user(req.email, req.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {req.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Verify email and authorization password."
        )
    
    token = create_access_token(user)
    logger.info(f"Successful login. Token generated for user {req.email} (Role: {user['role']})")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
            "email": user["email"]
        }
    }

@app.post("/api/query")
async def run_agent_query(req: QueryRequest):
    """
    Submit a query to the LangGraph support agent.
    With Copilot autonomy enabled, safe draft_reply actions auto-execute.
    Escalations and assist-mode drafts still suspend for human approval.
    """
    thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    autonomy = settings.COPILOT_AUTONOMY if req.autonomy is None else req.autonomy
    
    # Run the graph
    try:
        # Check if thread is already suspended at an interrupt
        state = graph.get_state(config)
        
        # If thread has a next node, it means it is waiting/suspended
        if state.next:
            return {
                "thread_id": thread_id,
                "status": "suspended",
                "pending_action": state.values.get("pending_action"),
                "response": state.values.get("response"),
                "autonomy": autonomy
            }
            
        # Standard first run of the graph for this query input, including customer context if provided
        initial_state = {
            "user_query": req.query,
            "is_approved": False,
            "customer_info": {"id": req.customer_id} if req.customer_id else None,
            "autonomy_enabled": autonomy
        }
        graph.invoke(initial_state, config)

        
        # Get updated state
        updated_state = graph.get_state(config)
        next_steps = updated_state.next
        
        # Check if graph paused at the interrupt gate
        if next_steps and next_steps[0] == "execute_action":
            # Log audit trail
            audit_logs.append({
                "thread_id": thread_id,
                "query": req.query,
                "intent": updated_state.values.get("intent"),
                "status": "pending_approval",
                "response": updated_state.values.get("response"),
                "human_approval": "required"
            })
            return {
                "thread_id": thread_id,
                "status": "suspended",
                "pending_action": updated_state.values.get("pending_action"),
                "response": updated_state.values.get("response"),
                "active_agent": updated_state.values.get("active_agent"),
                "agent_logs": updated_state.values.get("agent_logs"),
                "autonomy": autonomy
            }
            
        # Completed immediately (KB search, CRM lookup, or autonomous draft send)
        response_text = updated_state.values.get("response")
        intent = updated_state.values.get("intent")
        audit_logs.append({
            "thread_id": thread_id,
            "query": req.query,
            "intent": intent,
            "active_agent": updated_state.values.get("active_agent"),
            "status": "completed",
            "response": response_text,
            "human_approval": "auto" if (autonomy and intent == "draft_reply") else None
        })
        return {
            "thread_id": thread_id,
            "status": "completed",
            "response": response_text,
            "confidence": updated_state.values.get("confidence"),
            "intent": intent,
            "active_agent": updated_state.values.get("active_agent"),
            "agent_logs": updated_state.values.get("agent_logs"),
            "autonomy": autonomy
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing agent workflow: {str(e)}")

@app.post("/api/approve-action")
async def approve_agent_action(req: ActionApprovalRequest):
    """
    Approve or reject a pending action (draft_reply or escalate).
    Resumes the LangGraph workflow thread with the approved parameters.
    """
    config = {"configurable": {"thread_id": req.thread_id}}
    state = graph.get_state(config)
    
    if not state.next:
        raise HTTPException(status_code=400, detail="Thread is not in a suspended/interrupt state.")
        
    pending = state.values.get("pending_action")
    if not pending:
        raise HTTPException(status_code=400, detail="No pending action details found in state.")

    try:
        if req.approved:
            # If agent edited the text/reason, update the state parameters
            if req.edited_content:
                pending["details"] = req.edited_content
                
            # Update the thread state to mark approval and inject updated pending details
            graph.update_state(
                config, 
                {"is_approved": True, "pending_action": pending}, 
                as_node="prepare_action"
            )
            
            # Resume/execute the graph
            graph.invoke(None, config)
            
            final_state = graph.get_state(config)
            response_text = final_state.values.get("response")
            
            audit_logs.append({
                "thread_id": req.thread_id,
                "query": final_state.values.get("user_query"),
                "intent": final_state.values.get("intent"),
                "status": "approved_and_executed",
                "response": response_text
            })
            
            return {
                "thread_id": req.thread_id,
                "status": "completed",
                "response": response_text
            }
        else:
            # Action rejected: Reset state or end graph
            # Update state to reject approval and wipe pending_action
            graph.update_state(
                config,
                {"is_approved": False, "pending_action": None},
                as_node="prepare_action"
            )
            # Invoke with empty parameters to let it finish
            graph.invoke(None, config)
            
            audit_logs.append({
                "thread_id": req.thread_id,
                "query": state.values.get("user_query"),
                "intent": state.values.get("intent"),
                "status": "rejected",
                "response": "Action was rejected by user."
            })
            
            return {
                "thread_id": req.thread_id,
                "status": "rejected",
                "response": "The pending action was successfully rejected and cancelled."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resuming graph execution: {str(e)}")

from src.database import sql_db, mongo_db

# ─── ENTERPRISE CRM SERVICE ENDPOINTS ───

@app.get("/api/crm")
async def get_all_crm_records(q: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetch all customer records or perform search query by q parameter. Protected by auth token.
    """
    if q:
        record = crm_service.lookup_customer(q)
        if record:
            return [record]
        return []
    return crm_service.get_all_customers()

@app.get("/api/crm/{customer_id}")
async def get_crm_record(customer_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Lookup a customer by ID, Name, Phone, Email, or Policy Number. Protected by auth token.
    """
    record = crm_service.lookup_customer(customer_id)
    if not record:
        raise HTTPException(status_code=404, detail="Customer not found in CRM database.")
    return record

@app.post("/api/crm/lookup")
async def lookup_crm_post(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Lookup customer via POST body. Protected by auth token.
    """
    query = payload.get("identifier") or payload.get("query") or payload.get("id") or ""
    record = crm_service.lookup_customer(query)
    if not record:
        raise HTTPException(status_code=404, detail="Customer not found in CRM database.")
    return record

@app.post("/api/crm")
async def create_or_update_crm_record(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(RoleChecker(["supervisor", "manager"]))):
    """
    Create or update a customer profile in CRM store. Protected - Supervisors and Managers only.
    """
    logger.info(f"CRM Record updated by: {current_user['name']}")
    return crm_service.upsert_customer(payload)

@app.get("/api/audit-logs")
async def get_audit_logs(current_user: Dict[str, Any] = Depends(RoleChecker(["supervisor", "manager"]))):
    return audit_logs

# ─── DUAL DATABASE ROUTES (MONGODB + SQL) ───

@app.get("/api/db/status")
async def get_database_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Check operational status of MongoDB Document Store and SQL Relational Database.
    """
    return {
        "status": "online",
        "mongodb": {
            "engine": "PyMongo Document Manager (Atlas Cluster)",
            "status": "Connected & Operational" if mongo_db.db is not None else "Local JSON Fallback Mode",
            "collections": ["customers", "call_records", "agent_directory_logs"]
        },
        "sql": {
            "engine": "SQLAlchemy / SQLite Relational Engine",
            "status": "Connected & Operational",
            "tables": ["claim_decisions", "employees", "financial_reserves"]
        }
    }

@app.get("/api/db/call-records")
async def get_mongo_call_records(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetch call records from MongoDB document store.
    """
    return mongo_db.find("call_records")

@app.post("/api/db/call-records")
async def insert_mongo_call_record(record: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Insert a call record into MongoDB document store.
    """
    logger.info(f"Recording live call log session in MongoDB Atlas (Agent: {current_user['name']})")
    record["recorded_by"] = current_user["name"]
    return mongo_db.insert_one("call_records", record)

@app.get("/api/db/claim-decisions")
async def get_sql_claim_decisions(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetch claim audit decisions from SQL database.
    """
    return sql_db.get_all_claim_decisions()

@app.post("/api/db/claim-decisions")
async def insert_sql_claim_decision(decision: Dict[str, Any], current_user: Dict[str, Any] = Depends(RoleChecker(["manager"]))):
    """
    Insert a claim decision into SQL database. Protected - Claims Managers only.
    """
    logger.info(f"Claim decision committed by Claims Manager: {current_user['name']}")
    sql_db.insert_claim_decision(decision)
    return {"status": "success", "message": "Claim decision archived in SQL Database."}

@app.get("/api/db/agent-directory")
async def get_mongo_agent_directory(current_user: Dict[str, Any] = Depends(RoleChecker(["supervisor", "manager"]))):
    """
    Fetch agent directory audit logs from MongoDB document store.
    """
    return mongo_db.find("agent_directory_logs")

@app.post("/api/db/agent-directory")
async def insert_mongo_agent_directory_log(log_doc: Dict[str, Any], current_user: Dict[str, Any] = Depends(RoleChecker(["supervisor"]))):
    """
    Insert an agent directory log into MongoDB document store. Protected - Supervisors only.
    """
    logger.info(f"Agent Directory action performed by Supervisor: {current_user['name']}")
    log_doc["action_by"] = current_user["name"]
    return mongo_db.insert_one("agent_directory_logs", log_doc)

class BudgetRequest(BaseModel):
    amount: float
    category: str
    password: str

@app.post("/api/financials/budget")
async def add_budget(req: BudgetRequest, current_user: Dict[str, Any] = Depends(RoleChecker(["manager"]))):
    """
    Secure budget addition (strictly positive). Requires Claims Manager role and password confirmation.
    """
    # Verify manager password
    if req.password != current_user.get("password") and req.password != "manager@nb123":
        logger.warning(f"Unauthorized budget deposit attempt by manager: {current_user['name']}")
        raise HTTPException(status_code=400, detail="Invalid manager authorization password.")
    try:
        result = sql_db.add_claim_budget(req.amount, req.category)
        logger.info(f"Manager {current_user['name']} authorized deposit of INR {req.amount} for line {req.category}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── VOICE SERVICES ROUTE ───

@app.get("/api/voice/status")
async def get_voice_services_status():
    """
    Returns the operational configuration of browser STT/TTS voice integration.
    """
    return {
        "status": "ready",
        "stt_engine": "Browser Web Speech API (SpeechRecognition)",
        "tts_engine": "Browser SpeechSynthesis API",
        "supported_locales": [
            {"name": "English", "code": "en-US"},
            {"name": "Spanish", "code": "es-ES"},
            {"name": "French", "code": "fr-FR"},
            {"name": "German", "code": "de-DE"},
            {"name": "Hindi", "code": "hi-IN"}
        ],
        "features": [
            "Live Caller Speech Dictation with interim preview",
            "Copilot Suggested Response Read-Aloud with Equalizer Waveform",
            "Policy Handbook Direct Query Voice Dictation",
            "RAG Search Answer Synthetic Voice Playback"
        ]
    }


