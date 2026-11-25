import React, { useState, useEffect } from 'react';
import { FileCheck2, Download, Plus, RefreshCw, FileText, Calendar, User, Eye, X } from 'lucide-react';
import api from '../services/api';
import { InvestigationReport, Complaint } from '../types';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<InvestigationReport[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number>(1);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [repRes, compRes] = await Promise.all([
        api.get('/reports'),
        api.get('/complaints')
      ]);
      setReports(repRes.data);
      setComplaints(compRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', { complaint_id: selectedComplaintId });
      setShowGenerateModal(false);
      fetchReports();
      window.open(`http://localhost:8000${res.data.pdf_url}`, '_blank');
    } catch (err) {
      alert('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">INVESTIGATION REPORT DOSSIERS</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              REPORTLAB AUTOMATED FORENSICS
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Cryptographically sealed, multi-page PDF dossiers covering money trail summaries, connected mule accounts, and Section 91 notices.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 rounded-xl bg-cyber-primary text-[#020909] font-bold text-xs flex items-center space-x-2 hover:bg-cyber-primaryDark shadow-neon transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Compile New Dossier</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-cyber-textMuted font-mono">
            FETCHING REPORT ARCHIVES...
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-cyber-textMuted font-mono">
            NO COMPILED REPORTS YET. CLICK "COMPILE NEW DOSSIER" TO GENERATE A PDF DOSSIER.
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="cyber-card rounded-xl border border-cyber-border/40 p-4 space-y-3 hover:border-cyber-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyber-primary">{rep.report_number}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    DEMO DATA
                  </span>
                </div>

                <div className="text-sm font-semibold text-white">{rep.title}</div>
                <div className="text-[11px] text-cyber-textMuted font-mono">
                  Complaint: {rep.complaint_number}
                </div>
              </div>

              <div className="pt-3 border-t border-cyber-border/20 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-cyber-textMuted font-mono">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-cyber-primary" />
                    <span>{rep.investigator_name}</span>
                  </span>
                  <span>{rep.created_at}</span>
                </div>

                <a
                  href={`http://localhost:8000${rep.pdf_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-cyber-primary/10 border border-cyber-primary/40 hover:bg-cyber-primary hover:text-black text-cyber-primary font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-all font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Forensic PDF</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generate Dossier Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="cyber-card-glow max-w-md w-full p-6 rounded-2xl border border-cyber-primary/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/30">
              <div className="flex items-center space-x-2 text-cyber-primary font-bold text-sm font-mono">
                <FileCheck2 className="w-5 h-5 text-cyber-primary" />
                <span>GENERATE INVESTIGATION DOSSIER</span>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="text-cyber-textMuted block mb-1">Select Case Complaint *</label>
                <select
                  value={selectedComplaintId}
                  onChange={(e) => setSelectedComplaintId(Number(e.target.value))}
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyber-primary font-mono"
                >
                  {complaints.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.complaint_number} - {c.victim_name} (₹{c.amount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#031315] border border-cyber-border/20 text-gray-300 text-[11px] space-y-1">
                <div className="font-semibold text-cyber-primary">Included Sections:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-cyber-textMuted">
                  <li>Complaint & Remitter Details</li>
                  <li>Directed NetworkX Graph Node Breakdown</li>
                  <li>Rapid Pass-Through Anomalies & Detection Scores</li>
                  <li>SHA-256 Cryptographic Evidence Verification Log</li>
                  <li>Section 91 CrPC Lien Recommendation Block</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border/30">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border/40 text-cyber-textLight hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-lg bg-cyber-primary text-[#020909] font-bold shadow-neon hover:bg-cyber-primaryDark disabled:opacity-50"
                >
                  {generating ? 'Compiling PDF Dossier...' : 'Generate & Download PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

