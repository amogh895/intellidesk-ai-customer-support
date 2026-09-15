import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// ─── MOCK / INITIAL DATA ───
const DEFAULT_CUSTOMERS = [
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
    timestamp: "2026-09-15 22:45"
  },
  {
    id: "APP-403",
    thread_id: "tr_1a2b3c4d",
    customer_id: "CRM-102",
    customer_name: "Priya Sharma",
    action_type: "Policy Endorsement Addition",
    amount: 0,
    requestor: "CRM Account Agent",
    risk_tier: "Medium Risk",
    confidence: 79,
    details: "Endorsement rider: Add secondary driver (Rohan Sharma) to policy POL-NB-2026-4410.",
    timestamp: "2026-09-15 21:15"
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
    compliance: "GOVERNANCE INTERRUPT",
    details: "Payout amount ₹84,000 exceeds $1,000 auto-execute threshold. Graph state suspended."
  },
  {
    trace_id: "tr_7e6d5c4b",
    timestamp: "2026-09-15 23:20:05",
    actor: "Rahul Verma",
    role: "Support Agent",
    action: "APPROVE_ACTION",
    intent: "draft_reply",
    status: "EXECUTED",
    compliance: "AUDIT LOGGED",
    details: "Approved draft response for zero-dep cover confirmation."
  },
  {
    trace_id: "tr_6b5a4f3e",
    timestamp: "2026-09-15 22:50:19",
    actor: "Policy RAG Agent",
    role: "AI Agent",
    action: "VECTOR_SEARCH",
    intent: "policy_rag",
    status: "COMPLETED",
    compliance: "SOC2 PASSED",
    details: "Query executed on ChromaDB collection 'vehicle_policy_handbook'. 4 chunks retrieved."
  }
];

const POLICY_CLAUSES = [
  {
    clause: "Clause 1: Scope of Cover & Eligibility",
    content: "This NorthBridge Assurance policy provides comprehensive indemnity against accidental loss, external damage, fire, theft, and third-party liabilities for private motor vehicles registered in India under the Motor Vehicles Act."
  },
  {
    clause: "Clause 2: Depreciation Scale for Claim Settlements",
    content: "For claims on parts requiring replacement: Rubber/nylon/plastic parts: 50%; Tyres & Tubes: 50%; Batteries: 50%; Glass parts: 0%; Fibre glass components: 30%; All other metal parts: Age-graded 5% to 50% unless Zero Depreciation rider is active."
  },
  {
    clause: "Clause 3: No Claim Bonus (NCB) Entitlement",
    content: "NCB is earned on OD premium for claim-free policy renewal years: 1 Year: 20%, 2 Years: 25%, 3 Years: 35%, 4 Years: 45%, 5 Years: 50%. Transferred upon vehicle replacement within 90 days."
  },
  {
    clause: "Clause 4: Deductibles & Compulsory Excess",
    content: "Compulsory deductible per accidental claim: Vehicles <= 1500cc: ₹1,000; Vehicles > 1500cc: ₹2,000. Voluntary deductible discounts can be applied up to ₹7,500."
  },
  {
    clause: "Clause 5: Exclusions & Uncovered Losses",
    content: "Damage caused by driving under the influence of alcohol or drugs, driving without a valid license, consequential mechanical failure, nuclear risk, or war operations is strictly excluded."
  }
];

export default function App() {
  // ─── STATE MANAGEMENT ───
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    name: "Alex Mercer",
    role: "Claims Manager",
    email: "alex.mercer@northbridge.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  });

  // Dark / Light Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Active Sidebar Page: 'dashboard', 'copilot', 'tickets', 'approvals', 'kb', 'audit', 'eval', 'settings'
  const [activeTab, setActiveTab] = useState("copilot");

  // Selected Customer in Copilot Workspace
  const [selectedCustomer, setSelectedCustomer] = useState(DEFAULT_CUSTOMERS[0]);
  const [queryInput, setQueryInput] = useState("");
  const [autonomyEnabled, setAutonomyEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [focusedCard, setFocusedCard] = useState("all"); // 'all', 'crm', 'voice', 'copilot'
  const [toastMessage, setToastMessage] = useState("");

  // Citation Drawer Right Panel State
  const [activeCitation, setActiveCitation] = useState(null);

  // Pending Approvals & Audit Logs
  const [pendingApprovals, setPendingApprovals] = useState(INITIAL_PENDING_APPROVALS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Messages in Copilot Chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      text: "Copilot initialized. Multi-Agent Graph ready (Supervisor, Policy RAG, CRM, Claims HITL). Select a customer context or enter a query.",
      timestamp: "23:40"
    },
    {
      id: 2,
      sender: "customer",
      text: "Hello, I had a minor accident last night. What is the deductible for my policy POL-NB-2026-9921?",
      timestamp: "23:41"
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
      timestamp: "23:41"
    }
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Dark Mode Toggle Class Handler
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

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const role = form.role.value;
    setUser({
      name: email.split("@")[0].replace(".", " ").toUpperCase() || "Support Staff",
      role: role,
      email: email,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    });
    setIsAuthenticated(true);
    showToast(`Welcome back, ${role}! Logged in as ${email}`);
  };

  // Send Query to Copilot
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: queryInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = queryInput;
    setQueryInput("");

    // Simulate Agent RAG Processing
    setTimeout(() => {
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
          details: "Approve ₹45,000 claim reimbursement under Policy " + selectedCustomer.policy_number + " (Clause 1 Scope of Cover).",
          status: "pending"
        };
        citations = [
          {
            id: 1,
            title: "Clause 1: Scope of Cover & Claim Authorization Limits",
            doc: "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            snippet: "Claims exceeding $1,000 (approx. ₹80,000 equivalent threshold) require dual authorization from Claims Manager.",
            similarity: 0.887
          }
        ];
      } else {
        aiResponse = `Regarding customer query: "${currentQuery}". According to ${selectedCustomer.policy_type} [1], coverage details are confirmed active with ${selectedCustomer.coverage_details} [2]. No exclusions apply under standard operations.`;
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
        citations: citations,
        hitlCard: hitlCard,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);

      // Add audit log entry
      setAuditLogs((prev) => [
        {
          trace_id: "tr_" + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          actor: activeAgent,
          role: "AI Agent",
          action: hitlCard ? "SUSPEND_FOR_HITL" : "VECTOR_SEARCH",
          intent: hitlCard ? "escalate" : "policy_rag",
          status: hitlCard ? "PENDING_APPROVAL" : "COMPLETED",
          compliance: "SOC2 PASSED",
          details: `Processed query for customer ${selectedCustomer.name} (${selectedCustomer.id})`
        },
        ...prev
      ]);
    }, 1000);
  };

  // HITL Inline Approval / Rejection
  const handleHITLAction = (msgId, action) => {
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
    showToast(action === "approve" ? "Action Approved & Executed successfully!" : "Action Rejected & Process Cancelled.");
  };

  // Approval Page Quick Actions
  const handleQueueApproval = (approvalId, approved) => {
    setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    showToast(approved ? `Approval ${approvalId} granted and committed!` : `Approval ${approvalId} rejected.`);
  };

  // Speech Recognition Toggle
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      showToast("Voice Intake stopped.");
    } else {
      setIsListening(true);
      showToast("Listening... Speak customer query into microphone.");
      setTimeout(() => {
        setQueryInput("Can I claim zero depreciation on my bumper repair after a parking scrape?");
        setIsListening(false);
        showToast("Voice input transcribed successfully.");
      }, 3000);
    }
  };

  // Text-to-Speech Playback
  const handleSpeakText = (text) => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast("Speech Synthesis not supported in current browser.");
    }
  };

  // ─── LOGIN SCREEN IF NOT AUTHENTICATED ───
  if (!isAuthenticated) {
    return (
      <div className={`login-page-container ${isDarkMode ? "dark" : ""}`}>
        <div className="login-split-card">
          <div className="login-brand-panel">
            <div className="brand-logo-wrap">
              <div className="brand-icon">NB</div>
              <span className="brand-title">NorthBridge Assurance</span>
            </div>
            <h2 className="brand-headline">Grounded, governed AI copilot for enterprise insurance teams.</h2>
            <p className="brand-subtext">
              Multi-Agent architecture with automated LangGraph workflows, SOC2 audit logging, and Human-in-the-Loop governance.
            </p>
            <div className="brand-tags">
              <span className="brand-tag">✓ LangGraph Agentic Engine</span>
              <span className="brand-tag">✓ ChromaDB Policy RAG</span>
              <span className="brand-tag">✓ RAGAS Metric Suite</span>
            </div>
          </div>

          <div className="login-form-panel">
            <h3 className="form-title">Staff Portal Login</h3>
            <p className="form-subtitle">Access your support copilot and approval workspace</p>
            <form onSubmit={handleLogin} className="enterprise-login-form">
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
                  defaultValue="••••••••••••"
                  placeholder="Enter security password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role Assignment</label>
                <select name="role" defaultValue="Claims Manager">
                  <option value="Support Agent">Support Agent</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Claims Manager">Claims Manager</option>
                </select>
              </div>

              <button type="submit" className="login-btn">
                Authenticate & Launch Cockpit
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN ENTERPRISE APPLICATION ───
  return (
    <div className={`app-shell ${isDarkMode ? "dark" : ""}`}>
      {/* Toast Notification Banner */}
      {toastMessage && <div className="toast-notification">ℹ️ {toastMessage}</div>}

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
          <span className="version-pill">v2.4 Enterprise</span>
        </div>

        <div className="header-center">
          <div className="global-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search policy handbook, customer CRM, or trace ID... (⌘K)"
            />
            <span className="shortcut-badge">⌘K</span>
          </div>
        </div>

        <div className="header-right">
          {/* HITL Notification Bell */}
          <button
            className={`icon-btn notification-bell ${pendingApprovals.length > 0 ? "has-badge" : ""}`}
            onClick={() => setActiveTab("approvals")}
            title="Pending Approvals"
          >
            🔔
            {pendingApprovals.length > 0 && <span className="bell-badge">{pendingApprovals.length}</span>}
          </button>

          {/* Theme Mode Toggle */}
          <button
            className="icon-btn theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {/* User Profile & Role */}
          <div className="user-profile-widget">
            <img src={user.avatar} alt="User Avatar" className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={() => setIsAuthenticated(false)} title="Sign out">
            🚪
          </button>
        </div>
      </header>

      {/* BODY CONTAINER WITH PERSISTENT SIDEBAR */}
      <div className="app-body">
        {/* PERSISTENT SIDEBAR NAVIGATION */}
        <aside className="sidebar-nav">
          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>

            <button
              className={`nav-item ${activeTab === "copilot" ? "active" : ""}`}
              onClick={() => setActiveTab("copilot")}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-label">Chat / Copilot</span>
              <span className="nav-pill hero">Hero</span>
            </button>

            <button
              className={`nav-item ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("tickets")}
            >
              <span className="nav-icon">🎫</span>
              <span className="nav-label">Tickets</span>
            </button>

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

            <button
              className={`nav-item ${activeTab === "kb" ? "active" : ""}`}
              onClick={() => setActiveTab("kb")}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-label">Knowledge Base</span>
            </button>

            <button
              className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <span className="nav-icon">📜</span>
              <span className="nav-label">Audit Log</span>
            </button>

            <button
              className={`nav-item ${activeTab === "eval" ? "active" : ""}`}
              onClick={() => setActiveTab("eval")}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-label">Evaluation</span>
            </button>

            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="system-health">
              <span className="health-dot online"></span>
              <span className="health-text">Multi-Agent Graph: Active</span>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT PANEL */}
        <main className="main-viewport">
          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 1: HERO CHAT / COPILOT WORKSPACE                      */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "copilot" && (
            <div className="copilot-page-layout">
              {/* Top Workflow Banner */}
              <div className="agent-quick-helper">
                <div className="helper-content">
                  <span className="helper-badge">💡 Agent Workflow Helper</span>
                  <span className="helper-text">
                    Select customer context below, speak or type query. Grounded citations open the right-side inspection drawer.
                  </span>
                </div>
                <div className="focus-controls">
                  <span className="focus-label">Layout View:</span>
                  <button
                    className={`focus-btn ${focusedCard === "all" ? "active" : ""}`}
                    onClick={() => setFocusedCard("all")}
                  >
                    Standard 3-Card
                  </button>
                  <button
                    className={`focus-btn ${focusedCard === "crm" ? "active" : ""}`}
                    onClick={() => setFocusedCard("crm")}
                  >
                    CRM Focus
                  </button>
                  <button
                    className={`focus-btn ${focusedCard === "voice" ? "active" : ""}`}
                    onClick={() => setFocusedCard("voice")}
                  >
                    Voice Focus
                  </button>
                  <button
                    className={`focus-btn ${focusedCard === "copilot" ? "active" : ""}`}
                    onClick={() => setFocusedCard("copilot")}
                  >
                    Chat Focus
                  </button>
                </div>
              </div>

              {/* 3-CARD WORKSPACE GRID */}
              <div className={`workspace-cards-grid focus-${focusedCard}`}>
                {/* CARD 1: CUSTOMER PROFILE & CRM */}
                {(focusedCard === "all" || focusedCard === "crm") && (
                  <div className="workspace-card crm-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">👤</span> Customer Profile
                      </div>
                      <select
                        className="customer-selector"
                        value={selectedCustomer.id}
                        onChange={(e) =>
                          setSelectedCustomer(
                            DEFAULT_CUSTOMERS.find((c) => c.id === e.target.value) || DEFAULT_CUSTOMERS[0]
                          )
                        }
                      >
                        {DEFAULT_CUSTOMERS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="card-body">
                      <div className="customer-meta-row">
                        <div className="meta-item">
                          <span className="meta-label">Customer ID</span>
                          <span
                            className="meta-value clickable"
                            onClick={() => copyToClipboard(selectedCustomer.id, "Customer ID")}
                          >
                            {selectedCustomer.id} 📋
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Risk Tier</span>
                          <span className={`risk-badge risk-${selectedCustomer.risk_tier.toLowerCase()}`}>
                            {selectedCustomer.risk_tier} Risk
                          </span>
                        </div>
                      </div>

                      <div className="meta-item-full">
                        <span className="meta-label">Policy Number</span>
                        <span
                          className="meta-value clickable mono"
                          onClick={() => copyToClipboard(selectedCustomer.policy_number, "Policy Number")}
                        >
                          {selectedCustomer.policy_number} 📋
                        </span>
                      </div>

                      <div className="meta-item-full">
                        <span className="meta-label">Policy Type</span>
                        <span className="meta-value">{selectedCustomer.policy_type}</span>
                      </div>

                      <div className="meta-item-full">
                        <span className="meta-label">Coverage Details</span>
                        <span className="meta-value text-subtle">{selectedCustomer.coverage_details}</span>
                      </div>

                      <div className="claims-history-block">
                        <span className="block-title">Recent Claims History</span>
                        {selectedCustomer.claims_history.length === 0 ? (
                          <span className="no-claims">No prior claims on record.</span>
                        ) : (
                          selectedCustomer.claims_history.map((claim) => (
                            <div key={claim.claim_id} className="claim-history-item">
                              <div className="claim-top">
                                <span className="claim-id">{claim.claim_id}</span>
                                <span className="claim-status">{claim.status}</span>
                              </div>
                              <div className="claim-sub">
                                <span>₹{claim.amount.toLocaleString()}</span> • <span>{claim.reason}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CARD 2: VOICE COMMUNICATION STUDIO */}
                {(focusedCard === "all" || focusedCard === "voice") && (
                  <div className="workspace-card voice-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">🎙️</span> Voice Communication Studio
                      </div>
                      <span className="live-status-indicator">● WebSpeech STT Active</span>
                    </div>

                    <div className="card-body">
                      <div className="voice-controls-bar">
                        <button
                          className={`mic-record-btn ${isListening ? "listening" : ""}`}
                          onClick={toggleListening}
                        >
                          <span className="mic-icon">{isListening ? "🔴" : "🎙️"}</span>
                          <span>{isListening ? "Listening Customer..." : "Start Customer Voice Intake"}</span>
                        </button>
                      </div>

                      <div className="dictation-preview-box">
                        <span className="dictation-label">Live Dictation Transcript:</span>
                        <p className="dictation-text">
                          {isListening
                            ? "Dictating caller audio stream... Transcribing keywords..."
                            : "Microphone standby. Click button above to initiate voice dictation."}
                        </p>
                      </div>

                      <div className="autonomy-toggle-row">
                        <div className="toggle-info">
                          <span className="toggle-title">Copilot Autonomy</span>
                          <span className="toggle-desc">Auto-executes safe draft replies; escalates sensitive claims.</span>
                        </div>
                        <label className="switch">
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
                )}

                {/* CARD 3: COPILOT CUSTOMER HANDLER (MAIN CHAT) */}
                {(focusedCard === "all" || focusedCard === "copilot") && (
                  <div className="workspace-card copilot-card">
                    <div className="card-header">
                      <div className="card-title">
                        <span className="card-icon">🤖</span> Copilot Customer Handler
                      </div>
                      <span className="graph-state-pill">LangGraph: Ready</span>
                    </div>

                    <div className="chat-messages-container">
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
                                <span
                                  className={`confidence-badge ${msg.grounded ? "high" : "low"}`}
                                >
                                  {msg.grounded ? "🟢 Grounded (96%)" : "🟡 Verify Confidence (68%)"}
                                </span>
                              )}

                              <span className="msg-time">{msg.timestamp}</span>
                            </div>

                            <p className="message-text">{msg.text}</p>

                            {/* CITATION CHIPS */}
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

                            {/* INLINE HITL APPROVAL CARD */}
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
                                        ✓ Approve & Execute
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

                            {/* TTS READ ALOUD BUTTON */}
                            {msg.sender === "agent" && (
                              <button
                                className="tts-read-btn"
                                onClick={() => handleSpeakText(msg.text)}
                                title="Read Aloud"
                              >
                                🔊 {isSpeaking ? "Stop Voice" : "Speak Response"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-bar">
                      <input
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder={`Ask AI copilot regarding ${selectedCustomer.name}'s policy or claim...`}
                      />
                      <button type="submit" className="send-btn">
                        Dispatch Agent ➔
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE CITATION DRAWER */}
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

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 2: DASHBOARD                                         */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="page-container dashboard-page">
              <div className="page-header">
                <h2>Executive Support & Copilot Dashboard</h2>
                <p>Real-time analytics across multi-agent dispatches and ticket deflection.</p>
              </div>

              {/* KPI STATS CARDS */}
              <div className="kpi-cards-grid">
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Total Tickets Handled</span>
                    <span className="kpi-icon">🎫</span>
                  </div>
                  <div className="kpi-value">1,420</div>
                  <span className="kpi-trend positive">↑ +14% vs last week</span>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-title">Avg Latency</span>
                    <span className="kpi-icon">⚡</span>
                  </div>
                  <div className="kpi-value">1.4s</div>
                  <span className="kpi-trend positive">↓ -0.3s RAG optimization</span>
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
                  <span className="kpi-trend">Requires human action</span>
                </div>
              </div>

              {/* DASHBOARD CHARTS ROW */}
              <div className="dashboard-charts-row">
                <div className="chart-card">
                  <h3>Daily Resolution Volume (AI vs Human)</h3>
                  <div className="chart-placeholder-svg">
                    <svg viewBox="0 0 500 150" className="simple-line-chart">
                      <path
                        d="M0,120 Q80,40 160,80 T320,30 T500,60"
                        fill="none"
                        stroke="#1E3A8A"
                        strokeWidth="3"
                      />
                      <path
                        d="M0,140 Q80,100 160,110 T320,90 T500,100"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                  <div className="chart-legend">
                    <span><span className="legend-dot blue"></span> Copilot Auto-Resolved</span>
                    <span><span className="legend-dot green"></span> Human Escalate Handled</span>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Recent Audit Activity Feed</h3>
                  <div className="mini-activity-feed">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.trace_id} className="feed-item">
                        <span className="feed-time">{log.timestamp.split(" ")[1]}</span>
                        <div className="feed-details">
                          <span className="feed-action">{log.action}</span>
                          <span className="feed-actor">by {log.actor}</span>
                        </div>
                        <span className="feed-status">{log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 3: TICKETS                                           */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "tickets" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Active Customer Tickets</h2>
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
                    {DEFAULT_CUSTOMERS.map((c, idx) => (
                      <tr key={c.id}>
                        <td className="mono font-bold">TCK-2026-0{idx + 1}</td>
                        <td>{c.name}</td>
                        <td className="mono">{c.policy_number}</td>
                        <td>{c.policy_type}</td>
                        <td>
                          <span className={`priority-badge priority-${idx === 2 ? "high" : "normal"}`}>
                            {idx === 2 ? "High Priority" : "Normal"}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge risk-${c.risk_tier.toLowerCase()}`}>
                            {c.risk_tier} Risk
                          </span>
                        </td>
                        <td>
                          <span className="status-pill active">{c.status}</span>
                        </td>
                        <td>
                          <button
                            className="table-action-btn"
                            onClick={() => {
                              setSelectedCustomer(c);
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

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 4: APPROVALS QUEUE                                    */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "approvals" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Human-in-the-Loop Approval Queue</h2>
                <p>Review sensitive claims payouts, policy exceptions, and rate overrides requiring authorization.</p>
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
                          <span><strong>Confidence:</strong> {appr.confidence}%</span>
                          <span><strong>Timestamp:</strong> {appr.timestamp}</span>
                        </div>
                      </div>

                      <div className="approval-card-actions">
                        <button
                          className="appr-btn grant"
                          onClick={() => handleQueueApproval(appr.id, true)}
                        >
                          ✓ Grant Approval & Execute
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

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 5: KNOWLEDGE BASE                                     */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "kb" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Vector Knowledge Base Browser</h2>
                <p>NorthBridge Assurance Vehicle Insurance Policy Handbook (Clauses 1–10) in ChromaDB Vector Store.</p>
              </div>

              <div className="kb-stats-row">
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Vector Database</span>
                  <span className="kb-stat-val">ChromaDB Persistent Store</span>
                </div>
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Total Embedded Chunks</span>
                  <span className="kb-stat-val">179 Vector Embeddings</span>
                </div>
                <div className="kb-stat-box">
                  <span className="kb-stat-label">Chunk Strategy</span>
                  <span className="kb-stat-val">500 Characters (Overlap: 100)</span>
                </div>
              </div>

              <div className="kb-clauses-list">
                <h3>Ingested Policy Clauses</h3>
                {POLICY_CLAUSES.map((clause, idx) => (
                  <div key={idx} className="clause-item-card">
                    <h4 className="clause-title">{clause.clause}</h4>
                    <p className="clause-body">{clause.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 6: AUDIT LOG                                          */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "audit" && (
            <div className="page-container">
              <div className="page-header">
                <h2>Immutable Governance & Compliance Audit Log</h2>
                <p>Monospace trace history tracking every graph execution and human approval event.</p>
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

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 7: EVALUATION (RAGAS & CHUNKING)                      */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "eval" && (
            <div className="page-container">
              <div className="page-header">
                <h2>RAGAS Metrics & Chunk Configuration Evaluation</h2>
                <p>Empirical benchmark proving superiority of 500-character chunking strategy (≥85% target context recall).</p>
              </div>

              {/* RAGAS METRIC CARDS */}
              <div className="kpi-cards-grid">
                <div className="kpi-card eval-card">
                  <span className="kpi-title">Context Recall</span>
                  <div className="kpi-value text-green">87.4%</div>
                  <span className="kpi-sub">Target ≥85% PASSED</span>
                </div>

                <div className="kpi-card eval-card">
                  <span className="kpi-title">Faithfulness</span>
                  <div className="kpi-value text-blue">92.1%</div>
                  <span className="kpi-sub">Hallucination rate &lt; 8%</span>
                </div>

                <div className="kpi-card eval-card">
                  <span className="kpi-title">Answer Relevancy</span>
                  <div className="kpi-value text-purple">89.8%</div>
                  <span className="kpi-sub">Semantic alignment score</span>
                </div>

                <div className="kpi-card eval-card">
                  <span className="kpi-title">Harmfulness / Safety</span>
                  <div className="kpi-value text-emerald">0.0%</div>
                  <span className="kpi-sub">Zero unsafe completions</span>
                </div>
              </div>

              {/* CHUNKING STRATEGY COMPARISON TABLE */}
              <div className="chunk-eval-box">
                <h3>Chunk Size Configuration Benchmark Comparison</h3>
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Chunk Size Config</th>
                      <th>Overlap (Chars)</th>
                      <th>Total Vectors</th>
                      <th>Context Recall</th>
                      <th>Faithfulness</th>
                      <th>Status / Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>300 Chars</td>
                      <td>50</td>
                      <td>284</td>
                      <td>74.2%</td>
                      <td>85.0%</td>
                      <td><span className="status-pill failed">Below Target (&lt;85%)</span></td>
                    </tr>
                    <tr className="winning-row">
                      <td className="font-bold">500 Chars (Optimal ⭐)</td>
                      <td className="font-bold">100</td>
                      <td className="font-bold">179</td>
                      <td className="font-bold text-green">87.4%</td>
                      <td className="font-bold text-blue">92.1%</td>
                      <td><span className="status-pill active">WINNER (Target Met)</span></td>
                    </tr>
                    <tr>
                      <td>800 Chars</td>
                      <td>150</td>
                      <td>112</td>
                      <td>81.0%</td>
                      <td>88.5%</td>
                      <td><span className="status-pill failed">Context Diluted</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* PAGE 8: SETTINGS                                          */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="page-container">
              <div className="page-header">
                <h2>System Settings & Governance Config</h2>
                <p>Configure LLM router endpoints, autonomy thresholds, and vector store parameters.</p>
              </div>

              <div className="settings-section-card">
                <h3>Autonomy & Governance Thresholds</h3>
                <div className="setting-control-group">
                  <label>Autonomy Confidence Threshold (Default: 85%)</label>
                  <input type="range" min="50" max="95" defaultValue="85" className="range-slider" />
                  <span className="setting-desc">Queries with confidence below threshold force human approval.</span>
                </div>
              </div>

              <div className="settings-section-card">
                <h3>Primary LLM Provider</h3>
                <div className="setting-control-group">
                  <select defaultValue="claude-3-5" className="settings-select">
                    <option value="claude-3-5">Anthropic Claude 3.5 Sonnet (Recommended)</option>
                    <option value="gemini-1-5">Google Gemini 1.5 Pro</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
