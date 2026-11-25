import React, { useState, useEffect } from 'react';
import { Link2, AlertTriangle, ArrowRight, GitFork, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LinkedComplaint } from '../types';

export const LinkedComplaints: React.FC = () => {
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkedComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/linked-complaints');
      setLinks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">CROSS-COMPLAINT CONVERGENCE & SYNDICATES</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 border border-amber-500/40 text-amber-400">
              CROSS-CASE LINKAGE
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            AI-driven multi-hop path intersection discovers independent fraud complaints that secretly terminate or pass through common mule infrastructure.
          </p>
        </div>

        <button
          onClick={fetchLinks}
          className="px-3.5 py-1.5 rounded-lg bg-cyber-card border border-cyber-border/40 hover:border-cyber-primary text-xs text-cyber-textLight flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyber-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Re-scan Trajectories</span>
        </button>
      </div>

      {/* Explanatory Scenario Banner */}
      <div className="p-4 rounded-xl cyber-card-glow border border-cyber-primary/40 space-y-2">
        <div className="flex items-center space-x-2 text-cyber-primary font-bold text-xs uppercase font-mono">
          <Link2 className="w-4 h-4 text-cyber-primary" />
          <span>Multi-Victim Demonstration Scenario</span>
        </div>
        <p className="text-xs text-gray-200 leading-relaxed">
          Victim A (Aditya Roy, ₹50k) and Victim B (Sunita Deshmukh, ₹75k) filed separate police complaints regarding different fraud vectors (Power bill SMS vs Digital arrest CBI scam).
          MULETRACE's graph intersection engine autonomously identified that both money trails converge on <strong>Punjab National Bank (817263XXXX06 - Imran Sheikh)</strong>, proving operation by the same coordinated cybercrime syndicate.
        </p>
      </div>

      {/* Linked Complaints Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-12 text-center text-cyber-textMuted font-mono">
            CALCULATING MULTI-GRAPH INTERSECTIONS...
          </div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-cyber-textMuted font-mono">
            NO CROSS-COMPLAINT OVERLAPS FOUND
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="cyber-card rounded-xl border border-cyber-border/40 p-4 space-y-3 hover:border-cyber-primary/50 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-cyber-border/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center space-x-2">
                      <span className="text-cyber-primary">{link.complaint_a_number}</span>
                      <ArrowRight className="w-3 h-3 text-cyber-textMuted" />
                      <span className="text-amber-400 font-bold">{link.shared_bank_name} ({link.shared_account_masked})</span>
                      <ArrowRight className="w-3 h-3 text-cyber-textMuted" />
                      <span className="text-cyber-primary">{link.complaint_b_number}</span>
                    </div>
                    <div className="text-[10px] text-cyber-textMuted font-mono">
                      Convergence Type: {link.connection_type} • Confidence: {link.confidence_score.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-cyber-textMuted block">Combined Defrauded Pool</span>
                  <span className="text-sm font-black font-mono text-white">₹{link.total_combined_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Trajectory Breakdown */}
              <div className="p-3 rounded-lg bg-[#031315] border border-cyber-border/20 text-xs">
                <span className="text-[10px] font-bold text-cyber-primary uppercase tracking-wider font-mono block mb-1">
                  Intersection Trajectory
                </span>
                <p className="text-gray-300 text-[11px] leading-relaxed">{link.path_summary}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-gray-400">
                  Victims Involved: <strong className="text-white">{link.complaint_a_victim}</strong> and <strong className="text-white">{link.complaint_b_victim}</strong>
                </div>

                <button
                  onClick={() => navigate(`/money-trail?complaintId=${link.complaint_a_id}`)}
                  className="px-3 py-1.5 rounded-lg bg-cyber-primary text-black font-bold text-xs flex items-center space-x-1.5 shadow-neon hover:bg-cyber-primaryDark transition-all"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Visualize Shared Syndicate Graph</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

