import React, { useState, useEffect, useMemo } from 'react';
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
import { assetsAPI, tiAPI } from '../services/api';

const mapAssetFromApi = (a) => ({
  id: a._id,
  name: a.asset_value,
  ip: a.ip || 'N/A',
  ports: Array.isArray(a.ports) ? a.ports : (a.ports ? String(a.ports).split(',').map(p => p.trim()) : []),
  riskScore: a.risk_score || 0,
  riskLevel: a.risk_level || 'medium',
  services: a.services || 'N/A',
  firstSeen: a.first_discovered ? new Date(a.first_discovered).toLocaleDateString() : 'N/A',
  lastSeen: a.last_seen ? new Date(a.last_seen).toLocaleDateString() : 'N/A',
  source: (a.sources || []).join(', ') || 'N/A',
  sslExpiry: a.metadata?.ssl_expiry || 'N/A',
  techStack: a.metadata?.tech_stack || 'N/A',
  cloudProvider: a.cloud_provider || a.metadata?.cloud_provider || 'Self-Hosted',
  notes: a.notes || '',
  raw: a,
});

const AssetProfile = () => {
  const { selectedAssetId, subdomains, cloudExposures, credentials, logs, setLogs, user } = useApp();
  const [apiAsset, setApiAsset] = useState(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [cveIntel, setCveIntel] = useState(null);
  const [ipIntel, setIpIntel] = useState(null);

  const listAsset = useMemo(() => {
    const fromList = [...subdomains, ...cloudExposures.map(c => ({
      id: c.id,
      name: c.bucketName,
      ip: 'N/A',
      ports: [],
      riskScore: c.riskScore,
      riskLevel: c.riskRating?.toLowerCase() || 'high',
      services: c.configurationIssue,
      source: 'Cloud Scan',
      cloudProvider: c.cloudProvider,
    }))];
    return fromList.find(s => s.id === selectedAssetId) || fromList[0] || null;
  }, [selectedAssetId, subdomains, cloudExposures]);

  useEffect(() => {
    if (!selectedAssetId) {
      setApiAsset(null);
      return;
    }
    let cancelled = false;
    setAssetLoading(true);
    assetsAPI.getAsset(selectedAssetId)
      .then(res => {
        if (!cancelled && res.data) setApiAsset(mapAssetFromApi(res.data));
      })
      .catch(() => {
        if (!cancelled) setApiAsset(null);
      })
      .finally(() => {
        if (!cancelled) setAssetLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedAssetId]);

  const activeAsset = apiAsset || listAsset;

  // Accordion active toggles
  const [certOpen, setCertOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [cveOpen, setCveOpen] = useState(true);

  // Analyst Notepad State
  const [noteContent, setNoteContent] = useState('');
  const [localNotes, setLocalNotes] = useState([]);

  const cveFromServices = useMemo(() => {
    const text = `${activeAsset?.services || ''} ${activeAsset?.raw?.metadata?.cves || ''}`;
    const match = text.match(/CVE-\d{4}-\d+/i);
    return match ? match[0].toUpperCase() : (activeAsset?.raw?.metadata?.primary_cve || null);
  }, [activeAsset]);

  useEffect(() => {
    if (!cveFromServices) {
      setCveIntel(null);
      return;
    }
    let cancelled = false;
    tiAPI.lookupCVE(cveFromServices)
      .then(res => { if (!cancelled) setCveIntel(res.data); })
      .catch(() => { if (!cancelled) setCveIntel(null); });
    return () => { cancelled = true; };
  }, [cveFromServices]);

  useEffect(() => {
    const ip = activeAsset?.ip;
    if (!ip || ip === 'N/A' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      setIpIntel(null);
      return;
    }
    let cancelled = false;
    tiAPI.enrichIP(ip)
      .then(res => { if (!cancelled) setIpIntel(res.data); })
      .catch(() => { if (!cancelled) setIpIntel(null); });
    return () => { cancelled = true; };
  }, [activeAsset?.ip]);

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote = {
      timestamp: new Date().toISOString(),
      author: user?.name || "Analyst",
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
  const associatedCred = activeAsset ? credentials.find(c => {
    const domain = activeAsset.name?.split('.').slice(-2).join('.');
    return domain && c.email?.includes(domain);
  }) : null;

  const portsDisplay = Array.isArray(activeAsset?.ports)
    ? activeAsset.ports.join(', ')
    : (activeAsset?.ports || 'N/A');

  if (!activeAsset) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-cyber-text-secondary font-mono text-sm">
        <Database className="w-10 h-10 mb-4 opacity-40" />
        <p>No asset selected. Open Digital Footprint or the Infrastructure Graph and pivot to an asset profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-neon-blue" />
          <span>Detailed Exposed Asset Profile: {activeAsset.name}</span>
          {assetLoading && <span className="text-[10px] text-neon-blue font-mono normal-case">syncing…</span>}
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
                      <p className="text-[10px] text-cyber-text-secondary mt-0.5">Active crawler verifies open ports {portsDisplay} and matches running service banners.</p>
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
                        Source: <span className="font-bold">{associatedCred.source}</span> • Severity: {associatedCred.severity}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-cyber-text-secondary">
                      No directly authorized dark web credential correlations parsed for this subdomain.
                    </div>
                  )}

                  {cveIntel?.found && (
                    <div className="p-3 bg-cyber-black border border-cyber-light/30 rounded space-y-1.5">
                      <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">NVD CVE Intelligence</span>
                      <h4 className="text-xs font-bold text-cyber-text-primary">{cveIntel.cve_id} — {cveIntel.severity || 'UNRATED'} ({cveIntel.cvss_score ?? 'N/A'})</h4>
                      <p className="text-[10px] text-cyber-text-secondary leading-relaxed">{cveIntel.description?.slice(0, 280)}…</p>
                    </div>
                  )}

                  {ipIntel?.ripestat && (
                    <div className="p-3 bg-cyber-black border border-cyber-light/30 rounded space-y-1.5">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">RIPEstat Network Context</span>
                      <p className="text-[10px] text-cyber-text-secondary">
                        {ipIntel.ripestat.holder || 'Unknown holder'} • {ipIntel.ripestat.country || '—'} • {ipIntel.ripestat.asn || '—'}
                      </p>
                    </div>
                  )}

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
