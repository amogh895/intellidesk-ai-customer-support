import React, { useState, useEffect } from 'react';
import { useVoice } from './hooks/useVoice';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const ESCALATION_THRESHOLD = 70000; // Claims > ₹70,000 auto-escalate to Level 3

// ─── SINGLE SOURCE OF DATA STORAGE: EMPLOYEE DATABASE ───
const INITIAL_EMPLOYEES = [
  {
    id: "EMP-401", name: "Sarah Connor",
    email: "sarah.connor@northbridge.com", password: "sarah@nb123",
    role: "agent",
    status: "On Call", calls: 14, resolved: 11,
    duration: 6.2, csat: 4.8, compliance: 98,
    avgRes: 4.2, claims: 4, renewals: 6,
    aiUsage: 85, score: 96, prevScore: 94,
    flaggedAnswers: 0,
    openCases: 3, escalations: 1, trendVal: 2
  },
  {
    id: "EMP-402", name: "John Miller",
    email: "john.miller@northbridge.com", password: "john@nb123",
    role: "agent",
    status: "Idle", calls: 18, resolved: 17,
    duration: 4.8, csat: 4.9, compliance: 100,
    avgRes: 3.5, claims: 5, renewals: 8,
    aiUsage: 90, score: 98, prevScore: 97,
    flaggedAnswers: 1,
    openCases: 1, escalations: 0, trendVal: 1
  },
  {
    id: "EMP-403", name: "Elena Rostova",
    email: "elena.rostova@northbridge.com", password: "elena@nb123",
    role: "agent",
    status: "On Break", calls: 10, resolved: 8,
    duration: 7.5, csat: 4.2, compliance: 90,
    avgRes: 6.0, claims: 2, renewals: 3,
    aiUsage: 70, score: 86, prevScore: 91,
    flaggedAnswers: 3,
    openCases: 4, escalations: 2, trendVal: -5
  },
  {
    id: "EMP-404", name: "Marcus Aurelius",
    email: "marcus.aurelius@northbridge.com", password: "super@nb123",
    role: "supervisor",
    status: "On Call", calls: 15, resolved: 12,
    duration: 5.5, csat: 4.7, compliance: 96,
    avgRes: 4.5, claims: 3, renewals: 5,
    aiUsage: 80, score: 94, prevScore: 93,
    flaggedAnswers: 0,
    openCases: 0, escalations: 0, trendVal: 0
  },
  {
    id: "EMP-500", name: "Diana Harlow",
    email: "diana.harlow@northbridge.com", password: "manager@nb123",
    role: "manager",
    status: "Active", calls: 0, resolved: 0,
    duration: 0, csat: 0, compliance: 100,
    avgRes: 0, claims: 0, renewals: 0,
    aiUsage: 0, score: 0, prevScore: 0,
    flaggedAnswers: 0,
    openCases: 0, escalations: 0, trendVal: 0
  }
];

// ─── CENTRALIZED AGENT DIRECTORY & AUDIT LOG ───
const INITIAL_AGENT_DIRECTORY_LOGS = [
  {
    id: "EMP-401",
    name: "Sarah Connor",
    email: "sarah.connor@northbridge.com",
    role: "Level 1 Agent",
    status: "Active Working",
    dateAdded: "2026-01-15 09:00",
    dateRemoved: "N/A (Active Working)",
    actionBy: "System Onboarding",
    notes: "Primary Auto & Life insurance agent."
  },
  {
    id: "EMP-402",
    name: "John Miller",
    email: "john.miller@northbridge.com",
    role: "Level 1 Agent",
    status: "Active Working",
    dateAdded: "2026-02-01 10:30",
    dateRemoved: "N/A (Active Working)",
    actionBy: "System Onboarding",
    notes: "Senior Home & Auto support agent."
  },
  {
    id: "EMP-403",
    name: "Elena Rostova",
    email: "elena.rostova@northbridge.com",
    role: "Level 1 Agent",
    status: "Active Working",
    dateAdded: "2026-03-10 14:15",
    dateRemoved: "N/A (Active Working)",
    actionBy: "System Onboarding",
    notes: "Customer support & claims intake specialist."
  },
  {
    id: "EMP-399",
    name: "Michael Chang",
    email: "michael.chang@northbridge.com",
    role: "Level 1 Agent",
    status: "Removed",
    dateAdded: "2025-11-01 08:30",
    dateRemoved: "2026-07-15 16:45",
    actionBy: "Marcus Aurelius (Supervisor)",
    notes: "Offboarded: Resigned to pursue higher education."
  }
];

// ─── CENTRALIZED CALL RECORDS DATABASE ───
const INITIAL_CALL_RECORDS = [
  {
    id: "CALL-801",
    agentId: "EMP-402", agentName: "John Miller",
    customerId: "CRM-103", customerName: "Charlie Davis",
    policyNumber: "POL-LIFE-303", policyType: "Life",
    callType: "Scheduled Callback",
    scheduledTime: "2026-08-10 14:30",
    completedTime: "2026-08-10 14:35",
    duration: "5.2 min",
    intent: "Nominee / Beneficiary Change",
    status: "Completed",
    notes: "Customer confirmed designation of primary nominee to spouse Jane Davis."
  },
  {
    id: "CALL-802",
    agentId: "EMP-401", agentName: "Sarah Connor",
    customerId: "CRM-101", customerName: "Alice Smith",
    policyNumber: "POL-AUTO-501", policyType: "Auto",
    callType: "Inbound Call",
    scheduledTime: "N/A",
    completedTime: "2026-08-10 11:15",
    duration: "6.2 min",
    intent: "Claim Intake",
    status: "Completed",
    notes: "Collision claim intake filed (₹14,500). Escalated to Claims Manager queue."
  },
  {
    id: "CALL-803",
    agentId: "EMP-403", agentName: "Elena Rostova",
    customerId: "CRM-102", customerName: "Bob Jones",
    policyNumber: "POL-HOME-102", policyType: "Home",
    callType: "Scheduled Callback",
    scheduledTime: "2026-08-10 16:00",
    completedTime: "Pending",
    duration: "0.0 min",
    intent: "Premium Payment / Policy Status",
    status: "Scheduled",
    notes: "Follow up regarding 31-day grace period for missed premium payment."
  }
];

// ─── CENTRALIZED CLAIMS AUDIT ARCHIVE ───
const INITIAL_CLAIM_DECISIONS = [
  {
    id: "DEC-101",
    requestId: "REQ-880",
    customer: "Robert Chen",
    customerId: "CRM-104",
    policyNum: "POL-AUTO-302",
    policyType: "Auto",
    grossAmount: 4200,
    deductible: 500,
    netPayout: 3700,
    requestedBy: "John Miller",
    decidedBy: "Diana Harlow",
    decidedByRole: "Claims Manager",
    decision: "Approved",
    timestamp: "2026-08-08 11:20",
    notes: "Small collision claim approved. Verified repair estimate and clean driver history.",
    fraudProb: 2,
    fraudDrivers: ["No prior claims"]
  },
  {
    id: "DEC-102",
    requestId: "REQ-881",
    customer: "Eleanor Vance",
    customerId: "CRM-105",
    policyNum: "POL-HOME-209",
    policyType: "Home",
    grossAmount: 115000,
    deductible: 2000,
    netPayout: 0,
    requestedBy: "Sarah Connor",
    decidedBy: "Diana Harlow",
    decidedByRole: "Claims Manager",
    decision: "Rejected",
    timestamp: "2026-08-09 15:45",
    notes: "High-value flood claim rejected due to policy pre-existing condition exclusion.",
    fraudProb: 65,
    fraudDrivers: ["Unregistered contractor invoice", "Pre-existing structural wear"]
  }
];

// ─── HELPER: Compute dynamic team metrics ───
function computeTeamMetrics(agents) {
  const online = agents.filter(a => a.role === 'agent' && a.status !== 'Removed');
  if (online.length === 0) return { activeCount: 0, avgCsat: "0.00", avgDuration: "0.0" };
  const totalCsat = online.reduce((s, a) => s + a.csat, 0);
  const totalDuration = online.reduce((s, a) => s + a.duration, 0);
  return {
    activeCount: online.length,
    avgCsat: (totalCsat / online.length).toFixed(2),
    avgDuration: (totalDuration / online.length).toFixed(1),
  };
}

// ─── HELPER: Premium Risk Tier computation ───
function computeRiskTier(crmRecord) {
  if (!crmRecord) return 'Low';
  const claimsCount = crmRecord.claims ? crmRecord.claims.length : 0;
  const unpaid = crmRecord.outstanding_premium || 0;
  if (claimsCount > 1 || unpaid > 500) return 'High';
  if (claimsCount === 1 || unpaid > 0) return 'Medium';
  return 'Low';
}

// ─── HELPER: Trend arrow ───
function TrendArrow({ current, previous, trendVal }) {
  const val = trendVal !== undefined ? trendVal : (current - previous);
  if (val > 0) return <span className="trend-up">▲ +{val}</span>;
  if (val < 0) return <span className="trend-down">▼ {val}</span>;
  return <span className="trend-flat">● 0</span>;
}

// ─── HELPER: Get intent-driven CRM actions ───
function getContextualActions(intent) {
  const lower = (intent || "").toLowerCase();
  if (lower.includes("claim") || lower.includes("damage") || lower.includes("accident") || lower.includes("intake")) {
    return ["Start Claim", "Schedule Callback"];
  }
  return ["Schedule Callback"];
}

const ACTION_STYLE = {
  "Start Claim": "act-btn btn-blue",
  "Schedule Callback": "act-btn btn-green",
};

const CSAT_GOAL = 4.60;
const DURATION_SLA = 6.0;

export default function App() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Session
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [threadId, setThreadId] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);

  // Center-Screen Action Loading Modal State
  const [centerActionLoading, setCenterActionLoading] = useState({
    isLoading: false,
    title: "",
    subtitle: ""
  });

  // Single Source of Truth Store
  const [employees, setEmployees] = useState([...INITIAL_EMPLOYEES]);
  const [agentDirectoryLogs, setAgentDirectoryLogs] = useState([...INITIAL_AGENT_DIRECTORY_LOGS]);
  const [financials, setFinancials] = useState({
    ytdLoss: 1200000,
    budget: 1500000,
    fraudSavings: 245000,
    autoReserves: 450000,
    homeReserves: 780000
  });

  // Agent Onboarding / Offboarding States (Supervisor RBAC)
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [newAgentStatus, setNewAgentStatus] = useState('On Call');

  const [selectedAgentToRemove, setSelectedAgentToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  // Pending Escalations Queue (Operational Supervisor View)
  const [pendingEscalations, setPendingEscalations] = useState([
    { id: "ESC-301", title: "Beneficiary Change", agent: "Sarah Connor", agentId: "EMP-401", customer: "Charlie Davis (CRM-103)", type: "Policy Exception", urgency: "Medium", status: "Awaiting Review", details: "Customer requested nominee update on Life Policy POL-LIFE-303. Requires Level 2 supervisor review." },
    { id: "ESC-302", title: "Large Claim", agent: "Elena Rostova", agentId: "EMP-403", customer: "David Wilson (CRM-104)", type: "Claim High-Value", urgency: "High", status: "Awaiting Review", details: "Water damage claim (₹78,000) exceeds Level 1 auto-approval threshold. Requires supervisor sign-off." },
    { id: "ESC-303", title: "Coverage Exception", agent: "Sarah Connor", agentId: "EMP-401", customer: "Alice Smith (CRM-101)", type: "Deductible Waiver Request", urgency: "Medium", status: "Awaiting Review", details: "Customer requested deductible waiver due to third-party liability." }
  ]);
  const [selectedEscalationReview, setSelectedEscalationReview] = useState(null);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Centralized Call Record Database
  const [centralCallRecords, setCentralCallRecords] = useState([...INITIAL_CALL_RECORDS]);
  const [callFilterAgent, setCallFilterAgent] = useState('All');
  const [callFilterStatus, setCallFilterStatus] = useState('All');
  const [callSearchInput, setCallSearchInput] = useState('');
  const [selectedCallDetail, setSelectedCallDetail] = useState(null);

  // Centralized Claims Audit Archive
  const [centralClaimDecisions, setCentralClaimDecisions] = useState([...INITIAL_CLAIM_DECISIONS]);
  const [claimFilterDecision, setClaimFilterDecision] = useState('All');
  const [claimSearchInput, setClaimSearchInput] = useState('');
  const [selectedClaimDecisionDetail, setSelectedClaimDecisionDetail] = useState(null);

  // Language Driver
  const [copilotLang, setCopilotLang] = useState('English');

  // Voice Integration Engine (STT & TTS)
  const {
    isSTTSupported,
    isTTSSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    isSpeaking,
    speakingTextId,
    speak,
    stopSpeaking,
    voiceError,
    setVoiceError,
  } = useVoice();
  const [activeMicTarget, setActiveMicTarget] = useState(null); // 'caller' | 'search' | null

  // Persistent Session Customer Context
  const [crmInput, setCrmInput] = useState('CRM-103');
  const [crmRecord, setCrmRecord] = useState(null);
  const [crmError, setCrmError] = useState('');

  // Callback Calendar & Alarm Notification States
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackDateTime, setCallbackDateTime] = useState('');
  const [callbackReason, setCallbackReason] = useState('');
  const [scheduledCallbacks, setScheduledCallbacks] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);

  // Transcript Simulator
  const [conversation, setConversation] = useState([]);
  const [liveStatementInput, setLiveStatementInput] = useState('');

  // Enterprise Copilot Assist (4-Section Structure)
  const [copilotIntel, setCopilotIntel] = useState({
    intent: "General Policy Inquiry",
    sentiment: "Neutral",
    urgency: "Low",
    stage: "Opening",
    suggestedResponse: "Please verify a customer above to begin the assist session.",
    suggestedQuestions: [
      "Can you provide your CRM ID or policy number?",
      "Are you the primary policyholder?"
    ],
    nextAction: "Verify customer identity",
    policyRule: "Customer verification required to access account files.",
    reqDocs: [],
    alerts: []
  });

  // RAG chat
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Claims Manager calculator
  const [calcClaimAmt, setCalcClaimAmt] = useState(25000);
  const [calcDeductible, setCalcDeductible] = useState(1000);
  const [calcLiabilityPct, setCalcLiabilityPct] = useState(0);

  // Supervisor drilldown
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Flagged copilot answers
  const [flaggedAnswers, setFlaggedAnswers] = useState([]);

  // Approval comment tracking
  const [approvalComments, setApprovalComments] = useState({});

  // ─── HELPER: Execute Action with Center-Screen Loading Modal ───
  const executeWithLoading = (title, subtitle, taskFn, delayMs = 600) => {
    setCenterActionLoading({ isLoading: true, title, subtitle });
    setTimeout(() => {
      taskFn();
      setCenterActionLoading({ isLoading: false, title: "", subtitle: "" });
    }, delayMs);
  };

  // ─── AGENT-SCOPED ALARM MONITOR ───
  useEffect(() => {
    const interval = setInterval(() => {
      if (scheduledCallbacks.length === 0 || !user) return;
      const now = new Date();
      scheduledCallbacks.forEach(cb => {
        if (cb.agentId === user.id && cb.status === 'Pending' && !cb.alarmTriggered) {
          const schedDate = new Date(cb.scheduledTime);
          if (now >= schedDate) {
            setScheduledCallbacks(prev => prev.map(item => item.id === cb.id ? { ...item, alarmTriggered: true } : item));
            setActiveAlarm({ ...cb, alarmTriggered: true });
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch (e) {}
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledCallbacks, user]);

  // ─── CALLBACK MODAL HANDLERS ───
  const handleOpenCallbackModal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const defaultIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setCallbackDateTime(defaultIso);
    setCallbackReason(copilotIntel.intent ? `Follow up on ${copilotIntel.intent}` : "Policy consultation");
    setShowCallbackModal(true);
  };

  const handleConfirmCallback = (e) => {
    e.preventDefault();
    if (!callbackDateTime) return;

    executeWithLoading(
      "Scheduling Customer Callback",
      `Registering date & setting agent alarm for ${user.name}...`,
      () => {
        const newCb = {
          id: `CB-${Date.now()}`,
          agentId: user.id,
          agentName: user.name,
          customerId: crmRecord?.id || "CRM-103",
          customerName: crmRecord?.name || "Charlie Davis",
          policyNumber: crmRecord?.policy_number || "POL-LIFE-303",
          scheduledTime: callbackDateTime,
          reason: callbackReason || "Scheduled Callback",
          status: 'Pending',
          alarmTriggered: false
        };
        setScheduledCallbacks(prev => [...prev, newCb]);
        setShowCallbackModal(false);

        const formattedDate = new Date(callbackDateTime).toLocaleString();

        const newCallRecord = {
          id: `CALL-${Math.floor(800 + Math.random() * 100)}`,
          agentId: user.id,
          agentName: user.name,
          customerId: newCb.customerId,
          customerName: newCb.customerName,
          policyNumber: newCb.policyNumber,
          policyType: crmRecord?.policy_type || "Life",
          callType: "Scheduled Callback",
          scheduledTime: formattedDate,
          completedTime: "Pending",
          duration: "0.0 min",
          intent: copilotIntel.intent || "Scheduled Callback",
          status: "Scheduled",
          notes: `Scheduled callback by ${user.name}. Reason: ${newCb.reason}`
        };
        setCentralCallRecords(prev => [newCallRecord, ...prev]);

        setActionAlert({
          title: "Callback Scheduled Successfully",
          message: `Scheduled for ${newCb.customerName} (${newCb.policyNumber}) at ${formattedDate}. Recorded in Central DB.`
        });
        setConversation(prev => [...prev, {
          sender: "system",
          text: `CRM Note: Scheduled callback created for ${newCb.customerName} on ${formattedDate}. Reason: ${newCb.reason}`
        }]);
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  const handleTestAlarmNow = () => {
    const testCb = {
      id: `CB-TEST-${Date.now()}`,
      agentId: user.id,
      agentName: user.name,
      customerId: crmRecord?.id || "CRM-103",
      customerName: crmRecord?.name || "Charlie Davis",
      policyNumber: crmRecord?.policy_number || "POL-LIFE-303",
      scheduledTime: new Date().toISOString().slice(0, 16),
      reason: callbackReason || "Urgent Nominee Change Follow-up",
      status: 'Pending',
      alarmTriggered: true
    };
    setShowCallbackModal(false);
    setActiveAlarm(testCb);
  };

  const handleStartCallFromAlarm = (alarm) => {
    executeWithLoading(
      "Connecting Outbound Callback Call",
      `Establishing live session with ${alarm.customerName}...`,
      () => {
        setScheduledCallbacks(prev => prev.map(c => c.id === alarm.id ? { ...c, status: 'Completed' } : c));
        setActiveAlarm(null);

        setCentralCallRecords(prev => prev.map(r =>
          (r.customerId === alarm.customerId && r.status === 'Scheduled')
            ? { ...r, status: 'Completed', completedTime: new Date().toLocaleString(), duration: '2.5 min', notes: r.notes + ' — Callback completed by agent.' }
            : r
        ));

        setConversation(prev => [
          ...prev,
          { sender: "system", text: `CRM Note: Outbound scheduled call initiated with ${alarm.customerName} (${alarm.customerId}) for policy ${alarm.policyNumber}.` },
          { sender: "customer", text: `Hello, I'm calling back as scheduled regarding my policy.` }
        ]);
        setCopilotIntel(prev => ({
          ...prev,
          stage: "Callback In Progress",
          suggestedResponse: `Hello ${alarm.customerName}, this is ${user.name} following up as scheduled regarding your policy (${alarm.policyNumber}). How are you today?`
        }));
        setActionAlert({
          title: "Callback Started",
          message: `Active call established with ${alarm.customerName}. Record updated in Central DB.`
        });
        setTimeout(() => setActionAlert(null), 3000);
      }
    );
  };

  const handleSnoozeAlarm = (alarm) => {
    const newTime = new Date(Date.now() + 5 * 60000);
    const isoStr = new Date(newTime.getTime() - (newTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setScheduledCallbacks(prev => prev.map(c => c.id === alarm.id ? { ...c, scheduledTime: isoStr, alarmTriggered: false } : c));
    setActiveAlarm(null);
    setActionAlert({ title: "Alarm Snoozed", message: "Callback postponed by 5 minutes." });
    setTimeout(() => setActionAlert(null), 3000);
  };

  const handleDismissAlarm = (alarm) => {
    setScheduledCallbacks(prev => prev.map(c => c.id === alarm.id ? { ...c, status: 'Dismissed' } : c));
    setActiveAlarm(null);
  };

  // ─── AUTH HANDLER ───
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;
    const match = employees.find(emp => emp.email === email && emp.password === password);
    if (match) {
      if (match.status === 'Removed') {
        setAuthError('This Level 1 Agent account has been deactivated/removed by a Supervisor.');
        return;
      }
      executeWithLoading(
        "Authenticating User Credentials",
        `Verifying RBAC clearance for ${match.name}...`,
        () => {
          setUser({ ...match });
          setIsAuthenticated(true);
          setActiveTab(match.role === 'manager' ? 'exec_dashboard' : 'dashboard');
        },
        400
      );
    } else {
      setAuthError('Invalid credentials. Please verify your email and password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmailInput('');
    setPasswordInput('');
    setUser(null);
    handleChangeCustomer();
  };

  // ─── SUPERVISOR: ADD LEVEL 1 AGENT ───
  const handleAddAgentSubmit = (e) => {
    e.preventDefault();
    if (user.role !== 'supervisor') return;
    if (!newAgentName.trim() || !newAgentEmail.trim() || !newAgentPassword.trim()) return;

    executeWithLoading(
      "Creating Level 1 Agent Account",
      `Initializing credentials & logging directory entry for ${newAgentName}...`,
      () => {
        const newId = `EMP-${Math.floor(405 + Math.random() * 90)}`;
        const timestamp = new Date().toLocaleString();

        const newEmp = {
          id: newId,
          name: newAgentName.trim(),
          email: newAgentEmail.trim().toLowerCase(),
          password: newAgentPassword,
          role: "agent",
          status: newAgentStatus,
          calls: 0,
          resolved: 0,
          duration: 5.0,
          csat: 5.0,
          compliance: 100,
          avgRes: 4.0,
          claims: 0,
          renewals: 0,
          aiUsage: 80,
          score: 95,
          prevScore: 95,
          flaggedAnswers: 0,
          openCases: 0,
          escalations: 0,
          trendVal: 0
        };

        setEmployees(prev => [...prev, newEmp]);

        const newLog = {
          id: newId,
          name: newEmp.name,
          email: newEmp.email,
          role: "Level 1 Agent",
          status: "Active Working",
          dateAdded: timestamp,
          dateRemoved: "N/A (Active Working)",
          actionBy: `${user.name} (Supervisor)`,
          notes: `Onboarded by Supervisor ${user.name}.`
        };

        setAgentDirectoryLogs(prev => [newLog, ...prev]);

        setShowAddAgentModal(false);
        setNewAgentName('');
        setNewAgentEmail('');
        setNewAgentPassword('');

        setActionAlert({
          title: `Agent Created: ${newEmp.name}`,
          message: `Added ID ${newId}. Logged in Directory Archive on ${timestamp}. Agent can sign in immediately!`
        });
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  // ─── SUPERVISOR: REMOVE LEVEL 1 AGENT ───
  const handleConfirmRemoveAgent = () => {
    if (!selectedAgentToRemove || user.role !== 'supervisor') return;

    executeWithLoading(
      "Deactivating Agent Account",
      `Archiving offboarding record for ${selectedAgentToRemove.name}...`,
      () => {
        const timestamp = new Date().toLocaleString();

        setEmployees(prev => prev.map(e => e.id === selectedAgentToRemove.id ? { ...e, status: 'Removed' } : e));

        setAgentDirectoryLogs(prev => {
          const exists = prev.find(l => l.id === selectedAgentToRemove.id);
          if (exists) {
            return prev.map(l => l.id === selectedAgentToRemove.id ? {
              ...l,
              status: "Removed",
              dateRemoved: timestamp,
              actionBy: `${user.name} (Supervisor)`,
              notes: removeReason ? `Offboarded: ${removeReason}` : "Offboarded by Supervisor."
            } : l);
          } else {
            return [{
              id: selectedAgentToRemove.id,
              name: selectedAgentToRemove.name,
              email: selectedAgentToRemove.email,
              role: "Level 1 Agent",
              status: "Removed",
              dateAdded: "2026-01-15 09:00",
              dateRemoved: timestamp,
              actionBy: `${user.name} (Supervisor)`,
              notes: removeReason ? `Offboarded: ${removeReason}` : "Offboarded by Supervisor."
            }, ...prev];
          }
        });

        setActionAlert({
          title: `Agent Removed: ${selectedAgentToRemove.name}`,
          message: `Agent ID ${selectedAgentToRemove.id} deactivated on ${timestamp}. Recorded in Agent Directory Archive.`
        });

        setSelectedAgentToRemove(null);
        setRemoveReason('');
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  // ─── CHANGE CUSTOMER ───
  const handleChangeCustomer = () => {
    setCrmRecord(null);
    setCrmInput('');
    setCrmError('');
    setConversation([]);
    setThreadId(null);
    setChatHistory([]);
    setCopilotIntel({
      intent: "General Policy Inquiry",
      sentiment: "Neutral",
      urgency: "Low",
      stage: "Opening",
      suggestedResponse: "Please verify a customer above to begin the assist session.",
      suggestedQuestions: [
        "Can you provide your CRM ID or policy number?",
        "Are you the primary policyholder?"
      ],
      nextAction: "Verify customer identity",
      policyRule: "Customer verification required to access account files.",
      reqDocs: [],
      alerts: []
    });
    setActionAlert({ title: "Session Cleared", message: "Customer context and transcript reset safely for new session." });
    setTimeout(() => setActionAlert(null), 3000);
  };

  // ─── CRM LOOKUP ───
  const handleCrmLookup = async (queryVal = crmInput) => {
    setCrmError('');

    executeWithLoading(
      "Verifying Customer Identity",
      `Searching CRM database for ${queryVal}...`,
      async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/crm/${queryVal}`);
          if (res.ok) {
            const data = await res.json();
            setCrmRecord(data);
            setConversation([
              { sender: "system", text: `CRM Note: Inbound call established. Customer verified: ${data.name} (${data.id}).` }
            ]);

            const callRec = {
              id: `CALL-${Math.floor(850 + Math.random() * 100)}`,
              agentId: user.id,
              agentName: user.name,
              customerId: data.id,
              customerName: data.name,
              policyNumber: data.policy_number,
              policyType: data.policy_type,
              callType: "Inbound Call",
              scheduledTime: "N/A",
              completedTime: "In Progress",
              duration: "Active",
              intent: "General Policy Inquiry",
              status: "In Progress",
              notes: `Inbound call verified by ${user.name} for ${data.name} (${data.policy_number}).`
            };
            setCentralCallRecords(prev => [callRec, ...prev]);

            const alerts = [];
            if (data.outstanding_premium > 0) alerts.push(`Outstanding premium: ₹${data.outstanding_premium.toFixed(2)}`);
            const riskTier = computeRiskTier(data);
            if (riskTier === 'High') alerts.push("High-risk account — verify all documentation");
            const daysToRenewal = Math.ceil((new Date(data.renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysToRenewal <= 30 && daysToRenewal > 0) alerts.push(`Renewal due in ${daysToRenewal} days`);

            setCopilotIntel({
              intent: "General Policy Inquiry",
              sentiment: "Neutral",
              urgency: "Low",
              stage: "Opening",
              suggestedResponse: `Hello ${data.name}, thank you for calling NorthBridge Assurance. How can I assist you with your ${data.policy_type} policy (${data.policy_number}) today?`,
              suggestedQuestions: [
                "What would you like help with today?",
                "Is this regarding your coverage, premium, or a claim?",
                "Do you need to make an update to your policy details?"
              ],
              nextAction: "Identify the customer's reason for calling",
              policyRule: `${data.policy_type} policy active. Deductible and coverage terms apply as per schedule.`,
              reqDocs: [],
              alerts
            });
            return data;
          } else {
            setCrmError("No matching customer found. Try CRM ID (e.g., CRM-101, CRM-103), Name, Phone, or Policy Number.");
            return null;
          }
        } catch (e) {
          setCrmError("Could not connect to CRM API service.");
          return null;
        }
      }
    );
  };

  // ─── TRANSCRIPT SIMULATOR ───
  const handleAddStatement = async (statementText) => {
    if (!statementText.trim()) return;
    const text = statementText.toLowerCase();

    if (!crmRecord) {
      const idMatch = statementText.match(/CRM-\d{3}/i);
      if (idMatch) {
        const loaded = await handleCrmLookup(idMatch[0].toUpperCase());
        if (loaded) return;
      }

      setConversation(prev => [...prev, { sender: "customer", text: statementText }]);
      setLiveStatementInput('');
      setCopilotIntel({
        intent: text.includes("nominee") ? "Nominee / Beneficiary Change" : "General Policy Inquiry",
        sentiment: "Neutral",
        urgency: "Low",
        stage: "Opening",
        suggestedResponse: "Certainly, I'd be happy to help with your policy. May I please have your CRM ID, policy number, or full name to verify your account first?",
        suggestedQuestions: [
          "Can you provide your CRM ID or policy number?",
          "Are you the primary policyholder on the account?"
        ],
        nextAction: "Verify customer identity to access policy files",
        policyRule: "Account verification required before accessing specific policy files.",
        reqDocs: [],
        alerts: ["Customer identity unverified"]
      });
      return;
    }

    setConversation(prev => [...prev, { sender: "customer", text: statementText }]);
    setLiveStatementInput('');

    let sentiment = "Neutral";
    if (text.includes("worried") || text.includes("anxious") || text.includes("missed") || text.includes("cancel") || text.includes("stolen") || text.includes("accident")) {
      sentiment = "Anxious";
    } else if (text.includes("angry") || text.includes("frustrated") || text.includes("dispute") || text.includes("wrong")) {
      sentiment = "Frustrated";
    } else if (text.includes("thanks") || text.includes("great") || text.includes("good")) {
      sentiment = "Positive";
    }

    const isNomineeChange = text.includes("nominee") || text.includes("beneficiary");
    const isPaymentLapse = text.includes("missed") || text.includes("lapse") || text.includes("grace period") || text.includes("overdue") || (text.includes("cancel") && text.includes("payment"));
    const isBillingQuery = (text.includes("how much") || text.includes("premium") || text.includes("balance") || text.includes("cost") || text.includes("bill")) && !isPaymentLapse;
    const isClaimIntake = text.includes("claim") || text.includes("accident") || text.includes("damage") || text.includes("burst") || text.includes("fire") || text.includes("stolen");
    const isCancellation = text.includes("cancel") && !isPaymentLapse;
    const isOpening = text.includes("hello") || text.includes("hi ") || text.includes("help with my policy") || text.includes("need help");

    let intent = "General Policy Inquiry";
    let urgency = "Low";
    let stage = "Information Gathering";
    let suggestedResponse = "";
    let suggestedQuestions = [];
    let nextAction = "";
    let policyRule = "";
    let reqDocs = [];

    if (isNomineeChange) {
      intent = "Nominee / Beneficiary Change";
      urgency = "Low";
      stage = "Information Gathering";
      policyRule = "The current Policy Handbook does not specify the procedure or requirements for changing a nominee.";
      suggestedResponse = `I can certainly assist you with designating a nominee on your ${crmRecord.policy_type} policy (${crmRecord.policy_number}). Let me gather the new nominee's details for our policy service team.`;
      suggestedQuestions = [
        "Who would you like to designate as the new nominee?",
        "What is the nominee's relationship to you?",
        "Is this a replacement of an existing nominee?"
      ];
      nextAction = "Verify nominee details & check internal policy-service procedure";
    } else if (isPaymentLapse) {
      intent = "Premium Payment / Policy Status";
      urgency = "Medium";
      stage = "Information Gathering";
      policyRule = "31-day grace period applies before policy cancellation.";
      suggestedResponse = `Your policy (${crmRecord.policy_number}) does not automatically lapse immediately after a missed payment. The policy handbook specifies a 31-day grace period.`;
      suggestedQuestions = [
        "Was the missed payment intentional?",
        "Would you like help processing the payment right now?",
        "Would you like me to set up an automatic payment plan?"
      ];
      nextAction = "Assist customer with premium payment & confirm 31-day grace period";
    } else if (isClaimIntake) {
      intent = "Claim Intake";
      urgency = "High";
      stage = "Information Gathering";
      policyRule = `Standard policy deductible applies. Photos and incident report required for file.`;
      suggestedResponse = "I'm sorry to hear about the damage. Let's get your claim started right away. I'll need a few details about what happened.";
      suggestedQuestions = [
        "When did the incident occur?",
        "Are there photos of the damage available?",
        "Was a police report or incident report filed?"
      ];
      nextAction = "Initiate claim intake via 'Start Claim' button";
      reqDocs = ["Incident Report", "Photos of Damage", "Police Report (if applicable)"];
    } else if (isCancellation) {
      intent = "Policy Cancellation / Retention";
      urgency = "High";
      stage = "Resolution";
      policyRule = "Cancellation requires release form. Offer multi-policy discount or deductible adjustment for retention.";
      suggestedResponse = "I understand you are considering cancelling your policy. Before we proceed, I'd like to check if we can adjust your deductible or apply a multi-policy discount to reduce your premium.";
      suggestedQuestions = [
        "What is the main reason for considering cancellation?",
        "Would a lower premium or higher deductible make the policy more affordable?",
        "Would you like to schedule a callback with a supervisor?"
      ];
      nextAction = "Present retention discount or issue Cancellation Release Form";
      reqDocs = ["Cancellation Release Form"];
    } else if (isBillingQuery) {
      intent = "Billing & Premium Inquiry";
      urgency = "Low";
      stage = "Information Gathering";
      policyRule = `Current premium schedule: ₹${crmRecord.premium}/year. Outstanding balance: ₹${crmRecord.outstanding_premium.toFixed(2)}.`;
      suggestedResponse = `Your annual premium for policy ${crmRecord.policy_number} is ₹${crmRecord.premium}/year. Your current outstanding balance is ₹${crmRecord.outstanding_premium.toFixed(2)}.`;
      suggestedQuestions = [
        "Would you like me to email a copy of your billing summary?",
        "Would you like to update your payment method on file?",
        "Would you like to explore paperless billing discounts?"
      ];
      nextAction = "Confirm billing details with customer";
    } else if (isOpening || text.split(" ").length < 8) {
      intent = "General Policy Inquiry";
      urgency = "Low";
      stage = "Opening";
      policyRule = "Active policy on file. Standard policy handbook terms apply.";
      suggestedResponse = "Certainly. I'd be happy to help. Could you tell me what you'd like assistance with regarding your policy?";
      suggestedQuestions = [
        "Are you calling about your current policy?",
        "Is your question related to coverage, payment, renewal, or a claim?",
        "Could you tell me what issue you're experiencing?"
      ];
      nextAction = "Identify the customer's reason for calling";
    } else {
      intent = "Policy Handbook Inquiry";
      urgency = "Medium";
      stage = "Resolution";

      setConversation(prev => [...prev, { sender: "copilot", text: "Searching policy handbook...", isLoading: true }]);

      try {
        const res = await fetch(`${BACKEND_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: statementText, thread_id: threadId, customer_id: crmRecord.id })
        });
        if (res.ok) {
          const data = await res.json();
          setThreadId(data.thread_id);
          let answerText = (data.response || "").split("**Sources:**")[0].trim();

          if (copilotLang === 'Spanish') {
            answerText = `[ES] ${answerText}`;
          } else if (copilotLang === 'French') {
            answerText = `[FR] ${answerText}`;
          }

          setConversation(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].isLoading) {
                updated[i] = { sender: "copilot", text: answerText, msgIndex: i };
                break;
              }
            }
            return updated;
          });

          suggestedResponse = answerText;
          policyRule = "Handbook Rule retrieved from internal docs database.";
          suggestedQuestions = [
            "Does that clarify the policy rule for you?",
            "Would you like me to email a copy of this handbook section?",
            "Is there anything else regarding your coverage I can check?"
          ];
          nextAction = "Relay handbook answer to caller and verify satisfaction";
        }
      } catch (e) {
        // Fallback
      }
    }

    setCentralCallRecords(prev => prev.map(r =>
      (r.customerId === crmRecord.id && r.status === 'In Progress')
        ? { ...r, intent, notes: r.notes + ` | Latest: ${intent}` }
        : r
    ));

    const alerts = [];
    if (crmRecord.outstanding_premium > 0) alerts.push(`Outstanding premium: ₹${crmRecord.outstanding_premium.toFixed(2)}`);
    if (computeRiskTier(crmRecord) === 'High') alerts.push("High-risk account");
    if (isNomineeChange) alerts.push("Handbook limitation: verify internal procedure or escalate if tool unavailable");
    if (urgency === "High") alerts.push("Escalation may be required");

    setCopilotIntel({
      intent,
      sentiment,
      urgency,
      stage,
      suggestedResponse: suggestedResponse || "I can assist you with your policy details.",
      suggestedQuestions,
      nextAction: nextAction || "Assist customer with their inquiry",
      policyRule: policyRule || "Standard NorthBridge Assurance policy rules apply.",
      reqDocs,
      alerts
    });
  };

  // ─── VOICE INTERACTION HANDLERS ───
  const handleToggleCallerMic = () => {
    if (isListening && activeMicTarget === 'caller') {
      stopListening();
      setActiveMicTarget(null);
    } else {
      setActiveMicTarget('caller');
      startListening({
        language: copilotLang,
        onInterimResult: (text) => setLiveStatementInput(text),
        onFinalResult: (text) => {
          setLiveStatementInput(text);
          handleAddStatement(text);
          setActiveMicTarget(null);
        }
      });
    }
  };

  const handleToggleSearchMic = () => {
    if (isListening && activeMicTarget === 'search') {
      stopListening();
      setActiveMicTarget(null);
    } else {
      setActiveMicTarget('search');
      startListening({
        language: copilotLang,
        onInterimResult: (text) => setChatInput(text),
        onFinalResult: (text) => {
          setChatInput(text);
          setActiveMicTarget(null);
        }
      });
    }
  };

  const handleSpeakText = (text, id) => {
    speak(text, { id, language: copilotLang });
  };

  // ─── RAG KNOWLEDGE BASE QUERY ───
  const handleSendQuery = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const userQuery = chatInput;
    setChatInput('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery, thread_id: threadId, customer_id: crmRecord?.id })
      });
      if (res.ok) {
        const data = await res.json();
        setThreadId(data.thread_id);
        setChatHistory(prev => [...prev, {
          query: userQuery, response: data.response,
          status: data.status, confidence: data.confidence
        }]);
      } else {
        alert("Error connecting to backend.");
      }
    } catch (e) {
      alert("Backend not reachable. Ensure FastAPI is running on port 8001.");
    } finally {
      setChatLoading(false);
    }
  };

  // ─── CLAIMS GOVERNANCE ───
  const handleApprovalDecision = (requestId, decision) => {
    const req = approvalRequests.find(r => r.id === requestId);
    if (!req) return;
    const comment = approvalComments[requestId] || "";

    if (user.role !== 'manager') {
      setActionAlert({
        title: "Claims Governance Rule",
        message: `Claim approval/rejection requires binding clearance from Claims Manager Diana Harlow. Your recommendation notes were recorded.`
      });
      setTimeout(() => setActionAlert(null), 4000);
      return;
    }

    executeWithLoading(
      `Executing Claim ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      `Recording financial decision & updating Central Claims Archive...`,
      () => {
        const netPayout = Math.max(0, req.amount - (req.deductible || 0));

        const newDecisionRecord = {
          id: `DEC-${Math.floor(100 + Math.random() * 900)}`,
          requestId: req.id,
          customer: req.customer,
          customerId: req.customerId || "CRM-101",
          policyNum: req.policyNum,
          policyType: req.policyType,
          grossAmount: req.amount,
          deductible: req.deductible || 0,
          netPayout: decision === 'approve' ? netPayout : 0,
          requestedBy: req.requestedBy,
          decidedBy: user.name,
          decidedByRole: "Claims Manager",
          decision: decision === 'approve' ? 'Approved' : 'Rejected',
          timestamp: new Date().toLocaleString(),
          notes: comment || `${decision === 'approve' ? 'Approved' : 'Rejected'} by Claims Manager Diana Harlow.`,
          fraudProb: req.aiDetails?.fraudProb || 0,
          fraudDrivers: req.aiDetails?.fraudDrivers || []
        };

        setCentralClaimDecisions(prev => [newDecisionRecord, ...prev]);

        if (decision === 'approve') {
          setFinancials(prev => ({
            ...prev,
            ytdLoss: prev.ytdLoss + netPayout,
            autoReserves: req.policyType === 'Auto' ? Math.max(0, prev.autoReserves - netPayout) : prev.autoReserves,
            homeReserves: req.policyType === 'Home' ? Math.max(0, prev.homeReserves - netPayout) : prev.homeReserves,
          }));
          setEmployees(prev => prev.map(e => e.name === req.requestedBy ? { ...e, claims: e.claims + 1, resolved: e.resolved + 1 } : e));
        }

        setApprovalRequests(prev => prev.filter(r => r.id !== requestId));

        setActionAlert({
          title: `Claim ${req.id} ${decision.toUpperCase()}ED`,
          message: `Executed by Claims Manager Diana Harlow. Archived in Centralized Claims Audit Archive.`
        });
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  // ─── ESCALATION RESOLUTION HANDLER ───
  const handleResolveEscalation = (escId, decision) => {
    executeWithLoading(
      "Resolving Supervisor Escalation",
      `Executing decision & updating case status...`,
      () => {
        setPendingEscalations(prev => prev.map(e => e.id === escId ? { ...e, status: decision === 'approve' ? 'Approved' : 'Delegated' } : e));
        setSelectedEscalationReview(null);
        setActionAlert({
          title: `Escalation ${escId} Reviewed`,
          message: `Escalation ${decision === 'approve' ? 'approved & cleared' : 'delegated back to agent'} by Supervisor ${user.name}.`
        });
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  // ─── FRAUD CASE RESOLUTION ───
  const handleResolveFraud = (caseId) => {
    const caseObj = fraudClaims.find(c => c.id === caseId);
    if (!caseObj) return;

    executeWithLoading(
      "Resolving SIU Fraud Investigation",
      `Recording saved payout & allocating to Fraud Savings...`,
      () => {
        setFinancials(prev => ({
          ...prev,
          fraudSavings: prev.fraudSavings + caseObj.amount
        }));
        setFraudClaims(prev => prev.filter(c => c.id !== caseId));

        setActionAlert({
          title: "Fraud Case Prevented",
          message: `${caseId} (${caseObj.customer}): Saved ₹${caseObj.amount.toLocaleString()} payout. Added to Fraud Savings.`
        });
        setTimeout(() => setActionAlert(null), 3000);
      }
    );
  };

  // ─── APPLY SETTLEMENT ───
  const handleApplySettlement = () => {
    executeWithLoading(
      "Applying Calculated Settlement",
      "Updating YTD Loss Payments & Reserve Allocation...",
      () => {
        const netPayout = Math.max(0, (calcClaimAmt * (1 - calcLiabilityPct / 100)) - calcDeductible);
        setFinancials(prev => ({
          ...prev,
          ytdLoss: prev.ytdLoss + netPayout,
          autoReserves: Math.max(0, prev.autoReserves - netPayout)
        }));
        setActionAlert({
          title: "Settlement Applied",
          message: `Calculated Net Payout of ₹${netPayout.toLocaleString()} applied to YTD Loss Payments & Auto Reserves.`
        });
        setTimeout(() => setActionAlert(null), 4000);
      }
    );
  };

  // ─── CRM ACTIONS HANDLER ───
  const triggerCrmAction = (actionName) => {
    if (actionName === "Schedule Callback") {
      handleOpenCallbackModal();
      return;
    }

    executeWithLoading(
      `Executing Action: ${actionName}`,
      `Processing CRM update for ${crmRecord?.name}...`,
      () => {
        setActionAlert({
          title: actionName,
          message: `Processed for ${crmRecord?.name} (${crmRecord?.policy_number}).`
        });
        setConversation(prev => [...prev, { sender: "system", text: `CRM Note: Action executed — ${actionName}` }]);
        setTimeout(() => setActionAlert(null), 3000);
      }
    );
  };

  // ─── SUGGESTED QUERIES ───
  const getFollowUpSuggestions = () => {
    if (chatHistory.length === 0) {
      return [
        "What documents are required to file a home insurance claim?",
        "What is the standard collision deductible for auto?",
        "What is the grace period for life insurance premium payments?"
      ];
    }
    const last = (chatHistory[chatHistory.length - 1].query + " " + (chatHistory[chatHistory.length - 1].response || "")).toLowerCase();
    if (last.includes("claim")) return ["What is the deadline to report a claim?", "How can I dispute a claim denial?", "What is the subrogation process?"];
    if (last.includes("auto") || last.includes("vehicle")) return ["Does auto policy cover rental cars?", "What is Medical Payments (MedPay) coverage?", "What is the total loss threshold?"];
    return ["What is the appeals window for disputes?", "What details are required for underwriting?", "What are cyber liability coverage options?"];
  };

  const agentEmployees = employees.filter(e => e.role === 'agent' && e.status !== 'Removed');
  const teamMetrics = computeTeamMetrics(agentEmployees);

  const filteredCallRecords = centralCallRecords.filter(rec => {
    const matchesAgent = callFilterAgent === 'All' || rec.agentName === callFilterAgent;
    const matchesStatus = callFilterStatus === 'All' || rec.status === callFilterStatus;
    const searchLower = callSearchInput.toLowerCase();
    const matchesSearch = !callSearchInput.trim() ||
      rec.customerName.toLowerCase().includes(searchLower) ||
      rec.customerId.toLowerCase().includes(searchLower) ||
      rec.policyNumber.toLowerCase().includes(searchLower) ||
      rec.id.toLowerCase().includes(searchLower);
    return matchesAgent && matchesStatus && matchesSearch;
  });

  const filteredClaimDecisions = centralClaimDecisions.filter(dec => {
    const matchesDecision = claimFilterDecision === 'All' || dec.decision === claimFilterDecision;
    const searchLower = claimSearchInput.toLowerCase();
    const matchesSearch = !claimSearchInput.trim() ||
      dec.customer.toLowerCase().includes(searchLower) ||
      dec.policyNum.toLowerCase().includes(searchLower) ||
      dec.requestId.toLowerCase().includes(searchLower) ||
      dec.id.toLowerCase().includes(searchLower);
    return matchesDecision && matchesSearch;
  });

  // ════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-top-brand">
          <img src="https://img.icons8.com/color/96/artificial-intelligence.png" alt="logo" width="60" />
          <div>
            <h2>NorthBridge Assurance</h2>
            <p>IntelliDesk Enterprise Portal</p>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Company Staff and Employee Window</h2>
          </div>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>Work Email:</label>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="e.g. john.miller@northbridge.com" required />
            </div>
            <div className="auth-field">
              <label>Password:</label>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" required />
            </div>
            {authError && <div className="auth-error-box">{authError}</div>}
            <button type="submit" className="auth-submit-btn">Sign In</button>
          </form>
          <div className="auth-demo-hint">
            <strong>Demo Credentials:</strong>
            <ul>
              <li>Agent: <code>john.miller@northbridge.com</code> / <code>john@nb123</code></li>
              <li>Agent: <code>sarah.connor@northbridge.com</code> / <code>sarah@nb123</code></li>
              <li>Agent: <code>elena.rostova@northbridge.com</code> / <code>elena@nb123</code></li>
              <li>Supervisor: <code>marcus.aurelius@northbridge.com</code> / <code>super@nb123</code></li>
              <li>Claims Manager: <code>diana.harlow@northbridge.com</code> / <code>manager@nb123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // AUTHENTICATED LAYOUT
  // ════════════════════════════════════════════
  return (
    <div className="app-container">

      {/* ─── CENTER-SCREEN ACTION LOADING MODAL OVERLAY ─── */}
      {centerActionLoading.isLoading && (
        <div className="center-action-modal-overlay">
          <div className="center-action-card">
            <div className="action-spinner"></div>
            <h3>{centerActionLoading.title}</h3>
            <p>{centerActionLoading.subtitle}</p>
          </div>
        </div>
      )}

      {/* ─── SIDEBAR ─── */}
      <aside className="sidebar">
        <div className="brand">
          <img src="https://img.icons8.com/color/96/artificial-intelligence.png" alt="logo" width="40" />
          <div><h2>NorthBridge AI</h2><span>IntelliDesk Agent Assist</span></div>
        </div>
        <div className="current-user-card">
          <label>Signed In User:</label>
          <strong>{user.name}</strong>
          <span>{user.id} · {user.role.toUpperCase()}</span>
        </div>
        <nav className="nav-menu">
          {user.role === 'agent' && (
            <>
              <div className="menu-group-header">Agent Portal (Level 1)</div>
              <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>My Dashboard</button>
              <button className={`nav-btn ${activeTab === 'assist' ? 'active' : ''}`} onClick={() => setActiveTab('assist')}>Customer Assist</button>
            </>
          )}
          {user.role === 'supervisor' && (
            <>
              <div className="menu-group-header">Supervisor Board (Level 2)</div>
              <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Team Performance</button>
              <button className={`nav-btn ${activeTab === 'assist' ? 'active' : ''}`} onClick={() => setActiveTab('assist')}>Customer Assist</button>
              <button className={`nav-btn ${activeTab === 'call_records' ? 'active' : ''}`} onClick={() => setActiveTab('call_records')}>
                Central Call Records
              </button>
              <button className={`nav-btn ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
                Approvals {approvalRequests.length > 0 && <span className="alert-dot">•</span>}
              </button>
              <button className={`nav-btn ${activeTab === 'evals' ? 'active' : ''}`} onClick={() => setActiveTab('evals')}>QA Audits</button>
              {flaggedAnswers.length > 0 && (
                <button className={`nav-btn ${activeTab === 'flags' ? 'active' : ''}`} onClick={() => setActiveTab('flags')}>
                  Flagged Answers <span className="alert-dot">•</span>
                </button>
              )}
            </>
          )}
          {user.role === 'manager' && (
            <>
              <div className="menu-group-header">Claims Manager (Level 3)</div>
              <button className={`nav-btn ${activeTab === 'exec_dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('exec_dashboard')}>Executive Dashboard</button>
              <button className={`nav-btn ${activeTab === 'claims_archive' ? 'active' : ''}`} onClick={() => setActiveTab('claims_archive')}>
                Central Claims Archive
              </button>
              <button className={`nav-btn ${activeTab === 'call_records' ? 'active' : ''}`} onClick={() => setActiveTab('call_records')}>
                Central Call Records
              </button>
              <button className={`nav-btn ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
                Claim Approvals Queue {approvalRequests.length > 0 && <span className="alert-dot">•</span>}
              </button>
              <button className={`nav-btn ${activeTab === 'fraud' ? 'active' : ''}`} onClick={() => setActiveTab('fraud')}>Fraud Review</button>
              <button className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>Settlement Calculator</button>
            </>
          )}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button className="nav-btn logout-btn" onClick={handleLogout}>Log Out System</button>
          </div>
        </nav>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content">
        <header className="header-banner">
          <div className="header-meta">
            <span className="badge-role">{user.role === 'agent' ? 'Level 1 Agent Console' : user.role === 'supervisor' ? 'Level 2 Supervisor Board' : 'Level 3 Claims Executive Console'}</span>
            <span className="company-logo">NorthBridge Assurance Platform</span>
          </div>
          <h1>IntelliDesk Agent Assist Platform</h1>
          <p>Enterprise AI copilot with dynamic multi-level governance</p>
        </header>

        {actionAlert && (
          <div className="action-success-notification">
            <h4>{actionAlert.title}</h4>
            <p>{actionAlert.message}</p>
          </div>
        )}

        {/* ═══════════ CENTRALIZED CLAIMS AUDIT ARCHIVE (CLAIMS MANAGER EXCLUSIVE RBAC) ═══════════ */}
        {activeTab === 'claims_archive' && user.role === 'manager' && (
          <div className="content-card">
            <h3>Centralized Claims Audit Archive</h3>
            <p className="tab-caption">
              Centralized record of all approved and rejected claims across NorthBridge Assurance. Accessible exclusively by Claims Manager Diana Harlow.
            </p>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="health-card">
                <h4>Total Claims Decisions</h4>
                <div className="health-status-value success">{centralClaimDecisions.length}</div>
                <p>Enterprise claims processed</p>
              </div>
              <div className="health-card">
                <h4>Approved Payout Volume</h4>
                <div className="health-status-value success">
                  ₹{(centralClaimDecisions.filter(d => d.decision === 'Approved').reduce((s, d) => s + d.netPayout, 0) / 1000).toFixed(1)}K
                </div>
                <p>Total net financial payout</p>
              </div>
              <div className="health-card">
                <h4>Rejected Claims</h4>
                <div className="health-status-value" style={{ color: 'var(--danger-color)' }}>
                  {centralClaimDecisions.filter(d => d.decision === 'Rejected').length}
                </div>
                <p>Prevented payouts / exclusions</p>
              </div>
            </div>

            <div className="call-records-filter-bar">
              <div className="filter-item-group">
                <label>Filter Decision:</label>
                <select value={claimFilterDecision} onChange={(e) => setClaimFilterDecision(e.target.value)}>
                  <option value="All">All Decisions</option>
                  <option value="Approved">Approved Claims</option>
                  <option value="Rejected">Rejected Claims</option>
                </select>
              </div>

              <div className="filter-item-group" style={{ flex: 1 }}>
                <label>Search Archive:</label>
                <input
                  type="text"
                  placeholder="Search customer name, policy number, request ID, decision ID..."
                  value={claimSearchInput}
                  onChange={(e) => setClaimSearchInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Decision ID</th>
                  <th>Request ID</th>
                  <th>Customer</th>
                  <th>Policy Details</th>
                  <th>Gross Claim</th>
                  <th>Deductible</th>
                  <th>Net Payout</th>
                  <th>Decision</th>
                  <th>Requested By</th>
                  <th>Decided Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaimDecisions.map((dec, idx) => (
                  <tr key={idx}>
                    <td><code>{dec.id}</code></td>
                    <td><code>{dec.requestId}</code></td>
                    <td><strong>{dec.customer}</strong></td>
                    <td><code>{dec.policyNum}</code> ({dec.policyType})</td>
                    <td><strong>₹{dec.grossAmount.toLocaleString()}</strong></td>
                    <td>₹{dec.deductible.toLocaleString()}</td>
                    <td><strong style={{ color: dec.decision === 'Approved' ? 'var(--success-color)' : 'var(--text-secondary)' }}>₹{dec.netPayout.toLocaleString()}</strong></td>
                    <td>
                      <span className={`decision-badge ${dec.decision.toLowerCase()}`}>
                        {dec.decision === 'Approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td>{dec.requestedBy}</td>
                    <td>{dec.timestamp}</td>
                    <td>
                      <button className="act-btn" onClick={() => setSelectedClaimDecisionDetail(dec)}>
                        Inspect Claim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedClaimDecisionDetail && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h3>Claim Decision Audit Log: {selectedClaimDecisionDetail.id}</h3>
                    <button className="modal-close-btn" onClick={() => setSelectedClaimDecisionDetail(null)}>✖</button>
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    <p><strong>Request ID:</strong> <code>{selectedClaimDecisionDetail.requestId}</code></p>
                    <p><strong>Customer Name:</strong> {selectedClaimDecisionDetail.customer}</p>
                    <p><strong>Policy Number:</strong> <code>{selectedClaimDecisionDetail.policyNum}</code> ({selectedClaimDecisionDetail.policyType})</p>
                    <p><strong>Gross Amount:</strong> ₹{selectedClaimDecisionDetail.grossAmount.toLocaleString()} · <strong>Deductible:</strong> ₹{selectedClaimDecisionDetail.deductible.toLocaleString()}</p>
                    <p><strong>Net Financial Payout:</strong> <strong style={{ color: selectedClaimDecisionDetail.decision === 'Approved' ? 'var(--success-color)' : 'var(--danger-color)' }}>₹{selectedClaimDecisionDetail.netPayout.toLocaleString()}</strong></p>
                    <p><strong>Originating Agent:</strong> {selectedClaimDecisionDetail.requestedBy}</p>
                    <p><strong>Claims Manager Authorization:</strong> {selectedClaimDecisionDetail.decidedBy} ({selectedClaimDecisionDetail.decidedByRole})</p>
                    <p><strong>Decision Status:</strong> <span className={`decision-badge ${selectedClaimDecisionDetail.decision.toLowerCase()}`}>{selectedClaimDecisionDetail.decision}</span></p>
                    <p><strong>Decision Timestamp:</strong> {selectedClaimDecisionDetail.timestamp}</p>
                    
                    <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#f9fafb', borderLeft: '4px solid #16a34a', borderRadius: '6px' }}>
                      <strong>Claims Manager Audit Notes & Reasoning:</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem' }}>{selectedClaimDecisionDetail.notes}</p>
                    </div>

                    {selectedClaimDecisionDetail.fraudDrivers && selectedClaimDecisionDetail.fraudDrivers.length > 0 && (
                      <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(245,158,11,0.08)', borderLeft: '4px solid var(--warning-color)', borderRadius: '6px' }}>
                        <strong>AI Fraud Risk Score: {selectedClaimDecisionDetail.fraudProb}%</strong>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '0.95rem' }}>
                          {selectedClaimDecisionDetail.fraudDrivers.map((fd, i) => <li key={i}>{fd}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button className="act-btn btn-blue" onClick={() => setSelectedClaimDecisionDetail(null)}>Close Inspection</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ CENTRALIZED CALL RECORDS DATABASE (SUPERVISOR & MANAGER RBAC) ═══════════ */}
        {activeTab === 'call_records' && (user.role === 'supervisor' || user.role === 'manager') && (
          <div className="content-card">
            <h3>Centralized Call Record Database</h3>
            <p className="tab-caption">
              Enterprise record of all inbound calls, scheduled callbacks, and agent handle times. Restricted to Supervisor & Claims Manager clearance.
            </p>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="health-card">
                <h4>Total Call Records</h4>
                <div className="health-status-value success">{centralCallRecords.length}</div>
                <p>Enterprise total</p>
              </div>
              <div className="health-card">
                <h4>Scheduled Callbacks</h4>
                <div className="health-status-value" style={{ color: centralCallRecords.filter(r => r.status === 'Scheduled').length > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
                  {centralCallRecords.filter(r => r.status === 'Scheduled').length}
                </div>
                <p>Pending callback queue</p>
              </div>
              <div className="health-card">
                <h4>Completed Calls</h4>
                <div className="health-status-value success">
                  {centralCallRecords.filter(r => r.status === 'Completed').length}
                </div>
                <p>Resolved by agents</p>
              </div>
            </div>

            <div className="call-records-filter-bar">
              <div className="filter-item-group">
                <label>Filter Agent:</label>
                <select value={callFilterAgent} onChange={(e) => setCallFilterAgent(e.target.value)}>
                  <option value="All">All Agents</option>
                  <option value="John Miller">John Miller</option>
                  <option value="Sarah Connor">Sarah Connor</option>
                  <option value="Elena Rostova">Elena Rostova</option>
                </select>
              </div>

              <div className="filter-item-group">
                <label>Status:</label>
                <select value={callFilterStatus} onChange={(e) => setCallFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>

              <div className="filter-item-group" style={{ flex: 1 }}>
                <label>Search Logs:</label>
                <input
                  type="text"
                  placeholder="Search customer name, CRM ID, policy number..."
                  value={callSearchInput}
                  onChange={(e) => setCallSearchInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Handling Agent</th>
                  <th>Customer</th>
                  <th>Policy Details</th>
                  <th>Call Type</th>
                  <th>Scheduled Time</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCallRecords.map((rec, idx) => (
                  <tr key={idx}>
                    <td><code>{rec.id}</code></td>
                    <td><strong>{rec.agentName}</strong> (<code>{rec.agentId}</code>)</td>
                    <td>{rec.customerName} (<code>{rec.customerId}</code>)</td>
                    <td><code>{rec.policyNumber}</code> ({rec.policyType})</td>
                    <td>{rec.callType}</td>
                    <td>{rec.scheduledTime}</td>
                    <td>
                      <span className={`call-status-badge ${rec.status.toLowerCase().replace(/\s/g, '-')}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{rec.duration}</td>
                    <td>
                      <button className="act-btn" onClick={() => setSelectedCallDetail(rec)}>
                        Inspect Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedCallDetail && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h3>Call Inspection Log: {selectedCallDetail.id}</h3>
                    <button className="modal-close-btn" onClick={() => setSelectedCallDetail(null)}>✖</button>
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    <p><strong>Handling Agent:</strong> {selectedCallDetail.agentName} (<code>{selectedCallDetail.agentId}</code>)</p>
                    <p><strong>Customer Name:</strong> {selectedCallDetail.customerName} (<code>{selectedCallDetail.customerId}</code>)</p>
                    <p><strong>Policy Number:</strong> <code>{selectedCallDetail.policyNumber}</code> ({selectedCallDetail.policyType})</p>
                    <p><strong>Call Type:</strong> {selectedCallDetail.callType} · <strong>Status:</strong> {selectedCallDetail.status}</p>
                    <p><strong>Scheduled Timestamp:</strong> {selectedCallDetail.scheduledTime}</p>
                    <p><strong>Completed Timestamp:</strong> {selectedCallDetail.completedTime}</p>
                    <p><strong>Intent Category:</strong> {selectedCallDetail.intent}</p>
                    
                    <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#f9fafb', borderLeft: '4px solid #2563eb', borderRadius: '6px' }}>
                      <strong>Transcript & Notes:</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem' }}>{selectedCallDetail.notes}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button className="act-btn btn-blue" onClick={() => setSelectedCallDetail(null)}>Close Inspection</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ LEVEL 1: AGENT DASHBOARD ═══════════ */}
        {activeTab === 'dashboard' && user.role === 'agent' && (
          <div className="dashboard-view content-card">
            <h3>{user.name} — Today's Performance</h3>
            <p className="tab-caption">Your live operational metrics. Recomputes as calls are completed.</p>
            <div className="grid-3">
              <div className="health-card">
                <h4>Resolution Rate</h4>
                <div className="health-status-value success">{user.resolved} / {user.calls}</div>
                <p>{((user.resolved / Math.max(user.calls, 1)) * 100).toFixed(0)}% resolved</p>
              </div>
              <div className="health-card">
                <h4>Avg Handle Time</h4>
                <div className="health-status-value" style={{ color: user.duration <= DURATION_SLA ? 'var(--success-color)' : 'var(--warning-color)' }}>
                  {user.duration} min
                </div>
                <p style={{ color: user.duration <= DURATION_SLA ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {user.duration <= DURATION_SLA ? 'Within SLA Target' : 'Exceeds SLA Target'}
                </p>
              </div>
              <div className="health-card">
                <h4>My CSAT Rating</h4>
                <div className="health-status-value" style={{ color: user.csat >= CSAT_GOAL ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {user.csat} / 5.0
                </div>
                <p><TrendArrow current={user.score} previous={user.prevScore} /></p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LEVEL 2: OPERATIONAL SUPERVISOR DASHBOARD ═══════════ */}
        {activeTab === 'dashboard' && user.role === 'supervisor' && (
          <div className="team-dashboard-view">
            <div className="content-card">
              <h3>Team Operational Overview</h3>
              <p className="tab-caption">Actionable workload metrics for insurance customer support & agentic AI escalation management.</p>

              {/* TOP 3 OPERATIONAL KPI CARDS */}
              <div className="grid-3">
                <div className="health-card">
                  <h4>ACTIVE SUPPORT AGENTS</h4>
                  <div className="health-status-value success">{teamMetrics.activeCount}</div>
                  <p>Currently active</p>
                </div>
                <div className="health-card">
                  <h4>OPEN CUSTOMER CASES</h4>
                  <div className="health-status-value" style={{ color: 'var(--accent-color)' }}>
                    {agentEmployees.reduce((sum, a) => sum + (a.openCases || 0), 0)}
                  </div>
                  <p>5 normal | 3 high priority</p>
                </div>
                <div
                  className="health-card clickable-kpi-card"
                  onClick={() => {
                    const el = document.getElementById('pending-escalations-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ cursor: 'pointer', border: '1px solid #f59e0b' }}
                >
                  <h4>PENDING ESCALATIONS</h4>
                  <div className="health-status-value" style={{ color: 'var(--warning-color)' }}>
                    {pendingEscalations.filter(e => e.status === 'Awaiting Review').length}
                  </div>
                  <p>2 awaiting | supervisor action</p>
                </div>
              </div>
            </div>

            {/* ACTIONABLE AGENT PERFORMANCE TABLE */}
            <div className="content-card" style={{ marginTop: '24px' }}>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem' }}>Agent Performance Table</h4>
                  <p className="tab-caption" style={{ margin: '4px 0 0 0' }}>Live agent metrics, open case distribution, and escalation tracking.</p>
                </div>
                {user.role === 'supervisor' && (
                  <button className="act-btn btn-green" onClick={() => setShowAddAgentModal(true)}>
                    Add New Level 1 Agent
                  </button>
                )}
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Resolved / Total</th>
                    <th>Open Cases</th>
                    <th>Escalations</th>
                    <th>Trend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agentEmployees.map(agent => (
                    <tr key={agent.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`status-dot ${agent.status.toLowerCase().replace(/\s/g, '-')}`}></span>
                          <strong>{agent.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${agent.status.replace(/\s/g, '').toLowerCase()}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td>
                        <strong>{agent.resolved}/{agent.calls}</strong> ({((agent.resolved / Math.max(agent.calls, 1)) * 100).toFixed(0)}%)
                      </td>
                      <td><strong>{agent.openCases || 0}</strong></td>
                      <td>
                        <strong style={{ color: (agent.escalations || 0) > 0 ? 'var(--warning-color)' : 'var(--text-secondary)' }}>
                          {agent.escalations || 0}
                        </strong>
                      </td>
                      <td><TrendArrow trendVal={agent.trendVal} current={agent.score} previous={agent.prevScore} /></td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button className="act-btn" onClick={() => setSelectedAgent(agent)}>
                          Drill Down
                        </button>
                        {user.role === 'supervisor' && (
                          <button className="act-btn btn-remove" onClick={() => setSelectedAgentToRemove(agent)}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CLICKABLE PENDING ESCALATIONS SECTION */}
            <div id="pending-escalations-section" className="content-card" style={{ marginTop: '24px' }}>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Pending Escalations Queue</h3>
                <span className="badge-live">
                  {pendingEscalations.filter(e => e.status === 'Awaiting Review').length} Action Items
                </span>
              </div>
              <p className="tab-caption" style={{ marginBottom: '18px' }}>
                Cases requiring Level 2 Supervisor or higher-level intervention.
              </p>

              <div className="escalations-list-container">
                {pendingEscalations.map((esc) => (
                  <div key={esc.id} className="escalation-row-card">
                    <div className="escalation-title-group">
                      <strong>{esc.title}</strong>
                      <span className="escalation-customer">{esc.customer} · {esc.type}</span>
                    </div>
                    <div className="escalation-agent-group">
                      <span className="agent-label">Handling Agent:</span> <strong>{esc.agent}</strong>
                    </div>
                    <div className="escalation-action-group">
                      <button className="act-btn btn-blue" onClick={() => setSelectedEscalationReview(esc)}>
                        Review Case
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AGENT DIRECTORY & AUDIT LOG (WORKING & REMOVED AGENTS WITH DATES) */}
            <div className="content-card" style={{ marginTop: '24px' }}>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Centralized Agent Directory & Audit Log</h3>
                  <p className="tab-caption" style={{ margin: '4px 0 0 0' }}>
                    Complete enterprise audit history of all active working and removed Level 1 agents with onboarding/offboarding dates. Restricted to Supervisors.
                  </p>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent ID</th>
                    <th>Agent Name & Email</th>
                    <th>Status</th>
                    <th>Date Added (Onboarding)</th>
                    <th>Date Removed (Offboarding)</th>
                    <th>Action Executed By</th>
                    <th>Notes / Offboarding Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {agentDirectoryLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td><code>{log.id}</code></td>
                      <td>
                        <strong>{log.name}</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.email}</span>
                      </td>
                      <td>
                        <span className={`agent-log-badge ${log.status === 'Active Working' ? 'active' : 'removed'}`}>
                          {log.status === 'Active Working' ? 'Active Working' : 'Removed'}
                        </span>
                      </td>
                      <td>{log.dateAdded}</td>
                      <td>
                        <strong style={{ color: log.status === 'Removed' ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                          {log.dateRemoved}
                        </strong>
                      </td>
                      <td>{log.actionBy}</td>
                      <td style={{ fontSize: '0.95rem' }}>{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AGENT DRILL-DOWN MODAL/CARD */}
            {selectedAgent && (
              <div className="content-card" style={{ marginTop: '24px', borderLeft: '4px solid var(--accent-color)' }}>
                <div className="flex-row justify-between">
                  <h4>Employee Operational File: {selectedAgent.name} (Drill-Down)</h4>
                  <button className="act-btn" onClick={() => setSelectedAgent(null)}>Close Card</button>
                </div>
                <div className="grid-3" style={{ marginTop: '18px' }}>
                  <div className="health-card">
                    <strong>Open Workload Cases</strong>
                    <div className="health-status-value">{selectedAgent.openCases || 0}</div>
                  </div>
                  <div className="health-card">
                    <strong>Active Escalations</strong>
                    <div className="health-status-value" style={{ color: 'var(--warning-color)' }}>{selectedAgent.escalations || 0}</div>
                  </div>
                  <div className="health-card">
                    <strong>AI Assistance Usage</strong>
                    <div className="health-status-value success">{selectedAgent.aiUsage}%</div>
                  </div>
                  <div className="health-card">
                    <strong>Compliance Score</strong>
                    <div className="health-status-value success">{selectedAgent.compliance}%</div>
                  </div>
                  <div className="health-card">
                    <strong>Flagged Answers</strong>
                    <div className="health-status-value" style={{ color: selectedAgent.flaggedAnswers > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
                      {selectedAgent.flaggedAnswers}
                    </div>
                  </div>
                  <div className="health-card">
                    <strong>Avg Resolution Time</strong>
                    <div className="health-status-value">{selectedAgent.avgRes} min</div>
                  </div>
                </div>
              </div>
            )}

            {/* ESCALATION REVIEW MODAL */}
            {selectedEscalationReview && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h3>Review Pending Escalation: {selectedEscalationReview.title}</h3>
                    <button className="modal-close-btn" onClick={() => setSelectedEscalationReview(null)}>✖</button>
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    <p><strong>Escalation ID:</strong> <code>{selectedEscalationReview.id}</code></p>
                    <p><strong>Customer:</strong> {selectedEscalationReview.customer}</p>
                    <p><strong>Handling Agent:</strong> {selectedEscalationReview.agent} (<code>{selectedEscalationReview.agentId}</code>)</p>
                    <p><strong>Category Type:</strong> {selectedEscalationReview.type} · <strong>Urgency:</strong> <span style={{ color: selectedEscalationReview.urgency === 'High' ? 'var(--danger-color)' : 'var(--warning-color)', fontWeight: 600 }}>{selectedEscalationReview.urgency}</span></p>

                    <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#f9fafb', borderLeft: '4px solid #f59e0b', borderRadius: '6px' }}>
                      <strong>Escalation Details & Context:</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem' }}>{selectedEscalationReview.details}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button className="act-btn btn-green" onClick={() => handleResolveEscalation(selectedEscalationReview.id, 'approve')}>
                      Approve & Authorize Exception
                    </button>
                    <button className="act-btn" onClick={() => handleResolveEscalation(selectedEscalationReview.id, 'delegate')}>
                      Delegate Back to Agent
                    </button>
                    <button className="act-btn" onClick={() => setSelectedEscalationReview(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ADD LEVEL 1 AGENT MODAL */}
            {showAddAgentModal && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h3>Onboard New Level 1 Agent</h3>
                    <button className="modal-close-btn" onClick={() => setShowAddAgentModal(false)}>✖</button>
                  </div>
                  <form onSubmit={handleAddAgentSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Full Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Rivera"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Work Email:</label>
                      <input
                        type="email"
                        placeholder="e.g. alex.rivera@northbridge.com"
                        value={newAgentEmail}
                        onChange={(e) => setNewAgentEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Password:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newAgentPassword}
                        onChange={(e) => setNewAgentPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Initial Shift Status:</label>
                      <select
                        value={newAgentStatus}
                        onChange={(e) => setNewAgentStatus(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }}
                      >
                        <option value="On Call">On Call</option>
                        <option value="Idle">Idle</option>
                        <option value="On Break">On Break</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button type="button" className="act-btn" onClick={() => setShowAddAgentModal(false)}>Cancel</button>
                      <button type="submit" className="act-btn btn-green">Confirm Onboarding</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* REMOVE AGENT CONFIRMATION MODAL */}
            {selectedAgentToRemove && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h3>Offboard / Remove Agent: {selectedAgentToRemove.name}</h3>
                    <button className="modal-close-btn" onClick={() => setSelectedAgentToRemove(null)}>✖</button>
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    <p style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                      Are you sure you want to deactivate and remove Level 1 Agent {selectedAgentToRemove.name} (<code>{selectedAgentToRemove.id}</code>)?
                    </p>
                    <p><strong>Work Email:</strong> {selectedAgentToRemove.email}</p>
                    <p><strong>Action Executor:</strong> {user.name} (Supervisor)</p>

                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Offboarding Reason / Audit Notes:</label>
                      <textarea
                        rows="3"
                        placeholder="Enter reason for agent removal..."
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button className="act-btn" onClick={() => setSelectedAgentToRemove(null)}>Cancel</button>
                    <button className="act-btn btn-remove" onClick={handleConfirmRemoveAgent}>
                      Confirm Removal & Log
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════ SUPERVISOR: FLAGGED ANSWERS ═══════════ */}
        {activeTab === 'flags' && user.role === 'supervisor' && (
          <div className="content-card">
            <h3>Flagged Copilot Answers</h3>
            <p className="tab-caption">Answers flagged by agents as potentially incorrect. Review and route to RAG improvement queue.</p>
            {flaggedAnswers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No flagged answers currently pending review.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Flag ID</th><th>Agent</th><th>Customer</th><th>Query</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {flaggedAnswers.map((f, idx) => (
                    <tr key={idx}>
                      <td><code>{f.id}</code></td>
                      <td>{f.agent}</td>
                      <td>{f.customer}</td>
                      <td style={{ maxWidth: '300px', fontSize: '0.9rem' }}>{f.query}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(f.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ═══════════ SUPERVISOR: QA AUDITS ═══════════ */}
        {activeTab === 'evals' && user.role === 'supervisor' && (
          <div className="qa-audits-view content-card">
            <h3>Call Quality Audit: {selectedAudit.id}</h3>
            <p className="tab-caption">Each improvement suggestion links directly to the criterion scoring lowest.</p>
            <div className="grid-2">
              <div className="panel-col">
                <p><strong>Agent</strong>: {selectedAudit.agent} · <strong>Duration</strong>: {selectedAudit.duration}</p>
                <h4 style={{ marginTop: '20px' }}>Scored Criteria</h4>
                {selectedAudit.metrics.map((m, idx) => (
                  <div key={idx} className="sla-metric-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{m.name}</span>
                      <strong style={{ color: m.score >= 95 ? 'var(--success-color)' : m.score >= 85 ? 'var(--warning-color)' : 'var(--danger-color)' }}>{m.score}%</strong>
                    </div>
                    {m.suggestion && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--warning-color)', backgroundColor: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: '4px', width: '100%', marginTop: '6px' }}>
                        💡 <strong>Improvement Suggestion (Linked to {m.name})</strong>: {m.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="panel-col">
                <div className="risk-analytics-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
                  <h4>Agent Strengths</h4>
                  <ul>{selectedAudit.strengths.map((s, i) => <li key={i} style={{ fontSize: '0.95rem' }}>{s}</li>)}</ul>
                </div>
                <div className="health-card" style={{ marginTop: '20px' }}>
                  <h4>Overall QA Rating</h4>
                  <div className="health-status-value success">{selectedAudit.overall}%</div>
                  <p>Pulled from central employee audit record</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LEVEL 3: EXECUTIVE DASHBOARD ═══════════ */}
        {activeTab === 'exec_dashboard' && user.role === 'manager' && (
          <div className="exec-dashboard-view">
            <div className="content-card">
              <h3>Executive Dashboard</h3>
              <p className="tab-caption">Financial health snapshot of claims operations. Recomputes live as claims are approved or fraud is caught.</p>
              <div className="grid-3">
                <div className="health-card">
                  <h4>YTD Loss Payments</h4>
                  <div className="health-status-value success">₹{(financials.ytdLoss / 100000).toFixed(2)} Lakh</div>
                  <p>Budget: ₹{(financials.budget / 100000).toFixed(1)} Lakh</p>
                </div>
                <div className="health-card">
                  <h4>Pending Reviews</h4>
                  <div className="health-status-value" style={{ color: approvalRequests.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                    {approvalRequests.length}
                  </div>
                  <p>Claims requiring manager approval</p>
                </div>
                <div className="health-card">
                  <h4>Fraud Savings</h4>
                  <div className="health-status-value success">₹{(financials.fraudSavings / 1000).toFixed(0)}K</div>
                  <p>Direct payouts avoided</p>
                </div>
              </div>
            </div>
            <div className="content-card" style={{ marginTop: '24px' }}>
              <h4>Reserve Allocation</h4>
              <p className="tab-caption">Capital committed across lines of business. Decrements as claims are paid out.</p>
              <div className="sla-metric-row" style={{ marginTop: '18px' }}>
                <span>Auto Reserves</span>
                <div className="sla-progress-bar"><div className="fill" style={{ width: `${Math.min(100, (financials.autoReserves / 1000000) * 100)}%` }}></div></div>
                <strong>₹{(financials.autoReserves / 1000).toFixed(0)}K</strong>
              </div>
              <div className="sla-metric-row">
                <span>Home Reserves</span>
                <div className="sla-progress-bar"><div className="fill" style={{ width: `${Math.min(100, (financials.homeReserves / 1000000) * 100)}%` }}></div></div>
                <strong>₹{(financials.homeReserves / 1000).toFixed(0)}K</strong>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LEVEL 3: FRAUD REVIEW ═══════════ */}
        {activeTab === 'fraud' && user.role === 'manager' && (
          <div className="content-card">
            <h3>Fraud Review Worklist</h3>
            <p className="tab-caption">AI-flagged suspicious claims. Resolving a case as invalid adds the saved amount directly to Fraud Savings.</p>
            {fraudClaims.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No active fraud cases under review. All clear!</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Case ID</th><th>Customer</th><th>Type</th><th>Amount</th><th>Indicators</th><th>Actions</th></tr></thead>
                <tbody>
                  {fraudClaims.map((c, i) => (
                    <tr key={i}>
                      <td><code>{c.id}</code></td>
                      <td><strong>{c.customer}</strong></td>
                      <td>{c.type}</td>
                      <td><strong>₹{c.amount.toLocaleString()}</strong></td>
                      <td>{c.indicators.map((ind, j) => <div key={j} style={{ fontSize: '0.85rem', color: 'var(--danger-color)' }}>• {ind}</div>)}</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button className="act-btn" onClick={() => triggerCrmAction(`SIU Investigation: ${c.id}`)}>Investigate</button>
                        <button className="act-btn btn-green" onClick={() => handleResolveFraud(c.id)}>Mark Invalid (Save Payout)</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ═══════════ LEVEL 3: SETTLEMENT CALCULATOR ═══════════ */}
        {activeTab === 'calculator' && user.role === 'manager' && (
          <div className="content-card">
            <h3>Settlement Calculator</h3>
            <p className="tab-caption">Decision tool to compute net payout: (Gross Damages − Deductible) × (1 − Liability %).</p>
            <div className="grid-2">
              <div className="panel-col">
                <div className="copilot-section">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Gross Damages (₹):</label>
                  <input type="number" value={calcClaimAmt} onChange={(e) => setCalcClaimAmt(Number(e.target.value))} style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }} />
                </div>
                <div className="copilot-section" style={{ marginTop: '18px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Deductible (₹):</label>
                  <input type="number" value={calcDeductible} onChange={(e) => setCalcDeductible(Number(e.target.value))} style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }} />
                </div>
                <div className="copilot-section" style={{ marginTop: '18px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Comparative Liability (%):</label>
                  <input type="number" value={calcLiabilityPct} onChange={(e) => setCalcLiabilityPct(Number(e.target.value))} style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '1rem' }} />
                </div>
              </div>
              <div className="panel-col">
                <div className="health-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
                  <h4>Computed Net Payout</h4>
                  <div className="health-status-value success">
                    ₹{Math.max(0, (calcClaimAmt * (1 - calcLiabilityPct / 100)) - calcDeductible).toLocaleString()}
                  </div>
                  <p>Formula: (₹{calcClaimAmt.toLocaleString()} − ₹{calcDeductible.toLocaleString()}) × {(100 - calcLiabilityPct)}%</p>
                  <button className="act-btn btn-blue" style={{ marginTop: '18px' }} onClick={handleApplySettlement}>
                    Apply Settlement to Financials
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ APPROVALS QUEUE ═══════════ */}
        {activeTab === 'approvals' && (user.role === 'supervisor' || user.role === 'manager') && (
          <div className="content-card">
            <h3>Claim Approvals Queue</h3>
            <p className="tab-caption">
              {user.role === 'manager'
                ? 'Review and issue binding Approval or Rejection for all claims across NorthBridge Assurance.'
                : 'Supervisor Review Queue. Add recommendation notes for final Claims Manager authorization.'}
            </p>

            {user.role === 'supervisor' && (
              <div className="governance-notice-banner">
                Claims Governance Rule: All claim decisions (small or big amount) require final binding clearance by Claims Manager Diana Harlow. Supervisors may review documents and enter recommendation notes below.
              </div>
            )}

            {approvalRequests.map((req, idx) => {
              const netImpactVal = Math.max(0, req.amount - (req.deductible || 0));
              return (
                <div key={idx} className="hitl-approval-card" style={{ marginBottom: '28px', border: '1px solid var(--border-color)' }}>
                  <div className="hitl-meta flex-row justify-between">
                    <div>
                      <p><strong>Claim Request</strong>: <code>{req.id}</code> · <strong>{req.customer}</strong></p>
                      <p>{req.policyType} ({req.policyNum}) · Gross Amount: <code className="action-type-code">₹{req.amount.toLocaleString()}</code></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p><strong>Required Clearance</strong>: Claims Manager Diana Harlow</p>
                      <p><strong>Requested By</strong>: {req.requestedBy}</p>
                    </div>
                  </div>
                  <div className="risk-analytics-card" style={{ margin: '18px 0' }}>
                    <h4>AI Risk & Financial Analysis</h4>
                    <div className="grid-3" style={{ fontSize: '0.9rem', marginTop: '12px' }}>
                      <div>
                        <strong>Fraud Risk</strong>:{" "}
                        <span className="fraud-risk-hover-container">
                          <span className="fraud-risk-badge">{req.aiDetails.fraudProb}%</span>
                          <span className="fraud-risk-tooltip">
                            <strong>Top Risk Drivers:</strong>
                            <ul>
                              {req.aiDetails.fraudDrivers.map((fd, fidx) => <li key={fidx}>{fd}</li>)}
                            </ul>
                          </span>
                        </span>
                      </div>
                      <div><strong>Policy Status</strong>: {req.aiDetails.policyStatus}</div>
                      <div><strong>Net Impact</strong>: ₹{netImpactVal.toLocaleString()} (after ₹{req.deductible || 0} deductible)</div>
                      <div><strong>Payment History</strong>: {req.aiDetails.paymentHistory}</div>
                      <div><strong>Prior Claims</strong>: {req.aiDetails.claimsCount}</div>
                      <div><strong>Docs Status</strong>: {req.aiDetails.docsStatus}</div>
                    </div>
                  </div>
                  <div className="hitl-editor-area">
                    <label>Manager / Supervisor Decision Notes <span style={{ color: 'var(--danger-color)' }}>(required for central audit archive)</span>:</label>
                    <textarea
                      placeholder="Audit reasoning for approval or rejection..."
                      value={approvalComments[req.id] || ''}
                      onChange={(e) => setApprovalComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                      rows="3"
                    />
                  </div>
                  <div className="hitl-actions-group" style={{ marginTop: '18px' }}>
                    {user.role === 'manager' ? (
                      <>
                        <button
                          onClick={() => handleApprovalDecision(req.id, 'approve')}
                          className="approve-btn"
                          disabled={!(approvalComments[req.id] || '').trim()}
                          title={!(approvalComments[req.id] || '').trim() ? 'Decision notes required for approval' : ''}
                        >
                          {!(approvalComments[req.id] || '').trim() ? 'Approve Claim (enter notes)' : 'Approve Claim'}
                        </button>
                        <button onClick={() => handleApprovalDecision(req.id, 'reject')} className="reject-btn">
                          Reject Claim
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleApprovalDecision(req.id, 'recommend')}
                        className="act-btn btn-blue"
                        style={{ width: '100%', padding: '12px' }}
                      >
                        Record Recommendation Note & Pass to Claims Manager
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {approvalRequests.length === 0 && (
              <div className="hitl-empty-state"><p>No pending claims requiring approval clearance.</p></div>
            )}
          </div>
        )}

        {/* ═══════════ LEVEL 1: CUSTOMER ASSIST CONSOLE ═══════════ */}
        {activeTab === 'assist' && (user.role === 'agent' || user.role === 'supervisor') && (
          <div className="assist-layout">
            
            {/* ─── TOP: VERIFIED CUSTOMER CONTEXT HEADER BAR ─── */}
            {crmRecord ? (
              <div className="verified-customer-context-bar content-card">
                <div>
                  <span className="verified-badge">Verified Customer Context</span>
                  <h3 style={{ margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {crmRecord.name} <code style={{ fontSize: '0.95rem' }}>({crmRecord.id})</code>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Policy: <strong>{crmRecord.policy_number}</strong> · {crmRecord.policy_type} ({crmRecord.status}) · Premium: ₹{crmRecord.premium}/yr · Outstanding: ₹{crmRecord.outstanding_premium.toFixed(2)}
                  </p>
                </div>
                <button className="change-customer-btn" onClick={handleChangeCustomer}>
                  Change Customer
                </button>
              </div>
            ) : (
              <div className="verification-bar content-card single-col">
                <div className="search-group">
                  <h3>Verify Customer Identity</h3>
                  <p className="tab-caption">Search customer database to establish verified session context (e.g. CRM-101, CRM-103).</p>
                  <div className="flex-row gap-10">
                    <input
                      type="text"
                      value={crmInput}
                      onChange={(e) => setCrmInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCrmLookup()}
                      placeholder="Enter CRM ID (e.g., CRM-103), Name, Phone, or Policy Number"
                    />
                    <button onClick={() => handleCrmLookup()} className="submit-btn">Verify Customer</button>
                  </div>
                  {crmError && <div className="error-box">{crmError}</div>}
                </div>
              </div>
            )}

            <div className="grid-2 gap-30" style={{ marginTop: '24px' }}>
              {/* ─── LEFT COLUMN: CUSTOMER 360 PROFILE & CALL TRANSCRIPT ─── */}
              <div className="content-card dashboard-card">
                {crmRecord ? (
                  <>
                    <div className="dashboard-header-block">
                      <div className="avatar-initials-badge">{crmRecord.name.split(" ").map(n => n[0]).join("")}</div>
                      <div>
                        <h3>{crmRecord.name}</h3>
                        <span className={`status-badge ${crmRecord.status.toLowerCase()}`}>{crmRecord.status}</span>
                      </div>
                    </div>

                    <div className="profile-details-grid" style={{ marginTop: '18px' }}>
                      <div><strong>Policy Number</strong>: <code>{crmRecord.policy_number}</code></div>
                      <div><strong>Renewal Date</strong>: {crmRecord.renewal_date}</div>
                      <div><strong>Annual Premium</strong>: ₹{crmRecord.premium}/yr</div>
                      <div>
                        <strong>Outstanding Premium</strong>:{" "}
                        {crmRecord.outstanding_premium > 0 ? (
                          <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>₹{crmRecord.outstanding_premium.toFixed(2)}</span>
                        ) : (
                          <span style={{ color: 'var(--success-color)' }}>₹0.00 (Paid)</span>
                        )}
                      </div>
                    </div>

                    <div className="coverage-specs-box" style={{ marginTop: '18px' }}>
                      <strong>Coverage Specs:</strong>
                      <p>{crmRecord.coverage_details}</p>
                    </div>

                    <div style={{ marginTop: '18px', padding: '10px 14px', backgroundColor: computeRiskTier(crmRecord) === 'High' ? 'rgba(239,68,68,0.08)' : computeRiskTier(crmRecord) === 'Medium' ? 'rgba(245,158,11,0.08)' : 'rgba(22,163,74,0.08)', borderLeft: `4px solid ${computeRiskTier(crmRecord) === 'High' ? 'var(--danger-color)' : computeRiskTier(crmRecord) === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)'}`, borderRadius: '6px', fontSize: '0.95rem' }}>
                      <strong>Calculated Risk Tier: {computeRiskTier(crmRecord)}</strong>
                    </div>

                    <div className="lang-selector-group" style={{ marginTop: '18px' }}>
                      <label><strong>Preferred Language:</strong></label>
                      <select value={copilotLang} onChange={(e) => setCopilotLang(e.target.value)}>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="verify-empty-card">
                    <p style={{ color: 'var(--text-secondary)' }}>No active customer context verified. Enter a CRM ID above to verify account details.</p>
                  </div>
                )}

                {/* Call Transcript Simulator */}
                <div className="claims-summary-section" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4>Live Conversation Transcript</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🎤 Voice Active ({copilotLang})
                    </span>
                  </div>

                  {voiceError && (
                    <div className="voice-warning-toast">
                      <span>⚠️ {voiceError}</span>
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} 
                        onClick={() => setVoiceError(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="scrolling-transcript-panel" style={{ maxHeight: '240px', margin: '12px 0' }}>
                    {conversation.length === 0 ? (
                      <div className="empty-chat" style={{ height: '90px' }}>
                        <p>Simulate caller speech below using your <strong>Microphone (🎤)</strong> or keyboard.</p>
                      </div>
                    ) : (
                      conversation.map((msg, idx) => (
                        <div key={idx} className={`transcript-bubble ${msg.sender}`}>
                          <button
                            type="button"
                            className="transcript-audio-btn"
                            onClick={() => handleSpeakText(msg.text, `msg-${idx}`)}
                            title={speakingTextId === `msg-${idx}` ? "Stop playback" : "Listen to audio"}
                          >
                            {speakingTextId === `msg-${idx}` ? "⏹️ Playing..." : "🔊 Play"}
                          </button>
                          <span className="speaker-name">
                            {msg.sender === 'system' ? 'CRM Note' : msg.sender === 'customer' ? 'Caller' : 'Copilot Insight'}
                          </span>
                          <p>{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="speech-input-bar">
                    <input
                      type="text"
                      value={liveStatementInput}
                      onChange={(e) => setLiveStatementInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStatement(liveStatementInput)}
                      placeholder={isListening && activeMicTarget === 'caller' ? `🎙️ Listening in ${copilotLang}... Speak your statement now!` : "Simulate caller speech (e.g., 'I want to change the nominee on my policy')..."}
                    />
                    <button
                      type="button"
                      className={`mic-btn ${isListening && activeMicTarget === 'caller' ? 'mic-btn-recording' : ''}`}
                      onClick={handleToggleCallerMic}
                      title={isListening && activeMicTarget === 'caller' ? "Stop voice listening" : "Click to speak statement"}
                    >
                      {isListening && activeMicTarget === 'caller' ? (
                        <>
                          <span>🔴 Live Mic</span>
                          <div className="audio-wave-container">
                            <span className="audio-wave-bar"></span>
                            <span className="audio-wave-bar"></span>
                            <span className="audio-wave-bar"></span>
                            <span className="audio-wave-bar"></span>
                          </div>
                        </>
                      ) : (
                        <span>🎤 Speak</span>
                      )}
                    </button>
                    <button onClick={() => handleAddStatement(liveStatementInput)}>Simulate Speech</button>
                  </div>

                  {isListening && activeMicTarget === 'caller' && interimTranscript && (
                    <div className="live-voice-preview">
                      <span className="live-voice-preview-text">
                        🎙️ <em>"{interimTranscript}"</em>
                      </span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Transcribing live ({copilotLang})...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── RIGHT COLUMN: ENTERPRISE COPILOT ASSIST (4 SECTIONS) ─── */}
              <div className="content-card copilot-panel-card flex-col justify-between">
                <div className="copilot-top">
                  <div className="copilot-header">
                    <h3>Copilot Real-Time Agent Assist</h3>
                    <span className="badge-live">Live</span>
                  </div>

                  {/* SECTION 1: CONVERSATION UNDERSTANDING */}
                  <div className="copilot-section-card">
                    <div className="copilot-section-header">1. Conversation Understanding</div>
                    <div className="copilot-grid-2">
                      <div className="copilot-metric-pill">
                        <strong>Customer Intent</strong>
                        <span>{copilotIntel.intent}</span>
                      </div>
                      <div className="copilot-metric-pill">
                        <strong>Sentiment</strong>
                        <span style={{ color: copilotIntel.sentiment === 'Anxious' ? 'var(--warning-color)' : copilotIntel.sentiment === 'Frustrated' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                          {copilotIntel.sentiment}
                        </span>
                      </div>
                      <div className="copilot-metric-pill">
                        <strong>Urgency</strong>
                        <span style={{ color: copilotIntel.urgency === 'High' ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                          {copilotIntel.urgency}
                        </span>
                      </div>
                      <div className="copilot-metric-pill">
                        <strong>Conversation Stage</strong>
                        <span>{copilotIntel.stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: CUSTOMER CONTEXT */}
                  <div className="copilot-section-card">
                    <div className="copilot-section-header">2. Customer Context</div>
                    {crmRecord ? (
                      <div className="copilot-grid-2">
                        <div><strong>Customer</strong>: {crmRecord.name} (<code>{crmRecord.id}</code>)</div>
                        <div><strong>Policy</strong>: <code>{crmRecord.policy_number}</code> ({crmRecord.policy_type})</div>
                        <div><strong>Premium</strong>: ₹{crmRecord.premium}/yr</div>
                        <div><strong>Outstanding</strong>: {crmRecord.outstanding_premium > 0 ? `₹${crmRecord.outstanding_premium.toFixed(2)}` : '₹0.00 (Paid)'}</div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No customer verified yet.</p>
                    )}
                  </div>

                  {/* SECTION 3: AGENT GUIDANCE */}
                  <div className="copilot-section-card">
                    <div className="copilot-section-header">3. Agent Guidance</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>Suggested Agent Response:</strong>
                      <button
                        type="button"
                        className={`btn-voice-speak ${speakingTextId === 'suggested-resp' ? 'speaking' : ''}`}
                        onClick={() => handleSpeakText(copilotIntel.suggestedResponse, 'suggested-resp')}
                        title="Play suggested response with natural voice"
                      >
                        {speakingTextId === 'suggested-resp' ? (
                          <>
                            <span>⏹️ Stop Voice</span>
                            <div className="audio-wave-container">
                              <span className="audio-wave-bar"></span>
                              <span className="audio-wave-bar"></span>
                              <span className="audio-wave-bar"></span>
                              <span className="audio-wave-bar"></span>
                            </div>
                          </>
                        ) : (
                          <>🔊 Read Aloud</>
                        )}
                      </button>
                    </div>

                    <div className="suggested-response-box">
                      "{copilotIntel.suggestedResponse}"
                    </div>

                    {copilotIntel.suggestedQuestions.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Suggested Questions to Ask Caller:</strong>
                        <div className="suggested-q-list">
                          {copilotIntel.suggestedQuestions.map((q, qidx) => (
                            <button key={qidx} className="suggested-q-btn" onClick={() => handleAddStatement(q)}>
                              • {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {copilotIntel.nextAction && (
                      <div className="next-best-action-banner">
                        <strong>Next Best Action:</strong> {copilotIntel.nextAction}
                      </div>
                    )}
                  </div>

                  {/* SECTION 4: POLICY KNOWLEDGE & RULES */}
                  <div className="copilot-section-card">
                    <div className="copilot-section-header">4. Policy Knowledge & Rules</div>
                    
                    {copilotIntel.policyRule && (
                      <div className="policy-clause-box">
                        <strong>Policy Knowledge:</strong> {copilotIntel.policyRule}
                      </div>
                    )}

                    {copilotIntel.reqDocs.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Required Documents:</strong>
                        <div className="req-docs-group" style={{ marginTop: '6px' }}>
                          {copilotIntel.reqDocs.map((doc, i) => <span key={i} className="doc-pill">{doc}</span>)}
                        </div>
                      </div>
                    )}

                    {copilotIntel.alerts.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Active Alerts & Notes:</strong>
                        <div className="policy-alerts-group" style={{ marginTop: '6px' }}>
                          {copilotIntel.alerts.map((al, i) => (
                            <div key={i} className="alert-item" style={{ color: al.includes("High-risk") || al.includes("Escalation") || al.includes("Handbook limitation") ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                              {al}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contextual CRM Actions */}
                <div className="copilot-actions-footer" style={{ marginTop: '18px' }}>
                  <strong>Contextual CRM Actions:</strong>
                  <div className="action-buttons-grid">
                    {getContextualActions(copilotIntel.intent).map((action, i) => (
                      <button key={i} onClick={() => triggerCrmAction(action)} className={ACTION_STYLE[action] || "act-btn"}>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RAG Knowledge Base Direct Search */}
            <div className="content-card RAG-search-card" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>Policy Handbook Direct Search</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Dictate with 🎤 or listen with 🔊
                </span>
              </div>
              <div className="chat-log shadow-inner" style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '18px' }}>
                {chatHistory.length === 0 ? (
                  <div className="empty-chat" style={{ height: '70px' }}><p>Type or speak a question below, or select a suggested query.</p></div>
                ) : (
                  chatHistory.map((item, idx) => {
                    const cleanAnswer = (item.response || "").split("**Sources:**")[0].trim();
                    return (
                      <div key={idx} className="chat-message-group">
                        <div className="user-message">
                          <span className="message-role-badge">Agent Query</span>
                          <div className="user-message-text">{item.query}</div>
                        </div>
                        <div className="response-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div className="response-body-text">{cleanAnswer}</div>
                            <button
                              type="button"
                              className={`btn-voice-speak ${speakingTextId === `rag-resp-${idx}` ? 'speaking' : ''}`}
                              onClick={() => handleSpeakText(cleanAnswer, `rag-resp-${idx}`)}
                              title={speakingTextId === `rag-resp-${idx}` ? "Stop voice" : "Read answer aloud"}
                              style={{ flexShrink: 0 }}
                            >
                              {speakingTextId === `rag-resp-${idx}` ? "⏹️" : "🔊"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="suggestions-container">
                <span className="suggestions-title">Suggested Handbook Queries:</span>
                <div className="suggestions-list">
                  {getFollowUpSuggestions().map((s, i) => (
                    <button key={i} className="suggestion-pill" onClick={() => setChatInput(s)} disabled={chatLoading}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="chat-input-bar" style={{ marginTop: '14px' }}>
                <div className="input-with-mic-wrapper">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()} 
                    placeholder={isListening && activeMicTarget === 'search' ? `🎙️ Listening (${copilotLang})... Dictate your question...` : "Ask a policy question..."} 
                    disabled={chatLoading} 
                  />
                  <button 
                    type="button" 
                    className={`mic-search-btn ${isListening && activeMicTarget === 'search' ? 'recording' : ''}`}
                    onClick={handleToggleSearchMic}
                    title={isListening && activeMicTarget === 'search' ? "Stop recording" : "Dictate question by voice"}
                  >
                    {isListening && activeMicTarget === 'search' ? '🔴' : '🎤'}
                  </button>
                </div>
                <button onClick={handleSendQuery} disabled={chatLoading} className="submit-btn">{chatLoading ? "Searching..." : "Search"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SCHEDULE CALLBACK MODAL (DATETIME CALENDAR) ═══════════ */}
        {showCallbackModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Schedule Customer Callback</h3>
                <button className="modal-close-btn" onClick={() => setShowCallbackModal(false)}>✖</button>
              </div>
              <form onSubmit={handleConfirmCallback}>
                <div style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
                  <strong>Handling Agent:</strong> {user.name} (<code>{user.id}</code>)<br/>
                  <strong>Customer Context:</strong> {crmRecord ? `${crmRecord.name} (${crmRecord.id})` : 'Charlie Davis (CRM-103)'}<br/>
                  <strong>Policy:</strong> {crmRecord ? `${crmRecord.policy_number} · ${crmRecord.policy_type}` : 'POL-LIFE-303 · Term Life'}
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Select Date & Time (Calendar Picker):
                  </label>
                  <input
                    type="datetime-local"
                    className="datetime-picker-input"
                    value={callbackDateTime}
                    onChange={(e) => setCallbackDateTime(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Alarm notification will be shown strictly to {user.name} ({user.id}) at the scheduled time.
                  </span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Callback Reason / Notes:
                  </label>
                  <textarea
                    rows="3"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '6px', fontSize: '0.95rem' }}
                    value={callbackReason}
                    onChange={(e) => setCallbackReason(e.target.value)}
                    placeholder="Enter reason for scheduling callback..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="act-btn" onClick={handleTestAlarmNow} style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
                    Test Alarm Now
                  </button>
                  <button type="button" className="act-btn" onClick={() => setShowCallbackModal(false)}>Cancel</button>
                  <button type="submit" className="act-btn btn-green">Confirm Callback Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════ ALARM NOTIFICATION POPUP MODAL ═══════════ */}
        {activeAlarm && (
          <div className="modal-overlay">
            <div className="alarm-modal-card">
              <div className="alarm-banner">
                <div>
                  <div style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SCHEDULED CALLBACK ALARM DUE NOW!</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#7f1d1d' }}>Assigned Agent: {user.name} ({user.id})</div>
                </div>
              </div>

              <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '18px' }}>
                <p style={{ margin: '6px 0' }}><strong>Customer:</strong> {activeAlarm.customerName} (<code>{activeAlarm.customerId}</code>)</p>
                <p style={{ margin: '6px 0' }}><strong>Policy:</strong> <code>{activeAlarm.policyNumber}</code></p>
                <p style={{ margin: '6px 0' }}><strong>Scheduled Time:</strong> {new Date(activeAlarm.scheduledTime).toLocaleString()}</p>
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f9fafb', borderLeft: '4px solid #dc2626', borderRadius: '6px', fontSize: '0.95rem' }}>
                  <strong>Reason:</strong> {activeAlarm.reason}
                </div>
              </div>

              <div className="alarm-actions">
                <button onClick={() => handleStartCallFromAlarm(activeAlarm)} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none' }}>
                  Start Call Now
                </button>
                <button onClick={() => handleSnoozeAlarm(activeAlarm)} style={{ backgroundColor: '#f59e0b', color: '#ffffff', border: 'none' }}>
                  Snooze 5 Mins
                </button>
                <button onClick={() => handleDismissAlarm(activeAlarm)} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none' }}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
