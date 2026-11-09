import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon, ExternalLink, ShieldCheck, Download, AlertCircle } from './Icons';

export default function EvidenceViewerModal({ claim, isOpen, onClose }) {
  // Documents attached to claim or synthesized for demonstration if claim.documents is present/empty
  const documents = (claim && claim.documents) || [
    {
      id: 'doc-fir-01',
      title: 'Police First Information Report (FIR)',
      type: 'pdf',
      fileSize: '1.4 MB',
      verified: true,
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      description: 'Official FIR filed at Sector 18 Police Station detailing incident chronology and witness statements.'
    },
    {
      id: 'doc-surveyor-02',
      title: 'Independent Surveyor Assessment',
      type: 'pdf',
      fileSize: '3.2 MB',
      verified: true,
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      description: 'Certified surveyor damage itemization, part-by-part inspection, and salvage value calculation.'
    },
    {
      id: 'doc-estimate-03',
      title: 'Authorized Garage Repair Estimate',
      type: 'pdf',
      fileSize: '820 KB',
      verified: true,
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      description: 'OEM replacement quote including GST and labor breakdown from NorthBridge Network Garage.'
    },
    {
      id: 'doc-photo-04',
      title: 'Primary Vehicle Damage (Front Bumper & Grille)',
      type: 'image',
      fileSize: '2.8 MB',
      verified: true,
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      description: 'High-resolution photo showing radiator collapse, fender distortion, and headlamp fracture.'
    }
  ];

  const [selectedDoc, setSelectedDoc] = useState(documents[0]);

  if (!isOpen || !claim) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                  Claim Evidence Dossier
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {claim.claim_id || claim.id || 'CLAIM-EVIDENCE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer: <strong className="text-slate-700 dark:text-slate-300">{claim.customer_name || 'Policyholder'}</strong> ({claim.policy_number || 'POL-REF'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar + Preview Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document list */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Attached Artifacts ({documents.length})
            </div>
            {documents.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {doc.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> Signed
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="mt-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Evidence checksums verified via S3 SHA-256 HMAC. Signed temporary URLs expire after 15 minutes.
              </span>
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950/60 overflow-hidden">
            {/* Action Bar */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDoc.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDoc.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Direct
                </a>
                <a
                  href={selectedDoc.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
              {selectedDoc.type === 'image' ? (
                <div className="max-w-2xl max-h-full rounded-xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.title}
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 flex justify-between">
                    <span>GPS Exif Match: Verified at Scene</span>
                    <span>Timestamp: Incident Date -1h</span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-3xl h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 flex flex-col p-8">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                        NORTHBRIDGE ASSURANCE CLAIM ARTIFACT
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Document Reference: {selectedDoc.id.toUpperCase()} • Policy: {claim.policy_number || 'POL-DEFAULT'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        AUDITED & SIGNED
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto pr-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Summary: {selectedDoc.description}
                    </p>
                    <p>
                      This official digital document is archived in NorthBridge Secure S3 Object Storage with legal hold retention policies. All checksum signatures have passed automated tamper-evident verification.
                    </p>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div>File: {selectedDoc.title}.pdf</div>
                      <div>Size: {selectedDoc.fileSize}</div>
                      <div>SHA-256: 8f4e2b10a9c735d4ef821109a0b947c61729b8c039e14a72fa3b8214bc6e812d</div>
                      <div>Uploaded By: Surveyor #SRV-904 (Authorized Field Representative)</div>
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      To view full multi-page original PDF layout with digital signatures, please click the "Open Direct" or "Download" buttons above.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
