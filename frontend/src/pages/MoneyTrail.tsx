import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  GitFork, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Snowflake, 
  FileCheck2, 
  Layers, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Compass,
  Sliders,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { MoneyTrail, GraphNode } from '../types';
import { CytoscapeGraph } from '../components/CytoscapeGraph';

export const MoneyTrailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [complaintId, setComplaintId] = useState<string | null>(searchParams.get('complaintId') || '1');
  const [trail, setTrail] = useState<MoneyTrail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector panel state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [accountRiskDetails, setAccountRiskDetails] = useState<any | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Interactive filters
  const [minAmountFilter, setMinAmountFilter] = useState<number>(0);
  const [maxHops, setMaxHops] = useState<number>(5);

  const fetchTrail = async (cid?: string, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (search && search.startsWith('UTR')) {
        res = await api.get(`/trace/transaction/${encodeURIComponent(search)}`, { params: { max_depth: maxHops } });
      } else if (cid) {
        res = await api.get(`/trace/${cid}`, { params: { max_depth: maxHops } });
      } else if (search) {
        // Try complaint id first or search
        res = await api.get(`/trace/1`, { params: { max_depth: maxHops } });
      } else {
        res = await api.get('/trace/1', { params: { max_depth: maxHops } });
      }
      setTrail(res.data);

      // Default select first mule node if available
      if (res.data.nodes.length > 1) {
        const primaryMule = res.data.nodes.find((n: GraphNode) => n.node_type === 'mule_tier_1') || res.data.nodes[1];
        handleSelectNode(primaryMule);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to trace money trail for this transaction query.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrail(complaintId || undefined, searchQuery || undefined);
  }, [complaintId, maxHops]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchQuery.toUpperCase().startsWith('COMP-') || !isNaN(Number(searchQuery))) {
      const cleanId = searchQuery.replace(/\D/g, '');
      setComplaintId(cleanId || '1');
    } else {
      fetchTrail(undefined, searchQuery.trim());
    }
  };

  const handleSelectNode = async (node: GraphNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setAccountRiskDetails(null);
      return;
    }
    setLoadingRisk(true);
    try {
      const res = await api.get(`/accounts/${node.id}/risk`);
      setAccountRiskDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleToggleFreeze = async (accountId: number) => {
    try {
      const res = await api.post(`/accounts/${accountId}/toggle-freeze`);
      // Update local node state
      if (selectedNode && selectedNode.id === String(accountId)) {
        setSelectedNode({ ...selectedNode, is_frozen: res.data.is_frozen });
      }
      if (accountRiskDetails) {
        setAccountRiskDetails({ ...accountRiskDetails, is_frozen: res.data.is_frozen });
      }
      // Re-fetch trail to update visual border
      fetchTrail(complaintId || undefined, searchQuery || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateDossier = async () => {
    if (!trail?.complaint_id) return;
    try {
      const res = await api.post('/reports/generate', { complaint_id: trail.complaint_id });
      window.open(res.data.pdf_url, '_blank');
    } catch (err) {
      alert('Error generating investigation report dossier');
    }
  };

  // Filter edges based on minAmountFilter
  const filteredEdges = trail?.edges.filter(e => e.amount >= minAmountFilter) || [];
  // Retain nodes that have at least one connected filtered edge or are isolated selected
  const activeNodeIds = new Set(filteredEdges.flatMap(e => [e.source, e.target]));
  const filteredNodes = trail?.nodes.filter(n => activeNodeIds.has(n.id) || (selectedNode && n.id === selectedNode.id)) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">MONEY TRAIL TRACING ENGINE</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary animate-pulse">
              NETWORKX DIRECTED ANALYSIS
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Realtime cross-account directed graph tracing, smurfing detection, rapid fund movement, and convergence identification.
          </p>
        </div>

        {trail?.complaint_id && (
          <button
            onClick={handleGenerateDossier}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-card border border-cyber-primary/50 hover:border-cyber-primary text-cyber-primary font-bold text-xs flex items-center space-x-2 shadow-neon transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Export Case Dossier (PDF)</span>
          </button>
        )}
      </div>

      {/* Query Bar & Presets */}
      <div className="cyber-card p-3 rounded-xl border border-cyber-border/40 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyber-primary/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Complaint ID (e.g. COMP-2026-1001), UTR number, or Masked Account..."
                className="w-full bg-[#031315] border border-cyber-border/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-cyber-textMuted/60 focus:outline-none focus:border-cyber-primary font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-cyber-primary text-black font-bold text-xs rounded-lg hover:bg-cyber-primaryDark flex items-center space-x-1 font-mono transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Trace Flow</span>
            </button>
          </form>

          {/* Depth / Amount Controls */}
          <div className="flex items-center space-x-4 w-full md:w-auto text-xs text-cyber-textMuted">
            <div className="flex items-center space-x-1.5 font-mono">
              <span>Hops:</span>
              <select
                value={maxHops}
                onChange={(e) => setMaxHops(Number(e.target.value))}
                className="bg-[#031315] border border-cyber-border/40 rounded px-2 py-1 text-cyber-textLight focus:outline-none focus:border-cyber-primary text-xs"
              >
                <option value={3}>3 Hops</option>
                <option value={4}>4 Hops</option>
                <option value={5}>5 Hops</option>
                <option value={7}>7 Hops</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 font-mono">
              <span>Min Amt:</span>
              <input
                type="range"
                min={0}
                max={50000}
                step={2500}
                value={minAmountFilter}
                onChange={(e) => setMinAmountFilter(Number(e.target.value))}
                className="w-24 accent-[#00F5D4]"
              />
              <span className="text-cyber-primary font-bold">₹{minAmountFilter.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* 1-Click Fast Scenarios */}
        <div className="pt-2 border-t border-cyber-border/20 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-mono flex items-center space-x-1 mr-1">
            <Sparkles className="w-3 h-3 text-cyber-primary" />
            <span>Preset Cases:</span>
          </span>
          <button
            onClick={() => { setComplaintId('1'); setSearchQuery('COMP-2026-1001'); }}
            className="px-2.5 py-1 rounded bg-[#031315] border border-cyber-border/30 hover:border-cyber-primary text-[10px] text-cyber-textLight hover:text-cyber-primary transition-all font-mono"
          >
            Scenario 1: Victim A (₹50k Rapid Fan-Out)
          </button>
          <button
            onClick={() => { setComplaintId('2'); setSearchQuery('COMP-2026-1002'); }}
            className="px-2.5 py-1 rounded bg-[#031315] border border-cyber-border/30 hover:border-cyber-primary text-[10px] text-cyber-textLight hover:text-cyber-primary transition-all font-mono"
          >
            Scenario 2: Multi-Victim Convergence at Account C
          </button>
          <button
            onClick={() => { setComplaintId(null); setSearchQuery('UTR20261124800301'); fetchTrail(undefined, 'UTR20261124800301'); }}
            className="px-2.5 py-1 rounded bg-[#031315] border border-cyber-border/30 hover:border-cyber-primary text-[10px] text-cyber-textLight hover:text-cyber-primary transition-all font-mono"
          >
            Scenario 3: Circular Ring Cycle (D → I → J → D)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Investigation Split Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Cytoscape Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40 relative">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-border/30">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {trail?.complaint_number || 'INVESTIGATION NETWORK'}
                </span>
                <span className="text-[10px] text-cyber-textMuted font-mono">
                  (Total Traced Flow: ₹{trail?.total_traced_amount?.toLocaleString('en-IN') || 0})
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-cyber-primary">
                <span>Depth: {trail?.max_depth || 0} Hops</span>
              </div>
            </div>

            {loading ? (
              <div className="h-[520px] flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-cyber-textMuted font-mono">CALCULATING NETWORK PATHS...</span>
              </div>
            ) : trail ? (
              <CytoscapeGraph
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNode?.id}
                onSelectNode={handleSelectNode}
                height="520px"
              />
            ) : null}

            {/* Hop Breakdown Pill list */}
            {trail?.hop_breakdown && (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                {Object.entries(trail.hop_breakdown).map(([hop, count]) => (
                  <span key={hop} className="px-2 py-0.5 rounded bg-[#031315] border border-cyber-border/30 text-gray-300">
                    {hop}: <strong className="text-cyber-primary">{count}</strong> nodes
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rapid pass-through alerts banner */}
          {trail?.suspicious_patterns && trail.suspicious_patterns.length > 0 && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-red-400 font-bold font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>RAPID FUND MOVEMENT ANOMALIES IDENTIFIED</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-200">
                {trail.suspicious_patterns.map((p, idx) => (
                  <div key={idx} className="p-2 rounded bg-black/40 border border-red-500/20">
                    <span className="font-semibold text-white">Transit Mule: </span>
                    <span>{p.from_account} transferred ₹{p.amount?.toLocaleString('en-IN')} to {p.to_account} in </span>
                    <strong className="text-red-400 font-mono">{p.duration_mins} mins</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Detailed Account Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40 space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-2 border-b border-cyber-border/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-cyber-primary" />
                <span>Account Lead Inspector</span>
              </span>
              <span className="text-[10px] text-cyber-textMuted font-mono">EXPLAINABLE AI</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                {/* Account Header */}
                <div className="p-3 rounded-xl bg-[#031315] border border-cyber-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-cyber-primary">{selectedNode.masked_account}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      selectedNode.risk_score >= 80 ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                      selectedNode.risk_score >= 60 ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                      selectedNode.risk_score >= 30 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {selectedNode.risk_category.toUpperCase()} ({selectedNode.risk_score.toFixed(0)})
                    </span>
                  </div>

                  <div className="text-gray-300 font-medium">{selectedNode.holder_name}</div>
                  <div className="text-[11px] text-cyber-textMuted">{selectedNode.bank_name} • Node Role: <span className="text-white font-mono">{selectedNode.node_type}</span></div>

                  {selectedNode.device_id && (
                    <div className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40">
                      Fingerprint: {selectedNode.device_id}
                    </div>
                  )}
                </div>

                {/* Risk Score Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-cyber-textMuted font-mono">
                    <span>Mule Propensity Risk Index:</span>
                    <span className="text-white font-bold">{selectedNode.risk_score.toFixed(1)} / 100</span>
                  </div>
                  <div className="w-full bg-[#031315] h-2.5 rounded-full overflow-hidden border border-cyber-border/30">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedNode.risk_score >= 80 ? 'bg-red-500 shadow-neon-red' :
                        selectedNode.risk_score >= 60 ? 'bg-orange-500' :
                        selectedNode.risk_score >= 30 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${selectedNode.risk_score}%` }}
                    />
                  </div>
                </div>

                {/* Transaction Volume Summary */}
                {accountRiskDetails && (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#031315] border border-cyber-border/20">
                      <div className="text-cyber-textMuted flex items-center space-x-1">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        <span>Inflow</span>
                      </div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        ₹{accountRiskDetails.total_incoming_amount?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-cyber-textMuted">({accountRiskDetails.incoming_count} txns)</div>
                    </div>

                    <div className="p-2 rounded bg-[#031315] border border-cyber-border/20">
                      <div className="text-cyber-textMuted flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-red-400" />
                        <span>Outflow</span>
                      </div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        ₹{accountRiskDetails.total_outgoing_amount?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-cyber-textMuted">({accountRiskDetails.outgoing_count} txns)</div>
                    </div>
                  </div>
                )}

                {/* Explainable Detection Reasons */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-cyber-primary uppercase tracking-wider font-mono">
                    Detection Rules Triggered
                  </div>

                  {loadingRisk ? (
                    <div className="text-[11px] text-cyber-textMuted font-mono py-2">Analyzing rules...</div>
                  ) : accountRiskDetails?.explainable_reasons?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {accountRiskDetails.explainable_reasons.map((r: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-[#031315] border border-cyber-border/30 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                            <span>{r.title}</span>
                            <span className="text-cyber-primary font-mono text-[10px]">+{r.weight} pts</span>
                          </div>
                          <p className="text-[10px] text-gray-300 leading-relaxed">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic">No anomalous layering patterns triggered. Standard consumer account profile.</div>
                  )}
                </div>

                {/* Enforcement Actions */}
                <div className="pt-2 border-t border-cyber-border/30 flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleFreeze(Number(selectedNode.id))}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                      selectedNode.is_frozen
                        ? 'bg-sky-500/20 border border-sky-500/50 text-sky-400 hover:bg-sky-500/30'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>{selectedNode.is_frozen ? 'REMOVE DEBIT FREEZE' : 'APPLY SECTION 91 LIEN'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-cyber-textMuted font-mono text-xs">
                Click any bank account node on the transaction network to inspect its telemetry, risk explanation, and layering triggers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

