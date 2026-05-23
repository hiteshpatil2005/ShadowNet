import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  Fingerprint, 
  UserPlus, 
  ArrowLeft, 
  Cpu 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { login, register } = useApp();
  
  // Toggle registration state modes
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1); // 1: input details, 2: biometric handshake
  
  // Login input states
  const [username, setUsername] = useState('analyst@shadownet.ai');
  const [password, setPassword] = useState('ShadowNet2026!');
  
  // Registration input states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('SecOps Analyst');
  const [regPassword, setRegPassword] = useState('');
  
  // Common states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Biometric mock verification steps
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('Ready to Scan');

  useEffect(() => {
    let interval;
    if (registrationStep === 2 && scanProgress < 100) {
      interval = setInterval(() => {
        setScanProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            setScanStatus('Handshake Established. Encryption Active.');
            return 100;
          }
          if (next < 30) setScanStatus('Isolating data domain boundaries...');
          else if (next < 60) setScanStatus('Compiling custom RSA keys...');
          else if (next < 85) setScanStatus('Generating immutable analyst ledger...');
          else setScanStatus('Syncing threat databases...');
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [registrationStep, scanProgress]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Please populate all credential vectors.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }
    setError('');
    setRegistrationStep(2); // Go to Biometric Scan screen
  };

  const handleCompleteHandshake = async () => {
    setLoading(true);
    try {
      await register({
        email: regEmail,
        password: regPassword,
        full_name: regName,
        organization_name: 'ShadowNet AI Inc.',
      });
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setRegistrationStep(1);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setRegistrationStep(1);
    setScanProgress(0);
    setError('');
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
            {isRegistering ? (
              <UserPlus className="w-6 h-6 text-cyber-black stroke-[2.5]" />
            ) : (
              <Terminal className="w-6 h-6 text-cyber-black stroke-[2.5]" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase text-center">
            {isRegistering ? 'Enroll Analyst Terminal' : 'ShadowNet AI'}
          </h2>
          <p className="text-[10px] font-mono text-neon-blue uppercase tracking-widest pulse-text mt-1 text-center">
            {isRegistering ? 'CRYPTOGRAPHIC KEY CREATION' : 'CYBER INTELLIGENCE PORTAL'}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-400 rounded-lg p-3 flex items-center gap-2.5 text-xs font-mono mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CONDITION 1: Login Form */}
        {!isRegistering && (
          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                Analyst Identifier (Email)
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                placeholder="analyst@shadownet-ai.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                Secret Passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                placeholder="••••••••••••"
              />
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

            {/* New User Option Link */}
            <div className="pt-3 border-t border-cyber-light/20 flex justify-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[11px] font-mono text-neon-blue hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Analyst? Enlist Terminal</span>
              </button>
            </div>
          </form>
        )}

        {/* CONDITION 2: Register Mode Form */}
        {isRegistering && (
          <div className="relative z-10">
            
            {/* STEP A: Enter details */}
            {registrationStep === 1 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                    Analyst Full Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                    Analyst Registry Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="analyst@shadownet-ai.com"
                    className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                    Security Operations Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full h-10 px-3 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                  >
                    <option value="SecOps Analyst">SecOps Analyst</option>
                    <option value="SecOps Director">SecOps Director</option>
                    <option value="DevOps Specialist">DevOps Specialist</option>
                    <option value="Security Engineer">Security Engineer</option>
                    <option value="L3 Incident Responder">L3 Incident Responder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider mb-1.5">
                    Create Master Passphrase
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="w-full h-10 px-3.5 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded-lg text-xs font-mono text-cyber-text-primary focus:outline-none transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-10 cursor-pointer bg-gradient-to-r from-neon-blue to-neon-purple text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate Handshake Key</span>
                </button>

                <div className="pt-3 border-t border-cyber-light/20 flex justify-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[11px] font-mono text-cyber-text-secondary hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Decryption Portal</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP B: Biometric Scanning & Setup Screen */}
            {registrationStep === 2 && (
              <div className="space-y-6 text-center">
                
                {/* Fingerprint scan animation container */}
                <div className="w-32 h-32 mx-auto rounded-full border border-cyber-light/60 flex items-center justify-center relative bg-cyber-black glow-blue overflow-hidden select-none">
                  
                  {/* Pulse scanline layer */}
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-neon-blue/80 shadow-[0_0_10px_#00f0ff] z-10 transition-all duration-100" 
                    style={{ top: `${Math.abs(Math.sin((scanProgress / 100) * Math.PI) * 100)}%` }}
                  ></div>
                  
                  <Fingerprint 
                    className={`w-16 h-16 transition-all duration-300
                      ${scanProgress < 100 ? 'text-neon-blue animate-pulse' : 'text-emerald-400 scale-110'}
                    `} 
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2.5 py-1 rounded">
                    ENROLLMENT PROGRESS: {scanProgress}%
                  </span>
                  <p className="text-xs font-mono text-cyber-text-primary pt-2 h-4">{scanStatus}</p>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-cyber-black rounded-full h-1.5 border border-cyber-light/40 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>

                {scanProgress >= 100 ? (
                  <button
                    onClick={handleCompleteHandshake}
                    disabled={loading}
                    className="w-full h-10 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-cyber-black border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>Authorize & Enter System</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full h-10 bg-cyber-light/40 text-cyber-text-secondary/50 font-bold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-cyber-light/20"
                  >
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>Analyzing Authentication Data...</span>
                  </button>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setRegistrationStep(1)}
                    className="text-[10px] font-mono text-cyber-text-secondary hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to entry detail adjustment</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-8 text-[9px] font-mono text-cyber-text-secondary/50">
          SHADOWNET SECURED INC. © 2026. ALL THREAT TELEMETRY CONFIDENTIAL.
        </div>
      </div>
    </div>
  );
};

export default Login;
