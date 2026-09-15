import sys
import os
import random
from faker import Faker
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_pg import SessionLocal, init_db
from src.models import CustomerModel, PolicyModel, ClaimModel, TicketModel, ApprovalQueueModel, AuditLogModel, EvaluationMetricModel

load_dotenv()

fake = Faker()
Faker.seed(42)
random.seed(42)

POLICY_TYPES = [
    "Comprehensive Private Car Policy",
    "Third Party + Theft Coverage",
    "Commercial Fleet Vehicle Policy",
    "Zero Depreciation Motor Shield",
    "EV Battery & Drive Cover"
]

RISK_TIERS = ["Low", "Medium", "High"]

COVERAGE_OPTIONS = [
    "Zero Depreciation, Engine Protect, Roadside Assistance, NCB 35%",
    "Third Party Property Damage up to Rs 7.5 Lakhs, Fire & Theft",
    "Fleet Comprehensive, Goods In Transit Cover, Driver PA Rs 15L",
    "Full Bumper-to-Bumper Indemnity, Hydrostatic Lock Cover, Key Replacement",
    "EV High Voltage Battery Warranty, Wall Charger Surge Protection, Towing Support"
]

CLAIM_REASONS = [
    "Bumper damage repair after parking scrape",
    "Windshield chip repair from highway gravel",
    "Multi-vehicle highway collision claim",
    "Engine flood damage due to heavy waterlogging",
    "Side mirror theft replacement claim"
]

def seed_database():
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_count = db.query(CustomerModel).count()
        if existing_count >= 200:
            print(f"Database already contains {existing_count} customers. Skipping re-seed.")
            return

        print("Seeding ~200 internally-consistent Customer, Policy, Claim, and Ticket records...")

        # Clear tables cleanly
        db.query(ClaimModel).delete()
        db.query(PolicyModel).delete()
        db.query(TicketModel).delete()
        db.query(CustomerModel).delete()
        db.commit()

        # Seed fixed default customers first
        default_customers = [
            CustomerModel(
                id="CRM-101",
                name="Rahul Verma",
                email="rahul.verma@example.com",
                phone="+91 98765 43210",
                policy_number="POL-NB-2026-9921",
                policy_type="Comprehensive Private Car Policy",
                status="Active",
                premium=18450.0,
                risk_tier="Low",
                coverage_details="Zero Depreciation, Engine Protect, Roadside Assistance, NCB 35%"
            ),
            CustomerModel(
                id="CRM-102",
                name="Priya Sharma",
                email="priya.sharma@example.com",
                phone="+91 91234 56789",
                policy_number="POL-NB-2026-4410",
                policy_type="Third Party + Theft Coverage",
                status="Active",
                premium=9200.0,
                risk_tier="Medium",
                coverage_details="Third Party Property Damage up to Rs 7.5 Lakhs, Fire & Theft"
            ),
            CustomerModel(
                id="CRM-103",
                name="Amit Patel",
                email="amit.patel@example.com",
                phone="+91 99887 76655",
                policy_number="POL-NB-2026-1189",
                policy_type="Commercial Fleet Vehicle Policy",
                status="Under Review",
                premium=45000.0,
                risk_tier="High",
                coverage_details="Fleet Comprehensive, Goods In Transit Cover, Driver PA Rs 15L"
            )
        ]

        for c in default_customers:
            db.merge(c)
            pol = PolicyModel(
                policy_number=c.policy_number,
                customer_id=c.id,
                policy_type=c.policy_type,
                premium=c.premium,
                status=c.status,
                coverage_details=c.coverage_details
            )
            db.merge(pol)

        # Seed default claims
        db.merge(ClaimModel(
            claim_id="CLM-8812",
            customer_id="CRM-101",
            policy_number="POL-NB-2026-9921",
            date="2025-11-14",
            amount=12500.0,
            status="Settled",
            reason="Bumper damage repair"
        ))

        db.merge(ClaimModel(
            claim_id="CLM-9104",
            customer_id="CRM-103",
            policy_number="POL-NB-2026-1189",
            date="2026-02-01",
            amount=84000.0,
            status="Under Review",
            reason="Multi-vehicle highway collision"
        ))

        # Generate 197 unique customer records
        for i in range(104, 301):
            c_id = f"CRM-{i}"
            pol_no = f"POL-NB-2026-{i:04d}"
            p_type = random.choice(POLICY_TYPES)
            risk = random.choice(RISK_TIERS)
            cov = random.choice(COVERAGE_OPTIONS)
            prem = round(random.uniform(8000, 50000), 2)

            cust = CustomerModel(
                id=c_id,
                name=fake.name(),
                email=fake.email(),
                phone=fake.phone_number(),
                policy_number=pol_no,
                policy_type=p_type,
                status="Active" if random.random() > 0.15 else "Under Review",
                premium=prem,
                risk_tier=risk,
                coverage_details=cov
            )
            db.add(cust)

            pol = PolicyModel(
                policy_number=pol_no,
                customer_id=c_id,
                policy_type=p_type,
                premium=prem,
                status=cust.status,
                coverage_details=cov
            )
            db.add(pol)

            if random.random() > 0.4:
                t_id = f"TCK-2026-{i:03d}"
                ticket = TicketModel(
                    ticket_id=t_id,
                    customer_id=c_id,
                    customer_name=cust.name,
                    policy_number=pol_no,
                    issue_type=p_type,
                    priority="High Priority" if risk == "High" else "Normal",
                    risk_tier=risk,
                    status=cust.status
                )
                db.add(ticket)

            if random.random() > 0.6:
                clm_id = f"CLM-{random.randint(5000, 9999)}-{i}"
                clm = ClaimModel(
                    claim_id=clm_id,
                    customer_id=c_id,
                    policy_number=pol_no,
                    date=fake.date_between(start_date='-1y', end_date='today').strftime('%Y-%m-%d'),
                    amount=round(random.uniform(5000, 120000), 2),
                    status=random.choice(["Settled", "Under Review", "Approved"]),
                    reason=random.choice(CLAIM_REASONS)
                )
                db.add(clm)

        # Seed initial pending approvals with 2-level RBAC metadata
        db.merge(ApprovalQueueModel(
            id="APP-401",
            thread_id="tr_8f9a2b1c",
            customer_id="CRM-103",
            customer_name="Amit Patel",
            action_type="Claim Payout Approval",
            amount=84000.0,
            requestor="Claims HITL Agent",
            risk_tier="High Risk",
            confidence=68,
            details="Commercial fleet claim CLM-9104 exceeds single-agent payout limit ($1,000 threshold). Policy Clause 6.1 deductible applies.",
            status="pending",
            required_level=2,
            required_role="Claims Manager"
        ))

        # Seed initial audit log entries
        db.merge(AuditLogModel(
            trace_id="tr_9a8f12c4",
            actor="Supervisor Agent",
            role="AI Router",
            action="CLASSIFY_INTENT",
            intent="policy_rag",
            status="COMPLETED",
            compliance="SOC2 PASSED",
            details="Routed query to Policy RAG Agent. Top vector match: Clause 4 (Deductibles)."
        ))

        # Seed initial RAGAS metric benchmarks
        db.merge(EvaluationMetricModel(metric_name="Context Recall", score=87.4, chunk_size_config=500, benchmark_status="Target Met"))
        db.merge(EvaluationMetricModel(metric_name="Faithfulness", score=92.1, chunk_size_config=500, benchmark_status="Target Met"))
        db.merge(EvaluationMetricModel(metric_name="Answer Relevancy", score=89.8, chunk_size_config=500, benchmark_status="Target Met"))
        db.merge(EvaluationMetricModel(metric_name="Harmfulness / Safety", score=0.0, chunk_size_config=500, benchmark_status="Target Met"))

        db.commit()
        total_c = db.query(CustomerModel).count()
        total_p = db.query(PolicyModel).count()
        total_t = db.query(TicketModel).count()
        print(f"Successfully seeded database! Total Customers: {total_c}, Policies: {total_p}, Tickets: {total_t}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
