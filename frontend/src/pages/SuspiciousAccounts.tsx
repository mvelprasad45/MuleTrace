import React, { useState, useEffect } from 'react';
import { AlertOctagon, Snowflake, Search, Filter, ShieldCheck, Flame, GitFork, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SuspiciousAccount } from '../types';

export const SuspiciousAccounts: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SuspiciousAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/suspicious');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleFreeze = async (accountId: number) => {
    try {
      await api.post(`/accounts/${accountId}/toggle-freeze`);
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = accounts.filter(a => {
    const matchSearch = search === '' || 
      a.account_number_masked.toLowerCase().includes(search.toLowerCase()) ||
      a.account_holder_name.toLowerCase().includes(search.toLowerCase()) ||
      a.bank_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.device_id && a.device_id.toLowerCase().includes(search.toLowerCase()));
    
    const matchCat = categoryFilter === 'All' || a.risk_category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">SUSPICIOUS MULE ACCOUNT REPOSITORY</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/15 border border-red-500/40 text-red-400">
              HIGH PROPENSITY LEADS
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Statistical anomaly detection engine flags based on rapid pass-through, fan-out layering, and circular transaction loops.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="cyber-card p-3 rounded-xl border border-cyber-border/40 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyber-primary/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account, holder, bank, device ID..."
            className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-cyber-textMuted/60 focus:outline-none focus:border-cyber-primary font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-cyber-textMuted text-[11px]">Risk Level:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#031315] border border-cyber-border/40 rounded-lg px-2.5 py-1 text-xs text-cyber-textLight focus:outline-none focus:border-cyber-primary font-mono"
          >
            <option value="All">All Tiers</option>
            <option value="Critical">Critical (81 - 100)</option>
            <option value="High">High (61 - 80)</option>
            <option value="Medium">Medium (31 - 60)</option>
          </select>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-cyber-textMuted font-mono">
            EVALUATING MULE PROPENSITY ENGINE...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-cyber-textMuted font-mono">
            NO SUSPICIOUS ACCOUNTS MATCHING CRITERIA
          </div>
        ) : (
          filtered.map((acc) => {
            const isExpanded = expandedId === acc.id;
            return (
              <div
                key={acc.id}
                className="cyber-card rounded-xl border border-cyber-border/40 p-4 transition-all hover:border-cyber-primary/40 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${
                      acc.risk_score >= 80 ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                      acc.risk_score >= 60 ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' :
                      'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    }`}>
                      <AlertOctagon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold font-mono text-white">{acc.account_number_masked}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          acc.risk_score >= 80 ? 'bg-red-500/15 text-red-400 border-red-500/40' :
                          'bg-orange-500/15 text-orange-400 border-orange-500/40'
                        }`}>
                          {acc.risk_category.toUpperCase()} ({acc.risk_score.toFixed(0)})
                        </span>
                        {acc.is_frozen && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-sky-500/20 text-sky-400 border border-sky-500/40">
                            FROZEN (SECTION 91 LIEN)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5">
                        {acc.bank_name} • Holder: <span className="font-semibold text-white">{acc.account_holder_name}</span>
                      </div>
                      {acc.device_id && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">
                          Device Fingerprint: {acc.device_id}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleToggleFreeze(acc.account_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all ${
                        acc.is_frozen
                          ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30'
                          : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>{acc.is_frozen ? 'REMOVE LIEN' : 'FREEZE DEBIT'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/money-trail?search=${encodeURIComponent(acc.account_number_masked)}`)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/40 hover:bg-cyber-primary hover:text-black text-cyber-primary text-xs font-bold font-mono flex items-center space-x-1 transition-all"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Trace Trail</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                      className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border/40 text-cyber-textMuted hover:text-white"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details / Explainable Rule Log */}
                {isExpanded && (
                  <div className="pt-3 border-t border-cyber-border/20 space-y-2 text-xs animate-in fade-in">
                    <div className="text-[11px] font-bold text-cyber-primary uppercase tracking-wider font-mono">
                      Explainable Detection Breakdown
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {acc.reasons?.map((r, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-[#031315] border border-cyber-border/30">
                          <div className="flex items-center justify-between font-semibold text-white text-[11px]">
                            <span>{r.title}</span>
                            <span className="text-cyber-primary font-mono">+{r.weight} pts</span>
                          </div>
                          <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

