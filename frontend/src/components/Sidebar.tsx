import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  GitFork, 
  Network, 
  AlertOctagon, 
  Link2, 
  Vault, 
  FileCheck2, 
  Settings,
  ShieldAlert
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Complaints', path: '/complaints', icon: FileText, badge: '5 Active' },
  { name: 'Money Trail', path: '/money-trail', icon: GitFork, badge: 'Core' },
  { name: 'Network Analysis', path: '/network', icon: Network },
  { name: 'Suspicious Accounts', path: '/accounts', icon: AlertOctagon, badge: 'High Risk', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40' },
  { name: 'Linked Complaints', path: '/linked-complaints', icon: Link2, badge: 'AI Match' },
  { name: 'Evidence Vault', path: '/evidence', icon: Vault },
  { name: 'Investigation Reports', path: '/reports', icon: FileCheck2 },
  { name: 'System Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#020b0c]/95 border-r border-cyber-border/30 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold tracking-widest text-cyber-textMuted/60 uppercase">
          Investigation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/40 shadow-neon'
                    : 'text-cyber-textMuted hover:text-white hover:bg-cyber-card/60 hover:border hover:border-cyber-border/30'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono tracking-wider ${
                    item.badgeColor || 'bg-cyber-primary/10 text-cyber-primary border-cyber-primary/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Cyber Security Warning & Compliance Footer */}
      <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border/30 text-[11px] space-y-1.5">
        <div className="flex items-center space-x-2 text-cyber-primary font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 text-cyber-primary" />
          <span>LEGAL PROTOCOL</span>
        </div>
        <p className="text-[10px] text-cyber-textMuted leading-relaxed">
          Complement to RBI MuleHunter.AI. Graph anomalies represent investigative leads, not criminal guilt.
        </p>
      </div>
    </aside>
  );
};

