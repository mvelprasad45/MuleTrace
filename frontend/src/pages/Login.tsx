import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('officer@muletrace.gov.in');
  const [password, setPassword] = useState('Officer@MuleTrace2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password
      });
      
      // Store token and user data in context and localStorage
      login(response.data.access_token, response.data.user);
      
      // Navigate to the investigation dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.detail || 
                      (err.message === 'Network Error' 
                        ? 'Backend API offline. Ensure FastAPI server is running on port 8000.' 
                        : 'Authentication failed. Please verify credentials.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'admin' | 'officer') => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@muletrace.gov.in');
      setPassword('Admin@CyberTrace2026');
    } else {
      setEmail('officer@muletrace.gov.in');
      setPassword('Officer@MuleTrace2026');
    }
  };

  return (
    <div className="min-h-screen bg-[#020909] bg-grid-cyber flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Cyber Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F5D4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Login Card */}
      <div className="w-full max-w-md cyber-card-glow rounded-2xl p-6 sm:p-8 relative z-10 border border-[#00F5D4]/30 shadow-2xl backdrop-blur-xl">
        {/* Header with Glowing Badge */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 shadow-[0_0_15px_rgba(0,245,212,0.35)] mb-2">
            <Shield className="w-8 h-8 text-[#00F5D4]" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-black tracking-widest text-white">MULE<span className="text-[#00F5D4]">TRACE</span></h1>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 rounded">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-gray-400 tracking-wider">
            AI-POWERED FINANCIAL FRAUD NETWORK INVESTIGATION
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Officer Email / Badge ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#00F5D4]/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@muletrace.gov.in"
                className="w-full bg-[#041618] border border-[#00F5D4]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Secure Access Token</label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-[10px] text-[#00F5D4] hover:underline"
              >
                Forgot access?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#00F5D4]/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#041618] border border-[#00F5D4]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] transition-all font-mono"
              />
            </div>
          </div>

          {/* Access Command Centre Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl btn-cyber-primary flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#00F5D4',
              color: '#020909',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#020909] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="font-extrabold text-[#020909] tracking-wider text-xs sm:text-sm uppercase">
                  Access Command Centre
                </span>
                <ArrowRight className="w-4 h-4 text-[#020909] stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="mt-6 pt-5 border-t border-[#00F5D4]/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00F5D4]" />
              <span>Select Demo Account:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('officer')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                email === 'officer@muletrace.gov.in'
                  ? 'bg-[#00F5D4]/15 border-[#00F5D4] shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                  : 'bg-[#041618] border-gray-700/60 hover:border-[#00F5D4]/50'
              }`}
            >
              <div className="font-bold text-xs text-white">Investigation Officer</div>
              <div className="text-[10px] text-[#00F5D4] font-mono mt-0.5 truncate">officer@muletrace.gov.in</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                email === 'admin@muletrace.gov.in'
                  ? 'bg-[#00F5D4]/15 border-[#00F5D4] shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                  : 'bg-[#041618] border-gray-700/60 hover:border-[#00F5D4]/50'
              }`}
            >
              <div className="font-bold text-xs text-white">Administrator</div>
              <div className="text-[10px] text-[#00F5D4] font-mono mt-0.5 truncate">admin@muletrace.gov.in</div>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="cyber-card-glow max-w-sm w-full p-6 rounded-2xl border border-[#00F5D4]/40 space-y-4">
            <div className="flex items-center space-x-2 text-[#00F5D4] font-bold">
              <KeyRound className="w-5 h-5 text-[#00F5D4]" />
              <span>Demo Security Credentials</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Use either of the two pre-seeded demonstration accounts:
              <br /><br />
              <strong className="text-white">Officer:</strong> <code className="text-[#00F5D4]">officer@muletrace.gov.in</code> / <code className="text-[#00F5D4]">Officer@MuleTrace2026</code>
              <br />
              <strong className="text-white">Admin:</strong> <code className="text-[#00F5D4]">admin@muletrace.gov.in</code> / <code className="text-[#00F5D4]">Admin@CyberTrace2026</code>
            </p>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full py-2 bg-[#00F5D4] text-[#020909] font-bold text-xs rounded-lg hover:bg-[#1affdf] transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
