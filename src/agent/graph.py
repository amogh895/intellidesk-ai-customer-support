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
    Specialized Sub-Agent responsible for searching ChromaDB vector store
    (including 2026-2027 Vehicle Insurance Policy Handbook and markdown guidelines)
    and generating citation-backed compliance responses.
    """
    gemini = GeminiClient()
    query = state["user_query"]
    query_lower = query.lower()
    
    logs = list(state.get("agent_logs") or [])
    logs.append({
        "agent": "Policy RAG Specialist Agent",
        "action": "Executing semantic search on policy documents & handbooks"
    })
    
    # Special handling for queries about topics not in handbook (e.g., nominee/beneficiary change)
    if "nominee" in query_lower or "beneficiary" in query_lower:
        response = (
            "The current Policy Handbook does not specify the procedure or requirements for changing a nominee. "
            "Please check internal policy-service procedure or escalate to a supervisor if necessary."
        )
        return {
            "active_agent": "policy_rag",
            "retrieved_context": "",
            "confidence": 0.90,
            "response": response,
            "agent_logs": logs
        }

    # Retrieve top match documents from vector store
    retrieved = search_knowledge_base(query)
    context = retrieved["context"]
    confidence = retrieved["confidence"]
    sources = retrieved["sources"]
    
    if confidence < 0.51 or not context.strip():
        response = (
            "The current Policy Handbook does not contain specific documentation for this query. "
            "Please verify internal policy-service procedures or escalate to a supervisor."
        )
        context = ""
    else:
        system_prompt = (
            "You are the Policy RAG Specialist Sub-Agent for NorthBridge Insurance. "
            "Your task is to answer the user's query using ONLY the provided document context below.\n\n"
            f"CONTEXT:\n{context}\n\n"
            "INSTRUCTIONS:\n"
            "- Answer the question factually based ONLY on the context.\n"
            "- Cite the sources by appending their [1], [2] citation numbers where appropriate.\n"
            "- Do not make up facts or include external knowledge.\n"
            "- If the context does not contain enough info, state clearly that the handbook does not specify the procedure."
        )
        response = gemini.generate_response(prompt=query, system_instruction=system_prompt)
        
        # Format sources as citation appendix
        if sources:
            citation_list = []
            for src in sources:
                citation_list.append(f"- [{src['id']}] Source file: {src['file']} ({src['category']})")
            response += "\n\n**Sources:**\n" + "\n".join(citation_list)
            
    return {
        "active_agent": "policy_rag",
        "retrieved_context": context,
        "confidence": confidence,
        "response": response,
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
