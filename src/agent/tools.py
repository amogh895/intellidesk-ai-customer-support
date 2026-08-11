from src.retrieval.retriever import KnowledgeRetriever
from src.services.crm_service import CRMService
from src.services.ticket_service import TicketService

# Instantiate services
retriever = KnowledgeRetriever()
crm_service = CRMService()
ticket_service = TicketService()

def search_knowledge_base(query: str):
    """
    Search the internal NorthBridge Insurance documents database.
    """
    return retriever.retrieve(query)

def lookup_customer_record(identifier: str):
    """
    Search for customer name or CRM ID.
    """
    return crm_service.lookup_customer(identifier)

def draft_customer_response(customer_id: str, subject: str, content: str):
    """
    Generate a reply draft that requires approval.
    """
    return ticket_service.create_draft(customer_id, subject, content)

def escalate_to_supervisor(customer_id: str, reason: str, details: str):
    """
    Escalate issues to supervisors.
    """
    return ticket_service.escalate_ticket(customer_id, reason, details)
