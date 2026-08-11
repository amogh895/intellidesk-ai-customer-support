import streamlit as st
import pandas as pd
import requests
import json
from pathlib import Path

# Setup page config
st.set_page_config(
    page_title="IntelliDesk — Enterprise Support Platform",
    page_icon="💼",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling to create a premium, state-of-the-art UI
st.markdown("""
<style>
    /* Primary Colors & Dark Gradient Header */
    .main-header {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 2rem;
        border-radius: 12px;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .main-header h1 {
        margin: 0;
        font-family: 'Outfit', 'Inter', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
    }
    .main-header p {
        margin: 5px 0 0 0;
        opacity: 0.9;
        font-size: 1.1rem;
    }
    
    /* Clean, premium card containers */
    .premium-card {
        background-color: #ffffff;
        border: 1px solid #eef2f6;
        border-radius: 10px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        margin-bottom: 1.5rem;
    }
    
    /* Input element borders and focus styling */
    .stTextInput>div>div>input {
        border-radius: 8px;
    }
    
    /* Tag styles */
    .badge {
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
    }
    .badge-active { background-color: #d1e7dd; color: #0f5132; }
    .badge-inactive { background-color: #f8d7da; color: #842029; }
</style>
""", unsafe_allow_html=True)

# Define backend URL
BACKEND_URL = "http://127.0.0.1:8000"

# Main Side Navigation
st.sidebar.image("https://img.icons8.com/color/96/artificial-intelligence.png", width=60)
st.sidebar.title("IntelliDesk AI")
st.sidebar.caption("Enterprise AI Agent Portal")

view = st.sidebar.radio(
    "Navigation Menu",
    [
        "💬 Ask Assistant (RAG)", 
        "👤 Customer CRM Lookup", 
        "🛡️ Approval Dashboard (HITL)", 
        "📊 Ingestion Evaluation", 
        "📜 Audit Logs & Admin"
    ]
)

# Header Banner
st.markdown("""
<div class="main-header">
    <h1>IntelliDesk Agent Portal</h1>
    <p>Simulated Enterprise Insurance Knowledge & Actions Orchestrator</p>
</div>
""", unsafe_allow_html=True)

# -----------------
# VIEW 1: ASK ASSISTANT
# -----------------
if view == "💬 Ask Assistant (RAG)":
    st.subheader("Knowledge Query Engine")
    st.info("Submit any question regarding auto, home, or life insurance policies, claims manuals, underwriting rules, or billing queries.")
    
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "thread_id" not in st.session_state:
        st.session_state.thread_id = None
        
    query_input = st.text_input("Ask a question:", placeholder="e.g., What is the grace period for a late payment?")
    
    if st.button("Query Agent", type="primary"):
        if not query_input.strip():
            st.warning("Please type a question.")
        else:
            with st.spinner("Executing agent reasoning workflow..."):
                payload = {"query": query_input}
                if st.session_state.thread_id:
                    payload["thread_id"] = st.session_state.thread_id
                    
                try:
                    res = requests.post(f"{BACKEND_URL}/api/query", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        st.session_state.thread_id = data.get("thread_id")
                        
                        # Add to local history
                        st.session_state.chat_history.append({
                            "question": query_input,
                            "response": data.get("response"),
                            "status": data.get("status")
                        })
                    else:
                        st.error(f"Backend Server Error: {res.text}")
                except Exception as e:
                    st.error(f"Could not connect to FastAPI Backend at {BACKEND_URL}. Check if the server is running. Error: {e}")
                    
    # Render chat history
    if st.session_state.chat_history:
        st.write("### Conversation Thread History")
        for idx, chat in enumerate(reversed(st.session_state.chat_history)):
            with st.container():
                st.markdown(f"**Agent: (Question {len(st.session_state.chat_history) - idx})**")
                st.write(chat["question"])
                
                # If suspended, show a warning badge
                if chat["status"] == "suspended":
                    st.warning("⚠️ **Action Pending Approval** — This query triggered an outbound agent action requiring approval. Go to the Approval Dashboard tab.")
                else:
                    st.success("🤖 **Response**")
                    
                st.markdown(chat["response"])
                st.divider()

# -----------------
# VIEW 2: CUSTOMER CRM LOOKUP
# -----------------
elif view == "👤 Customer CRM Lookup":
    st.subheader("CRM Records Database")
    st.markdown("Search details from the mock CRM database using the Customer CRM ID.")
    
    search_id = st.text_input("Enter Customer CRM ID:", value="CRM-101", placeholder="CRM-101, CRM-102, CRM-103")
    
    if st.button("Lookup Records"):
        try:
            res = requests.get(f"{BACKEND_URL}/api/crm/{search_id}")
            if res.status_code == 200:
                record = res.json()
                
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"### Profile: {record['name']}")
                    st.markdown(f"**CRM ID**: `{record['id']}`")
                    
                    status_class = "badge-active" if record["status"] == "Active" else "badge-inactive"
                    st.markdown(f"**Policy Status**: <span class='badge {status_class}'>{record['status']}</span>", unsafe_allow_html=True)
                    st.markdown(f"**Policy Number**: `{record['policy_number']}` ({record['policy_type']})")
                    st.markdown(f"**Annual Premium**: `${record['premium']}`")
                
                with col2:
                    st.markdown("### Coverage Details")
                    st.info(record["coverage_details"])
                    
                    st.markdown("### Active Claims History")
                    if record["claims"]:
                        for claim in record["claims"]:
                            st.write(f"- **Claim {claim['id']}**: {claim['type']} | Status: `{claim['status']}` | Amount: `${claim['amount']}`")
                    else:
                        st.write("No active claims found for this customer.")
            else:
                st.error("No record found. Please verify the ID.")
        except Exception as e:
            st.error(f"Error fetching data: {e}")

# -----------------
# VIEW 3: APPROVAL DASHBOARD (HITL)
# -----------------
elif view == "🛡️ Approval Dashboard (HITL)":
    st.subheader("Human-in-the-Loop Actions Gate")
    st.markdown("Sensitive agent proposals (e.g., ticket drafting, supervisor escalations) wait here for supervisor authorization before executing.")
    
    thread_id = st.text_input("Enter Thread ID to check pending approvals:", value=st.session_state.get("thread_id") or "")
    
    if thread_id:
        try:
            # Query backend to retrieve current state
            res = requests.post(f"{BACKEND_URL}/api/query", json={"query": "status_check", "thread_id": thread_id})
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "suspended":
                    pending = data.get("pending_action") or {}
                    
                    st.warning(f"🔔 **Action Pending Approval** (Thread: `{thread_id}`)")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write("### Target Parameters")
                        st.write(f"- **Target Intent**: `{pending.get('intent')}`")
                        st.write(f"- **Customer ID**: `{pending.get('customer_id')}`")
                        st.write(f"- **Action Subject**: `{pending.get('subject')}`")
                        
                    with col2:
                        st.write("### Action Detail Content")
                        edited_content = st.text_area("Edit text before sending/escalating:", value=pending.get("details", ""))
                        
                    col_approve, col_reject = st.columns(2)
                    with col_approve:
                        if st.button("✅ Approve & Execute", type="primary"):
                            approval_res = requests.post(f"{BACKEND_URL}/api/approve-action", json={
                                "thread_id": thread_id,
                                "approved": True,
                                "edited_content": edited_content
                            })
                            if approval_res.status_code == 200:
                                st.success("Approved successfully! Response output below:")
                                st.markdown(approval_res.json().get("response"))
                                st.balloons()
                            else:
                                st.error("Failed to approve action.")
                    with col_reject:
                        if st.button("❌ Reject & Cancel"):
                            approval_res = requests.post(f"{BACKEND_URL}/api/approve-action", json={
                                "thread_id": thread_id,
                                "approved": False
                            })
                            if approval_res.status_code == 200:
                                st.info("Action rejected and wiped from queue.")
                            else:
                                st.error("Failed to reject action.")
                else:
                    st.info("No active suspended actions pending approval for this Thread ID.")
            else:
                st.error("Failed to fetch thread info.")
        except Exception as e:
            st.error(f"Error checking pending approvals: {e}")
    else:
        st.info("Provide a Thread ID in the field above to verify queue details.")

# -----------------
# VIEW 4: INGESTION EVALUATION
# -----------------
elif view == "📊 Ingestion Evaluation":
    st.subheader("Ingestion Chunking Analysis & RAGAS Benchmarks")
    st.markdown("We benchmark search accuracy across 3 configurations of chunk sizes to optimize retrieval precision.")
    
    report_file = Path("evaluation/report.md")
    
    if report_file.exists():
        st.markdown(report_file.read_text())
    else:
        st.warning("No evaluation report generated yet. Run the evaluation script using the terminal first:")
        st.code("python evaluation/evaluator.py")
        
        # Display sample/mock evaluation matrix to allow immediate visualization
        st.write("### Mock Benchmarks Table (Preview)")
        mock_data = pd.DataFrame({
            "Chunk Size": [300, 500, 800],
            "Overlap Chars": [50, 100, 150],
            "Retrieval Accuracy": ["73.3%", "86.7%", "80.0%"],
            "Avg Confidence": ["64%", "81%", "76%"],
            "Faithfulness (Groundedness)": ["91%", "95%", "88%"]
        })
        st.table(mock_data)

# -----------------
# VIEW 5: AUDIT LOGS & ADMIN
# -----------------
elif view == "📜 Audit Logs & Admin":
    st.subheader("System Governance & Audit Trail")
    st.markdown("Browse raw logs tracking intents, confidence, and human review decisions.")
    
    if st.button("Refresh Audit Logs"):
        try:
            res = requests.get(f"{BACKEND_URL}/api/audit-logs")
            if res.status_code == 200:
                logs = res.json()
                if logs:
                    st.write(pd.DataFrame(logs))
                else:
                    st.info("No audit logs captured in this session yet.")
            else:
                st.error("Could not fetch logs.")
        except Exception as e:
            st.error(f"Error fetching logs: {e}")
            
    st.markdown("---")
    st.subheader("Governance Specifications Quick View")
    st.markdown("""
    - **Data Sanitization**: Automatic masking of PII pattern categories (SSNs, CCs).
    - **Grounding Prompts**: Core retrieval templates enforce strictly grounded facts with zero-tolerance policy against hallucinated details.
    - **Action Gates**: Interrupt points instantiated in LangGraph structure blocks block automatic execution of outbound drafts.
    """)
