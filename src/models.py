from sqlalchemy import Column, String, Float, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True) # e.g. CRM-101
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    policy_number = Column(String, nullable=False, index=True)
    policy_type = Column(String, nullable=False)
    status = Column(String, default="Active")
    premium = Column(Float, default=15000.0)
    risk_tier = Column(String, default="Low")
    coverage_details = Column(Text, nullable=False)
    hashed_password = Column(String, nullable=True)

    claims = relationship("ClaimModel", back_populates="customer", cascade="all, delete-orphan")
    support_requests = relationship("SupportRequestModel", back_populates="customer", cascade="all, delete-orphan")

class SupportRequestModel(Base):
    __tablename__ = "support_requests"

    id = Column(String, primary_key=True, index=True) # e.g. REQ-2026-001
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    channel = Column(String, default="text") # 'text' | 'voice'
    original_query = Column(Text, nullable=False)
    redacted_query = Column(Text, nullable=False)
    status = Column(String, default="new", index=True) # 'new'|'in_progress'|'awaiting_approval'|'answered'|'closed'
    assigned_agent_id = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    updated_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    customer = relationship("CustomerModel", back_populates="support_requests")
    messages = relationship("RequestMessageModel", back_populates="request", cascade="all, delete-orphan")

class RequestMessageModel(Base):
    __tablename__ = "request_messages"

    id = Column(String, primary_key=True, index=True) # e.g. MSG-9001
    request_id = Column(String, ForeignKey("support_requests.id"), nullable=False, index=True)
    sender_role = Column(String, nullable=False) # 'customer'|'agent'|'ai_draft'
    body = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True)
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    request = relationship("SupportRequestModel", back_populates="messages")

class PolicyModel(Base):
    __tablename__ = "policies"

    policy_number = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    policy_type = Column(String, nullable=False)
    premium = Column(Float, nullable=False)
    status = Column(String, default="Active")
    coverage_details = Column(Text, nullable=False)

class ClaimModel(Base):
    __tablename__ = "claims"

    claim_id = Column(String, primary_key=True) # e.g. CLM-8812
    customer_id = Column(String, ForeignKey("customers.id"))
    policy_number = Column(String, nullable=False)
    date = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Under Review")
    reason = Column(Text, nullable=False)

    customer = relationship("CustomerModel", back_populates="claims")

class TicketModel(Base):
    __tablename__ = "tickets"

    ticket_id = Column(String, primary_key=True) # e.g. TCK-2026-001
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    policy_number = Column(String, nullable=False)
    issue_type = Column(String, nullable=False)
    priority = Column(String, default="Normal")
    risk_tier = Column(String, default="Low")
    status = Column(String, default="Active")
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

class ApprovalQueueModel(Base):
    __tablename__ = "approval_queue"

    id = Column(String, primary_key=True) # e.g. APP-401
    thread_id = Column(String, index=True, nullable=False)
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    amount = Column(Float, default=0.0)
    requestor = Column(String, default="Claims HITL Agent")
    risk_tier = Column(String, default="Medium Risk")
    confidence = Column(Integer, default=75)
    details = Column(Text, nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    required_level = Column(Integer, default=1) # 1 = Technical Support Specialist (Senior CSR) (Level 1), 2 = Customer Service Manager (CSM) (Level 2)
    required_role = Column(String, default="Technical Support Specialist (Senior CSR)") # "Technical Support Specialist (Senior CSR)" or "Customer Service Manager (CSM)"
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    trace_id = Column(String, primary_key=True) # e.g. tr_9a8f12c4
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    actor = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    intent = Column(String, nullable=False)
    status = Column(String, nullable=False)
    compliance = Column(String, default="SOC2 PASSED")
    details = Column(Text, nullable=False)

# ─── CENTRALIZED CONVERSATION & CALL LEDGER MODEL (RESTRICTED TO SUPERVISOR & CLAIMS MANAGER) ───
class CustomerConversationModel(Base):
    __tablename__ = "customer_conversations"

    id = Column(String, primary_key=True) # e.g. CONV-9901
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    agent_id = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    channel = Column(String, default="Voice Intake (STT)") # Voice Intake (STT), Text Chat
    caller_sentiment = Column(String, default="neutral") # neutral, anxious, frustrated
    transcript = Column(Text, nullable=False)
    ai_copilot_response = Column(Text, nullable=False)
    resolution_status = Column(String, default="Resolved")
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class PolicyChunkModel(Base):
    __tablename__ = "policy_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_name = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    clause_title = Column(String, nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_size = Column(Integer, default=500)
    embedding = Column(JSON, nullable=True)

class EvaluationMetricModel(Base):
    __tablename__ = "evaluation_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    chunk_size_config = Column(Integer, default=500)
    benchmark_status = Column(String, default="Target Met")
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
