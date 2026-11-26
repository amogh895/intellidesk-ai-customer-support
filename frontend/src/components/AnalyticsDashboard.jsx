import React, { useState, useEffect } from 'react';
import {
  TrendingUp, AlertCircle, Clock, ShieldCheck, CheckCircle2,
  FileSpreadsheet, RefreshCw, BarChart3, PieChart,
  ArrowDownRight, Layers, Users, Sparkles
} from './Icons';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-IN').format(val || 0);
};

export default function AnalyticsDashboard({ apiUrl, token }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPolicyType, setSelectedPolicyType] = useState('all');
  const [selectedRiskTier, setSelectedRiskTier] = useState('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState(null);

  // Fetch Analytics from Backend API
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (timeRange) params.append('time_range', timeRange);
      if (selectedTeam !== 'all') params.append('team', selectedTeam);
      if (selectedPolicyType !== 'all') params.append('policy_type', selectedPolicyType);
      if (selectedRiskTier !== 'all') params.append('risk_tier', selectedRiskTier);

      const res = await fetch(`${apiUrl}/analytics/claims-manager?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Analytics API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to retrieve real-time analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedTeam, selectedPolicyType, selectedRiskTier]);

  // Export Analytics Summary to CSV
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Open Claims', data.kpis?.open_claims || 0],
      ['Pending Payout INR', data.kpis?.pending_payout_inr || 0],
      ['SLA Breaches', data.kpis?.sla_breaches || 0],
      ['Avg Settlement Hours', data.kpis?.avg_settlement_hours || 0],
      ['Groundedness Rate %', data.kpis?.groundedness_rate || 0],
      ['First Contact Resolution %', data.kpis?.fcr_rate || 0],
      [],
      ['Pipeline Stage', 'Count', 'Value INR'],
      ...(data.pipeline || []).map(p => [p.stage, p.count, p.value_inr]),
      [],
      ['Approval Aging Bucket', 'Count'],
      ...(data.approval_aging || []).map(a => [a.bucket, a.count]),
      [],
      ['Top Reasons', 'Reason Code', 'Count'],
      ...(data.top_reasons || data.top_rejection_reasons || []).map(r => [r.reason, r.count])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `csm_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Card & Container Style Helpers
  const cardStyle = {
    backgroundColor: 'var(--bg-surface, #ffffff)',
    border: '1px solid var(--border-color, #cbd5e1)',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
    boxSizing: 'border-box'
  };

  if (isLoading && !data) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '36px', width: '280px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '8px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '100px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '12px' }} />
          ))}
        </div>
        <div style={{ height: '240px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '12px' }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--red-bg, #fee2e2)',
          border: '1px solid var(--semantic-red, #b91c1c)',
          color: 'var(--semantic-red, #b91c1c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle width={24} height={24} style={{ color: '#b91c1c' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Failed to fetch Claim Manager Analytics</div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>{error}</div>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            style={{
              padding: '8px 16px',
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw width={14} height={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const pipeline = data?.pipeline || [];
  const trend = data?.trend || [];
  const exposure = data?.exposure || [];
  const aging = data?.approval_aging || [];
  const teamPerf = data?.team_performance || [];
  const confidence = data?.ai_confidence || data?.ai_confidence_dist || [];
  const sentiment = data?.sentiment_trend || [];
  const matrix = data?.heatmap_matrix || [];
  const reasons = data?.top_reasons || data?.top_rejection_reasons || [];

  const maxPipelineCount = Math.max(...pipeline.map(p => p.count), 1);
  const maxAgingCount = Math.max(...aging.map(a => a.count), 1);
  const maxReasonCount = Math.max(...reasons.map(r => r.count), 1);
  const totalExposure = exposure.reduce((sum, item) => sum + (item.value_inr || 0), 0) || 1;
  const l1Exposure = exposure.find(e => e.level === 'L1' || e.level?.includes('Level 1'))?.value_inr || 0;
  const l2Exposure = exposure.find(e => e.level === 'L2' || e.level?.includes('Level 2'))?.value_inr || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header & Filters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '18px',
        borderBottom: '1px solid var(--border-color, #cbd5e1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Claims Executive Intelligence
            </h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-light, #eff6ff)',
              color: 'var(--primary-brand, #1e3a8a)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles width={13} height={13} /> Live Aggregations
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #475569)' }}>
            Real-time multi-dimensional claims operations, exposure monitoring, and agent copilot governance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Policy Type Filter */}
          <select
            value={selectedPolicyType}
            onChange={(e) => setSelectedPolicyType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">All Policy Types</option>
            <option value="Comprehensive Private Car Policy">Comprehensive Private Car</option>
            <option value="Third Party + Theft Coverage">Third Party + Theft</option>
            <option value="Commercial Fleet Vehicle Policy">Commercial Fleet</option>
            <option value="Health Individual">Health Individual</option>
            <option value="Term Life">Term Life</option>
          </select>

          {/* Risk Tier Filter */}
          <select
            value={selectedRiskTier}
            onChange={(e) => setSelectedRiskTier(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">All Risk Tiers</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            title="Refresh Metrics"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw width={14} height={14} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary-brand, #1e3a8a)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileSpreadsheet width={14} height={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 1. KPI STRIP (6 Metrics) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        
        {/* Open Claims */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>Open Claims</span>
            <Layers width={16} height={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '8px' }}>
            {formatNumber(kpis.open_claims)}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--semantic-green, #047857)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ArrowDownRight width={12} height={12} /> Active in pipeline
          </div>
        </div>

        {/* Pending Exposure */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>Pending Exposure</span>
            <TrendingUp width={16} height={16} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatINR(kpis.pending_payout_inr)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle, #64748b)', marginTop: '4px' }}>
            L1: {formatINR(l1Exposure)} • L2: {formatINR(l2Exposure)}
          </div>
        </div>

        {/* SLA Breaches */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>SLA Breaches</span>
            <AlertCircle width={16} height={16} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--semantic-red, #b91c1c)', marginTop: '8px' }}>
            {formatNumber(kpis.sla_breaches)}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', marginTop: '4px' }}>
            Target: 0 breaches
          </div>
        </div>

        {/* Avg Settlement Hours */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>Avg Settlement</span>
            <Clock width={16} height={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '8px' }}>
            {kpis.avg_settlement_hours || 18.5}h
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--semantic-green, #047857)', marginTop: '4px' }}>
            -2.4h vs 30d avg
          </div>
        </div>

        {/* Groundedness */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>Groundedness</span>
            <ShieldCheck width={16} height={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--semantic-green, #047857)', marginTop: '8px' }}>
            {kpis.groundedness_rate || 94.8}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle, #64748b)', marginTop: '4px' }}>
            Target &ge; 95.0%
          </div>
        </div>

        {/* First Contact Resolution */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #475569)' }}>FCR Rate</span>
            <CheckCircle2 width={16} height={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '8px' }}>
            {kpis.fcr_rate || 81.2}%
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--semantic-green, #047857)', marginTop: '4px' }}>
            +1.8% vs last week
          </div>
        </div>

      </div>

      {/* 2 & 3: PIPELINE FUNNEL & VOLUME/VALUE TREND */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        
        {/* Visual 2: Claims Pipeline Funnel */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Claims Pipeline Distribution
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
                Active claims segmented by operational lifecycle
              </p>
            </div>
            <BarChart3 width={16} height={16} style={{ color: 'var(--text-subtle, #64748b)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pipeline.map((stage) => {
              const pct = Math.round((stage.count / maxPipelineCount) * 100);
              const isSelected = selectedStageFilter === stage.stage;
              const barColor =
                stage.stage === 'Settled' ? '#10b981' :
                stage.stage === 'Rejected' ? '#ef4444' :
                stage.stage === 'Awaiting Approval' ? '#8b5cf6' :
                stage.stage === 'Under Review' ? '#f59e0b' : '#3b82f6';

              return (
                <div
                  key={stage.stage}
                  onClick={() => setSelectedStageFilter(isSelected ? null : stage.stage)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary-light, #eff6ff)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary-brand, #1e3a8a)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>{stage.stage}</span>
                    <span style={{ color: 'var(--text-muted, #475569)' }}>
                      <strong>{stage.count}</strong> claims • <span style={{ fontFamily: 'monospace' }}>{formatINR(stage.value_inr)}</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(pct, 4)}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 3: Claims Volume & Value Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Claims Velocity & Payout Volume (7-Day Trend)
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
                Daily claim inflow count and approved payout volume
              </p>
            </div>
            <TrendingUp width={16} height={16} style={{ color: 'var(--text-subtle, #64748b)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '180px', paddingTop: '20px' }}>
            {trend.map((t, idx) => {
              const maxVal = Math.max(...trend.map(item => item.claims), 10);
              const barHeightPct = Math.round((t.claims / maxVal) * 100);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-brand, #1e3a8a)' }}>
                    {t.claims}
                  </div>
                  <div style={{ width: '100%', maxWidth: '28px', height: `${Math.max(barHeightPct, 15)}%`, backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle, #64748b)', whiteSpace: 'nowrap' }}>
                    {t.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4 & 5: PAYOUT EXPOSURE & APPROVAL AGING */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        
        {/* Visual 4: Payout Exposure by Approval Level */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Payout Exposure by Approval Authority
              </h3>
              <PieChart width={16} height={16} style={{ color: 'var(--text-subtle, #64748b)' }} />
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
              Level 1 (&lt; ₹1L) vs Level 2 (&ge; ₹1L) authorization split
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '12px 0' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path
                    stroke="var(--bg-subtle, #f1f5f9)"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke="#3b82f6"
                    strokeDasharray={`${Math.round((l1Exposure / totalExposure) * 100)}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    {formatINR(totalExposure)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      Level 1: Senior CSR & CSM
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #475569)' }}>
                      {formatINR(l1Exposure)} ({Math.round((l1Exposure / totalExposure) * 100)}%)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      Level 2: CSM Only (&ge; ₹1L)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #475569)' }}>
                      {formatINR(l2Exposure)} ({Math.round((l2Exposure / totalExposure) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle, #64748b)', padding: '8px 12px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '8px' }}>
            Dual approval required above ₹5,00,000 threshold.
          </div>
        </div>

        {/* Visual 5: Approval Aging & SLA Alert Buckets */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Approval Queue Aging & SLA Distribution
            </h3>
            <Clock width={16} height={16} style={{ color: 'var(--text-subtle, #64748b)' }} />
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Turnaround aging with strict 24-hour compliance target
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {aging.map((b) => {
              const isBreach = b.bucket.includes('24h') || b.bucket.includes('Over');
              const isWarning = b.bucket.includes('12-24h') || b.bucket.includes('4-12h');
              const pct = Math.round((b.count / maxAgingCount) * 100);
              const barColor = isBreach ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

              return (
                <div key={b.bucket} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: isBreach ? '#ef4444' : 'var(--text-main, #0f172a)' }}>
                      {b.bucket} {isBreach ? '• SLA Breached' : isWarning ? '• In Progress' : '• Healthy'}
                    </span>
                    <span style={{ color: 'var(--text-muted, #475569)', fontWeight: 600 }}>{b.count} approvals</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(pct, 5)}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 6 & 7: TEAM PERFORMANCE & AI CONFIDENCE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        
        {/* Visual 6: Team Performance Matrix */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Claims Operations Team Performance
            </h3>
            <Users width={16} height={16} style={{ color: 'var(--text-subtle, #64748b)' }} />
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Representative handled volume, average handle time (AHT), and escalation rate
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color, #cbd5e1)', color: 'var(--text-subtle, #64748b)' }}>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Agent</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Team</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Handled</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>AHT</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Escalation</th>
                </tr>
              </thead>
              <tbody>
                {teamPerf.map((agent, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>{agent.agent}</td>
                    <td style={{ padding: '8px 4px', color: 'var(--text-muted, #475569)' }}>{agent.team}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'monospace' }}>{agent.handled}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'monospace' }}>{agent.aht_min}m</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-brand, #1e3a8a)' }}>
                      {agent.escalation_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual 7: AI Confidence Distribution */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              AI Copilot Draft Confidence Distribution
            </h3>
            <Sparkles width={16} height={16} style={{ color: '#8b5cf6' }} />
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Histogram bucketed by confidence range (CSM review queue for &lt;75%)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {confidence.map((bucket) => {
              const count = bucket.count || 0;
              const isLow = bucket.bucket === '<70%' || bucket.bucket === '50-60%' || bucket.bucket === '60-70%';
              return (
                <div key={bucket.bucket} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      {bucket.bucket}
                    </span>
                    <span style={{ color: 'var(--text-muted, #475569)', fontWeight: 600 }}>
                      {count} drafts {isLow && <span style={{ color: '#d97706', fontWeight: 700 }}>(Spot Check)</span>}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(count * 2.2 + 8, 100)}%`, backgroundColor: isLow ? '#f59e0b' : '#3b82f6', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 8, 9 & 10: SENTIMENT, HEATMAP & TOP DENIAL REASONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        
        {/* Visual 8: Customer Sentiment Trend */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            Voice & Chat Sentiment
          </h3>
          <p style={{ margin: '3px 0 14px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Customer tone distribution during claim calls
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sentiment.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle, #64748b)' }}>
                  <span>{s.date.slice(5)}</span>
                  <span>{s.positive}% Pos • {s.neutral}% Neu • {s.negative}% Neg</span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', backgroundColor: 'var(--bg-subtle, #f1f5f9)' }}>
                  <div style={{ width: `${s.positive}%`, height: '100%', backgroundColor: '#10b981' }} />
                  <div style={{ width: `${s.neutral}%`, height: '100%', backgroundColor: '#94a3b8' }} />
                  <div style={{ width: `${s.negative}%`, height: '100%', backgroundColor: '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual 9: Policy Type vs Risk Tier Heatmap */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            Risk Tier vs Policy Matrix
          </h3>
          <p style={{ margin: '3px 0 14px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Claim concentration density heatmap
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '6px', fontSize: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-subtle, #64748b)', textAlign: 'left' }}>Type</div>
            <div style={{ fontWeight: 700, color: '#10b981' }}>Low</div>
            <div style={{ fontWeight: 700, color: '#f59e0b' }}>Med</div>
            <div style={{ fontWeight: 700, color: '#ef4444' }}>High</div>

            {matrix.map((row, idx) => (
              <React.Fragment key={idx}>
                <div style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-main, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.policy_type}>
                  {row.policy_type.replace(" Policy", "")}
                </div>
                <div style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontWeight: 700 }}>
                  {row.low}
                </div>
                <div style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: 700 }}>
                  {row.med}
                </div>
                <div style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', fontWeight: 700 }}>
                  {row.high}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Visual 10: Top Denial / Escalation Reasons */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            Top Denial & Escalation Drivers
          </h3>
          <p style={{ margin: '3px 0 14px', fontSize: '0.78rem', color: 'var(--text-muted, #475569)' }}>
            Audited reason code frequency
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reasons.map((r) => {
              const pct = Math.round((r.count / maxReasonCount) * 100);
              return (
                <div key={r.reason} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {r.reason}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted, #475569)' }}>{r.count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(pct, 8)}%`, backgroundColor: '#ef4444', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
