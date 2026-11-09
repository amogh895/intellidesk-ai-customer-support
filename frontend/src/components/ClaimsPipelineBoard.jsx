import React, { useState } from "react";

const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ClaimsPipelineBoard({
  pipeline,
  onMoveStage,
  onOpenEvidence,
  currentUserRole: _currentUserRole
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [draggedClaimId, setDraggedClaimId] = useState(null);

  const columns = [
    { key: "New", title: "New", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
    { key: "Under Review", title: "Under Review", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
    { key: "Awaiting Approval", title: "Awaiting Approval", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)" },
    { key: "Settled", title: "Settled", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
    { key: "Rejected", title: "Rejected", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" }
  ];

  const handleDragStart = (e, claimId) => {
    setDraggedClaimId(claimId);
    e.dataTransfer.setData("text/plain", claimId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const claimId = e.dataTransfer.getData("text/plain") || draggedClaimId;
    if (claimId && onMoveStage) {
      onMoveStage(claimId, targetStage);
    }
    setDraggedClaimId(null);
  };

  return (
    <div className="pipeline-board-container" style={{ padding: "1.25rem 0" }}>
      {/* Search & Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, maxWidth: "400px" }}>
          <input
            type="text"
            className="search-input"
            placeholder="Filter pipeline cards by claim ID, customer, or policy..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          💡 Drag & drop cards between columns or use quick transition buttons to reassign stages
        </div>
      </div>

      {/* 5 Kanban Columns */}
      <div
        className="pipeline-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1rem",
          minHeight: "560px",
          alignItems: "start"
        }}
      >
        {columns.map((col) => {
          const cards = (pipeline[col.key] || []).filter((c) => {
            if (!filterQuery.trim()) return true;
            const q = filterQuery.toLowerCase();
            return (
              (c.claim_id || "").toLowerCase().includes(q) ||
              (c.customer_name || "").toLowerCase().includes(q) ||
              (c.policy_number || "").toLowerCase().includes(q)
            );
          });

          const totalValue = cards.reduce((sum, c) => sum + (c.amount || 0), 0);

          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              style={{
                background: col.bg,
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                minHeight: "520px"
              }}
            >
              {/* Column Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${col.color}`, paddingBottom: "0.5rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{col.title}</h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{formatINR(totalValue)}</span>
                </div>
                <span
                  style={{
                    background: col.color,
                    color: "#fff",
                    borderRadius: "999px",
                    padding: "0.15rem 0.55rem",
                    fontSize: "0.75rem",
                    fontWeight: "600"
                  }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "650px" }}>
                {cards.map((c) => {
                  const isSlaBreached = c.sla_breach || (c.sla_hours_remaining !== undefined && c.sla_hours_remaining < 4);

                  return (
                    <div
                      key={c.claim_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.claim_id)}
                      style={{
                        background: "var(--card-bg)",
                        borderRadius: "8px",
                        padding: "0.85rem",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                        border: isSlaBreached ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        cursor: "grab",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                      }}
                    >
                      {/* Top Bar: Claim ID & SLA Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: col.color }}>{c.claim_id}</strong>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                            background: isSlaBreached ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                            color: isSlaBreached ? "#ef4444" : "#10b981",
                            fontWeight: "600"
                          }}
                        >
                          ⏱️ {c.sla_hours_remaining !== undefined ? `${c.sla_hours_remaining}h SLA` : "24h SLA"}
                        </span>
                      </div>

                      {/* Customer & Policy */}
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>{c.customer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{c.policy_number}</div>

                      {/* Claim Amount */}
                      <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        {formatINR(c.amount)}
                      </div>

                      {/* Reason snippet */}
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {c.reason}
                      </p>

                      {/* Fraud & Risk Badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.2rem" }}>
                        {c.risk_tier && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px",
                              background: c.risk_tier === "High" ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                              color: c.risk_tier === "High" ? "#ef4444" : "#3b82f6",
                              fontWeight: "500"
                            }}
                          >
                            {c.risk_tier} Risk
                          </span>
                        )}
                        {c.fraud_flags?.excessive_payout && (
                          <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontWeight: "600" }}>
                            ⚠️ &gt;3x Premium
                          </span>
                        )}
                        {c.fraud_flags?.repeat_claimant && (
                          <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", fontWeight: "600" }}>
                            🔁 Repeat Claim
                          </span>
                        )}
                      </div>

                      {/* Bottom action row: Evidence & Stage Shift */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-color)" }}>
                        <button
                          type="button"
                          onClick={() => onOpenEvidence && onOpenEvidence(c)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-color)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            padding: 0,
                            textDecoration: "underline"
                          }}
                        >
                          📎 View Evidence ({c.evidence ? c.evidence.length : 2})
                        </button>

                        {/* Quick stage selector */}
                        <select
                          value={c.status}
                          onChange={(e) => onMoveStage && onMoveStage(c.claim_id, e.target.value)}
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.15rem 0.3rem",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-primary)",
                            color: "var(--text-primary)"
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Awaiting Approval">Awaiting Approval</option>
                          <option value="Settled">Settled</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {cards.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    No claims in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
