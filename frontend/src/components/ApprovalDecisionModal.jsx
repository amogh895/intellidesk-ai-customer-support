import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, FileText, UserCheck, Loader2 } from './Icons';

const REASON_CODES = {
  approval: [
    { code: 'POLICY_COMPLIANT', label: 'Policy Compliant & Verified' },
    { code: 'SURVEYOR_RECOMMENDED', label: 'Surveyor Field Assessment Approved' },
    { code: 'DISCRETIONARY_OVERRIDE', label: 'Discretionary Override (Customer Retention)' },
    { code: 'SETTLEMENT_FAST_TRACK', label: 'Fast-Track Cashless Settlement Qualified' },
    { code: 'OTHER_APPROVAL', label: 'Other Justified Approval (Detail in Notes)' }
  ],
  rejection: [
    { code: 'POLICY_EXCLUSION', label: 'Explicit Policy Exclusion Clause Applicable' },
    { code: 'INSUFFICIENT_EVIDENCE', label: 'Incomplete / Unsubstantiated Claim Documentation' },
    { code: 'FRAUD_SUSPICION', label: 'Potential Fraud / Tampered Evidence Flagged' },
    { code: 'EXCEEDS_COVERAGE_LIMIT', label: 'Claim Amount Exceeds Policy Sum Insured' },
    { code: 'LATE_REPORTING', label: 'Late Incident Notification (>72h Window)' },
    { code: 'PRE_EXISTING_DAMAGE', label: 'Surveyor Found Pre-Existing Damage' },
    { code: 'OTHER_REJECTION', label: 'Other Grounds for Rejection (Detail in Notes)' }
  ]
};

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ApprovalDecisionModal({
  approval,
  decisionType, // 'grant' | 'reject'
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  onOpenEvidence
}) {
  const isGrant = decisionType === 'grant';
  const amount = Number(approval?.amount) || Number(approval?.claim_amount) || 0;
  const requiresDualApproval = amount >= 500000;

  const [reasonCode, setReasonCode] = useState(
    isGrant ? REASON_CODES.approval[0].code : REASON_CODES.rejection[0].code
  );
  const [note, setNote] = useState('');
  const [secondApprover, setSecondApprover] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !approval) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reasonCode) {
      setErrorMsg('Please select an authoritative reason code.');
      return;
    }
    if (!note.trim() || note.trim().length < 10) {
      setErrorMsg('A detailed auditor note (minimum 10 characters) is mandatory.');
      return;
    }
    if (requiresDualApproval && isGrant && !secondApprover.trim() && !approval.resolved_by) {
      setErrorMsg('Dual approval threshold (≥ ₹5,00,000) requires specifying the senior co-approver.');
      return;
    }

    setErrorMsg('');
    onSubmit({
      approved: isGrant,
      reason_code: reasonCode,
      note: note.trim(),
      second_approver: secondApprover.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isGrant
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isGrant ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-300'
            }`}>
              {isGrant ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                {isGrant ? 'Authorize Claim Settlement' : 'Decline / Reject Claim'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ticket / Claim Ref: <span className="font-mono font-medium">{approval.claim_id || approval.id}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatINR(amount)}
            </div>
            <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
              amount >= 100000
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
            }`}>
              {amount >= 100000 ? 'Level 2 (CSM Required)' : 'Level 1 (Senior CSR / CSM)'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dual Approval Warning if applicable */}
          {requiresDualApproval && isGrant && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <strong className="block font-semibold">Dual Approval Threshold Triggered (≥ ₹5,00,000)</strong>
                Claims in excess of ₹5 Lakh require primary CSM validation and secondary audit authorization.
              </div>
            </div>
          )}

          {/* Quick Context Summary */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Policyholder: </span>
              <strong className="text-slate-700 dark:text-slate-300">{approval.customer_name || 'Policyholder'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Policy: </span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{approval.policy_number || 'POL-REF'}</span>
            </div>
            {onOpenEvidence && (
              <button
                type="button"
                onClick={() => onOpenEvidence(approval)}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <FileText className="w-3.5 h-3.5" /> View Evidence
              </button>
            )}
          </div>

          {/* Reason Code (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Authoritative Reason Code <span className="text-rose-500">*</span>
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {(isGrant ? REASON_CODES.approval : REASON_CODES.rejection).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Dual Approver Name (if required) */}
          {requiresDualApproval && isGrant && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Secondary Senior Co-Approver Email / ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. priya.nair@northbridge.in"
                  value={secondApprover}
                  onChange={(e) => setSecondApprover(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Reviewer Note (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reviewer Audit Log Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder={isGrant ? 'Describe verification details, coverage limits checked, and any applicable deductible...' : 'Document exact exclusion clause or lack of evidence justifying rejection...'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Immutable entry written to NorthBridge compliance audit log.
            </span>
          </div>

          {/* Validation Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md flex items-center gap-2 transition-all ${
                isGrant
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-rose-400'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isGrant ? 'Confirm Settlement Authorization' : 'Confirm Claim Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
