import React, { useState } from 'react';
import { 
  UserCheck, 
  Database, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Share2, 
  Save, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AssetProfile = () => {
  const { selectedAssetId, subdomains, credentials, logs, setLogs } = useApp();

  // Find the selected subdomain in our database
  const activeAsset = subdomains.find(s => s.id === selectedAssetId) || subdomains[1]; // fallback to vpn

  // Accordion active toggles
  const [certOpen, setCertOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [cveOpen, setCveOpen] = useState(true);

  // Analyst Notepad State
  const [noteContent, setNoteContent] = useState('');
  const [localNotes, setLocalNotes] = useState([
    { timestamp: "2026-05-22T19:30:00Z", author: "Sarah Jenkins", text: "Verified that SMB port 445 on vpn endpoint is indeed leaking Samba 4.1 banners. Initiated firewall block queue." },
    { timestamp: "2026-05-23T04:15:00Z", author: "Sarah Jenkins", text: "Coordinating with DevOps team (Hitesh Patil) to force credential rotations on Jenkins gateway." }
  ]);

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote = {
      timestamp: new Date().toISOString(),
      author: "Sarah Jenkins",
      text: noteContent.trim()
    };

    setLocalNotes(prev => [newNote, ...prev]);

    // Hook it back into the global log feed so other pages can see the action!
    const newGlobalLog = {
      id: `log-analyst-note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: "Analyst Note Committed",
      details: `SecOps Director added note to asset profile '${activeAsset.name}': '${noteContent.trim().substring(0, 40)}...'`,
      severity: "INFO",
      status: "Closed"
      
    };
    setLogs(prev => [newGlobalLog, ...prev]);
    
    setNoteContent('');
  };

  // Find associated leaked credential if any
  const associatedCred = credentials.find(c => 
    c.email.includes(activeAsset.name.replace('vpn.', '').replace('api-dev.', '').replace('staging.', ''))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-neon-blue" />
          <span>Detailed Exposed Asset Profile: {activeAsset.name}</span>
        </h1>
        <p className="text-xs text-cyber-text-secondary leading-relaxed font-mono">
          System Registry ID: {activeAsset.id} • Scanning Target: {activeAsset.ip}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Metadata and Accordions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Primary Metadata Block */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-cyber-light/20 pb-3">
              <Database className="w-4.5 h-4.5 text-neon-blue" />
              <span>Asset Infrastructure Metadata</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-cyber-light/20">
                <span className="text-cyber-text-secondary">Fully Qualified Domain:</span>
                <span className="text-cyber-text-primary font-bold">{activeAsset.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-light/20">
                <span className="text-cyber-text-secondary">Target IPv4 Host:</span>
                <span className="text-cyber-text-primary font-bold text-cyan-400">{activeAsset.ip}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-light/20">
                <span className="text-cyber-text-secondary">Host Platform Cloud:</span>
                <span className="text-cyber-text-primary font-bold">{activeAsset.cloudProvider}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-light/20">
                <span className="text-cyber-text-secondary">Discovery Technique:</span>
                <span className="text-cyber-text-primary font-bold text-neon-blue">{activeAsset.source}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-light/20 sm:col-span-2">
                <span className="text-cyber-text-secondary">Identified Software Suite:</span>
                <span className="text-cyber-text-primary truncate font-bold text-orange-400">{activeAsset.services}</span>
              </div>
            </div>
          </div>

          {/* Accordion Panels */}
          <div className="space-y-4">
            
            {/* Accordion 1: SSL/TLS Certificate Registry */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden">
              <button 
                onClick={() => setCertOpen(!certOpen)}
                className="w-full px-5 py-4 cursor-pointer flex items-center justify-between font-bold text-xs uppercase tracking-wider text-cyber-text-primary hover:bg-cyber-gray/30 transition-colors select-none"
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  <span>SSL / TLS Certificate Encryption Metrics</span>
                </div>
                {certOpen ? <ChevronUp className="w-4 h-4 text-cyber-text-secondary" /> : <ChevronDown className="w-4 h-4 text-cyber-text-secondary" />}
              </button>

              {certOpen && (
                <div className="p-5 border-t border-cyber-light/20 font-mono text-xs space-y-3 bg-cyber-black/25 leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between border-b border-cyber-light/10 py-1.5">
                      <span className="text-cyber-text-secondary text-[10px]">Issuer Authority:</span>
                      <span className="text-cyber-text-primary">Let's Encrypt Authority X3</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-light/10 py-1.5">
                      <span className="text-cyber-text-secondary text-[10px]">Encryption Key size:</span>
                      <span className="text-cyber-text-primary">RSA 2048 Bits (SHA256)</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-light/10 py-1.5">
                      <span className="text-cyber-text-secondary text-[10px]">Valid Registry:</span>
                      <span className="text-emerald-400 font-bold">Valid (Active)</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-light/10 py-1.5">
                      <span className="text-cyber-text-secondary text-[10px]">Expiration Limit:</span>
                      <span className="text-cyber-text-primary">In 78 Days (Expires Aug 2026)</span>
                    </div>
                  </div>
                  {activeAsset.riskScore >= 80 && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded p-3 flex items-start gap-2 text-[10px] text-red-300">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Warning: Critical CVE mappings resolvable on this server override TLS encryption validity. Mitigate host immediately.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Historical Exposure Evolution Logs */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden">
              <button 
                onClick={() => setHistoryOpen(!historyOpen)}
                className="w-full px-5 py-4 cursor-pointer flex items-center justify-between font-bold text-xs uppercase tracking-wider text-cyber-text-primary hover:bg-cyber-gray/30 transition-colors select-none"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neon-blue" />
                  <span>Historical Asset Exposure Timeline Logs</span>
                </div>
                {historyOpen ? <ChevronUp className="w-4 h-4 text-cyber-text-secondary" /> : <ChevronDown className="w-4 h-4 text-cyber-text-secondary" />}
              </button>

              {historyOpen && (
                <div className="p-5 border-t border-cyber-light/20 font-mono text-xs bg-cyber-black/25 space-y-4">
                  
                  <div className="relative border-l border-cyber-light/40 pl-6 space-y-4 ml-2">
                    
                    <div className="relative">
                      <span className="absolute -left-8.5 top-0.5 w-4 h-4 rounded-full bg-neon-blue border border-cyber-black flex items-center justify-center text-[7px] text-cyber-black font-bold">1</span>
                      <div className="text-[10px] text-cyber-text-secondary">May 23, 2026 • 08:00 AM</div>
                      <h4 className="text-xs font-bold text-cyber-text-primary mt-0.5">Asset Re-indexed & Monitored</h4>
                      <p className="text-[10px] text-cyber-text-secondary mt-0.5">Active crawler verifies open ports {activeAsset.ports.join(', ')} and matches running Nginx payloads.</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-8.5 top-0.5 w-4 h-4 rounded-full bg-orange-500 border border-cyber-black flex items-center justify-center text-[7px] text-cyber-black font-bold">2</span>
                      <div className="text-[10px] text-cyber-text-secondary">May 18, 2026 • 04:30 PM</div>
                      <h4 className="text-xs font-bold text-cyber-text-primary mt-0.5">Telemetry Scopes Modified</h4>
                      <p className="text-[10px] text-cyber-text-secondary mt-0.5">Public subdomain exposure risk increased by +25 due to credentials correlated on breach forums.</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-8.5 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border border-cyber-black flex items-center justify-center text-[7px] text-cyber-black font-bold">3</span>
                      <div className="text-[10px] text-cyber-text-secondary">May 01, 2026 • 10:12 AM</div>
                      <h4 className="text-xs font-bold text-cyber-text-primary mt-0.5">First Discovered Exposure</h4>
                      <p className="text-[10px] text-cyber-text-secondary mt-0.5">Asset identified through active DNS AXFR records scanning.</p>
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Accordion 3: Associated Threat Correlations */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden">
              <button 
                onClick={() => setCveOpen(!cveOpen)}
                className="w-full px-5 py-4 cursor-pointer flex items-center justify-between font-bold text-xs uppercase tracking-wider text-cyber-text-primary hover:bg-cyber-gray/30 transition-colors select-none"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Associated Credential & Toxic Vulnerability Links</span>
                </div>
                {cveOpen ? <ChevronUp className="w-4 h-4 text-cyber-text-secondary" /> : <ChevronDown className="w-4 h-4 text-cyber-text-secondary" />}
              </button>

              {cveOpen && (
                <div className="p-5 border-t border-cyber-light/20 font-mono text-xs bg-cyber-black/25 space-y-4">
                  {associatedCred ? (
                    <div className="p-3.5 rounded bg-red-950/20 border border-red-900/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
                        <span className="text-red-400 font-bold uppercase">Toxic Credential Correlation Detected</span>
                      </div>
                      <p className="text-[11px] text-cyber-text-secondary leading-relaxed">
                        The email domain user <span className="text-cyber-text-primary font-bold">{associatedCred.email}</span> ({associatedCred.owner}) has verified plaintext credentials exposed on breach forums that authorize access on this asset scope.
                      </p>
                      <div className="text-[10px] text-red-300">
                        Exposed pass: <span className="font-bold">{associatedCred.leakedPassword}</span> • Risk Confidence: 95%
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-cyber-text-secondary">
                      No directly authorized dark web credential correlations parsed for this subdomain.
                    </div>
                  )}

                  {/* Vulnerability mapping summaries */}
                  <div className="p-3 bg-cyber-black border border-cyber-light/30 rounded space-y-1.5">
                    <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Known Active CVE Scans</span>
                    <h4 className="text-xs font-bold text-cyber-text-primary">CVE-2023-46805: VPN Session Hijack bypass</h4>
                    <p className="text-[10px] text-cyber-text-secondary leading-relaxed">Allows an attacker to bypass authentication scopes and traverse internal active directories. Confirmed in simulator paths.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: SecOps Analyst Notepad */}
        <div className="space-y-6">
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4 flex flex-col h-full justify-between">
            
            <div className="space-y-4">
              <div className="space-y-1 border-b border-cyber-light/20 pb-3">
                <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Save className="w-4.5 h-4.5 text-neon-blue" />
                  <span>SecOps Investigation Notepad</span>
                </span>
                <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                  Record investigations notes directly to this asset. Committed notes append to public platform logs.
                </p>
              </div>

              {/* notepad entry form */}
              <form onSubmit={handleSaveNote} className="space-y-3 font-mono text-xs">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record credentials verification steps, firewall overrides, or team actions taken..."
                  className="w-full h-32 p-3 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded focus:outline-none text-cyber-text-primary font-sans placeholder:text-cyber-text-secondary/40 text-xs"
                />
                
                <button
                  type="submit"
                  className="w-full h-9 cursor-pointer bg-neon-blue text-cyber-black font-bold uppercase tracking-wider text-[11px] rounded transition-all duration-200 hover:bg-cyan-400 active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Commit Note to Audit Log</span>
                </button>
              </form>

              {/* Local committed notes feed list */}
              <div className="space-y-3 border-t border-cyber-light/20 pt-4 max-h-60 overflow-y-auto">
                <span className="text-[9px] font-mono text-cyber-text-secondary uppercase tracking-widest font-bold block">Audit Note Ledger</span>
                
                {localNotes.map((note, index) => (
                  <div key={index} className="p-3 bg-cyber-black border border-cyber-light/30 rounded font-sans text-xs space-y-1 leading-relaxed">
                    <div className="flex items-center justify-between text-[9px] font-mono text-cyber-text-secondary">
                      <span className="font-bold text-neon-blue">{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-cyber-text-primary text-[11px]">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AssetProfile;
