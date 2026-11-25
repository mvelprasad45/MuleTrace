import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertCircle, 
  GitFork, 
  MessageSquare, 
  Eye, 
  CheckCircle,
  Clock,
  Send,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Complaint } from '../types';

export const Complaints: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Form State
  const [form, setForm] = useState({
    victim_name: '',
    victim_mobile: '',
    bank_name: 'HDFC Bank',
    masked_account_number: '',
    utr_number: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_time: '14:30:00',
    suspected_upi_id: '',
    suspected_account_number: '',
    fraud_description: '',
    priority: 'High'
  });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          search: search || undefined,
          status: statusFilter,
          priority: priorityFilter
        }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, priorityFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/complaints', {
        ...form,
        amount: parseFloat(form.amount)
      });
      setShowCreateModal(false);
      // Reset
      setForm({
        victim_name: '',
        victim_mobile: '',
        bank_name: 'HDFC Bank',
        masked_account_number: '',
        utr_number: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_time: '14:30:00',
        suspected_upi_id: '',
        suspected_account_number: '',
        fraud_description: '',
        priority: 'High'
      });
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register complaint');
    }
  };

  const openDetails = async (c: Complaint) => {
    setSelectedComplaint(c);
    try {
      const res = await api.get(`/complaints/${c.id}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedComplaint) return;
    setSavingNote(true);
    try {
      const res = await api.post(`/complaints/${selectedComplaint.id}/notes`, {
        note_text: newNote,
        is_lead: true
      });
      setNotes([res.data, ...notes]);
      setNewNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateStatus = async (complaintId: number, newStatus: string) => {
    try {
      await api.put(`/complaints/${complaintId}`, { status: newStatus });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus as any });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">COMPLAINT MANAGEMENT</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              NATIONAL CYBERCRIME INTAKE
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Register, triage, prioritize, and initiate deep money trail tracing across financial fraud complaints.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-cyber-primary text-[#020909] font-bold text-xs flex items-center space-x-2 hover:bg-cyber-primaryDark shadow-neon transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Complaint</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-3 rounded-xl border border-cyber-border/40 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyber-primary/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Complaint ID, victim, UTR..."
            className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-cyber-textMuted/60 focus:outline-none focus:border-cyber-primary font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-cyber-textMuted text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#031315] border border-cyber-border/40 rounded-lg px-2.5 py-1 text-xs text-cyber-textLight focus:outline-none focus:border-cyber-primary font-mono"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Evidence Required">Evidence Required</option>
              <option value="Escalated">Escalated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-cyber-textMuted text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#031315] border border-cyber-border/40 rounded-lg px-2.5 py-1 text-xs text-cyber-textLight focus:outline-none focus:border-cyber-primary font-mono"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="cyber-card rounded-xl border border-cyber-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#031416] border-b border-cyber-border/40 text-[11px] font-bold text-cyber-textMuted uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Victim</th>
                <th className="py-3 px-4">Defrauded Amount</th>
                <th className="py-3 px-4">Transaction UTR</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/20 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cyber-textMuted font-mono">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
                      <span>QUERYING COMPLAINT REPOSITORIES...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cyber-textMuted font-mono">
                    NO MATCHING FRAUD COMPLAINTS FOUND
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-cyber-primary/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyber-primary">
                      {c.complaint_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{c.victim_name}</div>
                      <div className="text-[10px] text-cyber-textMuted">{c.bank_name} ({c.masked_account_number})</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹{c.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-300">
                      {c.utr_number}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-cyber-textMuted font-mono">
                      {c.transaction_date} {c.transaction_time}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        c.priority === 'Critical' ? 'bg-red-500/15 text-red-400 border-red-500/40' :
                        c.priority === 'High' ? 'bg-orange-500/15 text-orange-400 border-orange-500/40' :
                        'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === 'New' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                        c.status === 'Under Investigation' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        c.status === 'Escalated' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openDetails(c)}
                          title="View Dossier & Notes"
                          className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border/40 hover:border-cyber-primary text-cyber-textLight hover:text-cyber-primary transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/money-trail?complaintId=${c.id}`)}
                          title="Trace Money Trail Graph"
                          className="px-2.5 py-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/40 hover:bg-cyber-primary hover:text-black text-cyber-primary font-bold text-[11px] flex items-center space-x-1 transition-all"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Trace</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="cyber-card-glow max-w-2xl w-full p-6 rounded-2xl border border-cyber-primary/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/30">
              <div className="flex items-center space-x-2 text-cyber-primary font-bold text-sm">
                <FileText className="w-5 h-5 text-cyber-primary" />
                <span>REGISTER NEW FINANCIAL FRAUD COMPLAINT</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-cyber-textMuted block mb-1">Victim Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.victim_name}
                    onChange={(e) => setForm({ ...form, victim_name: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-sans focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Victim Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={form.victim_mobile}
                    onChange={(e) => setForm({ ...form, victim_mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Remitter Bank *</label>
                  <input
                    type="text"
                    required
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Masked Remitter Account *</label>
                  <input
                    type="text"
                    required
                    value={form.masked_account_number}
                    onChange={(e) => setForm({ ...form, masked_account_number: e.target.value })}
                    placeholder="501002XXXX99"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Transaction UTR / Reference ID *</label>
                  <input
                    type="text"
                    required
                    value={form.utr_number}
                    onChange={(e) => setForm({ ...form, utr_number: e.target.value })}
                    placeholder="UTR20261124800999"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Defrauded Amount (INR) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="50000"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Suspected Beneficiary UPI ID</label>
                  <input
                    type="text"
                    value={form.suspected_upi_id}
                    onChange={(e) => setForm({ ...form, suspected_upi_id: e.target.value })}
                    placeholder="fraudster@upi"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
                <div>
                  <label className="text-cyber-textMuted block mb-1">Suspected Beneficiary Account</label>
                  <input
                    type="text"
                    value={form.suspected_account_number}
                    onChange={(e) => setForm({ ...form, suspected_account_number: e.target.value })}
                    placeholder="91827364501904"
                    className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyber-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-cyber-textMuted block mb-1">Fraud Incident Synopsis & Modus Operandi *</label>
                <textarea
                  required
                  rows={3}
                  value={form.fraud_description}
                  onChange={(e) => setForm({ ...form, fraud_description: e.target.value })}
                  placeholder="Detail the deception vector (e.g. Electricity bill SMS, Digital arrest impersonation, courier scam)..."
                  className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg p-2 text-white focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border/40 text-cyber-textLight hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyber-primary text-[#020909] font-bold shadow-neon hover:bg-cyber-primaryDark"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Notes Drawer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="cyber-card-glow max-w-2xl w-full p-6 rounded-2xl border border-cyber-primary/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/30">
              <div>
                <div className="text-xs text-cyber-textMuted font-mono">CASE DOSSIER</div>
                <div className="text-base font-bold text-cyber-primary font-mono">{selectedComplaint.complaint_number}</div>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#031315] border border-cyber-border/20">
                <span className="text-cyber-textMuted text-[10px] uppercase block">Victim Details</span>
                <span className="font-semibold text-white text-sm">{selectedComplaint.victim_name}</span>
                <span className="block text-[11px] text-gray-300 font-mono">{selectedComplaint.victim_mobile}</span>
                <span className="block text-[11px] text-gray-400">{selectedComplaint.bank_name} ({selectedComplaint.masked_account_number})</span>
              </div>
              <div className="p-3 rounded-lg bg-[#031315] border border-cyber-border/20">
                <span className="text-cyber-textMuted text-[10px] uppercase block">Financial Loss</span>
                <span className="font-bold text-white text-lg font-mono">₹{selectedComplaint.amount.toLocaleString('en-IN')}</span>
                <span className="block text-[10px] text-cyber-primary font-mono">UTR: {selectedComplaint.utr_number}</span>
                <span className="block text-[10px] text-gray-400 font-mono">{selectedComplaint.transaction_date} {selectedComplaint.transaction_time}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#031315] border border-cyber-border/20 text-xs">
              <span className="text-cyber-textMuted text-[10px] uppercase block mb-1 font-bold">Modus Operandi</span>
              <p className="text-gray-200 leading-relaxed">{selectedComplaint.fraud_description}</p>
            </div>

            {/* Status change pill */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#031315] border border-cyber-border/20 text-xs">
              <span className="text-cyber-textMuted">Triage Status:</span>
              <div className="flex space-x-1.5">
                {['Under Investigation', 'Escalated', 'Evidence Required', 'Closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedComplaint.id, st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      selectedComplaint.status === st
                        ? 'bg-cyber-primary text-black font-bold'
                        : 'bg-cyber-card border border-cyber-border/30 text-cyber-textLight hover:border-cyber-primary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Investigation Notes & Leads */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-cyber-primary uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyber-primary" />
                <span>Investigator Notes & Leads</span>
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record an observation, Section 91 notice dispatch, or lead..."
                  className="flex-1 bg-[#031315] border border-cyber-border/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-primary"
                />
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-3 py-1.5 bg-cyber-primary text-black font-bold text-xs rounded-lg hover:bg-cyber-primaryDark flex items-center space-x-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="p-2.5 rounded bg-[#031315]/80 border border-cyber-border/20 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-cyber-primary font-mono mb-0.5">
                      <span>{n.author_name}</span>
                      <span className="text-cyber-textMuted">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-200 text-[11px]">{n.note_text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-cyber-border/30 flex justify-end space-x-3">
              <button
                onClick={() => navigate(`/money-trail?complaintId=${selectedComplaint.id}`)}
                className="px-4 py-2 rounded-lg bg-cyber-primary text-black font-bold text-xs flex items-center space-x-1.5 shadow-neon hover:bg-cyber-primaryDark"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Launch Money Trail Tracing Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

