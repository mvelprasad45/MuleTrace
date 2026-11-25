import React, { useState, useEffect } from 'react';
import { 
  Vault, 
  Upload, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Lock,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';
import { EvidenceItem } from '../types';

export const EvidenceVault: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<number, any>>({});
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Upload Form
  const [complaintId, setComplaintId] = useState('1');
  const [category, setCategory] = useState('Transaction Screenshot');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evidence/1');
      setEvidenceList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('complaint_id', complaintId);
      formData.append('category', category);
      formData.append('notes', notes);
      formData.append('file', selectedFile);

      await api.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setNotes('');
      fetchEvidence();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const verifyIntegrity = async (id: number) => {
    setVerifyingId(id);
    try {
      const res = await api.get(`/evidence/verify/${id}`);
      setVerificationResults(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">DIGITAL EVIDENCE VAULT</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              SHA-256 CRYPTOGRAPHIC INTEGRITY
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Tamper-proof storage of bank statements, SMS fraud screenshots, UPI receipts, and forensic artifacts.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-xl bg-cyber-primary text-[#020909] font-bold text-xs flex items-center space-x-2 hover:bg-cyber-primaryDark shadow-neon transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Ingest Evidence Artifact</span>
        </button>
      </div>

      {/* Security Protocol Banner */}
      <div className="cyber-card-glow p-4 rounded-xl border border-cyber-primary/40 space-y-2">
        <div className="flex items-center space-x-2 text-cyber-primary font-bold text-xs font-mono">
          <Lock className="w-4 h-4" />
          <span>Chain of Custody & Cryptographic Hashing Protocol</span>
        </div>
        <p className="text-xs text-gray-200 leading-relaxed">
          Each uploaded digital artifact is processed through a SHA-256 cryptographic hashing pipeline prior to storage.
          Investigators can run realtime disk re-hash verification to produce tamper-free verification certificates admissible under Section 65B of the Indian Evidence Act.
        </p>
      </div>

      {/* Evidence Table */}
      <div className="cyber-card rounded-xl border border-cyber-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#031416] border-b border-cyber-border/40 text-[11px] font-bold text-cyber-textMuted uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Artifact ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Integrity Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/20 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cyber-textMuted font-mono">
                    INDEXING EVIDENCE VAULT DIRECTORIES...
                  </td>
                </tr>
              ) : evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cyber-textMuted font-mono">
                    NO DIGITAL EVIDENCE ATTACHED YET. CLICK "INGEST EVIDENCE ARTIFACT" TO UPLOAD.
                  </td>
                </tr>
              ) : (
                evidenceList.map((ev) => {
                  const check = verificationResults[ev.id];
                  return (
                    <tr key={ev.id} className="hover:bg-cyber-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyber-primary">
                        EV-{ev.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary font-mono">
                          {ev.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {ev.file_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyber-textMuted">
                        {(ev.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-gray-300">
                        {ev.sha256_hash.slice(0, 16)}...{ev.sha256_hash.slice(-8)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {ev.uploader_name}
                      </td>
                      <td className="py-3 px-4">
                        {check ? (
                          check.is_tamper_free ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>TAMPER-FREE PASS</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/40 flex items-center space-x-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span>CORRUPTED/CHANGED</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-cyber-textMuted font-mono">Pending verification</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => verifyIntegrity(ev.id)}
                            disabled={verifyingId === ev.id}
                            className="px-2.5 py-1 rounded bg-[#031315] border border-cyber-border/40 hover:border-cyber-primary text-cyber-primary text-[10px] font-mono flex items-center space-x-1 transition-all"
                          >
                            <ShieldCheck className={`w-3 h-3 ${verifyingId === ev.id ? 'animate-spin' : ''}`} />
                            <span>Verify Hash</span>
                          </button>
                          <a
                            href={`http://localhost:8000/api/evidence/download/${ev.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded bg-cyber-card border border-cyber-border/40 hover:border-cyber-primary text-cyber-textLight hover:text-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="cyber-card-glow max-w-md w-full p-6 rounded-2xl border border-cyber-primary/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/30">
              <div className="flex items-center space-x-2 text-cyber-primary font-bold text-sm font-mono">
                <Upload className="w-5 h-5 text-cyber-primary" />
                <span>INGEST DIGITAL FORENSIC EVIDENCE</span>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-cyber-textMuted block mb-1">Select Case Complaint ID *</label>
                <input
                  type="number"
                  required
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div>
                <label className="text-cyber-textMuted block mb-1">Evidence Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white focus:outline-none focus:border-cyber-primary"
                >
                  <option value="Bank Statement">Bank Statement (PDF / CSV)</option>
                  <option value="Transaction Screenshot">Transaction Screenshot (PNG / JPG)</option>
                  <option value="SMS Screenshot">SMS Scam Screenshot</option>
                  <option value="WhatsApp Screenshot">WhatsApp Extortion Chat</option>
                  <option value="Email Evidence">Phishing Email Header / RFC822</option>
                  <option value="Other">Other Supporting Artifact</option>
                </select>
              </div>

              <div>
                <label className="text-cyber-textMuted block mb-1">Attach Physical File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-cyber-textMuted file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-cyber-primary file:text-black file:font-bold hover:file:bg-cyber-primaryDark"
                />
              </div>

              <div>
                <label className="text-cyber-textMuted block mb-1">Forensic Investigator Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record source phone, seizing officer, or remarks..."
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border/30">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border/40 text-cyber-textLight hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-cyber-primary text-[#020909] font-bold shadow-neon hover:bg-cyber-primaryDark disabled:opacity-50"
                >
                  {uploading ? 'Computing SHA-256...' : 'Confirm Upload & Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

