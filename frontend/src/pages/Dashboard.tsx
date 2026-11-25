import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Activity, 
  AlertTriangle, 
  GitFork, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Snowflake,
  Flame,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DashboardStats, Complaint, SuspiciousAccount, MoneyTrail } from '../types';
import { CytoscapeGraph } from '../components/CytoscapeGraph';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [suspiciousAccounts, setSuspiciousAccounts] = useState<SuspiciousAccount[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [previewTrail, setPreviewTrail] = useState<MoneyTrail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes, suspRes, actRes, trailRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/complaints'),
        api.get('/accounts/suspicious'),
        api.get('/dashboard/activities'),
        api.get('/trace/1') // Default preview on Complaint 1
      ]);

      setStats(statsRes.data);
      setRecentComplaints(compRes.data.slice(0, 5));
      setSuspiciousAccounts(suspRes.data.slice(0, 5));
      setActivities(actRes.data.slice(0, 6));
      setPreviewTrail(trailRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleFreeze = async (accountId: number) => {
    try {
      await api.post(`/accounts/${accountId}/toggle-freeze`);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-cyber-textMuted tracking-wider font-mono">INITIALIZING CYBER INTELLIGENCE COMMAND...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">OPERATIONAL INTELLIGENCE DASHBOARD</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              LIVE NETWORK STATE
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Cross-account financial crime tracking, mule ring detection and automated transaction trail analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border/40 hover:border-cyber-primary text-xs text-cyber-textLight flex items-center space-x-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyber-primary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => navigate('/complaints')}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-primary text-[#020909] font-bold text-xs flex items-center space-x-2 hover:bg-cyber-primaryDark shadow-neon transition-all"
          >
            <span>+ New Complaint</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-textMuted text-xs mb-1">
            <span>Total Complaints</span>
            <FileText className="w-4 h-4 text-cyber-primary" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats?.total_complaints || 0}</div>
          <div className="text-[10px] text-cyber-primary/80 flex items-center space-x-1 mt-1 font-mono">
            <span>{stats?.active_investigations || 0} active leads</span>
          </div>
        </div>

        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-textMuted text-xs mb-1">
            <span>Transactions Analysed</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats?.transactions_analysed || 0}</div>
          <div className="text-[10px] text-sky-400/80 flex items-center space-x-1 mt-1 font-mono">
            <span>Total: ₹{((stats?.total_defrauded_amount || 0) + 120000).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-textMuted text-xs mb-1">
            <span>Suspicious Accounts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats?.suspicious_accounts || 0}</div>
          <div className="text-[10px] text-amber-400/80 flex items-center space-x-1 mt-1 font-mono">
            <span>Flagged by detection engine</span>
          </div>
        </div>

        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-textMuted text-xs mb-1">
            <span>High-Risk Networks</span>
            <Flame className="w-4 h-4 text-cyber-red" />
          </div>
          <div className="text-2xl font-black text-cyber-red font-mono">{stats?.high_risk_networks || 0}</div>
          <div className="text-[10px] text-red-400/80 flex items-center space-x-1 mt-1 font-mono">
            <span>Rapid pass-through mules</span>
          </div>
        </div>

        <div className="cyber-card p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-cyber-textMuted text-xs mb-1">
            <span>Frozen Fund Shield</span>
            <Snowflake className="w-4 h-4 text-cyber-primary" />
          </div>
          <div className="text-2xl font-black text-cyber-primary font-mono">₹{stats?.total_frozen_amount?.toLocaleString('en-IN') || '0'}</div>
          <div className="text-[10px] text-cyber-primary/80 flex items-center space-x-1 mt-1 font-mono">
            <span>Secured via rapid liens</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout: Left (Complaints/Alerts), Center (Cytoscape Graph), Right (High-Risk/Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Complaints */}
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-border/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-cyber-primary" />
                <span>Recent Complaints</span>
              </span>
              <button onClick={() => navigate('/complaints')} className="text-[10px] text-cyber-primary hover:underline flex items-center space-x-0.5">
                <span>View all</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/money-trail?complaintId=${c.id}`)}
                  className="p-2.5 rounded-lg bg-[#031315]/80 border border-cyber-border/30 hover:border-cyber-primary/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyber-primary group-hover:underline">{c.complaint_number}</span>
                    <span className="text-[10px] font-mono text-gray-300">₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[11px] text-gray-200 truncate mt-0.5">{c.victim_name} ({c.bank_name})</div>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-cyber-textMuted">
                    <span className={`px-1.5 py-0.2 rounded ${c.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {c.priority} Priority
                    </span>
                    <span>{c.transaction_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity Log */}
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 pb-2 border-b border-cyber-border/30 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Investigation Audit Stream</span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="text-[11px] p-2 rounded bg-[#031315]/60 border border-cyber-border/20">
                  <div className="flex items-center justify-between text-[9px] text-cyber-primary font-mono">
                    <span>{act.action}</span>
                    <span className="text-cyber-textMuted">{act.timestamp.split(' ')[1]}</span>
                  </div>
                  <div className="text-gray-300 text-[10px] mt-0.5 leading-snug truncate" title={act.details}>
                    {act.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Large Interactive Transaction Network (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-border/30">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <GitFork className="w-4 h-4 text-cyber-primary" />
                  <span>Interactive Money Trail Topology (Scenario Preview)</span>
                </span>
                <span className="text-[10px] text-cyber-textMuted">
                  Directed transaction graph tracing pass-through hops and layering nodes
                </span>
              </div>
              <button
                onClick={() => navigate('/money-trail')}
                className="px-2.5 py-1 rounded bg-cyber-primary/10 border border-cyber-primary/30 text-[10px] text-cyber-primary hover:bg-cyber-primary hover:text-black transition-colors font-mono"
              >
                Full Workspace →
              </button>
            </div>

            {previewTrail && (
              <CytoscapeGraph
                nodes={previewTrail.nodes}
                edges={previewTrail.edges}
                height="460px"
                onSelectNode={(node) => {
                  if (node) {
                    navigate(`/money-trail?search=${encodeURIComponent(node.masked_account)}`);
                  }
                }}
              />
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-cyber-textMuted font-mono">
              <span>Traced Depth: {previewTrail?.max_depth || 0} Hops</span>
              <span>Nodes: {previewTrail?.nodes.length || 0} Accounts</span>
              <span>Edges: {previewTrail?.edges.length || 0} Directed Flows</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: High-Risk Accounts & Alerts (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="cyber-card rounded-xl p-4 border border-cyber-border/40">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-border/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-cyber-red" />
                <span>High-Risk Accounts</span>
              </span>
              <button onClick={() => navigate('/accounts')} className="text-[10px] text-cyber-primary hover:underline">
                All ({stats?.suspicious_accounts})
              </button>
            </div>

            <div className="space-y-2.5">
              {suspiciousAccounts.map((acc) => (
                <div key={acc.id} className="p-2.5 rounded-lg bg-[#031315]/80 border border-cyber-border/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{acc.account_number_masked}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                      acc.risk_score >= 80 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {acc.risk_score.toFixed(0)} RISK
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-300">{acc.bank_name} • {acc.account_holder_name}</div>
                  
                  {/* Triggers */}
                  <div className="flex flex-wrap gap-1">
                    {acc.detection_rules.slice(0, 2).map((r, idx) => (
                      <span key={idx} className="text-[8px] px-1 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleToggleFreeze(acc.account_id)}
                      className={`text-[9px] px-2 py-0.5 rounded font-mono transition-colors flex items-center space-x-1 ${
                        acc.is_frozen
                          ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
                          : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <Snowflake className="w-2.5 h-2.5" />
                      <span>{acc.is_frozen ? 'DEBIT FROZEN' : 'APPLY LIEN FREEZE'}</span>
                    </button>
                    <button
                      onClick={() => navigate(`/money-trail?search=${encodeURIComponent(acc.account_number_masked)}`)}
                      className="text-[9px] text-cyber-primary hover:underline"
                    >
                      Trace →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Transaction Volume Trend Chart & Fraud Pattern Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 cyber-card rounded-xl p-4 border border-cyber-border/40">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border/30">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-cyber-primary" />
              <span>Fraudulent Transaction Velocity & Volume Timeline</span>
            </span>
            <span className="text-[10px] text-cyber-primary font-mono">7-DAY TELEMETRY</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.daily_volume || []}>
                <defs>
                  <linearGradient id="cyberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020909', borderColor: '#00F5D4', fontSize: '11px', borderRadius: '8px' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Processed Volume']}
                />
                <Area type="monotone" dataKey="amount" stroke="#00F5D4" strokeWidth={2} fillOpacity={1} fill="url(#cyberGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 cyber-card rounded-xl p-4 border border-cyber-border/40">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-border/30">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyber-primary" />
              <span>Fraud Pattern Telemetry</span>
            </span>
            <span className="text-[10px] text-cyber-textMuted font-mono">RULES</span>
          </div>

          <div className="space-y-2.5">
            {stats?.fraud_pattern_breakdown?.map((pat, idx) => (
              <div key={idx} className="p-2 rounded bg-[#031315]/80 border border-cyber-border/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-gray-200 text-[11px]">{pat.name}</div>
                  <div className="text-[9px] text-cyber-textMuted">Algorithm Triggered</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-cyber-primary">{pat.count} clusters</span>
                  <div className="text-[9px] font-mono text-red-400">{pat.risk} Risk</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

