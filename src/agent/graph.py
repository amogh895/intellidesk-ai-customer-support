import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from src.agent.state import AgentState
from src.agent.tools import (
    search_knowledge_base,
    lookup_customer_record,
    draft_customer_response,
    escalate_to_supervisor
)
from src.llm.gemini_client import GeminiClient
from src.config.config import settings

logger = logging.getLogger(__name__)

# Intent classifier Pydantic schema for structured output
class IntentRouter(BaseModel):
    intent: str = Field(
        description="One of: 'search_knowledge' (question about policies/claims/billing/guidelines), 'lookup_customer' (retrieve customer profile/claims), 'draft_reply' (write reply to customer), 'escalate' (escalate issues/disputes)."
    )
    customer_id: Optional[str] = Field(
        None, description="Extracted customer CRM ID (e.g., CRM-101) if mentioned, else null."
    )
    subject: Optional[str] = Field(
        None, description="Extracted subject line for email drafting, else null."
    )
    details: Optional[str] = Field(
        None, description="Details or reasoning for escalation or drafting, else null."
    )

def get_intent_classification(query: str, gemini: GeminiClient) -> IntentRouter:
    system_prompt = (
        "You are an Orchestrator / Supervisor Agent for NorthBridge Insurance customer support. "
        "Analyze the incoming query and determine which specialized sub-agent to invoke: "
        "Policy RAG Specialist Agent ('search_knowledge'), CRM Account Agent ('lookup_customer'), or Claims Clearance Agent ('draft_reply' / 'escalate')."
    )
    return gemini.generate_structured_output(
        prompt=query,
        schema=IntentRouter,
        system_instruction=system_prompt
    )

def _autonomy_on(state: AgentState) -> bool:
    if state.get("autonomy_enabled") is not None:
        return bool(state.get("autonomy_enabled"))
    return bool(settings.COPILOT_AUTONOMY)

# ═══════════ AGENT 1: SUPERVISOR ORCHESTRATOR AGENT ═══════════
def supervisor_orchestrator_node(state: AgentState) -> Dict[str, Any]:
    """
    Supervisor Agent that evaluates caller speech/query, classifies intent,
    and assigns control to specialized sub-agents.
    """
    gemini = GeminiClient()
    query = state["user_query"]
    classification = get_intent_classification(query, gemini)
    
    logs = list(state.get("agent_logs") or [])
    logs.append({
        "agent": "Supervisor Orchestrator Agent",
        "action": f"Classified intent as '{classification.intent}'",
        "customer_id": classification.customer_id
    })

    return {
        "intent": classification.intent,
        "active_agent": "supervisor",
        "agent_logs": logs,
        "customer_info": {"id": classification.customer_id} if classification.customer_id else state.get("customer_info"),
        "pending_action": {
            "intent": classification.intent,
            "customer_id": classification.customer_id,
            "subject": classification.subject or "Support Follow-up",
            "details": classification.details or query
        } if classification.intent in ["draft_reply", "escalate"] else None
    }

# ═══════════ AGENT 2: POLICY RAG SPECIALIST SUB-AGENT ═══════════
def policy_rag_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized Sub-Agent responsible for searching PolicyChunkModel vector store
    (including 2026-2027 Vehicle Insurance Policy Handbook and markdown guidelines)
    and generating citation-backed grounded responses.
    """
    gemini = GeminiClient()
    query = state["user_query"]
    
    logs = list(state.get("agent_logs") or [])
    logs.append({
        "agent": "Policy RAG Specialist Agent",
        "action": "Executing semantic search on policy documents & handbooks"
    })
    
    # Retrieve top match documents from database vector store
    retrieved = search_knowledge_base(query)
    context = retrieved.get("context", "")
    confidence = retrieved.get("confidence", 0.0)
    sources = retrieved.get("sources", [])
    
    citations = [
        {
            "id": src.get("id", idx + 1),
            "title": src.get("category") or src.get("file") or "Policy Handbook",
            "doc": src.get("file") or "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            "snippet": src.get("snippet") or ""
        }
        for idx, src in enumerate(sources)
    ]

    if confidence < 0.20 or not context.strip():
        response = (
            "The current Policy Handbook does not contain specific documentation to answer this query. "
            "Flagged for human staff review to confirm internal policy service procedures."
        )
        context = ""
    else:
        system_prompt = (
            "You are the Policy RAG Specialist Sub-Agent for NorthBridge Insurance.\n"
            "Your task is to answer the customer's actual question using ONLY the provided document CONTEXT below.\n\n"
            f"CONTEXT:\n{context}\n\n"
            "STRICT INSTRUCTIONS:\n"
            "1. Answer the customer's actual question directly and specifically based ONLY on the retrieved CONTEXT.\n"
            "2. Cite specific policy clauses and section names using [1], [2] where appropriate.\n"
            "3. State clearly whether the requested item/event is COVERED, EXCLUDED, or PARTIALLY COVERED. Include specific rupee/dollar amounts, deductibles, limits, and rider requirements if present in the context.\n"
            "4. Note: Motor insurance policies cover accidental loss/damage, theft, fire, third-party liability, and active riders (such as Zero Depreciation or EV Battery Shield). Motor insurance DOES NOT cover normal wear and tear, battery age degradation, mechanical/electrical breakdown, or manufacturing defects covered under manufacturer warranty.\n"
            "5. If the context does not contain sufficient information to answer the query, explicitly state that the policy handbook lacks the required details and flag the inquiry for human staff review.\n"
            "6. NEVER emit generic boilerplate phrases like 'coverage verified active under standard terms and conditions'."
        )
        response = gemini.generate_response(prompt=query, system_instruction=system_prompt)
        
    return {
        "active_agent": "policy_rag",
        "retrieved_context": context,
        "confidence": confidence,
        "response": response,
        "citations": citations,
        "agent_logs": logs
    }

# ═══════════ AGENT 3: CRM & ACCOUNT SPECIALIST SUB-AGENT ═══════════
def crm_account_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized Sub-Agent responsible for looking up customer CRM records,
    policy statuses, active claims, and computing account risk metrics.
    """
    logs = list(state.get("agent_logs") or [])
    cust_record = state.get("customer_info") or {}
    cust_id = cust_record.get("id")
    
    logs.append({
        "agent": "CRM & Account Specialist Agent",
        "action": f"Auditing customer record for ID '{cust_id}'"
    })
    
    if not cust_id:
        return {
            "active_agent": "crm_account",
            "response": "Please verify customer identity (e.g. CRM-101, CRM-103) to access customer account records.",
            "agent_logs": logs
        }
        
    record = lookup_customer_record(cust_id)
    if not record:
        return {
            "active_agent": "crm_account",
            "response": f"No customer record found for ID: {cust_id}.",
            "agent_logs": logs
        }
        
    details_str = (
        f"### Customer CRM Record Found (Audited by CRM Specialist Agent)\n"
        f"- **Name**: {record['name']}\n"
        f"- **CRM ID**: {record['id']}\n"
        f"- **Policy Number**: {record['policy_number']} ({record['policy_type']} - {record['status']})\n"
        f"- **Premium**: ₹{record['premium']}\n"
        f"- **Coverage details**: {record['coverage_details']}\n"
    )
    if record.get("claims"):
        details_str += "\n**Active Claims**:\n"
        for c in record["claims"]:
            details_str += f"- Claim ID: {c['id']}, Status: {c['status']}, Type: {c['type']}, Amount: ₹{c['amount']}\n"
    else:
        details_str += "\nNo active claims on file."

    return {
        "active_agent": "crm_account",
        "customer_info": record,
        "response": details_str,
        "agent_logs": logs
    }

# ═══════════ AGENT 4: CLAIMS & HITL CLEARANCE SUB-AGENT ═══════════
def claims_hitl_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized Sub-Agent responsible for evaluating claim actions,
    drafting customer emails, managing ticket escalations, and triggering
    the Human-In-The-Loop (HITL) gate for supervisor clearance.
    """
    pending = state.get("pending_action") or {}
    intent = state.get("intent")
    autonomy = _autonomy_on(state)
    logs = list(state.get("agent_logs") or [])

    auto_approve = autonomy and intent == "draft_reply"
    
    logs.append({
        "agent": "Claims & HITL Clearance Agent",
        "action": f"Evaluated action '{intent}'. Auto-approve: {auto_approve}"
    })
    
    if intent == "draft_reply" and auto_approve:
        response = (
            f"**Autonomous Claims Copilot**: Draft reply for customer "
            f"`{pending.get('customer_id')}` auto-approved by Copilot Autonomy."
        )
    elif intent == "draft_reply":
        response = (
            f"**Action Required**: A draft email response is pending approval for customer "
            f"`{pending.get('customer_id')}`. Please verify and approve."
        )
    elif intent == "escalate":
        response = (
            f"**Action Required**: An escalation ticket is pending approval for customer "
            f"`{pending.get('customer_id')}`. Please verify and approve."
        )
    else:
        response = "Action prepared by Claims Specialist."
        
    return {
        "active_agent": "claims_hitl",
        "response": response,
        "is_approved": auto_approve,
        "agent_logs": logs
    }

def execute_claims_action_node(state: AgentState) -> Dict[str, Any]:
    """
    Executes transaction after HITL gate approval or autonomous clearance.
    """
    pending = state.get("pending_action") or {}
    intent = state.get("intent")
    logs = list(state.get("agent_logs") or [])
    
    if not state.get("is_approved"):
        return {
            "active_agent": "claims_hitl",
            "response": "Action rejected or unauthorized by Claims Clearance Agent.",
            "agent_logs": logs
        }

    action_result = {}
    if intent == "draft_reply":
        action_result = draft_customer_response(
            customer_id=pending.get("customer_id") or "UNKNOWN",
            subject=pending.get("subject") or "Support Follow-up",
            content=pending.get("details") or "",
            auto_send=_autonomy_on(state)
        )
        status_note = action_result['status']
        response = (
            f"### Action Executed by Claims Specialist Agent: Outbound Email {'Sent' if 'Sent' in status_note else 'Draft Created'}\n"
            f"- **Draft ID**: {action_result['draft_id']}\n"
            f"- **Customer ID**: {action_result['customer_id']}\n"
            f"- **Status**: {status_note}\n\n"
            f"**Draft Body**:\n```\n{action_result['content']}\n```"
        )
    elif intent == "escalate":
        action_result = escalate_to_supervisor(
            customer_id=pending.get("customer_id") or "UNKNOWN",
            reason=pending.get("subject") or "Escalation Request",
            details=pending.get("details") or ""
        )
        response = (
            f"### Action Executed by Claims Specialist Agent: Ticket Escalated\n"
            f"- **Ticket ID**: {action_result['ticket_id']}\n"
            f"- **Reason**: {action_result['reason']}\n"
            f"- **Status**: {action_result['status']}"
        )
    else:
        response = "No matching action identified."

    logs.append({
        "agent": "Claims & HITL Clearance Agent",
        "action": f"Executed action '{intent}' successfully",
        "result": action_result
    })

    return {
        "active_agent": "claims_hitl",
        "action_output": action_result,
        "response": response,
        "pending_action": None,
        "agent_logs": logs
    }

# ═══════════ MULTI-AGENT GRAPH ROUTING ═══════════
def multi_agent_router(state: AgentState) -> str:
    intent = state.get("intent")
    if intent == "search_knowledge":
        return "policy_rag_specialist"
    elif intent == "lookup_customer":
        return "crm_account_specialist"
    elif intent in ["draft_reply", "escalate"]:
        return "claims_hitl_specialist"
    return END

def after_prepare_edge(state: AgentState) -> str:
    if state.get("is_approved"):
        return "auto_execute_claims_action"
    return "execute_claims_action"

# Build Multi-Agent StateGraph
builder = StateGraph(AgentState)

# Add Multi-Agent Nodes
builder.add_node("supervisor_orchestrator", supervisor_orchestrator_node)
builder.add_node("policy_rag_specialist", policy_rag_specialist_node)
builder.add_node("crm_account_specialist", crm_account_specialist_node)
builder.add_node("claims_hitl_specialist", claims_hitl_specialist_node)
builder.add_node("execute_claims_action", execute_claims_action_node)
builder.add_node("auto_execute_claims_action", execute_claims_action_node)

# Set Entry Point & Conditional Edges
builder.set_entry_point("supervisor_orchestrator")
builder.add_conditional_edges("supervisor_orchestrator", multi_agent_router)

builder.add_edge("policy_rag_specialist", END)
builder.add_edge("crm_account_specialist", END)

builder.add_conditional_edges("claims_hitl_specialist", after_prepare_edge)
builder.add_edge("execute_claims_action", END)
builder.add_edge("auto_execute_claims_action", END)

# Memory Checkpointer & Graph Compilation with Interrupt Gate
memory = MemorySaver()
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["execute_claims_action"]
)

def run_graph_workflow(
    query: str,
    customer_id: Optional[str] = None,
    thread_id: Optional[str] = None,
    autonomy: bool = True
) -> Dict[str, Any]:
    """
    Executes compiled LangGraph multi-agent graph workflow and formats output to frontend JSON schema.
    """
    import uuid
    from src.pii import redact_pii
    
    redacted = redact_pii(query)
    t_id = thread_id or f"tr_{uuid.uuid4().hex[:8]}"

    initial_state: AgentState = {
        "user_query": redacted,
        "intent": None,
        "active_agent": None,
        "agent_logs": [],
        "retrieved_context": None,
        "confidence": 0.0,
        "customer_info": {"id": customer_id} if customer_id else None,
        "action_output": None,
        "response": None,
        "is_approved": None,
        "pending_action": None,
        "history": None,
        "autonomy_enabled": autonomy,
        "citations": []
    }

    config = {"configurable": {"thread_id": t_id}}
    final_state = graph.invoke(initial_state, config=config)

    response_text = final_state.get("response") or "No response generated."
    confidence_val = final_state.get("confidence") or 0.85
    if isinstance(confidence_val, float) and confidence_val <= 1.0:
        confidence_pct = int(confidence_val * 100)
    else:
        confidence_pct = int(confidence_val)

    raw_agent = final_state.get("active_agent") or "supervisor"
    agent_map = {
        "supervisor": "Supervisor Orchestrator Agent",
        "policy_rag": "Policy RAG Agent",
        "crm_account": "CRM Account Agent",
        "claims_hitl": "Claims HITL Agent"
    }
    active_agent = agent_map.get(raw_agent, raw_agent)

    query_lower = query.lower()
    sentiment = "neutral"
    if any(w in query_lower for w in ["urgent", "immediately", "accident", "crash", "stolen"]):
        sentiment = "anxious"
    elif any(w in query_lower for w in ["angry", "delay", "rejected", "horrible", "terrible"]):
        sentiment = "frustrated"

    citations = final_state.get("citations") or []

    hitlCard = None
    if final_state.get("pending_action"):
        pending = final_state["pending_action"]
        hitlCard = {
            "required_level": 2 if pending.get("intent") == "escalate" else 1,
            "required_role": "Customer Service Manager (CSM)" if pending.get("intent") == "escalate" else "Technical Support Specialist (Senior CSR)",
            "action": pending.get("intent"),
            "details": pending.get("details")
        }

    return {
        "thread_id": t_id,
        "status": "completed",
        "response": response_text,
        "confidence": confidence_pct,
        "grounded": (confidence_val if isinstance(confidence_val, float) else confidence_val / 100.0) >= 0.25,
        "activeAgent": active_agent,
        "sentiment": sentiment,
        "citations": citations,
        "hitlCard": hitlCard
    }

