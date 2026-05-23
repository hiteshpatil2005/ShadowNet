import React, { useState } from 'react';
import { Terminal, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { setIsAuthenticated } = useApp();
  const [username, setUsername] = useState('analyst@shadownet.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate threat registry loading sequences
    setTimeout(() => {
      setLoading(false);
      setIsAuthenticated(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center relative cyber-grid px-4">
      {/* Dynamic glow design background */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-neon-blue/5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-purple/5 blur-3xl"></div>
      
      <div className="w-full max-w-md bg-cyber-dark/90 border border-cyber-light/60 p-8 rounded-xl shadow-2xl relative glow-blue overflow-hidden">
        
        {/* Futuristic scanline element */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-linear-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>

        {/* Security Platform Banner */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center glow-blue mb-4">
            <Terminal className="w-6 h-6 text-cyber-black stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase">
            SHADOWNET AI
          </h2>
          <p className="text-[10px] font-mono text-neon-blue uppercase tracking-widest pulse-text mt-1">
            CYBER INTELLIGENCE PORTAL
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
              Analyst Identifier (Email)
            </label>
            <div className="relative">
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                placeholder="analyst@shadownet-ai.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
              Secret Passphrase
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Secure Handshake Notification */}
          <div className="bg-cyber-gray border border-cyber-light/30 rounded-lg p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-cyber-text-primary uppercase tracking-wide">
                Secure Handshake Active
              </span>
              <span className="text-[9px] text-cyber-text-secondary font-mono mt-0.5 leading-relaxed">
                Platform matches certificates over SSL and logs analyst sessions in an immutable ledger.
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-900/50 text-red-400 rounded-lg p-3 flex items-center gap-2.5 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 cursor-pointer bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue hover:to-neon-blue text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all duration-250 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-cyber-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Initialize Decryption</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center mt-8 text-[9px] font-mono text-cyber-text-secondary/50">
          SHADOWNET SECURED INC. © 2026. ALL THREAT TELEMETRY CONFIDENTIAL.
        </div>
      </div>
    </div>
  );
};

export default Login;
