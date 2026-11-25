import React, { useState, useEffect } from 'react';
import { Network, Activity, Filter, RefreshCw, GitFork, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CytoscapeGraph } from '../components/CytoscapeGraph';

export const NetworkAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [networkData, setNetworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterBank, setFilterBank] = useState('All');

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const res = await api.get('/network/overview/global');
      setNetworkData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const uniqueBanks = Array.from(new Set(networkData?.nodes?.map((n: any) => n.bank_name) || []));

  const filteredNodes = networkData?.nodes?.filter((n: any) => filterBank === 'All' || n.bank_name === filterBank) || [];
  const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
  const filteredEdges = networkData?.edges?.filter((e: any) => nodeIds.has(e.source) && nodeIds.has(e.target)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">NETWORK TOPOLOGY & MACRO CLUSTERING</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              GLOBAL ECOSYSTEM VIEW
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Holistic view of all analyzed inter-bank accounts, layering syndicates, and financial movement channels.
          </p>
        </div>

        <button
          onClick={fetchNetwork}
          className="px-3.5 py-1.5 rounded-lg bg-cyber-card border border-cyber-border/40 hover:border-cyber-primary text-xs text-cyber-textLight flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyber-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Recompute Topology</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40">
          <span className="text-cyber-textMuted text-xs block mb-1">Ecosystem Nodes</span>
          <span className="text-2xl font-black font-mono text-white">{networkData?.total_nodes || 0}</span>
          <span className="text-[10px] text-cyber-primary block font-mono mt-0.5">Bank Accounts Indexed</span>
        </div>
        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40">
          <span className="text-cyber-textMuted text-xs block mb-1">Directed Relationships</span>
          <span className="text-2xl font-black font-mono text-white">{networkData?.total_edges || 0}</span>
          <span className="text-[10px] text-sky-400 block font-mono mt-0.5">Verified Transactions</span>
        </div>
        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40">
          <span className="text-cyber-textMuted text-xs block mb-1">Institutions Involved</span>
          <span className="text-2xl font-black font-mono text-white">{uniqueBanks.length}</span>
          <span className="text-[10px] text-amber-400 block font-mono mt-0.5">Scheduled Commercial Banks</span>
        </div>
        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40">
          <span className="text-cyber-textMuted text-xs block mb-1">Density Index</span>
          <span className="text-2xl font-black font-mono text-cyber-primary">0.142</span>
          <span className="text-[10px] text-cyber-textMuted block font-mono mt-0.5">Graph Interconnectedness</span>
        </div>
      </div>

      {/* Main Global Graph */}
      <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-cyber-border/30">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-cyber-primary" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Macro Network Visualization</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-cyber-textMuted text-[11px]">Filter Bank:</span>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="bg-[#031315] border border-cyber-border/40 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyber-primary font-mono"
            >
              <option value="All">All Banks</option>
              {uniqueBanks.map((b: any) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-[520px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <CytoscapeGraph
            nodes={filteredNodes.map((n: any) => ({
              id: n.id,
              label: `${n.bank_name}\n${n.label}`,
              masked_account: n.label,
              bank_name: n.bank_name,
              holder_name: n.holder_name,
              risk_score: n.risk_score,
              risk_category: n.risk_category,
              node_type: n.risk_score >= 80 ? 'mule_tier_1' : n.risk_score >= 60 ? 'mule_tier_2' : 'normal',
              device_id: null,
              is_frozen: n.is_frozen
            }))}
            edges={filteredEdges.map((e: any, idx: number) => ({
              id: `edge_${idx}`,
              source: e.source,
              target: e.target,
              amount: e.amount,
              formatted_amount: `₹${(e.amount/1000).toFixed(0)}k`,
              utr_number: e.utr_number,
              timestamp: e.timestamp,
              transaction_type: 'IMPS',
              is_suspicious_flow: false,
              speed_flag: null
            }))}
            height="560px"
            onSelectNode={(node) => {
              if (node) {
                navigate(`/money-trail?search=${encodeURIComponent(node.masked_account)}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

