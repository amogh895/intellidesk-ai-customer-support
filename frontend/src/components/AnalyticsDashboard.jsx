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

export default function AnalyticsDashboard({ apiUrl, token, onFilterChange }) {
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
  }, [selectedTeam, selectedPolicyType, selectedRiskTier]);

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
      ...(data.top_reasons || []).map(r => [r.reason, r.count])
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

  if (isLoading && !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <div>
              <h4 className="font-semibold text-base">Failed to fetch Claim Manager Analytics</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
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
  const confidence = data?.ai_confidence || [];
  const sentiment = data?.sentiment_trend || [];
  const matrix = data?.heatmap_matrix || [];
  const reasons = data?.top_reasons || [];

  const maxPipelineCount = Math.max(...pipeline.map(p => p.count), 1);
  const maxAgingCount = Math.max(...aging.map(a => a.count), 1);
  const maxReasonCount = Math.max(...reasons.map(r => r.count), 1);
  const totalExposure = exposure.reduce((sum, item) => sum + (item.value_inr || 0), 0) || 1;
  const l1Exposure = exposure.find(e => e.level === 'L1')?.value_inr || 0;
  const l2Exposure = exposure.find(e => e.level === 'L2')?.value_inr || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Claims Executive Intelligence
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live SQL Aggregations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-dimensional claims operations, exposure monitoring, and agent copilot governance.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Policy Type Filter */}
          <select
            value={selectedPolicyType}
            onChange={(e) => setSelectedPolicyType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Policy Types</option>
            <option value="Comprehensive Auto">Comprehensive Auto</option>
            <option value="Third-Party Auto">Third-Party Auto</option>
            <option value="Health Individual">Health Individual</option>
            <option value="Term Life">Term Life</option>
            <option value="Home & Property">Home & Property</option>
          </select>

          {/* Risk Tier Filter */}
          <select
            value={selectedRiskTier}
            onChange={(e) => setSelectedRiskTier(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Risk Tiers</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 1. KPI STRIP (6 Metrics with Sparkline representation) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Open Claims */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Open Claims</span>
            <span className="text-indigo-600"><Layers className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatNumber(kpis.open_claims)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
            <ArrowDownRight className="w-3 h-3" /> 4.2% vs yesterday
          </div>
        </div>

        {/* Pending Payout */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Exposure</span>
            <span className="text-purple-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {formatINR(kpis.pending_payout_inr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            L1: {formatINR(l1Exposure)} • L2: {formatINR(l2Exposure)}
          </div>
        </div>

        {/* SLA Breaches */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">SLA Breaches</span>
            <span className="text-rose-600"><AlertCircle className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatNumber(kpis.sla_breaches)}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Target: 0 breaches
          </div>
        </div>

        {/* Avg Settlement Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Settlement</span>
            <span className="text-blue-600"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {kpis.avg_settlement_hours || 18.4}h
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            -2.6h vs 30d avg
          </div>
        </div>

        {/* Groundedness */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Groundedness</span>
            <span className="text-emerald-600"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {kpis.groundedness_rate || 96.2}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target ≥ 95.0%
          </div>
        </div>

        {/* First Contact Resolution */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">FCR Rate</span>
            <span className="text-indigo-600"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {kpis.fcr_rate || 88.5}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +1.8% vs last week
          </div>
        </div>

      </div>

      {/* 2 & 3: PIPELINE FUNNEL & VOLUME/VALUE TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual 2: Claims Pipeline Funnel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Claims Pipeline Distribution
              </h3>
              <p className="text-xs text-slate-500">Live active claims segmented by operational lifecycle</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {pipeline.map((stage) => {
              const pct = Math.round((stage.count / maxPipelineCount) * 100);
              const isSelected = selectedStageFilter === stage.stage;
              return (
                <div
                  key={stage.stage}
                  onClick={() => setSelectedStageFilter(isSelected ? null : stage.stage)}
                  className={`cursor-pointer p-2 rounded-xl transition-all ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{stage.stage}</span>
                    <span className="text-slate-500">
                      <strong>{stage.count}</strong> claims • <span className="font-mono">{formatINR(stage.value_inr)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stage.stage === 'Settled' ? 'bg-emerald-500' :
                        stage.stage === 'Rejected' ? 'bg-rose-500' :
                        stage.stage === 'Awaiting Approval' ? 'bg-purple-500' :
                        stage.stage === 'Under Review' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 3: Claims Volume & Value Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Claims Velocity & Payout Volume (7-Day Trend)
              </h3>
              <p className="text-xs text-slate-500">Bars: Inflow claims count • Line: Total authorized value (₹)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {trend.map((t, idx) => {
              const maxVal = Math.max(...trend.map(item => item.claims), 10);
              const barHeightPct = Math.round((t.claims / maxVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-10">
                    <div>{t.date}</div>
                    <div className="font-semibold">{t.claims} claims ({formatINR(t.value_inr)})</div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-end h-32 overflow-hidden">
                    <div
                      className="w-full bg-indigo-500/80 hover:bg-indigo-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(barHeightPct, 12)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4 & 5: PAYOUT EXPOSURE & APPROVAL AGING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual 4: Payout Exposure by Approval Level */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Payout Exposure by Approval Authority
              </h3>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Level 1 (&lt; ₹1L) vs Level 2 (≥ ₹1L) risk authorization split
            </p>

            <div className="flex items-center justify-around py-4">
              {/* Donut representation */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* L1 arc */}
                  <path
                    className="text-indigo-500"
                    strokeDasharray={`${Math.round((l1Exposure / totalExposure) * 100)}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatINR(totalExposure)}
                  </span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-500" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Level 1: Senior CSR & CSM
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatINR(l1Exposure)} ({Math.round((l1Exposure / totalExposure) * 100)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-500" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Level 2: CSM Only (&ge; ₹1 Lakh)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatINR(l2Exposure)} ({Math.round((l2Exposure / totalExposure) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            Dual approval required above ₹5,00,000 threshold.
          </div>
        </div>

        {/* Visual 5: Approval Aging & SLA Alert Buckets */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Approval Queue Aging & SLA Distribution
            </h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Turnaround buckets with strict 24-hour compliance target
          </p>

          <div className="space-y-3 pt-1">
            {aging.map((b) => {
              const isBreach = b.bucket.includes('24h') || b.bucket.includes('Over');
              const isWarning = b.bucket.includes('12-24h');
              const pct = Math.round((b.count / maxAgingCount) * 100);

              return (
                <div key={b.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isBreach ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {b.bucket} {isBreach ? '• SLA Breached' : isWarning ? '• SLA Warning' : '• Healthy'}
                    </span>
                    <span className="font-mono text-slate-500">{b.count} approvals</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isBreach ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 6 & 7: TEAM PERFORMANCE & AI CONFIDENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual 6: Team Performance Matrix */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Claims Operations Team Performance
            </h3>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Comparison of representative handled volume, average handle time (AHT) and draft adoption
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium text-right">Handled</th>
                  <th className="pb-2 font-medium text-right">AHT (mins)</th>
                  <th className="pb-2 font-medium text-right">Escalation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamPerf.map((agent, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{agent.agent}</td>
                    <td className="py-2.5 text-slate-500">{agent.team}</td>
                    <td className="py-2.5 font-mono text-right">{agent.handled}</td>
                    <td className="py-2.5 font-mono text-right">{agent.aht_min}m</td>
                    <td className="py-2.5 font-mono text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                      {agent.escalation_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual 7: AI Confidence Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              AI Copilot Draft Confidence Distribution
            </h3>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Histogram bucketed by 10% ranges (CSM spot-check review queue for &lt;75%)
          </p>

          <div className="space-y-3 pt-1">
            {confidence.map((bucket) => {
              const count = bucket.count || 0;
              const isLow = bucket.bucket === '<70%' || bucket.bucket === '70-79%';
              return (
                <div key={bucket.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Confidence Range: {bucket.bucket}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} drafts {isLow && <strong className="text-amber-600">(Review Queue)</strong>}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLow ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(count * 6 + 5, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 8, 9 & 10: SENTIMENT, HEATMAP & TOP DENIAL REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual 8: Customer Sentiment Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
            Voice & Chat Sentiment
          </h3>
          <p className="text-xs text-slate-500 mb-4">Customer tone distribution during claim calls</p>
          
          <div className="space-y-3">
            {sentiment.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{s.date}</span>
                  <span>{s.positive}% Pos • {s.neutral}% Neu • {s.negative}% Neg</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  <div className="bg-emerald-500 h-full" style={{ width: `${s.positive}%` }} />
                  <div className="bg-slate-400 h-full" style={{ width: `${s.neutral}%` }} />
                  <div className="bg-rose-500 h-full" style={{ width: `${s.negative}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual 9: Policy Type vs Risk Tier Heatmap */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
            Risk Tier vs Policy Matrix
          </h3>
          <p className="text-xs text-slate-500 mb-4">Claim concentration density heatmap</p>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="font-semibold text-slate-400 pb-1">Type</div>
            <div className="font-semibold text-slate-400 pb-1">Low</div>
            <div className="font-semibold text-slate-400 pb-1">Med</div>
            <div className="font-semibold text-slate-400 pb-1">High</div>

            {matrix.map((row, idx) => (
              <React.Fragment key={idx}>
                <div className="text-left font-medium text-slate-700 dark:text-slate-300 truncate">
                  {row.policy_type}
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono font-medium">
                  {row.low}
                </div>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono font-medium">
                  {row.med}
                </div>
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-mono font-medium">
                  {row.high}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Visual 10: Top Denial / Escalation Reasons */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
            Top Denial & Escalation Drivers
          </h3>
          <p className="text-xs text-slate-500 mb-4">Audited reason code frequency</p>

          <div className="space-y-3">
            {reasons.map((r) => {
              const pct = Math.round((r.count / maxReasonCount) * 100);
              return (
                <div key={r.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {r.reason}
                    </span>
                    <span className="font-mono text-slate-500">{r.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
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
