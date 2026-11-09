import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import asyncio
from fastapi import HTTPException
from src.main import (
    health_check, staff_login, customer_login, resolve_approval_decision,
    get_dashboard_metrics, get_claims_manager_analytics, get_claims_pipeline,
    search_claims_and_customers, LoginRequest, CustomerLoginRequest, ApprovalDecisionRequest
)
from src.db_pg import SessionLocal, init_db
from src.models import StaffModel, ApprovalQueueModel, CustomerModel, ClaimModel
from src.auth import validate_approval_permission, decode_access_token

@pytest.fixture
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_api_health(db):
    res = health_check(db=db)
    assert res["status"] == "healthy"
    assert "staff_seeded" in res

def test_staff_login_success(db):
    res = staff_login(LoginRequest(
        email="alex.mercer@northbridge.com",
        password="CSM@2026"
    ), db=db)
    assert "access_token" in res
    assert res["user"]["role"] == "Customer Service Manager (CSM)"
    assert res["user"]["tier"] == 1
    assert res["user"]["team"] == "Executive"

def test_staff_login_invalid_password(db):
    with pytest.raises(HTTPException) as exc:
        staff_login(LoginRequest(
            email="alex.mercer@northbridge.com",
            password="WrongPassword123"
        ), db=db)
    assert exc.value.status_code == 401

def test_customer_login_success(db):
    res = customer_login(CustomerLoginRequest(
        email="rahul.verma@example.com",
        password="Customer@2026"
    ), db=db)
    assert "access_token" in res
    assert res["customer"]["name"] == "Rahul Verma"

def test_rbac_approval_support_agent_forbidden(db):
    agent_staff = {
        "sub": "sarah.jenkins@northbridge.com",
        "name": "Sarah Jenkins",
        "role": "Support Agent",
        "tier": 3,
        "team": "Team Alpha",
        "realm": "staff"
    }
    with pytest.raises(HTTPException) as exc:
        validate_approval_permission(agent_staff, 50000.0)
    assert exc.value.status_code == 403
    assert "Support Agent" in exc.value.detail or "RBAC Violation" in exc.value.detail

def test_rbac_approval_level_2_senior_csr_forbidden(db):
    senior_csr_staff = {
        "sub": "riya.kapoor@northbridge.com",
        "name": "Riya Kapoor",
        "role": "Technical Support Specialist (Senior CSR)",
        "tier": 2,
        "team": "Team Alpha",
        "realm": "staff"
    }
    # Level 1 (< 100,000 INR) should pass
    validate_approval_permission(senior_csr_staff, 45000.0)

    # Level 2 (>= 100,000 INR) must fail with 403
    with pytest.raises(HTTPException) as exc:
        validate_approval_permission(senior_csr_staff, 150000.0)
    assert exc.value.status_code == 403
    assert "Level 2" in exc.value.detail

def test_rbac_approval_csm_decision_flow(db):
    csm_staff = {
        "sub": "alex.mercer@northbridge.com",
        "name": "Alex Mercer",
        "role": "Customer Service Manager (CSM)",
        "tier": 1,
        "team": "Executive",
        "realm": "staff"
    }
    appr = ApprovalQueueModel(
        id="APP-UNIT-TEST-01",
        thread_id="tr_unit_test_01",
        customer_id="CRM-101",
        customer_name="Rahul Verma",
        action_type="Claim Payout Authorization",
        amount=75000.0,
        details="Authorized payout for accidental bumper repair under Clause 4.",
        status="pending"
    )
    db.merge(appr)
    db.commit()

    # Empty reason code must raise 400
    with pytest.raises(HTTPException) as exc:
        resolve_approval_decision(
            approval_id="APP-UNIT-TEST-01",
            req=ApprovalDecisionRequest(approved=True, reason_code="", note="Some note"),
            current_staff=csm_staff,
            db=db
        )
    assert exc.value.status_code == 400

    # Valid decision
    res = resolve_approval_decision(
        approval_id="APP-UNIT-TEST-01",
        req=ApprovalDecisionRequest(
            approved=True,
            reason_code="POLICY_COMPLIANT",
            note="Verified against policy terms and deductibles."
        ),
        current_staff=csm_staff,
        db=db
    )
    assert res["status"] == "success"
    assert res["approval"]["status"] == "approved"

def test_dashboard_metrics(db):
    res = get_dashboard_metrics(db=db)
    assert "open_claims" in res
    assert "pending_payout_inr" in res
    assert res["stream_active"] is True

def test_analytics_claims_manager(db):
    res = get_claims_manager_analytics(db=db)
    assert "kpis" in res
    assert "pipeline" in res
    assert "trend" in res
    assert "exposure" in res
    assert "approval_aging" in res
    assert "team_performance" in res
    assert "ai_confidence_dist" in res
    assert "sentiment_trend" in res
    assert "policy_risk_matrix" in res
    assert "top_rejection_reasons" in res

def test_claims_pipeline(db):
    res = get_claims_pipeline(db=db)
    assert "New" in res
    assert "Under Review" in res
    assert "Awaiting Approval" in res
    assert "Settled" in res
    assert "Rejected" in res

def test_search_claims_and_customers(db):
    res = search_claims_and_customers(q="verma", db=db)
    assert "customers" in res
    assert any("Verma" in c["name"] for c in res["customers"])
