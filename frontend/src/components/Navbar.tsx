import React, { useState } from 'react';
import { Shield, Bell, Search, User as UserIcon, LogOut, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/money-trail?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-[#020909]/90 border-b border-cyber-border/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Demo Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-lg bg-cyber-primary/10 border border-cyber-primary/40 flex items-center justify-center shadow-neon">
            <Shield className="w-5 h-5 text-cyber-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-widest text-white">MULE<span className="text-cyber-primary">TRACE</span></span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 border border-amber-500/40 text-amber-400 rounded tracking-wider animate-pulse">
                DEMO DATA
              </span>
            </div>
            <p className="text-[10px] text-cyber-textMuted tracking-wider hidden sm:block">FINANCIAL CYBERCRIME INTELLIGENCE COMMAND</p>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-cyber-primary/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Complaint ID (e.g. COMP-2026-1001), UTR, or Account..."
            className="w-full bg-[#041618]/90 border border-cyber-border/40 rounded-lg pl-9 pr-4 py-1.5 text-xs text-cyber-textLight placeholder-cyber-textMuted/60 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all font-mono"
          />
        </div>
      </form>

      {/* Right Controls: Notifications, Officer Badge, Logout */}
      <div className="flex items-center space-x-4">
        {/* Live System Status Ping */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span className="font-mono">NETWORK MONITOR: ONLINE</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-cyber-card border border-cyber-border/30 hover:border-cyber-primary/60 text-cyber-textLight transition-all"
          >
            <Bell className="w-4 h-4 text-cyber-primary" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyber-red rounded-full ring-2 ring-[#020909] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyber-red rounded-full ring-2 ring-[#020909]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 cyber-card-glow rounded-xl p-3 border border-cyber-primary/40 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border/30 mb-2">
                <span className="text-xs font-bold text-cyber-primary uppercase tracking-wider">Active Alerts</span>
                <span className="text-[10px] text-cyber-textMuted">Realtime</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-red-950/40 border border-red-500/30 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-300">Rapid Pass-Through Mule Detected</div>
                    <div className="text-[11px] text-gray-300">Account 918273XXXX04 cleared ₹50,000 within 12 mins</div>
                  </div>
                </div>
                <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-300">Cross-Complaint Convergence</div>
                    <div className="text-[11px] text-gray-300">Complaints #1001 & #1002 share Node C (817263XXXX06)</div>
                  </div>
                </div>
                <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-cyan-300">Evidence SHA-256 Verified</div>
                    <div className="text-[11px] text-gray-300">Cryptographic audit log verified without tampering</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-3 pl-2 border-l border-cyber-border/40">
          <div className="w-8 h-8 rounded-full bg-cyber-primary/20 border border-cyber-primary/50 flex items-center justify-center text-cyber-primary">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{user?.full_name || 'Officer In-Charge'}</div>
            <div className="text-[10px] text-cyber-primary/80 font-mono">{user?.badge_number || 'CCU-442'} • {user?.role || 'Officer'}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out of command centre"
            className="p-1.5 rounded-lg text-cyber-textMuted hover:text-cyber-red hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

