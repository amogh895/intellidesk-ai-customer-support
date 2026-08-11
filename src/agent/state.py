from typing import TypedDict, Dict, Any, List, Optional

class AgentState(TypedDict):
    """
    Main state schema managed by the LangGraph orchestrator.
    """
    user_query: str
    intent: Optional[str]        # 'search_knowledge' | 'lookup_customer' | 'draft_reply' | 'escalate'
    retrieved_context: Optional[str]
    confidence: Optional[float]
    customer_info: Optional[Dict[str, Any]]
    action_output: Optional[Dict[str, Any]]
    response: Optional[str]
    is_approved: Optional[bool]
    pending_action: Optional[Dict[str, Any]]  # Stores info on the action that needs human approval
    history: Optional[List[Dict[str, str]]]
