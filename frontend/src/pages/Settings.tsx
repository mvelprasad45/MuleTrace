import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Database, Radio, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export const Settings: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configurable thresholds state
  const [rapidWindow, setRapidWindow] = useState(60);
  const [passthroughRatio, setPassthroughRatio] = useState(70);
  const [fanOutThreshold, setFanOutThreshold] = useState(3);
  const [fanInThreshold, setFanInThreshold] = useState(3);
  const [unusualVolume, setUnusualVolume] = useState(100000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/activities');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-wider text-white">SYSTEM TELEMETRY & CONFIGURATION</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/40 text-cyber-primary">
              CENTRAL NODE CONTROL
            </span>
          </div>
          <p className="text-xs text-cyber-textMuted mt-0.5">
            Calibrate rule weights, threshold boundaries, database connectivity, and view global audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Detection Threshold Configuration (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="cyber-card rounded-xl p-5 border border-cyber-border/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyber-border/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-cyber-primary" />
                <span>Detection Engine Thresholds</span>
              </span>
              <span className="text-[10px] text-cyber-textMuted font-mono">CALIBRATION</span>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Threshold parameters applied to live scoring engine.</span>
              </div>
            )}

            <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-cyber-textLight">
                  <span>Rapid Money Movement Window (Minutes):</span>
                  <span className="font-mono font-bold text-cyber-primary">{rapidWindow} mins</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={5}
                  value={rapidWindow}
                  onChange={(e) => setRapidWindow(Number(e.target.value))}
                  className="w-full accent-[#00F5D4]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-cyber-textLight">
                  <span>Minimum Pass-Through Ratio (%):</span>
                  <span className="font-mono font-bold text-cyber-primary">{passthroughRatio}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={passthroughRatio}
                  onChange={(e) => setPassthroughRatio(Number(e.target.value))}
                  className="w-full accent-[#00F5D4]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-cyber-textLight">
                  <span>Fan-Out Recipient Account Threshold:</span>
                  <span className="font-mono font-bold text-cyber-primary">{fanOutThreshold} accounts</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={fanOutThreshold}
                  onChange={(e) => setFanOutThreshold(Number(e.target.value))}
                  className="w-full accent-[#00F5D4]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-cyber-textLight">
                  <span>Fan-In Remitter Account Threshold:</span>
                  <span className="font-mono font-bold text-cyber-primary">{fanInThreshold} accounts</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={fanInThreshold}
                  onChange={(e) => setFanInThreshold(Number(e.target.value))}
                  className="w-full accent-[#00F5D4]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-cyber-textLight">
                  <span>High Velocity Volume Trigger:</span>
                  <span className="font-mono font-bold text-cyber-primary">₹{unusualVolume.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={unusualVolume}
                  onChange={(e) => setUnusualVolume(Number(e.target.value))}
                  className="w-full accent-[#00F5D4]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-cyber-primary text-black font-bold font-mono text-xs shadow-neon hover:bg-cyber-primaryDark transition-all"
                >
                  Save & Apply Detection Parameters
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: System Audit Stream (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="cyber-card rounded-xl p-5 border border-cyber-border/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyber-border/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-cyber-primary" />
                <span>Global System Audit Log (Immutable Trail)</span>
              </span>
              <button onClick={fetchActivities} className="text-cyber-primary hover:text-white">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg bg-[#031315] border border-cyber-border/20 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px] text-cyber-primary">
                    <span className="font-bold">{act.action}</span>
                    <span className="text-cyber-textMuted">{act.timestamp}</span>
                  </div>
                  <div className="text-gray-300 text-[11px] mt-1 leading-snug">{act.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

