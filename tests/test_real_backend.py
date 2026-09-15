import pytest
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_pg import SessionLocal, init_db
from src.seed import seed_database
from src.ingest_pgvector import ingest_policy_documents
from src.agent.real_graph import real_agent_graph
from src.models import CustomerModel, ApprovalQueueModel

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_database()
    ingest_policy_documents()

def test_database_seeding():
    db = SessionLocal()
    count = db.query(CustomerModel).count()
    db.close()
    assert count >= 3, "Database should contain seeded customer records."

def test_policy_rag_retrieval():
    result = real_agent_graph.process_query("What is the compulsory deductible for motor vehicles?")
    assert result["status"] == "completed"
    assert result["grounded"] is True
    assert len(result["citations"]) > 0
    assert result["confidence"] >= 80

def test_claims_hitl_and_2level_rbac():
    result = real_agent_graph.process_query("Submit accidental claim payout for major crash damage", customer_id="CRM-103")
    assert result["status"] == "suspended"
    assert result["hitlCard"] is not None
    assert result["hitlCard"]["required_level"] in [1, 2]

def test_crm_lookup_routing():
    result = real_agent_graph.process_query("What is my policy number and coverage details?", customer_id="CRM-101")
    assert result["status"] == "completed"
    assert "Comprehensive Private Car Policy" in result["response"]
