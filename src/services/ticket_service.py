from typing import Dict, Any, List

class TicketService:
    """
    Mock service managing ticket lifecycle, drafts, and supervisor escalations.
    """
    def __init__(self):
        self.drafts: Dict[str, Dict[str, Any]] = {}
        self.escalations: List[Dict[str, Any]] = []

    def create_draft(self, customer_id: str, subject: str, content: str) -> Dict[str, Any]:
        """
        Creates or updates a response draft for a customer.
        """
        draft_id = f"DFT-{len(self.drafts) + 101}"
        draft_entry = {
            "draft_id": draft_id,
            "customer_id": customer_id,
            "subject": subject,
            "content": content,
            "status": "Pending Approval"
        }
        self.drafts[draft_id] = draft_entry
        return draft_entry

    def approve_draft(self, draft_id: str) -> bool:
        """
        Approves a draft response, changing its status to 'Sent'.
        """
        if draft_id in self.drafts:
            self.drafts[draft_id]["status"] = "Approved & Sent"
            return True
        return False

    def escalate_ticket(self, customer_id: str, reason: str, details: str) -> Dict[str, Any]:
        """
        Escalates a support ticket to Supervisor level.
        """
        ticket_id = f"ESC-{len(self.escalations) + 201}"
        escalation_entry = {
            "ticket_id": ticket_id,
            "customer_id": customer_id,
            "reason": reason,
            "details": details,
            "status": "Escalated"
        }
        self.escalations.append(escalation_entry)
        return escalation_entry
