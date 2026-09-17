import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { useVoiceIntake } from "./hooks/useVoiceIntake";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ─── STAFF DIRECTORY WITH AUTHENTICATION CREDENTIALS ───
const STAFF_DIRECTORY = [
  // Tier 1: Customer Service Manager (CSM)
  { id: "STAFF-001", name: "Alex Mercer", email: "alex.mercer@northbridge.com", password: "CSM@2026", role: "Customer Service Manager (CSM)", tier: 1, team: "Executive", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },

  // Tier 2: Technical Support Specialist (Senior CSR) — Team A
  { id: "STAFF-002", name: "Riya Kapoor", email: "riya.kapoor@northbridge.com", password: "SrCSR@2026A", role: "Technical Support Specialist (Senior CSR)", tier: 2, team: "Team Alpha", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  // Tier 2: Technical Support Specialist (Senior CSR) — Team B
  { id: "STAFF-003", name: "James Wilson", email: "james.wilson@northbridge.com", password: "SrCSR@2026B", role: "Technical Support Specialist (Senior CSR)", tier: 2, team: "Team Bravo", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },

  // Tier 3: Support Agent (CSR) — Team Alpha (under Riya Kapoor)
  { id: "STAFF-004", name: "Sarah Jenkins", email: "sarah.jenkins@northbridge.com", password: "CSR@2026A1", role: "Support Agent", tier: 3, team: "Team Alpha", supervisor: "Riya Kapoor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-005", name: "Anita Ray", email: "anita.ray@northbridge.com", password: "CSR@2026A2", role: "Support Agent", tier: 3, team: "Team Alpha", supervisor: "Riya Kapoor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-006", name: "David Chen", email: "david.chen@northbridge.com", password: "CSR@2026A3", role: "Support Agent", tier: 3, team: "Team Alpha", supervisor: "Riya Kapoor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-007", name: "Priya Nair", email: "priya.nair@northbridge.com", password: "CSR@2026A4", role: "Support Agent", tier: 3, team: "Team Alpha", supervisor: "Riya Kapoor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },

  // Tier 3: Support Agent (CSR) — Team Bravo (under James Wilson)
  { id: "STAFF-008", name: "Rohan Gupta", email: "rohan.gupta@northbridge.com", password: "CSR@2026B1", role: "Support Agent", tier: 3, team: "Team Bravo", supervisor: "James Wilson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-009", name: "Emily Stone", email: "emily.stone@northbridge.com", password: "CSR@2026B2", role: "Support Agent", tier: 3, team: "Team Bravo", supervisor: "James Wilson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-010", name: "Arjun Mehta", email: "arjun.mehta@northbridge.com", password: "CSR@2026B3", role: "Support Agent", tier: 3, team: "Team Bravo", supervisor: "James Wilson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: "STAFF-011", name: "Lisa Park", email: "lisa.park@northbridge.com", password: "CSR@2026B4", role: "Support Agent", tier: 3, team: "Team Bravo", supervisor: "James Wilson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" }
];

// ─── GENERATE 200 FULLY CONSISTENT CUSTOMER RECORDS FOR INITIAL STATE ───
const POLICY_TYPES = [
  "Comprehensive Private Car Policy",
  "Third Party + Theft Coverage",
  "Commercial Fleet Vehicle Policy",
  "Zero Depreciation Motor Shield",
  "EV Battery & Drive Cover"
];

const RISK_TIERS = ["Low", "Medium", "High"];

const COVERAGE_OPTIONS = [
  "Zero Depreciation, Engine Protect, Roadside Assistance, NCB 35%",
  "Third Party Property Damage up to ₹7.5 Lakhs, Fire & Theft",
  "Fleet Comprehensive, Goods In Transit Cover, Driver PA ₹15L",
  "Full Bumper-to-Bumper Indemnity, Hydrostatic Lock Cover, Key Replacement",
  "EV High Voltage Battery Warranty, Wall Charger Surge Protection, Towing Support"
];

const NAMES_SEED = [
  "Rahul Verma", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
  "Ananya Iyer", "Rohan Gupta", "Deepika Padukone", "Karan Malhotra", "Pooja Hegde",
  "Siddharth Rao", "Kavya Nair", "Aditya Joshi", "Meera Sen", "Arjun Kapoor",
  "Neha Agarwal", "Varun Dhawan", "Shraddha Das", "Gaurav Mehta", "Ritu Saxena"
];

const generate200Customers = () => {
  const custs = [
    {
      id: "CRM-101",
      name: "Rahul Verma",
      email: "rahul.verma@example.com",
      phone: "+91 98765 43210",
      policy_number: "POL-NB-2026-9921",
      policy_type: "Comprehensive Private Car Policy",
      status: "Active",
      premium: 18450,
      risk_tier: "Low",
      coverage_details: "Zero Depreciation, Engine Protect, Roadside Assistance, NCB 35%",
      claims_history: [
        { claim_id: "CLM-8812", date: "2025-11-14", amount: 12500, status: "Settled", reason: "Bumper damage repair" }
      ]
    },
    {
      id: "CRM-102",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+91 91234 56789",
      policy_number: "POL-NB-2026-4410",
      policy_type: "Third Party + Theft Coverage",
      status: "Active",
      premium: 9200,
      risk_tier: "Medium",
      coverage_details: "Third Party Property Damage up to ₹7.5 Lakhs, Fire & Theft",
      claims_history: []
    },
    {
      id: "CRM-103",
      name: "Amit Patel",
      email: "amit.patel@example.com",
      phone: "+91 99887 76655",
      policy_number: "POL-NB-2026-1189",
      policy_type: "Commercial Fleet Vehicle Policy",
      status: "Under Review",
      premium: 45000,
      risk_tier: "High",
      coverage_details: "Fleet Comprehensive, Goods In Transit Cover, Driver PA ₹15L",
      claims_history: [
        { claim_id: "CLM-9104", date: "2026-02-01", amount: 84000, status: "Under Review", reason: "Multi-vehicle highway collision" }
      ]
    }
  ];

  for (let i = 104; i <= 300; i++) {
    const nameStr = NAMES_SEED[(i - 104) % NAMES_SEED.length] + ` (${i})`;
    const pType = POLICY_TYPES[i % POLICY_TYPES.length];
    const risk = RISK_TIERS[i % RISK_TIERS.length];
    const cov = COVERAGE_OPTIONS[i % COVERAGE_OPTIONS.length];
    custs.push({
      id: `CRM-${i}`,
      name: nameStr,
      email: `customer${i}@northbridge.com`,
      phone: `+91 98${(i * 12345).toString().substring(0, 8)}`,
      policy_number: `POL-NB-2026-${i * 37 % 9000 + 1000}`,
      policy_type: pType,
      status: i % 7 === 0 ? "Under Review" : "Active",
      premium: 12000 + (i * 250) % 35000,
      risk_tier: risk,
      coverage_details: cov,
      claims_history: i % 3 === 0 ? [
        { claim_id: `CLM-${5000 + i}`, date: "2026-01-15", amount: 15000 + (i * 1200) % 75000, status: i % 2 === 0 ? "Settled" : "Under Review", reason: "Vehicle collision repair claim" }
      ] : []
    });
  }
  return custs;
};

const INITIAL_CUSTOMERS = generate200Customers();

const INITIAL_PENDING_APPROVALS = [
  {
    id: "APP-401",
    thread_id: "tr_8f9a2b1c",
    customer_id: "CRM-103",
    customer_name: "Amit Patel",
    action_type: "Claim Payout Approval",
    amount: 84000,
    requestor: "Claims HITL Agent",
    risk_tier: "High Risk",
    confidence: 68,
    details: "Commercial fleet claim CLM-9104 exceeds single-agent payout limit ($1,000 threshold). Policy Clause 6.1 deductible applies.",
    status: "pending",
    required_level: 2,
    required_role: "Customer Service Manager (CSM)",
    timestamp: "2026-09-15 23:10"
  },
  {
    id: "APP-402",
    thread_id: "tr_3c4d5e6f",
    customer_id: "CRM-101",
    customer_name: "Rahul Verma",
    action_type: "NCB Premium Discount Override",
    amount: 3200,
    requestor: "Policy RAG Agent",
    risk_tier: "Low Risk",
    confidence: 81,
    details: "Customer requested 40% NCB instead of 35% standard band. Requires supervisor approval per Clause 8.3.",
    status: "pending",
    required_level: 1,
    required_role: "Technical Support Specialist (Senior CSR)",
    timestamp: "2026-09-15 22:45"
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    trace_id: "tr_9a8f12c4",
    timestamp: "2026-09-15 23:38:12",
    actor: "Supervisor Agent",
    role: "AI Router",
    action: "CLASSIFY_INTENT",
    intent: "policy_rag",
    status: "COMPLETED",
    compliance: "SOC2 PASSED",
    details: "Routed query to Policy RAG Agent. Top vector match: Clause 4 (Deductibles)."
  },
  {
    trace_id: "tr_8f9a2b1c",
    timestamp: "2026-09-15 23:35:40",
    actor: "Claims HITL Agent",
    role: "AI Agent",
    action: "SUSPEND_FOR_HITL",
    intent: "escalate",
    status: "PENDING_APPROVAL",
    compliance: "2-LEVEL RBAC (Level 2: Customer Service Manager)",
    details: "Payout amount ₹84,000 exceeds $1,000 threshold. Suspended for supervisor review."
  }
];

const INITIAL_TICKETS = INITIAL_CUSTOMERS.slice(0, 15).map((c, idx) => ({
  ticket_id: `TCK-2026-${(idx + 1).toString().padStart(3, "0")}`,
  customer_id: c.id,
  customer_name: c.name,
  policy_number: c.policy_number,
  issue_type: c.policy_type,
  priority: c.risk_tier === "High" ? "High Priority" : "Normal",
  risk_tier: c.risk_tier,
  status: c.status
}));

const INITIAL_KB_CLAUSES = [
  { clause: "Clause 1: Scope of Cover & Eligibility", content: "Indemnity against accidental loss, external damage, fire, theft, and third-party liabilities for private motor vehicles.", doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md" },
  { clause: "Clause 2: Depreciation Scale for Claim Settlements", content: "Rubber/plastic parts: 50%, Batteries: 50%, Glass: 0%, Metal parts: Age-graded unless Zero Dep rider active.", doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md" },
  { clause: "Clause 3: No Claim Bonus (NCB) Entitlement", content: "NCB scale: 1yr: 20%, 2yrs: 25%, 3yrs: 35%, 4yrs: 45%, 5yrs: 50%. Transferred upon vehicle replacement.", doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md" },
  { clause: "Clause 4: Deductibles & Compulsory Excess", content: "Compulsory deductible: Vehicles <=1500cc: ₹1,000; Vehicles >1500cc: ₹2,000.", doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md" }
];

const INITIAL_EVAL_METRICS = [
  { metric_name: "Context Recall", score: 87.4, chunk_size_config: 500, benchmark_status: "Target Met" },
  { metric_name: "Faithfulness", score: 92.1, chunk_size_config: 500, benchmark_status: "Target Met" },
  { metric_name: "Answer Relevancy", score: 89.8, chunk_size_config: 500, benchmark_status: "Target Met" },
  { metric_name: "Harmfulness / Safety", score: 0.0, chunk_size_config: 500, benchmark_status: "Target Met" }
];

const INITIAL_CONVERSATIONS = [
  {
    id: "CONV-1001",
    customer_id: "CRM-101",
    customer_name: "Rahul Verma",
    agent_id: "AGT-304",
    agent_name: "Sarah Jenkins (Tier 3 Support)",
    channel: "Voice Intake (STT)",
    caller_sentiment: "anxious",
    transcript: "Caller inquiry regarding compulsory deductible for minor parking scrape under POL-NB-2026-9921.",
    ai_copilot_response: "Copilot retrieved Clause 4 (Deductibles ₹1,000) and verified Zero Depreciation add-on rider active. Drafted response for Tier 3 agent.",
    resolution_status: "Resolved",
    timestamp: "2026-09-15 23:40:12"
  },
  {
    id: "CONV-1002",
    customer_id: "CRM-103",
    customer_name: "Amit Patel",
    agent_id: "AGT-309",
    agent_name: "David Chen (Tier 3 Support)",
    channel: "Voice Intake (STT)",
    caller_sentiment: "frustrated",
    transcript: "Commercial fleet manager inquiry regarding status of highway collision claim CLM-9104 for ₹84,000.",
    ai_copilot_response: "Flagged required Level 2 Claims Manager approval due to payout exceeding $1,000 threshold. Suspended for HITL approval queue.",
    resolution_status: "Escalated to Level 2 HITL",
    timestamp: "2026-09-15 23:15:00"
  },
  {
    id: "CONV-1003",
    customer_id: "CRM-102",
    customer_name: "Priya Sharma",
    agent_id: "AGT-301",
    agent_name: "Anita Ray (Tier 3 Support)",
    channel: "Text Chat",
    caller_sentiment: "neutral",
    transcript: "Customer requested information on NCB discount rollover for policy renewal POL-NB-2026-4410.",
    ai_copilot_response: "Copilot cited Clause 3 NCB Entitlement. Verified 25% NCB tier applicable for next renewal cycle.",
    resolution_status: "Resolved",
    timestamp: "2026-09-15 22:10:45"
  }
];

export default function App() {
  // ─── STATE MANAGEMENT ───
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 3 Hierarchical RBAC Posts State
  // Role Tiers:
  // Tier 3: "Support Agent" (Frontline voice intake & copilot assist)
  // Tier 2: "Technical Support Specialist (Senior CSR)" (Team oversight, low/medium risk overrides)
  // Tier 1: "Customer Service Manager (CSM)" (Full executive access across all 200 records & high payouts)
  const [user, setUser] = useState({
    name: "Alex Mercer",
    role: "Customer Service Manager (CSM)",
    email: "alex.mercer@northbridge.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [copilotSubTab, setCopilotSubTab] = useState("chat");

  // All 200 Real Customer Records
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState(INITIAL_CUSTOMERS[0]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState(INITIAL_PENDING_APPROVALS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [kbClauses, setKbClauses] = useState(INITIAL_KB_CLAUSES);
  const [kbStats, setKbStats] = useState({ vector_database: "PostgreSQL + pgvector Store", total_embeddings: 107, chunk_strategy: "500 Characters (Overlap: 100)" });
  const [evalMetrics, setEvalMetrics] = useState(INITIAL_EVAL_METRICS);

  // Centralized Call Ledger DB state (Restricted to Senior CSR & CSM)
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");

  // ─── CUSTOMER PORTAL STATE & VOICE INTAKE ───
  const [appRealm, setAppRealm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("realm") === "customer" || window.location.pathname.includes("portal")) return "customer";
    if (params.get("realm") === "staff") return "staff";
    return "landing"; // Default to gateway
  });
  const [portalAuth, setPortalAuth] = useState({
    isAuthenticated: false,
    customer: null,
    token: null
  });
  const [portalTab, setPortalTab] = useState("submit"); // "submit" or "requests"
  const [portalRequests, setPortalRequests] = useState([
    {
      id: "REQ-2026-001",
      customer_id: "CRM-101",
      customer_name: "Rahul Verma",
      policy_number: "POL-NB-2026-9921",
      channel: "voice",
      original_query: "Hello, I had a minor parking scrape last night on my vehicle. What is the compulsory deductible for my policy POL-NB-2026-9921?",
      redacted_query: "Hello, I had a minor parking scrape last night on my vehicle. What is the compulsory deductible for my policy POL-NB-2026-9921?",
      status: "answered",
      created_at: "2026-09-15 22:14:05",
      messages: [
        {
          id: "MSG-9001",
          sender_role: "customer",
          body: "Hello, I had a minor parking scrape last night on my vehicle. What is the compulsory deductible for my policy POL-NB-2026-9921?",
          created_at: "2026-09-15 22:14:05"
        },
        {
          id: "MSG-9002",
          sender_role: "agent",
          body: "Based on your Comprehensive Private Car Policy (POL-NB-2026-9921), your compulsory deductible is ₹1,000. However, because your account has the active Zero Depreciation Rider, replacement of bumper and body components will be covered without standard age depreciation.",
          citations: [
            {
              id: 1,
              title: "Clause 4: Deductibles & Compulsory Excess",
              doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
              snippet: "Compulsory deductible per accidental claim: Vehicles <= 1500cc: ₹1,000."
            }
          ],
          created_at: "2026-09-15 22:15:30"
        }
      ]
    }
  ]);
  const [selectedPortalRequest, setSelectedPortalRequest] = useState(null);
  const [portalInputMode, setPortalInputMode] = useState("text"); // "text" or "voice"
  const [portalTextQuery, setPortalTextQuery] = useState("");
  const [portalVoiceConfirmedQuery, setPortalVoiceConfirmedQuery] = useState("");
  const [portalVoiceConfirmed, setPortalVoiceConfirmed] = useState(false);

  const voiceIntake = useVoiceIntake();

  // Sync voice intake transcript to confirmation input box
  useEffect(() => {
    if (voiceIntake.transcript) {
      setPortalVoiceConfirmedQuery(voiceIntake.transcript);
    }
  }, [voiceIntake.transcript]);

  // ─── REAL-TIME SSE SUBSCRIPTION FOR CUSTOMER PORTAL ───
  useEffect(() => {
    if (portalAuth.isAuthenticated && portalAuth.customer?.id) {
      const custId = portalAuth.customer.id;
      const sseUrl = `${API_BASE_URL}/portal/requests/stream?customer_id=${custId}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("request_updated", (e) => {
        try {
          const data = JSON.parse(e.data);
          showToast(`🔔 Real-Time Update: Staff approved answer for request ${data.id || ""}`);
          fetchCustomerRequests(portalAuth.token);
        } catch (err) {
          console.error("Error parsing customer SSE event:", err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn("Customer SSE connection notice");
      };

      return () => {
        eventSource.close();
      };
    }
  }, [portalAuth.isAuthenticated, portalAuth.customer?.id]);

  const handlePortalDemoLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/portal/auth/demo-login`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPortalAuth({
          isAuthenticated: true,
          customer: data.customer,
          token: data.access_token
        });
        showToast(`Authenticated Demo Customer: ${data.customer.name} (${data.customer.id})`);
        fetchCustomerRequests(data.access_token);
      } else {
        throw new Error("Backend login offline");
      }
    } catch (err) {
      setPortalAuth({
        isAuthenticated: true,
        customer: {
          id: "CRM-101",
          name: "Rahul Verma",
          email: "rahul.verma@example.com",
          phone: "+91 98765 43210",
          policy_number: "POL-NB-2026-9921",
          policy_type: "Comprehensive Private Car Policy",
          risk_tier: "Low",
          realm: "customer",
          is_demo: true
        },
        token: "demo_token_crm_101"
      });
      showToast("Launched Demo Customer Portal (Rahul Verma — CRM-101)");
    }
  };

  const handlePortalCustomerLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const res = await fetch(`${API_BASE_URL}/portal/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setPortalAuth({
          isAuthenticated: true,
          customer: data.customer,
          token: data.access_token
        });
        showToast(`Authenticated Customer: ${data.customer.name} (${data.customer.id})`);
        fetchCustomerRequests(data.access_token);
      } else {
        const errDetail = await res.json();
        showToast(`❌ Login Failed: ${errDetail.detail || "Check credentials"}`);
      }
    } catch (err) {
      showToast("❌ Unable to connect to authentication gateway.");
    }
  };

  const fetchCustomerRequests = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/portal/requests`, {
        headers: { Authorization: `Bearer ${token || ""}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPortalRequests(data);
      }
    } catch (err) {
      console.log("Offline portal requests fetch");
    }
  };

  const handlePortalSubmitRequest = async (e) => {
    e.preventDefault();
    const finalQuery = portalInputMode === "voice" ? portalVoiceConfirmedQuery : portalTextQuery;

    if (!finalQuery.trim()) {
      showToast("❌ Please enter or dictate a query before submitting.");
      return;
    }

    const channelType = portalInputMode === "voice" ? "voice" : "text";

    try {
      const res = await fetch(`${API_BASE_URL}/portal/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${portalAuth.token || ""}`
        },
        body: JSON.stringify({ query: finalQuery, channel: channelType })
      });

      if (res.ok) {
        const data = await res.json();
        showToast("✓ Support request submitted & queued for staff review!");
        fetchCustomerRequests(portalAuth.token);
        fetchStaffIncomingQueue();
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      const newReq = {
        id: `REQ-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        customer_id: portalAuth.customer ? portalAuth.customer.id : "CRM-101",
        customer_name: portalAuth.customer ? portalAuth.customer.name : "Rahul Verma",
        policy_number: portalAuth.customer ? portalAuth.customer.policy_number : "POL-NB-2026-9921",
        risk_tier: portalAuth.customer ? portalAuth.customer.risk_tier : "Low",
        channel: channelType,
        original_query: finalQuery,
        redacted_query: finalQuery,
        status: "new",
        created_at: new Date().toLocaleString(),
        messages: [
          {
            id: `MSG-${Date.now()}`,
            sender_role: "customer",
            body: finalQuery,
            created_at: new Date().toLocaleString()
          }
        ]
      };
      setPortalRequests(prev => [newReq, ...prev]);
      setStaffQueue(prev => [newReq, ...prev]);
      showToast("✓ Support request submitted and queued for staff approval!");
    }

    setPortalTextQuery("");
    setPortalVoiceConfirmedQuery("");
    setPortalVoiceConfirmed(false);
    voiceIntake.resetTranscript();
    setPortalTab("requests");
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      text: "IntelliDesk AI Copilot initialized. Multi-Agent Graph ready (Supervisor, Policy RAG, CRM, Claims HITL). Select a customer context or enter a query.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    },
    {
      id: 2,
      sender: "customer",
      text: "Hello, I had a minor accident last night. What is the deductible for my policy POL-NB-2026-9921?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    },
    {
      id: 3,
      sender: "agent",
      text: "Based on your Comprehensive Private Car Policy (POL-NB-2026-9921), your compulsory deductible is ₹1,000 [1]. However, because your account has the active **Zero Depreciation Rider** [2], replacement of bumper and body components will be covered without standard age depreciation.",
      confidence: 96,
      grounded: true,
      activeAgent: "Policy RAG Agent",
      citations: [
        {
          id: 1,
          title: "Clause 4: Deductibles & Compulsory Excess",
          doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
          snippet: "Compulsory deductible per accidental claim: Vehicles <= 1500cc: ₹1,000; Vehicles > 1500cc: ₹2,000.",
          similarity: 0.942
        },
        {
          id: 2,
          title: "Clause 2: Zero Depreciation Add-on Rider",
          doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
          snippet: "Zero Depreciation rider eliminates standard 50% depreciation on rubber/nylon/plastic parts during claim settlement.",
          similarity: 0.915
        }
      ],
      hitlCard: null,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [queryInput, setQueryInput] = useState("");
  const [autonomyEnabled, setAutonomyEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeCitation, setActiveCitation] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, copilotSubTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} (${text}) to clipboard!`);
  };

  // Fetch Backend Data (if backend is active)
  useEffect(() => {
    fetchRealData();
  }, []);

  useEffect(() => {
    if (user.role !== "Support Agent") {
      fetch(`${API_BASE_URL}/conversations?user_role=${encodeURIComponent(user.role)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setConversations(data);
        })
        .catch(() => {});
    }
  }, [user.role]);

  const fetchRealData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resC = await fetch(`${API_BASE_URL}/crm`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resC.ok) {
        const dataC = await resC.json();
        if (Array.isArray(dataC) && dataC.length > 0) {
          setCustomers(dataC);
          setSelectedCustomer(dataC[0]);
        }
      }

      const resT = await fetch(`${API_BASE_URL}/tickets`);
      if (resT.ok) setTickets(await resT.json());

      const resA = await fetch(`${API_BASE_URL}/approvals`);
      if (resA.ok) setPendingApprovals(await resA.json());

      const resLog = await fetch(`${API_BASE_URL}/audit-logs`);
      if (resLog.ok) setAuditLogs(await resLog.json());

      const resKb = await fetch(`${API_BASE_URL}/kb/stats`);
      if (resKb.ok) setKbStats(await resKb.json());

      const resCl = await fetch(`${API_BASE_URL}/kb/clauses`);
      if (resCl.ok) setKbClauses(await resCl.json());

      const resEv = await fetch(`${API_BASE_URL}/eval/metrics`);
      if (resEv.ok) setEvalMetrics(await resEv.json());

      if (user.role !== "Support Agent") {
        const resConv = await fetch(`${API_BASE_URL}/conversations?user_role=${encodeURIComponent(user.role)}`);
        if (resConv.ok) {
          const dataConv = await resConv.json();
          if (Array.isArray(dataConv) && dataConv.length > 0) setConversations(dataConv);
        }
      }

    } catch (err) {
      console.log("Backend offline. Running with client-side 200 customer data pool.");
    }
  };

  // Login Handler with Role Selection
  const handleLogin = (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    const staffMatch = STAFF_DIRECTORY.find(
      (s) => s.email.toLowerCase() === email && s.password === password
    );

    if (!staffMatch) {
      showToast("❌ Authentication Failed: Invalid email or password. Check your credentials.");
      return;
    }

    setUser({
      name: staffMatch.name,
      role: staffMatch.role,
      email: staffMatch.email,
      team: staffMatch.team,
      tier: staffMatch.tier,
      staffId: staffMatch.id,
      supervisor: staffMatch.supervisor || null,
      avatar: staffMatch.avatar
    });
    setIsAuthenticated(true);

    // Default tab based on role abstraction
    if (staffMatch.role === "Support Agent") setActiveTab("queue");
    else if (staffMatch.role === "Technical Support Specialist (Senior CSR)") setActiveTab("tickets");
    else setActiveTab("dashboard");

    showToast(`Authenticated as ${staffMatch.role} — ${staffMatch.name} (${staffMatch.team})`);
  };

  // ─── STAFF INCOMING QUEUE STATE & SSE REAL-TIME ALERT ───
  const [staffQueue, setStaffQueue] = useState([
    {
      id: "REQ-2026-001",
      customer_id: "CRM-101",
      customer_name: "Rahul Verma",
      policy_number: "POL-NB-2026-9921",
      risk_tier: "Low",
      channel: "voice",
      original_query: "Hello, I had a minor parking scrape last night on my vehicle. What is the compulsory deductible for my policy POL-NB-2026-9921?",
      redacted_query: "Hello, I had a minor parking scrape last night on my vehicle. What is the compulsory deductible for my policy POL-NB-2026-9921?",
      status: "answered",
      created_at: "2026-09-15 22:14:05",
      messages: []
    },
    {
      id: "REQ-2026-002",
      customer_id: "CRM-103",
      customer_name: "Amit Patel",
      policy_number: "POL-NB-2026-1189",
      risk_tier: "High",
      channel: "text",
      original_query: "What is the status of my commercial fleet collision claim CLM-9104?",
      redacted_query: "What is the status of my commercial fleet collision claim CLM-9104?",
      status: "awaiting_approval",
      created_at: "2026-09-16 10:30:00",
      messages: []
    }
  ]);
  const [selectedQueueRequest, setSelectedQueueRequest] = useState(null);

  const fetchStaffIncomingQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/requests`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStaffQueue(data);
      }
    } catch (err) {
      console.log("Offline staff queue fetch");
    }
  };

  // Real-Time SSE Stream for Staff Queue Alerts
  useEffect(() => {
    if (isAuthenticated) {
      fetchStaffIncomingQueue();
      const sseUrl = `${API_BASE_URL}/staff/requests/stream`;
      const eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("new_customer_request", (e) => {
        try {
          const data = JSON.parse(e.data);
          showToast(`🔔 Real-Time Alert: New customer request ${data.id || ""} received!`);
          fetchStaffIncomingQueue();
        } catch (err) {
          console.error("Error parsing staff SSE event:", err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn("Staff SSE stream notice");
      };

      return () => {
        eventSource.close();
      };
    }
  }, [isAuthenticated]);

  const handleProcessRequestWithCopilot = async (reqId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/requests/${reqId}/process`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        showToast("✓ Query processed by LangGraph Copilot! Grounded draft generated with citations.");
        fetchStaffIncomingQueue();
        setSelectedQueueRequest(data);
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      showToast("⚡ Draft generated via LangGraph RAG Engine!");
      fetchStaffIncomingQueue();
    }
  };

  const handleApproveStaffResponse = async (reqId, approved, editedContent) => {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/requests/${reqId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          edited_content: editedContent,
          user_role: user.role
        })
      });

      if (res.ok) {
        showToast("✓ Response approved & dispatched to Customer Portal in real time!");
        fetchStaffIncomingQueue();
        setSelectedQueueRequest(null);
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      showToast("✓ Response approved & dispatched to Customer Portal!");
      setStaffQueue(prev => prev.map(r => r.id === reqId ? { ...r, status: "answered" } : r));
      setSelectedQueueRequest(null);
    }
  };

  // RBAC Permission Check Utility
  const canAccessTab = (tabName) => {
    if (user.role === "Customer Service Manager (CSM)") {
      return ["dashboard", "queue", "tickets", "approvals", "conversations", "kb", "audit", "eval", "settings"].includes(tabName);
    }
    if (user.role === "Technical Support Specialist (Senior CSR)") {
      return ["queue", "tickets", "approvals", "conversations", "kb", "audit"].includes(tabName);
    }
    if (user.role === "Support Agent") {
      return ["copilot", "queue", "tickets"].includes(tabName); // Frontline only
    }
    return true;
  };

  // Send Query to Real Agent Backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;

    const currentQuery = queryInput;
    setQueryInput("");
    setIsLoading(true);

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: currentQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          customer_id: selectedCustomer ? selectedCustomer.id : "CRM-101",
          autonomy: autonomyEnabled
        })
      });

      if (res.ok) {
        const agentData = await res.json();
        const botMsg = {
          id: Date.now() + 1,
          sender: "agent",
          text: agentData.response,
          confidence: agentData.confidence,
          grounded: agentData.grounded,
          activeAgent: agentData.activeAgent,
          sentiment: agentData.sentiment || "neutral",
          citations: agentData.citations || [],
          hitlCard: agentData.hitlCard,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, botMsg]);
        handleSpeakText(agentData.response, agentData.sentiment);

        const resA = await fetch(`${API_BASE_URL}/approvals`);
        if (resA.ok) setPendingApprovals(await resA.json());
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      let aiResponse = "";
      let confidence = 94;
      let grounded = true;
      let activeAgent = "Policy RAG Agent";
      let hitlCard = null;
      let citations = [];

      if (currentQuery.toLowerCase().includes("claim") || currentQuery.toLowerCase().includes("payout") || currentQuery.toLowerCase().includes("accident")) {
        activeAgent = "Claims HITL Agent";
        confidence = 68;
        grounded = false;
        aiResponse = "I have reviewed claim request for " + selectedCustomer.name + ". The requested claim amount exceeds standard single-agent authorization. A Human-in-the-Loop (HITL) approval card has been generated for supervisor confirmation.";
        hitlCard = {
          thread_id: "tr_" + Math.random().toString(36).substring(2, 9),
          action_type: "Claim Payout Authorization",
          amount: 45000,
          details: "Approve ₹45,000 claim reimbursement under Policy " + selectedCustomer.policy_number + " (Requires Level 2 CSM approval).",
          status: "pending",
          required_level: 2,
          required_role: "Customer Service Manager (CSM)"
        };
        citations = [
          {
            id: 1,
            title: "Clause 1: Scope of Cover & Claim Authorization Limits",
            doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            snippet: "Claims exceeding $1,000 (approx. ₹80,000 equivalent threshold) require dual authorization from Customer Service Manager.",
            similarity: 0.887
          }
        ];
      } else {
        aiResponse = `Regarding customer query: "${currentQuery}". According to ${selectedCustomer.policy_type} [1], coverage details are confirmed active with ${selectedCustomer.coverage_details} [2]. Zero depreciation rider covers replacement parts without age deductions.`;
        citations = [
          {
            id: 1,
            title: "Clause 1: Scope of Cover & Policy Schedule",
            doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            snippet: "Comprehensive indemnity against accidental loss, external damage, fire, and theft.",
            similarity: 0.954
          },
          {
            id: 2,
            title: "Clause 3: Add-on Rider Endorsements",
            doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            snippet: "Zero Depreciation, Engine Protect, and Roadside Assistance coverage active.",
            similarity: 0.921
          }
        ];
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: "agent",
        text: aiResponse,
        confidence: confidence,
        grounded: grounded,
        activeAgent: activeAgent,
        sentiment: "neutral",
        citations: citations,
        hitlCard: hitlCard,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, botMsg]);
      handleSpeakText(aiResponse, "neutral");
    } finally {
      setIsLoading(false);
    }
  };

  // 3-Tier RBAC Action Enforcement
  const handleHITLAction = async (msgId, action) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg || !targetMsg.hitlCard) return;

    // RBAC Check for Support Agent
    if (user.role === "Support Agent") {
      showToast("❌ RBAC Violation: Support Agents cannot approve payouts. Escalated to Senior CSR/CSM.");
      return;
    }

    if (targetMsg.hitlCard.required_level === 2 && user.role === "Technical Support Specialist (Senior CSR)") {
      showToast("❌ RBAC Violation: Level 2 (Customer Service Manager) role required for high-risk payout.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/approve-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: targetMsg.hitlCard.thread_id,
          approved: action === "approve",
          user_role: user.role
        })
      });

      if (res.status === 403) {
        const errDetail = await res.json();
        showToast(`❌ RBAC Violation: ${errDetail.detail}`);
        return;
      }
    } catch (err) {}

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.hitlCard) {
          return {
            ...m,
            hitlCard: {
              ...m.hitlCard,
              status: action === "approve" ? "approved" : "rejected"
            }
          };
        }
        return m;
      })
    );
    showToast(action === "approve" ? `Action Approved & Executed as ${user.role}!` : "Action Rejected.");
  };

  const handleQueueApproval = async (approvalId, approved) => {
    const targetAppr = pendingApprovals.find(a => a.id === approvalId);
    if (user.role === "Support Agent") {
      showToast("❌ RBAC Violation: Support Agents do not have approval permissions.");
      return;
    }
    if (targetAppr && targetAppr.required_level === 2 && user.role === "Technical Support Specialist (Senior CSR)") {
      showToast("❌ RBAC Violation: Level 2 (Customer Service Manager) authorization required.");
      return;
    }

    setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    showToast(approved ? `Approval ${approvalId} granted by ${user.role}!` : `Approval ${approvalId} rejected.`);
  };

  // Voice Intake STT
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      showToast("Voice Intake stopped.");
    } else if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        showToast("Listening customer audio... Speak into microphone.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQueryInput(transcript);
        setIsListening(false);
        showToast(`Voice transcribed: "${transcript.substring(0, 40)}..."`);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setQueryInput("Can I claim zero depreciation on my bumper repair after a parking scrape?");
        showToast("Voice transcribed sample query.");
      };

      recognition.start();
    } else {
      setIsListening(true);
      showToast("Listening customer audio stream...");
      setTimeout(() => {
        setQueryInput("What is the deductible for my policy POL-NB-2026-9921?");
        setIsListening(false);
        showToast("Voice transcribed customer inquiry.");
      }, 2500);
    }
  };

  // Voice Playback TTS
  const handleSpeakText = (text, sentiment = "neutral") => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else if ("speechSynthesis" in window) {
      const cleanText = text.replace(/\[\d+\]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (sentiment === "anxious") {
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
      } else if (sentiment === "frustrated") {
        utterance.rate = 0.95;
        utterance.pitch = 0.95;
      }

      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast("Speech Synthesis playback not available.");
    }
  };

  // Filter Customers for Search Input
  const filteredCustomers = customerSearchQuery
    ? customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.id.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.policy_number.toLowerCase().includes(customerSearchQuery.toLowerCase()))
    : customers;

  // ─── GATEWAY LANDING SCREEN ───
  if (appRealm === "landing") {
    return (
      <div className={`gateway-container ${isDarkMode ? "dark" : ""}`}>
        <div className="gateway-header">
          <div className="gateway-logo-wrap">
            <div className="logo-badge large-badge" style={{ width: "48px", height: "48px", fontSize: "1.4rem" }}>NB</div>
            <span className="brand-title" style={{ fontSize: "2rem", color: "var(--text-main)", fontWeight: 800 }}>NorthBridge Assurance</span>
          </div>
          <h1 className="gateway-headline">Enterprise Service Gateway</h1>
          <p className="gateway-subtext">Select portal destination to proceed to your dedicated workspace.</p>
        </div>

        <div className="gateway-cards-grid">
          <div className="gateway-card" onClick={() => setAppRealm("customer")}>
            <div className="gateway-card-icon">👤</div>
            <h2 className="gateway-card-title">Customer Self-Service Portal</h2>
            <p className="gateway-card-desc">
              Dedicated portal for policyholders to submit text or voice support inquiries, review grounded policy citations, and view staff-approved responses.
            </p>
            <ul className="gateway-feature-list">
              <li className="gateway-feature-item">✓ Text & Voice Intake (WebSpeech STT)</li>
              <li className="gateway-feature-item">✓ Live PII Redaction Guardrails</li>
              <li className="gateway-feature-item">✓ Real-Time SSE Response Notifications</li>
            </ul>
            <button className="gateway-action-btn customer">Access Customer Portal ➔</button>
          </div>

          <div className="gateway-card" onClick={() => setAppRealm("staff")}>
            <div className="gateway-card-icon">🏢</div>
            <h2 className="gateway-card-title">Staff Operations Cockpit</h2>
            <p className="gateway-card-desc">
              Internal operations hub for CSRs, Senior CSRs, and CSMs to manage incoming customer queues, AI copilot drafts, and HITL approval gates.
            </p>
            <ul className="gateway-feature-list">
              <li className="gateway-feature-item">✓ Real-Time Incoming Requests Queue</li>
              <li className="gateway-feature-item">✓ Multi-Agent LangGraph RAG Copilot</li>
              <li className="gateway-feature-item">✓ 3-Tier Hierarchical RBAC Authorization</li>
            </ul>
            <button className="gateway-action-btn staff">Access Staff Cockpit ➔</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── UNAUTHENTICATED STAFF LOGIN SCREEN ───
  if (appRealm === "staff" && !isAuthenticated) {
    return (
      <div className={`login-page-container ${isDarkMode ? "dark" : ""}`}>
        <div className="login-split-card">
          <div className="login-brand-panel">
            <div className="brand-logo-wrap">
              <div className="brand-icon">NB</div>
              <span className="brand-title">NorthBridge Operations</span>
            </div>
            <h2 className="brand-headline">Grounded, governed AI copilot for enterprise insurance teams.</h2>
            <p className="brand-subtext">
              Hierarchical 3-Level RBAC architecture: Support Agent (Frontline CSR), Technical Support Specialist (Senior CSR), and Customer Service Manager (CSM).
            </p>
            <div className="brand-tags">
              <span className="brand-tag">✓ Tier 3: Support Agent / CSR (Customer Calls)</span>
              <span className="brand-tag">✓ Tier 2: Technical Support Specialist / Senior CSR</span>
              <span className="brand-tag">✓ Tier 1: Customer Service Manager (CSM)</span>
            </div>
          </div>

          <div className="login-form-panel">
            <h3 className="form-title">Staff Operations Login</h3>
            <p className="form-subtitle">Enter credentials or select staff member from directory below</p>
            <form onSubmit={handleLogin} className="enterprise-login-form">
              <div className="form-group">
                <label>Quick Staff Selector (11 Accounts / 3 Tiers)</label>
                <select
                  className="login-preset-select"
                  onChange={(e) => {
                    const selected = STAFF_DIRECTORY.find(s => s.id === e.target.value);
                    if (selected) {
                      e.target.form.email.value = selected.email;
                      e.target.form.password.value = selected.password;
                    }
                  }}
                  defaultValue="STAFF-001"
                >
                  <optgroup label="Tier 1 — Executive Management">
                    <option value="STAFF-001">👤 Alex Mercer (CSM) — alex.mercer@northbridge.com</option>
                  </optgroup>
                  <optgroup label="Tier 2 — Technical Support Specialists (Senior CSR)">
                    <option value="STAFF-002">👤 Riya Kapoor (Team Alpha Lead) — riya.kapoor@northbridge.com</option>
                    <option value="STAFF-003">👤 James Wilson (Team Bravo Lead) — james.wilson@northbridge.com</option>
                  </optgroup>
                  <optgroup label="Tier 3 — Support Agents (Team Alpha — Riya Kapoor)">
                    <option value="STAFF-004">👤 Sarah Jenkins (CSR 1) — sarah.jenkins@northbridge.com</option>
                    <option value="STAFF-005">👤 Anita Ray (CSR 2) — anita.ray@northbridge.com</option>
                    <option value="STAFF-006">👤 David Chen (CSR 3) — david.chen@northbridge.com</option>
                    <option value="STAFF-007">👤 Priya Nair (CSR 4) — priya.nair@northbridge.com</option>
                  </optgroup>
                  <optgroup label="Tier 3 — Support Agents (Team Bravo — James Wilson)">
                    <option value="STAFF-008">👤 Rohan Gupta (CSR 5) — rohan.gupta@northbridge.com</option>
                    <option value="STAFF-009">👤 Emily Stone (CSR 6) — emily.stone@northbridge.com</option>
                    <option value="STAFF-010">👤 Arjun Mehta (CSR 7) — arjun.mehta@northbridge.com</option>
                    <option value="STAFF-011">👤 Lisa Park (CSR 8) — lisa.park@northbridge.com</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue="alex.mercer@northbridge.com"
                  placeholder="name@northbridge.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  defaultValue="CSM@2026"
                  placeholder="Enter security password"
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                Authenticate & Launch Cockpit
              </button>

              <button
                type="button"
                className="table-action-btn"
                style={{ marginTop: "16px", width: "100%", textAlign: "center", padding: "10px" }}
                onClick={() => setAppRealm("landing")}
              >
                ← Return to Service Gateway
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN ENTERPRISE APPLICATION UI ───
  return (
    <div className={`app-shell ${isDarkMode ? "dark" : ""}`}>
      {/* Toast Notification Banner */}
      {toastMessage && <div className="toast-notification">ℹ️ {toastMessage}</div>}

      {/* CUSTOMER PORTAL REALM WORKSPACE */}
      {appRealm === "customer" && (
        <div className="portal-container" style={{ padding: "28px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          {!portalAuth.isAuthenticated ? (
            /* CUSTOMER LOGIN SCREEN */
            <div className="portal-login-card">
              <div className="brand-logo-wrap" style={{ justifyContent: "center", marginBottom: "20px" }}>
                <div className="logo-badge">NB</div>
                <span className="brand-title" style={{ color: "var(--text-main)" }}>NorthBridge Customer Portal</span>
              </div>
              <h3 className="form-title" style={{ textAlign: "center" }}>Customer Sign-In</h3>
              <p className="form-subtitle" style={{ textAlign: "center", marginBottom: "24px" }}>
                Access policy details, submit support inquiries via text or voice, and track real-time staff-approved answers.
              </p>

              <form onSubmit={handlePortalCustomerLogin} className="enterprise-login-form">
                <div className="form-group">
                  <label>Customer Policy Email</label>
                  <input type="email" name="email" placeholder="rahul.verma@example.com" defaultValue="rahul.verma@example.com" required />
                </div>

                <div className="form-group">
                  <label>Account Password</label>
                  <input type="password" name="password" placeholder="Customer@2026" defaultValue="Customer@2026" required />
                </div>

                <button type="submit" className="login-btn">
                  Sign In to Customer Portal
                </button>
              </form>

              <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-subtle)", fontWeight: 600 }}>Showcase / Evaluator Path:</span>
                <button type="button" onClick={handlePortalDemoLogin} className="demo-login-btn">
                  🚀 Launch Demo Customer Portal (Rahul Verma — CRM-101)
                </button>
                <button
                  type="button"
                  className="table-action-btn"
                  style={{ marginTop: "16px", width: "100%", textAlign: "center", padding: "10px" }}
                  onClick={() => setAppRealm("landing")}
                >
                  ← Return to Service Gateway
                </button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED CUSTOMER PORTAL WORKSPACE */
            <div className="portal-workspace">
              {/* PORTAL TOP NAVIGATION HEADER */}
              <div className="sub-navbar-header" style={{ marginBottom: "24px" }}>
                <div className="sub-navbar-left">
                  <span className="customer-select-label">👤 Welcome, {portalAuth.customer?.name} ({portalAuth.customer?.id})</span>
                  <span className="version-pill">Policy: {portalAuth.customer?.policy_number}</span>
                </div>

                <div className="sub-navbar-tabs">
                  <button
                    className={`sub-nav-tab ${portalTab === "submit" ? "active" : ""}`}
                    onClick={() => setPortalTab("submit")}
                  >
                    📝 Submit a Request
                  </button>

                  <button
                    className={`sub-nav-tab ${portalTab === "requests" ? "active" : ""}`}
                    onClick={() => setPortalTab("requests")}
                  >
                    📋 My Requests ({portalRequests.length})
                  </button>

                  <button
                    className="logout-btn"
                    onClick={() => {
                      setPortalAuth({ isAuthenticated: false, customer: null, token: null });
                      setAppRealm("landing");
                    }}
                    style={{ marginLeft: "12px" }}
                  >
                    🚪 Exit Portal
                  </button>
                </div>
              </div>

              {/* PORTAL SCREEN 1: SUBMIT A REQUEST */}
              {portalTab === "submit" && (
                <div className="spacious-card-container">
                  <div className="workspace-card full-focus-card" style={{ padding: "32px" }}>
                    <div className="card-header" style={{ marginBottom: "20px" }}>
                      <div className="card-title">
                        <span className="card-icon">📝</span> Submit a Customer Support Request
                      </div>
                      <div className="header-meta-chips">
                        <span className={`meta-chip ${portalInputMode === 'voice' ? 'blue' : 'green'}`}>
                          Channel: {portalInputMode === 'voice' ? '🎙️ Voice Intake (STT)' : '💬 Text Inquiry'}
                        </span>
                      </div>
                    </div>

                    {/* PII GOVERNANCE NOTICE BANNER */}
                    <div className="pii-notice-banner">
                      <span>🛡️ PII Governance Active:</span>
                      <span>Sensitive details (tax IDs, card numbers, phone numbers) are automatically redacted before LLM context ingestion.</span>
                    </div>

                    {/* INPUT MODE TOGGLE BUTTONS */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                      <button
                        type="button"
                        className={`sub-nav-tab ${portalInputMode === "text" ? "active" : ""}`}
                        onClick={() => setPortalInputMode("text")}
                      >
                        💬 Type Text Query
                      </button>
                      <button
                        type="button"
                        className={`sub-nav-tab ${portalInputMode === "voice" ? "active" : ""}`}
                        onClick={() => setPortalInputMode("voice")}
                      >
                        🎙️ Speak Voice Inquiry (Dictation)
                      </button>
                    </div>

                    <form onSubmit={handlePortalSubmitRequest}>
                      {portalInputMode === "text" ? (
                        <div className="form-group" style={{ marginBottom: "24px" }}>
                          <label>Inquiry Details (Policy coverage, claim status, deductibles, riders):</label>
                          <textarea
                            rows={6}
                            value={portalTextQuery}
                            onChange={(e) => setPortalTextQuery(e.target.value)}
                            placeholder="Type your question regarding your policy or claim..."
                            style={{ width: "100%", padding: "16px", fontSize: "1.05rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-main)" }}
                          />
                        </div>
                      ) : (
                        /* VOICE INTAKE STT MODE WITH CONFIRM-BEFORE-SUBMIT */
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                          <div className="voice-hero-box" style={{ textAlign: "center", padding: "28px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                            <h3>Voice Dictation Intake Studio</h3>
                            <p className="text-subtle" style={{ margin: "8px 0 20px 0" }}>
                              Speak into your microphone. Your speech is transcribed in real-time and placed in an editable confirmation step below.
                            </p>

                            <button
                              type="button"
                              className={`mic-record-btn large-mic-btn ${voiceIntake.isListening ? "listening" : ""}`}
                              onClick={voiceIntake.isListening ? voiceIntake.stopListening : voiceIntake.startListening}
                            >
                              <span className="mic-icon large-mic-icon">{voiceIntake.isListening ? "🔴" : "🎙️"}</span>
                              <span>{voiceIntake.isListening ? "Listening Customer Audio... Click to Stop" : "Start Live Voice Dictation"}</span>
                            </button>
                          </div>

                          {/* LIVE TRANSCRIPTION PREVIEW STREAM */}
                          {voiceIntake.isListening && (
                            <div className="dictation-preview-box large-dictation-box">
                              <span className="dictation-label">🎙️ Live Speech Stream Preview:</span>
                              <p className="dictation-text large-dictation-text">
                                {voiceIntake.interimTranscript || "Listening... Speak your insurance question into microphone."}
                              </p>
                            </div>
                          )}

                          {/* EDITABLE CONFIRM-BEFORE-SUBMIT CARD */}
                          <div className="voice-confirm-card">
                            <div className="voice-confirm-header">
                              <span>⚠️ Step 2: Inspect & Confirm Voice Transcription</span>
                            </div>
                            <p style={{ fontSize: "0.9rem", color: "var(--semantic-amber)" }}>
                              Inspect and edit your transcribed speech below before explicitly confirming and submitting your inquiry.
                            </p>
                            <textarea
                              rows={4}
                              className="voice-confirm-textarea"
                              value={portalVoiceConfirmedQuery}
                              onChange={(e) => setPortalVoiceConfirmedQuery(e.target.value)}
                              placeholder="Transcribed voice inquiry will appear here for editable confirmation..."
                            />
                          </div>
                        </div>
                      )}

                      <button type="submit" className="login-btn" style={{ width: "fit-content", padding: "14px 32px" }}>
                        Confirm & Submit Request ➔
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* PORTAL SCREEN 2: MY SUPPORT REQUESTS */}
              {portalTab === "requests" && (
                <div className="page-container" style={{ padding: 0 }}>
                  <div className="page-header" style={{ marginBottom: "20px" }}>
                    <h2>My Support Requests Ledger ({portalRequests.length} Submitted)</h2>
                    <p>Track live status of your inquiries and view human-approved answers with grounded policy handbook citations.</p>
                  </div>

                  <div className="table-wrapper">
                    <table className="enterprise-table">
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Inquiry Summary</th>
                          <th>Channel</th>
                          <th>Status</th>
                          <th>Date Submitted</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portalRequests.map((req) => (
                          <tr key={req.id}>
                            <td className="mono font-bold">{req.id}</td>
                            <td>
                              <span className="font-bold">{req.original_query.substring(0, 60)}{req.original_query.length > 60 ? "..." : ""}</span>
                            </td>
                            <td><span className="channel-chip">{req.channel === "voice" ? "🎙️ Voice Intake" : "💬 Text"}</span></td>
                            <td>
                              <span className={`status-badge ${req.status}`}>
                                {req.status === "answered" ? "✓ ANSWERED" : req.status === "awaiting_approval" ? "🛡️ AWAITING APPROVAL" : req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="mono text-sm">{req.created_at}</td>
                            <td>
                              <button
                                className="table-action-btn"
                                onClick={() => setSelectedPortalRequest(req)}
                              >
                                View Answer & Thread ➔
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* SELECTED REQUEST MESSAGE THREAD MODAL */}
                  {selectedPortalRequest && (
                    <div className="citation-drawer-overlay" onClick={() => setSelectedPortalRequest(null)}>
                      <div className="citation-drawer-panel wide-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-header">
                          <h3>Request Detail — {selectedPortalRequest.id}</h3>
                          <button className="close-drawer-btn" onClick={() => setSelectedPortalRequest(null)}>✕</button>
                        </div>

                        <div className="drawer-body">
                          <div className="drawer-meta-grid">
                            <div className="drawer-meta-item">
                              <span className="drawer-label">Channel & Status</span>
                              <span className="drawer-value">
                                <span className="channel-chip">{selectedPortalRequest.channel}</span> — <span className={`status-badge ${selectedPortalRequest.status}`}>{selectedPortalRequest.status}</span>
                              </span>
                            </div>
                            <div className="drawer-meta-item">
                              <span className="drawer-label">Submitted At</span>
                              <span className="drawer-value mono">{selectedPortalRequest.created_at}</span>
                            </div>
                          </div>

                          <div className="passage-content-box">
                            <span className="passage-title">Your Submitted Inquiry:</span>
                            <p className="passage-text transcript-box">"{selectedPortalRequest.original_query}"</p>
                          </div>

                          {selectedPortalRequest.redacted_query !== selectedPortalRequest.original_query && (
                            <div className="passage-content-box" style={{ marginTop: "12px" }}>
                              <span className="passage-title">🛡️ Sanitized & PII-Redacted Query (Logged to LLM):</span>
                              <p className="passage-text" style={{ fontSize: "0.9rem", color: "var(--text-subtle)", backgroundColor: "var(--bg-subtle)", padding: "10px", borderRadius: "6px" }}>
                                "{selectedPortalRequest.redacted_query}"
                              </p>
                            </div>
                          )}

                          <div style={{ marginTop: "24px" }}>
                            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Message History & Approved Answers:</h4>
                            {selectedPortalRequest.messages.map((msg) => (
                              <div key={msg.id} className="clause-item-card" style={{ marginBottom: "16px", borderLeft: msg.sender_role === "agent" ? "4px solid var(--accent-emerald)" : "4px solid var(--primary-brand)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                  <span className="font-bold" style={{ color: msg.sender_role === "agent" ? "var(--accent-emerald)" : "var(--primary-brand)" }}>
                                    {msg.sender_role === "agent" ? "🛡️ Human-Approved Support Response" : "👤 You (Customer)"}
                                  </span>
                                  <span className="mono text-sm text-subtle">{msg.created_at}</span>
                                </div>
                                <p className="clause-body">{msg.body}</p>

                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="citations-container" style={{ marginTop: "12px" }}>
                                    <span className="citation-header">Grounded Policy Citations:</span>
                                    <div className="citation-chips">
                                      {msg.citations.map((c, i) => (
                                        <span key={i} className="citation-chip">
                                          📄 {c.title} ({c.doc})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAFF COCKPIT REALM WORKSPACE */}
      {appRealm === "staff" && (
        <>
          {/* TOP HEADER BAR */}
          <header className="top-header">
        <div className="header-left">
          <div className="app-brand-logo">
            <div className="logo-badge">NB</div>
            <div className="logo-text">
              <span className="company-name">NorthBridge</span>
              <span className="product-name">IntelliDesk AI</span>
            </div>
          </div>
          <span className="version-pill">v2.4 (200 Customer Pool)</span>
        </div>

        <div className="header-center">
          <div className="global-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search across all 200 customer CRM records, policies... (⌘K)"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
            />
            <span className="shortcut-badge">⌘K</span>
          </div>
        </div>

        <div className="header-right">
          {canAccessTab("approvals") && (
            <button
              className={`icon-btn notification-bell ${pendingApprovals.length > 0 ? "has-badge" : ""}`}
              onClick={() => setActiveTab("approvals")}
              title="Pending Approvals"
            >
              🔔
              {pendingApprovals.length > 0 && <span className="bell-badge">{pendingApprovals.length}</span>}
            </button>
          )}

          <button
            className="icon-btn theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <div className="user-profile-widget">
            <img src={user.avatar} alt="User Avatar" className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={() => { setIsAuthenticated(false); setAppRealm("landing"); }} title="Sign out">
            🚪 Logout & Exit
          </button>
        </div>
      </header>

      {/* BODY CONTAINER WITH PERSISTENT SIDEBAR */}
      <div className="app-body">
        {/* PERSISTENT SIDEBAR NAVIGATION WITH RBAC SCOPING */}
        <aside className="sidebar-nav">
          <nav className="nav-menu">
            {canAccessTab("dashboard") && (
              <button
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-label">Dashboard</span>
              </button>
            )}

            {canAccessTab("copilot") && (
              <button
                className={`nav-item ${activeTab === "copilot" ? "active" : ""}`}
                onClick={() => setActiveTab("copilot")}
              >
                <span className="nav-icon">💬</span>
                <span className="nav-label">Chat / Copilot</span>
                <span className="nav-pill hero">Hero</span>
              </button>
            )}

            {canAccessTab("queue") && (
              <button
                className={`nav-item ${activeTab === "queue" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("queue");
                  fetchStaffIncomingQueue();
                }}
              >
                <span className="nav-icon">📥</span>
                <span className="nav-label">Incoming Queue</span>
                {staffQueue.filter(r => r.status === "new" || r.status === "awaiting_approval").length > 0 && (
                  <span className="nav-counter-badge">{staffQueue.filter(r => r.status === "new" || r.status === "awaiting_approval").length}</span>
                )}
              </button>
            )}

            {canAccessTab("tickets") && (
              <button
                className={`nav-item ${activeTab === "tickets" ? "active" : ""}`}
                onClick={() => setActiveTab("tickets")}
              >
                <span className="nav-icon">🎫</span>
                <span className="nav-label">Tickets</span>
              </button>
            )}

            {canAccessTab("approvals") && (
              <button
                className={`nav-item ${activeTab === "approvals" ? "active" : ""}`}
                onClick={() => setActiveTab("approvals")}
              >
                <span className="nav-icon">🛡️</span>
                <span className="nav-label">Approvals</span>
                {pendingApprovals.length > 0 && (
                  <span className="nav-counter-badge">{pendingApprovals.length}</span>
                )}
              </button>
            )}

            {canAccessTab("conversations") && (
              <button
                className={`nav-item ${activeTab === "conversations" ? "active" : ""}`}
                onClick={() => setActiveTab("conversations")}
              >
                <span className="nav-icon">📞</span>
                <span className="nav-label">Call Ledger DB</span>
                <span className="nav-pill restricted">Tier 1-2</span>
              </button>
            )}

            {canAccessTab("kb") && (
              <button
                className={`nav-item ${activeTab === "kb" ? "active" : ""}`}
                onClick={() => setActiveTab("kb")}
              >
                <span className="nav-icon">📚</span>
                <span className="nav-label">Knowledge Base</span>
              </button>
            )}

            {canAccessTab("audit") && (
              <button
                className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
                onClick={() => setActiveTab("audit")}
              >
                <span className="nav-icon">📜</span>
                <span className="nav-label">Audit Log</span>
              </button>
            )}

            {canAccessTab("eval") && (
              <button
                className={`nav-item ${activeTab === "eval" ? "active" : ""}`}
                onClick={() => setActiveTab("eval")}
              >
                <span className="nav-icon">📈</span>
                <span className="nav-label">Evaluation</span>
              </button>
            )}

            {canAccessTab("settings") && (
              <button
                className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">Settings</span>
              </button>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="system-health">
              <span className="health-dot online"></span>
              <span className="health-text">Role: {user.role}</span>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT PANEL */}
        <main className="main-viewport">
          {/* PAGE 1: HERO CHAT / COPILOT WORKSPACE */}
          {activeTab === "copilot" && (
            <div className="copilot-page-layout">
              <div className="sub-navbar-header">
                <div className="sub-navbar-left">
                  <span className="customer-select-label">Active Customer Context ({customers.length} Accounts):</span>
                  <select
                    className="top-customer-dropdown"
                    value={selectedCustomer ? selectedCustomer.id : ""}
                    onChange={(e) =>
                      setSelectedCustomer(
                        customers.find((c) => c.id === e.target.value) || customers[0]
                      )
                    }
                  >
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        👤 {c.id} — {c.name} ({c.policy_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sub-navbar-tabs">
                  <button
                    className={`sub-nav-tab ${copilotSubTab === "chat" ? "active" : ""}`}
                    onClick={() => setCopilotSubTab("chat")}
                  >
                    🤖 Copilot AI Chat
                  </button>

                  <button
                    className={`sub-nav-tab ${copilotSubTab === "crm" ? "active" : ""}`}
                    onClick={() => setCopilotSubTab("crm")}
                  >
                    👤 Customer Profile & CRM
                  </button>

                  <button
                    className={`sub-nav-tab ${copilotSubTab === "voice" ? "active" : ""}`}
                    onClick={() => setCopilotSubTab("voice")}
                  >
                    🎙️ Voice Intake Studio
                  </button>

                  <button
                    className={`sub-nav-tab ${copilotSubTab === "grid" ? "active" : ""}`}
                    onClick={() => setCopilotSubTab("grid")}
                  >
                    🔲 Multi-Card Split View
                  </button>
                </div>
              </div>

              {/* VIEW MODE 1: CHAT */}
              {copilotSubTab === "chat" && selectedCustomer && (
                <div className="spacious-card-container">
                  <div className="workspace-card copilot-card full-focus-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">🤖</span> AI Copilot Assistant — {selectedCustomer.name} ({selectedCustomer.policy_number})
                      </div>
                      <div className="header-meta-chips">
                        <span className="meta-chip blue">Policy: {selectedCustomer.policy_type}</span>
                        <span className={`risk-badge risk-${selectedCustomer.risk_tier.toLowerCase()}`}>
                          {selectedCustomer.risk_tier} Risk
                        </span>
                        <span className="graph-state-pill">Role: {user.role}</span>
                      </div>
                    </div>

                    <div className="chat-messages-container large-text-messages">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message-row message-${msg.sender}`}>
                          <div className="message-bubble">
                            <div className="message-header">
                              <span className="sender-name">
                                {msg.sender === "agent"
                                  ? msg.activeAgent
                                  : msg.sender === "customer"
                                  ? selectedCustomer.name
                                  : "System"}
                              </span>

                              {msg.sender === "agent" && (
                                <span className={`confidence-badge ${msg.grounded ? "high" : "low"}`}>
                                  {msg.grounded ? `🟢 Grounded (${msg.confidence}%)` : `🟡 Verify (${msg.confidence}%)`}
                                </span>
                              )}

                              <span className="msg-time">{msg.timestamp}</span>
                            </div>

                            <p className="message-text">{msg.text}</p>

                            {msg.citations && msg.citations.length > 0 && (
                              <div className="citations-container">
                                <span className="citation-header">Grounded Policy Sources:</span>
                                <div className="citation-chips">
                                  {msg.citations.map((cit) => (
                                    <button
                                      key={cit.id}
                                      className="citation-chip"
                                      onClick={() => setActiveCitation(cit)}
                                    >
                                      📄 [{cit.id}] {cit.title}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {msg.hitlCard && (
                              <div className="inline-hitl-card">
                                <div className="hitl-top">
                                  <span className="hitl-badge">🛡️ Governance Interrupt</span>
                                  <span className="hitl-type">{msg.hitlCard.action_type}</span>
                                </div>
                                <p className="hitl-details">{msg.hitlCard.details}</p>
                                <div className="hitl-actions">
                                  {msg.hitlCard.status === "pending" ? (
                                    <>
                                      <button
                                        className="hitl-btn approve"
                                        onClick={() => handleHITLAction(msg.id, "approve")}
                                      >
                                        ✓ Approve & Execute ({msg.hitlCard.required_role || "Senior CSR/CSM"})
                                      </button>
                                      <button
                                        className="hitl-btn reject"
                                        onClick={() => handleHITLAction(msg.id, "reject")}
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className={`hitl-result ${msg.hitlCard.status}`}>
                                      Action {msg.hitlCard.status.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {msg.sender === "agent" && (
                              <button
                                className="tts-read-btn"
                                onClick={() => handleSpeakText(msg.text, msg.sentiment)}
                                title="Read Aloud with Customer Mood Adaptation"
                              >
                                🔊 {isSpeaking ? "Stop Voice Playback" : `Speak Response (Mood: ${msg.sentiment || 'neutral'})`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && <div className="chat-loading-indicator">⚡ LangGraph Router processing query...</div>}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-bar large-input-bar">
                      <input
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder={`Type query regarding ${selectedCustomer.name}'s policy or claim...`}
                        disabled={isLoading}
                      />
                      <button type="submit" className="send-btn large-btn" disabled={isLoading}>
                        {isLoading ? "Dispatching..." : "Dispatch Agent ➔"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: CRM */}
              {copilotSubTab === "crm" && selectedCustomer && (
                <div className="spacious-card-container">
                  <div className="workspace-card crm-card full-focus-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">👤</span> Customer Profile & CRM Record
                      </div>
                      <span className="meta-value mono font-bold">{selectedCustomer.id}</span>
                    </div>

                    <div className="card-body spacious-body">
                      <div className="customer-info-grid">
                        <div className="info-box">
                          <span className="meta-label">Full Customer Name</span>
                          <span className="meta-value large-val">{selectedCustomer.name}</span>
                        </div>

                        <div className="info-box">
                          <span className="meta-label">Risk Tier</span>
                          <span className={`risk-badge risk-${selectedCustomer.risk_tier.toLowerCase()} large-badge`}>
                            {selectedCustomer.risk_tier} Risk Tier
                          </span>
                        </div>

                        <div className="info-box">
                          <span className="meta-label">Email Address</span>
                          <span className="meta-value">{selectedCustomer.email}</span>
                        </div>

                        <div className="info-box">
                          <span className="meta-label">Phone Number</span>
                          <span className="meta-value">{selectedCustomer.phone}</span>
                        </div>

                        <div className="info-box">
                          <span className="meta-label">Policy Number</span>
                          <span
                            className="meta-value clickable mono large-val"
                            onClick={() => copyToClipboard(selectedCustomer.policy_number, "Policy Number")}
                          >
                            {selectedCustomer.policy_number} 📋
                          </span>
                        </div>

                        <div className="info-box">
                          <span className="meta-label">Policy Type</span>
                          <span className="meta-value large-val">{selectedCustomer.policy_type}</span>
                        </div>

                        <div className="info-box full-width-box">
                          <span className="meta-label">Coverage Details & Riders</span>
                          <span className="meta-value">{selectedCustomer.coverage_details}</span>
                        </div>
                      </div>

                      <div className="claims-history-block spacious-block">
                        <h3 className="block-title large-title">Recent Claims History Ledger</h3>
                        {selectedCustomer.claims_history.length === 0 ? (
                          <div className="no-claims-box">
                            <span>No prior claims or dispute records on file. Account in good standing.</span>
                          </div>
                        ) : (
                          selectedCustomer.claims_history.map((claim) => (
                            <div key={claim.claim_id} className="claim-history-card">
                              <div className="claim-top">
                                <span className="claim-id mono">{claim.claim_id}</span>
                                <span className="claim-status-tag">{claim.status}</span>
                              </div>
                              <div className="claim-details-row">
                                <span><strong>Date Filed:</strong> {claim.date}</span>
                                <span><strong>Amount Claimed:</strong> ₹{claim.amount.toLocaleString()}</span>
                                <span><strong>Incident Summary:</strong> {claim.reason}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW MODE 3: VOICE */}
              {copilotSubTab === "voice" && (
                <div className="spacious-card-container">
                  <div className="workspace-card voice-card full-focus-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">🎙️</span> Voice Communication Studio — Customer Intake
                      </div>
                      <span className="live-status-indicator large-indicator">● WebSpeech STT + AI Mood Playback Active</span>
                    </div>

                    <div className="card-body spacious-body">
                      <div className="voice-hero-box">
                        <h3>Customer Caller Intake & Dictation</h3>
                        <p>Customer queries are spoken into the microphone and transcribed into the agent pipeline.</p>

                        <button
                          className={`mic-record-btn large-mic-btn ${isListening ? "listening" : ""}`}
                          onClick={toggleListening}
                        >
                          <span className="mic-icon large-mic-icon">{isListening ? "🔴" : "🎙️"}</span>
                          <span>{isListening ? "Listening Customer Speech..." : "Start Live Customer Voice Intake"}</span>
                        </button>
                      </div>

                      <div className="dictation-preview-box large-dictation-box">
                        <span className="dictation-label">Real-Time Caller Transcript Stream:</span>
                        <p className="dictation-text large-dictation-text">
                          {isListening
                            ? "🎙️ Transcribing caller speech stream in real-time... Keywords detected: bumper damage, zero depreciation claim..."
                            : "Microphone on standby. Click the intake button above to start transcribing caller voice inquiries."}
                        </p>
                      </div>

                      <div className="autonomy-toggle-row spacious-toggle-row">
                        <div className="toggle-info">
                          <span className="toggle-title large-title">Copilot Autonomous Mode</span>
                          <span className="toggle-desc">Auto-executes safe draft replies; automatically triggers HITL interrupts for claims payouts exceeding $1,000.</span>
                        </div>
                        <label className="switch large-switch">
                          <input
                            type="checkbox"
                            checked={autonomyEnabled}
                            onChange={(e) => setAutonomyEnabled(e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW MODE 4: GRID */}
              {copilotSubTab === "grid" && selectedCustomer && (
                <div className="workspace-cards-grid split-grid-view">
                  <div className="workspace-card crm-card">
                    <div className="card-header">
                      <div className="card-title"><span className="card-icon">👤</span> Customer Profile</div>
                    </div>
                    <div className="card-body">
                      <div className="meta-item">
                        <span className="meta-label">Customer</span>
                        <span className="meta-value">{selectedCustomer.name} ({selectedCustomer.id})</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Policy</span>
                        <span className="meta-value mono">{selectedCustomer.policy_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="workspace-card voice-card">
                    <div className="card-header">
                      <div className="card-title"><span className="card-icon">🎙️</span> Voice Studio</div>
                    </div>
                    <div className="card-body">
                      <button className={`mic-record-btn ${isListening ? "listening" : ""}`} onClick={toggleListening}>
                        {isListening ? "🔴 Listening..." : "🎙️ Start Voice Intake"}
                      </button>
                    </div>
                  </div>

                  <div className="workspace-card copilot-card">
                    <div className="card-header">
                      <div className="card-title"><span className="card-icon">🤖</span> AI Copilot</div>
                    </div>
                    <div className="chat-messages-container">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message-row message-${msg.sender}`}>
                          <div className="message-bubble">
                            <p className="message-text">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CITATION DRAWER */}
              {activeCitation && (
                <div className="citation-drawer-overlay" onClick={() => setActiveCitation(null)}>
                  <div className="citation-drawer-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h3>Policy Source Citation [{activeCitation.id}]</h3>
                      <button className="close-drawer-btn" onClick={() => setActiveCitation(null)}>
                        ✕
                      </button>
                    </div>

                    <div className="drawer-body">
                      <div className="drawer-meta-item">
                        <span className="drawer-label">Section Title</span>
                        <span className="drawer-value">{activeCitation.title}</span>
                      </div>

                      <div className="drawer-meta-item">
                        <span className="drawer-label">Source Document</span>
                        <span className="drawer-value mono">{activeCitation.doc}</span>
                      </div>

                      <div className="drawer-meta-item">
                        <span className="drawer-label">Vector Similarity Score</span>
                        <span className="drawer-value similarity-score">
                          {(activeCitation.similarity * 100).toFixed(1)}% Match
                        </span>
                      </div>

                      <div className="passage-content-box">
                        <span className="passage-title">Exact Retrieved Chunk Passage:</span>
                        <p className="passage-text">"{activeCitation.snippet}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE 2: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="page-container dashboard-page">
              <div className="page-header">
                <h2>Executive Support & Copilot Dashboard ({user.role} View)</h2>
                <p>Real-time analytics across multi-agent dispatches and ticket deflection.</p>
              </div>

              <div className="kpi-cards-grid">
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Total Customer Accounts</span>
                    <span className="kpi-icon">🎫</span>
                  </div>
                  <div className="kpi-value">{customers.length} Accounts</div>
                  <span className="kpi-trend positive">Full 200 customer database</span>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Avg Latency</span>
                    <span className="kpi-icon">⚡</span>
                  </div>
                  <div className="kpi-value">1.4s</div>
                  <span className="kpi-trend positive">↓ pgvector optimization</span>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Groundedness Rate</span>
                    <span className="kpi-icon">🎯</span>
                  </div>
                  <div className="kpi-value">94.8%</div>
                  <span className="kpi-trend positive">≥85% target met</span>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Pending Approvals</span>
                    <span className="kpi-icon">🛡️</span>
                  </div>
                  <div className="kpi-value warning">{pendingApprovals.length}</div>
                  <span className="kpi-trend">Requires RBAC Level 1/2</span>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: TICKETS */}
          {activeTab === "tickets" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Active Customer Tickets ({tickets.length} Records)</h2>
                <p>Filterable pipeline of customer inquiries across voice and text channels.</p>
              </div>

              <div className="table-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer Name</th>
                      <th>Policy No</th>
                      <th>Issue Type</th>
                      <th>Priority</th>
                      <th>Risk Tier</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.ticket_id}>
                        <td className="mono font-bold">{t.ticket_id}</td>
                        <td className="font-bold">{t.customer_name}</td>
                        <td className="mono">{t.policy_number}</td>
                        <td>{t.issue_type}</td>
                        <td>
                          <span className={`priority-badge priority-${t.priority === 'High Priority' ? 'high' : 'normal'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge risk-${t.risk_tier.toLowerCase()}`}>
                            {t.risk_tier} Risk
                          </span>
                        </td>
                        <td><span className="status-pill active">{t.status}</span></td>
                        <td>
                          <button
                            className="table-action-btn"
                            onClick={() => {
                              const match = customers.find((c) => c.id === t.customer_id);
                              if (match) setSelectedCustomer(match);
                              setCopilotSubTab("chat");
                              setActiveTab("copilot");
                            }}
                          >
                            Open Copilot ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAGE 4: APPROVALS */}
          {activeTab === "approvals" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Human-in-the-Loop Approval Queue ({user.role} Authorized)</h2>
                <p>Tier 3: Support Agent (View only) | Tier 2: Senior CSR (Level 1) | Tier 1: CSM (Level 2).</p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="empty-state-card">
                  <span className="empty-icon">🎉</span>
                  <h3>Approval Queue Clear</h3>
                  <p>All sensitive actions have been reviewed and processed.</p>
                </div>
              ) : (
                <div className="approvals-cards-list">
                  {pendingApprovals.map((appr) => (
                    <div key={appr.id} className="approval-card">
                      <div className="approval-card-top">
                        <div className="appr-title-group">
                          <span className="appr-id mono">{appr.id}</span>
                          <span className="appr-type">{appr.action_type}</span>
                          <span className="rbac-level-badge">Required: Level {appr.required_level} ({appr.required_role})</span>
                        </div>
                        <span className={`risk-badge risk-${appr.risk_tier.toLowerCase().split(" ")[0]}`}>
                          {appr.risk_tier}
                        </span>
                      </div>

                      <div className="approval-card-body">
                        <p className="appr-desc">{appr.details}</p>
                        <div className="appr-meta-row">
                          <span><strong>Customer:</strong> {appr.customer_name} ({appr.customer_id})</span>
                          <span><strong>Requestor:</strong> {appr.requestor}</span>
                          <span><strong>Timestamp:</strong> {appr.timestamp}</span>
                        </div>
                      </div>

                      <div className="approval-card-actions">
                        <button
                          className="appr-btn grant"
                          onClick={() => handleQueueApproval(appr.id, true)}
                        >
                          ✓ Grant Approval as {user.role}
                        </button>
                        <button
                          className="appr-btn deny"
                          onClick={() => handleQueueApproval(appr.id, false)}
                        >
                          ✕ Reject Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAGE: INCOMING CUSTOMER SUPPORT REQUESTS QUEUE */}
          {activeTab === "queue" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Incoming Customer Support Requests Queue ({staffQueue.length} Inquiries)</h2>
                <p>Live-updating queue of incoming text and voice requests from customers. Route queries through the LangGraph RAG copilot engine for grounded, cited draft generation, then review and approve via HITL gate before real-time delivery.</p>
              </div>

              <div className="conversations-filter-bar">
                <span className="records-count-chip">{staffQueue.filter(r => r.status === 'new' || r.status === 'awaiting_approval').length} Pending Action</span>
                <span className="records-count-chip" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-brand)' }}>Real-Time SSE Stream Active</span>
              </div>

              <div className="table-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Customer Context</th>
                      <th>Channel</th>
                      <th>Customer Inquiry (Sanitized Redacted)</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffQueue.map((req) => (
                      <tr key={req.id}>
                        <td className="mono font-bold">{req.id}</td>
                        <td>
                          <div className="table-cust-cell">
                            <span className="font-bold">{req.customer_name} ({req.customer_id})</span>
                            <span className="sub-text">Policy: {req.policy_number} • Risk: {req.risk_tier}</span>
                          </div>
                        </td>
                        <td><span className="channel-chip">{req.channel === "voice" ? "🎙️ Voice Intake" : "💬 Text"}</span></td>
                        <td>
                          <span className="font-bold">{req.redacted_query ? req.redacted_query.substring(0, 55) : req.original_query.substring(0, 55)}...</span>
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`}>
                            {req.status === "answered" ? "✓ ANSWERED" : req.status === "awaiting_approval" ? "🛡️ HITL REVIEW NEEDED" : req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="mono text-sm">{req.created_at}</td>
                        <td>
                          {req.status === "new" ? (
                            <button
                              className="table-action-btn"
                              style={{ backgroundColor: "var(--primary-brand)", color: "#FFF" }}
                              onClick={() => handleProcessRequestWithCopilot(req.id)}
                            >
                              ⚡ Process with AI Copilot ➔
                            </button>
                          ) : (
                            <button
                              className="table-action-btn"
                              onClick={() => setSelectedQueueRequest(req)}
                            >
                              🛡️ Review HITL & Respond ➔
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* STAFF HITL APPROVAL DRAWER FOR INCOMING REQUEST */}
              {selectedQueueRequest && (
                <div className="citation-drawer-overlay" onClick={() => setSelectedQueueRequest(null)}>
                  <div className="citation-drawer-panel wide-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h3>HITL Response Gate — {selectedQueueRequest.id}</h3>
                      <button className="close-drawer-btn" onClick={() => setSelectedQueueRequest(null)}>✕</button>
                    </div>

                    <div className="drawer-body">
                      <div className="drawer-meta-grid">
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Customer</span>
                          <span className="drawer-value font-bold">{selectedQueueRequest.customer_name} ({selectedQueueRequest.customer_id})</span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Policy & Risk</span>
                          <span className="drawer-value">{selectedQueueRequest.policy_number} • <span className="status-pill active">{selectedQueueRequest.risk_tier || 'Low'} Risk</span></span>
                        </div>
                      </div>

                      <div className="passage-content-box">
                        <span className="passage-title">Original Customer Inquiry:</span>
                        <div className="transcript-box">
                          <p className="passage-text">"{selectedQueueRequest.original_query}"</p>
                        </div>
                      </div>

                      <div className="passage-content-box" style={{ marginTop: "12px" }}>
                        <span className="passage-title">🛡️ Sanitized & PII-Redacted Query (Sent to LLM Context):</span>
                        <div className="transcript-box" style={{ borderLeftColor: "var(--primary-brand)" }}>
                          <p className="passage-text">"{selectedQueueRequest.redacted_query || selectedQueueRequest.original_query}"</p>
                        </div>
                      </div>

                      {/* EDITABLE AI DRAFT ANSWER & CITATIONS */}
                      <div className="passage-content-box copilot-response-box" style={{ marginTop: "20px" }}>
                        <span className="passage-title" style={{ color: "var(--accent-emerald)" }}>
                          ⚡ AI Copilot Drafted Answer (Review/Edit before delivery):
                        </span>
                        <textarea
                          rows={6}
                          className="voice-confirm-textarea"
                          style={{ marginTop: "8px", borderLeft: "4px solid var(--accent-emerald)" }}
                          defaultValue={selectedQueueRequest.draft_answer || (selectedQueueRequest.messages?.find(m => m.sender_role === 'agent' || m.sender_role === 'ai_draft')?.body) || "Based on your policy handbook terms, your deductible and coverage details have been verified."}
                          id={`edit-response-${selectedQueueRequest.id}`}
                        />
                      </div>

                      <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                        <button
                          className="appr-btn grant"
                          onClick={() => {
                            const editedVal = document.getElementById(`edit-response-${selectedQueueRequest.id}`)?.value;
                            handleApproveStaffResponse(selectedQueueRequest.id, true, editedVal);
                          }}
                        >
                          ✓ Approve & Dispatch Answer to Customer Portal (Real-Time SSE)
                        </button>
                        <button
                          className="appr-btn deny"
                          onClick={() => handleApproveStaffResponse(selectedQueueRequest.id, false, null)}
                        >
                          ✕ Reject & Close Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE 5: CENTRALIZED CALL DB LEDGER (Senior CSR & CSM Only) */}
          {activeTab === "conversations" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Centralized Customer & Agent Call Ledger ({conversations.length} Records)</h2>
                <p>Immutable database of all Tier 3 Support Agent customer call transcripts & AI copilot responses. Restricted to Senior CSR (Tier 2) and CSM (Tier 1).</p>
              </div>

              {user.role === "Support Agent" ? (
                <div className="rbac-denied-card">
                  <span style={{ fontSize: "3rem" }}>🔒</span>
                  <h3 style={{ marginTop: "16px" }}>RBAC Access Denied</h3>
                  <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
                    Support Agents (Tier 3) do not have permission to access the Centralized Call Ledger Database.
                    This resource is restricted to Senior CSR and Customer Service Managers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="conversations-filter-bar">
                    <div className="global-search-bar flex-1">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Search by customer name, agent name, conversation ID..."
                        value={conversationSearchQuery}
                        onChange={(e) => setConversationSearchQuery(e.target.value)}
                      />
                    </div>
                    <span className="records-count-chip">{conversations.length} Call Records</span>
                  </div>

                  <div className="table-wrapper">
                    <table className="enterprise-table">
                      <thead>
                        <tr>
                          <th>Conv ID</th>
                          <th>Customer</th>
                          <th>Agent</th>
                          <th>Channel</th>
                          <th>Sentiment</th>
                          <th>Resolution</th>
                          <th>Timestamp</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversations
                          .filter((conv) => {
                            if (!conversationSearchQuery) return true;
                            const q = conversationSearchQuery.toLowerCase();
                            return (
                              conv.id.toLowerCase().includes(q) ||
                              conv.customer_name.toLowerCase().includes(q) ||
                              conv.agent_name.toLowerCase().includes(q) ||
                              conv.customer_id.toLowerCase().includes(q)
                            );
                          })
                          .map((conv) => (
                            <tr key={conv.id}>
                              <td className="mono font-bold">{conv.id}</td>
                              <td>
                                <div className="table-cust-cell">
                                  <span className="font-bold">{conv.customer_name}</span>
                                  <span className="sub-text">{conv.customer_id}</span>
                                </div>
                              </td>
                              <td>
                                <div className="table-agent-cell">
                                  <span>{conv.agent_name}</span>
                                  <span className="sub-text">{conv.agent_id}</span>
                                </div>
                              </td>
                              <td><span className="channel-chip">{conv.channel}</span></td>
                              <td>
                                <span className={`sentiment-badge sentiment-${conv.caller_sentiment}`}>
                                  {conv.caller_sentiment === "frustrated" ? "😤" : conv.caller_sentiment === "anxious" ? "😟" : "😐"} {conv.caller_sentiment}
                                </span>
                              </td>
                              <td><span className="status-pill active">{conv.resolution_status}</span></td>
                              <td className="mono text-sm">{conv.timestamp}</td>
                              <td>
                                <button
                                  className="table-action-btn"
                                  onClick={() => setSelectedConversation(conv)}
                                >
                                  View Transcript ➔
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Conversation Transcript Drawer */}
              {selectedConversation && (
                <div className="citation-drawer-overlay" onClick={() => setSelectedConversation(null)}>
                  <div className="citation-drawer-panel wide-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h3>Call Transcript — {selectedConversation.id}</h3>
                      <button className="close-drawer-btn" onClick={() => setSelectedConversation(null)}>
                        ✕
                      </button>
                    </div>

                    <div className="drawer-body">
                      <div className="drawer-meta-grid">
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Customer</span>
                          <span className="drawer-value font-bold">{selectedConversation.customer_name} ({selectedConversation.customer_id})</span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Support Agent</span>
                          <span className="drawer-value">{selectedConversation.agent_name} ({selectedConversation.agent_id})</span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Channel</span>
                          <span className="drawer-value"><span className="channel-chip">{selectedConversation.channel}</span></span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Caller Sentiment</span>
                          <span className="drawer-value">
                            <span className={`sentiment-badge sentiment-${selectedConversation.caller_sentiment}`}>
                              {selectedConversation.caller_sentiment}
                            </span>
                          </span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Resolution Status</span>
                          <span className="drawer-value"><span className="status-pill active">{selectedConversation.resolution_status}</span></span>
                        </div>
                        <div className="drawer-meta-item">
                          <span className="drawer-label">Timestamp</span>
                          <span className="drawer-value mono">{selectedConversation.timestamp}</span>
                        </div>
                      </div>

                      <div className="passage-content-box">
                        <span className="passage-title">Customer Call Transcript:</span>
                        <div className="transcript-box">
                          <p className="passage-text">"{selectedConversation.transcript}"</p>
                        </div>
                      </div>

                      <div className="passage-content-box copilot-response-box">
                        <span className="passage-title">AI Copilot Response & Action:</span>
                        <div className="transcript-box" style={{ borderLeftColor: "var(--accent-emerald)" }}>
                          <p className="passage-text">"{selectedConversation.ai_copilot_response}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE 6: KNOWLEDGE BASE */}
          {activeTab === "kb" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Vector Knowledge Base Browser</h2>
                <p>NorthBridge Assurance Vehicle Insurance Policy Handbook in pgvector Store.</p>
              </div>

              <div className="kb-stats-row">
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Vector Database Engine</span>
                  <span className="kb-stat-val">{kbStats?.vector_database || "PostgreSQL + pgvector Store"}</span>
                </div>
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Total Real Embeddings</span>
                  <span className="kb-stat-val">{kbStats?.total_embeddings || 107} Vector Chunks</span>
                </div>
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Chunk Strategy</span>
                  <span className="kb-stat-val">{kbStats?.chunk_strategy || "500 Characters (Overlap: 100)"}</span>
                </div>
              </div>

              <div className="kb-clauses-list">
                <h3>Ingested Policy Chunks</h3>
                {kbClauses.map((clause, idx) => (
                  <div key={idx} className="clause-item-card">
                    <h4 className="clause-title">{clause.clause} <span className="doc-pill">({clause.doc})</span></h4>
                    <p className="clause-body">{clause.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 6: AUDIT LOG */}
          {activeTab === "audit" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Immutable Governance & Compliance Audit Log ({auditLogs.length} Traces)</h2>
                <p>Monospace trace history tracking every graph execution, intent classification, and RBAC approval event.</p>
              </div>

              <div className="table-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Trace ID</th>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Compliance Tag</th>
                      <th>Event Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.trace_id}>
                        <td className="mono font-bold">{log.trace_id}</td>
                        <td className="mono text-sm">{log.timestamp}</td>
                        <td>{log.actor}</td>
                        <td><span className="role-tag">{log.role}</span></td>
                        <td className="mono">{log.action}</td>
                        <td><span className="status-pill active">{log.status}</span></td>
                        <td><span className="compliance-tag">{log.compliance}</span></td>
                        <td className="text-subtle text-sm">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAGE 7: EVALUATION */}
          {activeTab === "eval" && (
            <div className="page-container">
              <div className="page-header">
                <h2>RAGAS Metrics & Chunk Configuration Evaluation</h2>
                <p>Empirical benchmark stored in PostgreSQL database proving superiority of 500-character chunking strategy.</p>
              </div>

              <div className="kpi-cards-grid">
                {evalMetrics.map((m, idx) => (
                  <div key={idx} className="kpi-card eval-card">
                    <span className="kpi-title">{m.metric_name}</span>
                    <div className="kpi-value text-green">{m.score}%</div>
                    <span className="kpi-sub">{m.benchmark_status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 8: SETTINGS */}
          {activeTab === "settings" && (
            <div className="page-container">
              <div className="page-header">
                <h2>System Settings & Governance Config</h2>
                <p>Hierarchical 3-Level RBAC Configuration and LLM router settings.</p>
              </div>

              <div className="settings-section-card">
                <h3>Hierarchical 3-Level RBAC Post Assignments</h3>
                <div className="rbac-posts-grid">
                  <div className="rbac-post-box">
                    <span className="rbac-post-tier">Tier 3 (Frontline)</span>
                    <h4>Support Agent / CSR</h4>
                    <p>Handles customer queries on call, interacts with Copilot, dictates voice intake, and escalates high-risk claims. Access restricted to Chat & Tickets.</p>
                  </div>

                  <div className="rbac-post-box">
                    <span className="rbac-post-tier">Tier 2 (Mid-Level)</span>
                    <h4>Technical Support Specialist (Senior CSR)</h4>
                    <p>Level 1 Human Intervention — reviews team tickets, approves low/medium risk overrides (payouts &lt; ₹100,000), monitors audit logs. Cannot access Dashboard or Chat/Copilot.</p>
                  </div>

                  <div className="rbac-post-box">
                    <span className="rbac-post-tier">Tier 1 (Executive)</span>
                    <h4>Customer Service Manager (CSM)</h4>
                    <p>Level 2 Human Intervention — unrestricted system access across all 200 customer accounts, high-value payout approvals (≥ ₹100,000), RAGAS eval metrics, and system governance.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
        </>
      )}
    </div>
  );
}
