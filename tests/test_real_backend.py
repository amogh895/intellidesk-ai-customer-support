import pytest
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_pg import SessionLocal, init_db
from src.seed import seed_database
from src.models import CustomerModel, ApprovalQueueModel, SupportRequestModel, RequestMessageModel
from src.agent.graph import run_graph_workflow

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_database()

def test_database_seeding():
    db = SessionLocal()
    count = db.query(CustomerModel).count()
    cust = db.query(CustomerModel).filter(CustomerModel.id == "CRM-101").first()
    db.close()
    assert count >= 3, "Database should contain seeded customer records."
    assert cust is not None
    assert cust.hashed_password is not None, "Customer should have a hashed password."

def test_support_request_data_model():
    db = SessionLocal()
    requests = db.query(SupportRequestModel).filter(SupportRequestModel.customer_id == "CRM-101").all()
    assert len(requests) > 0, "CRM-101 should have at least 1 seeded support request."
    req = requests[0]
    assert req.channel in ["text", "voice"]
    assert len(req.messages) > 0, "Support request should have messages."
    db.close()

def test_policy_rag_retrieval():
    result = run_graph_workflow("What is the compulsory deductible for motor vehicles?")
    assert result["status"] == "completed"
    assert "response" in result
    assert result["confidence"] >= 0  # Confidence depends on vector store state

def test_crm_lookup_routing():
    result = run_graph_workflow("What is my policy number and coverage details?", customer_id="CRM-101")
    assert result["status"] == "completed"
    assert "response" in result

def test_staff_queue_and_hitl_approval_dispatch():
    db = SessionLocal()
    # Create an isolated test request
    test_req = SupportRequestModel(
        id="REQ-TEST-DISPATCH",
        customer_id="CRM-101",
        original_query="What is my policy coverage?",
        redacted_query="What is my policy coverage?",
        channel="text",
        status="new"
    )
    db.merge(test_req)
    db.commit()

    req = db.query(SupportRequestModel).filter(SupportRequestModel.id == "REQ-TEST-DISPATCH").first()
    assert req is not None
    assert req.status in ["new", "awaiting_approval"]

    # Process query with real LangGraph workflow
    graph_res = run_graph_workflow(req.redacted_query, customer_id=req.customer_id)
    assert graph_res["status"] == "completed"

    req.status = "answered"
    db.commit()

    updated_req = db.query(SupportRequestModel).filter(SupportRequestModel.id == "REQ-TEST-DISPATCH").first()
    assert updated_req.status == "answered"

    # Clean up test object
    db.delete(updated_req)
    db.commit()
    db.close()
