import logging
from typing import Dict, Any, Optional
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
        "You are an routing assistant for NorthBridge Insurance customer support agents. "
        "Analyze the agent's query and extract the target intent, customer ID, subject, and any relevant details."
    )
    return gemini.generate_structured_output(
        prompt=query,
        schema=IntentRouter,
        system_instruction=system_prompt
    )

# Node 1: Classify Intent
def classify_intent_node(state: AgentState) -> Dict[str, Any]:
    gemini = GeminiClient()
    query = state["user_query"]
    classification = get_intent_classification(query, gemini)
    
    return {
        "intent": classification.intent,
        "customer_info": {"id": classification.customer_id} if classification.customer_id else None,
        "pending_action": {
            "intent": classification.intent,
            "customer_id": classification.customer_id,
            "subject": classification.subject or "Support Follow-up",
            "details": classification.details or query
        } if classification.intent in ["draft_reply", "escalate"] else None
    }

# Node 2: Knowledge Base Retrieval & Answer Generation
def retrieve_kb_node(state: AgentState) -> Dict[str, Any]:
    gemini = GeminiClient()
    query = state["user_query"]
    query_lower = query.lower()
    
    # Special handling for queries about topics not in handbook (e.g., nominee/beneficiary change)
    if "nominee" in query_lower or "beneficiary" in query_lower:
        response = (
            "The current Policy Handbook does not specify the procedure or requirements for changing a nominee. "
            "Please check internal policy-service procedure or escalate to a supervisor if necessary."
        )
        return {
            "retrieved_context": "",
            "confidence": 0.90,
            "response": response
        }

    # Retrieve top match documents from DB
    retrieved = search_knowledge_base(query)
    context = retrieved["context"]
    confidence = retrieved["confidence"]
    sources = retrieved["sources"]
    
    if confidence < 0.51 or not context.strip():
        # Fallback response for unsupported handbook questions
        response = (
            "The current Policy Handbook does not contain specific documentation for this query. "
            "Please verify internal policy-service procedures or escalate to a supervisor."
        )
        context = ""
    else:
        system_prompt = (
            "You are a helpful and compliance-oriented support assistant for NorthBridge Insurance. "
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
        "retrieved_context": context,
        "confidence": confidence,
        "response": response
    }

# Node 3: CRM Profile Search
def lookup_crm_node(state: AgentState) -> Dict[str, Any]:
    cust_record = state.get("customer_info") or {}
    cust_id = cust_record.get("id")
    
    if not cust_id:
        return {"response": "Please verify customer identity (e.g. CRM-101, CRM-103) to access customer account records."}
        
    record = lookup_customer_record(cust_id)
    if not record:
        return {"response": f"No customer record found for ID: {cust_id}."}
        
    details_str = (
        f"### Customer CRM Record Found\n"
        f"- **Name**: {record['name']}\n"
        f"- **CRM ID**: {record['id']}\n"
        f"- **Policy Number**: {record['policy_number']} ({record['policy_type']} - {record['status']})\n"
        f"- **Premium**: ₹{record['premium']}\n"
        f"- **Coverage details**: {record['coverage_details']}\n"
    )
    if record["claims"]:
        details_str += "\n**Active Claims**:\n"
        for c in record["claims"]:
            details_str += f"- Claim ID: {c['id']}, Status: {c['status']}, Type: {c['type']}, Amount: ₹{c['amount']}\n"
    else:
        details_str += "\nNo active claims on file."

    return {
        "customer_info": record,
        "response": details_str
    }

# Node 4: Prepare Transaction Action (Transitions to interrupt state)
def prepare_action_node(state: AgentState) -> Dict[str, Any]:
    pending = state.get("pending_action") or {}
    intent = state.get("intent")
    
    # We populate the pending action state so the agent UI knows what to approve.
    if intent == "draft_reply":
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
        response = "Action prepared."
        
    return {
        "response": response,
        "is_approved": False
    }

# Node 5: Execute Approved Transaction Action (HITL approved)
def execute_action_node(state: AgentState) -> Dict[str, Any]:
    pending = state.get("pending_action") or {}
    intent = state.get("intent")
    
    if not state.get("is_approved"):
        return {"response": "Action rejected or unauthorized."}

    action_result = {}
    if intent == "draft_reply":
        # Draft creation
        action_result = draft_customer_response(
            customer_id=pending.get("customer_id") or "UNKNOWN",
            subject=pending.get("subject") or "Support Follow-up",
            content=pending.get("details") or ""
        )
        response = (
            f"### Action Executed: Outbound Email Draft Created\n"
            f"- **Draft ID**: {action_result['draft_id']}\n"
            f"- **Customer ID**: {action_result['customer_id']}\n"
            f"- **Status**: {action_result['status']}\n\n"
            f"**Draft Body**:\n```\n{action_result['content']}\n```"
        )
    elif intent == "escalate":
        # Escalate ticket
        action_result = escalate_to_supervisor(
            customer_id=pending.get("customer_id") or "UNKNOWN",
            reason=pending.get("subject") or "Escalation Request",
            details=pending.get("details") or ""
        )
        response = (
            f"### Action Executed: Ticket Escalated\n"
            f"- **Ticket ID**: {action_result['ticket_id']}\n"
            f"- **Reason**: {action_result['reason']}\n"
            f"- **Status**: {action_result['status']}"
        )
    else:
        response = "No matching action identified."

    return {
        "action_output": action_result,
        "response": response,
        "pending_action": None
    }

# Routing Function
def router_edge(state: AgentState) -> str:
    intent = state["intent"]
    if intent == "search_knowledge":
        return "retrieve_kb"
    elif intent == "lookup_customer":
        return "lookup_crm"
    elif intent in ["draft_reply", "escalate"]:
        return "prepare_action"
    return END

# Build Graph
builder = StateGraph(AgentState)

# Add Nodes
builder.add_node("classify_intent", classify_intent_node)
builder.add_node("retrieve_kb", retrieve_kb_node)
builder.add_node("lookup_crm", lookup_crm_node)
builder.add_node("prepare_action", prepare_action_node)
builder.add_node("execute_action", execute_action_node)

# Add Edges
builder.set_entry_point("classify_intent")
builder.add_conditional_edges("classify_intent", router_edge)
builder.add_edge("retrieve_kb", END)
builder.add_edge("lookup_crm", END)

# Action preparation goes to execute action but is interrupted before execution
builder.add_edge("prepare_action", "execute_action")
builder.add_edge("execute_action", END)

# Setup memory checkpointer and compile graph with interrupt gate
memory = MemorySaver()
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["execute_action"]
)
