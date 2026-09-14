from typing import TypedDict, Dict, Any, List, Optional

class AgentState(TypedDict):
    """
    Main state schema managed by the LangGraph multi-agent orchestrator.
    """
    user_query: str
    intent: Optional[str]        # 'search_knowledge' | 'lookup_customer' | 'draft_reply' | 'escalate'
    active_agent: Optional[str]  # 'supervisor' | 'policy_rag' | 'crm_account' | 'claims_hitl'
    agent_logs: Optional[List[Dict[str, Any]]]
    retrieved_context: Optional[str]
    confidence: Optional[float]
    customer_info: Optional[Dict[str, Any]]
    action_output: Optional[Dict[str, Any]]
    response: Optional[str]
    is_approved: Optional[bool]
    pending_action: Optional[Dict[str, Any]]  # Stores info on the action that needs human approval
    history: Optional[List[Dict[str, str]]]
    autonomy_enabled: Optional[bool]  # When True, safe draft_reply skips HITL gate
