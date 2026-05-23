import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Cpu, 
  ShieldAlert, 
  Cloud, 
  Search, 
  Filter, 
  Download, 
  ArrowRight,
  ExternalLink,
  Lock,
  Database,
  Terminal,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DigitalFootprint = () => {
  const navigate = useNavigate();
  const { 
    subdomains, 
    credentials, 
    cloudExposures, 
    navigateToAssetProfile 
  } = useApp();

  // Active tab selection
  const [activeTab, setActiveTab] = useState('subdomains');
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  
  // Export status notification state
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Tab definitions
  const tabs = [
    { id: 'subdomains', label: 'Subdomains', icon: Globe, count: subdomains.length },
    { id: 'apis', label: 'Services & APIs', icon: Cpu, count: 5 },
    { id: 'credentials', label: 'Leaked Credentials', icon: Lock, count: credentials.length },
    { id: 'cloud', label: 'Cloud Exposures', icon: Cloud, count: cloudExposures.length }
  ];

  // Helper to get risk badges
  const getRiskBadge = (score) => {
    if (score >= 80) return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40">CRITICAL ({score})</span>;
    if (score >= 60) return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-900/40">HIGH ({score})</span>;
    if (score >= 40) return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40">MEDIUM ({score})</span>;
    return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">LOW ({score})</span>;
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'CRITICAL') return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40">CRITICAL</span>;
    if (sev === 'HIGH') return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-900/40">HIGH</span>;
    if (sev === 'MEDIUM') return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40">MEDIUM</span>;
    return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">LOW</span>;
  };

  // Memoized lists following search terms and filters
  const filteredSubdomains = useMemo(() => {
    return subdomains.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.ip.includes(searchTerm) ||
                            item.services.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = riskFilter === 'ALL' ||
                            (riskFilter === 'CRITICAL' && item.riskScore >= 80) ||
                            (riskFilter === 'HIGH' && item.riskScore >= 60 && item.riskScore < 80) ||
                            (riskFilter === 'MEDIUM' && item.riskScore >= 40 && item.riskScore < 60) ||
                            (riskFilter === 'LOW' && item.riskScore < 40);
      return matchesSearch && matchesFilter;
    });
  }, [subdomains, searchTerm, riskFilter]);

  const filteredCredentials = useMemo(() => {
    return credentials.filter(item => {
      const matchesSearch = item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.source.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = riskFilter === 'ALL' || item.severity === riskFilter;
      return matchesSearch && matchesFilter;
    });
  }, [credentials, searchTerm, riskFilter]);

  const filteredCloud = useMemo(() => {
    return cloudExposures.filter(item => {
      const matchesSearch = item.bucketName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.configurationIssue.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = riskFilter === 'ALL' || item.riskRating === riskFilter;
      return matchesSearch && matchesFilter;
    });
  }, [cloudExposures, searchTerm, riskFilter]);

  // Compiled API endpoints and ports
  const apiEndpoints = [
    { endpoint: '/v1/users', protocol: 'REST / JSON', version: 'v2.1', auth: 'None (Unauthenticated)', status: 'Vulnerable', parent: 'api-dev.shadownet-ai.com' },
    { endpoint: '/oauth/token', protocol: 'OAuth2 Gateway', version: 'v1.4', auth: 'Basic Client Secret', status: 'Secured', parent: 'vpn.shadownet-ai.com' },
    { endpoint: '/debug/dump', protocol: 'GraphQL Endpoint', version: 'v3.0.1', auth: 'None (Bypassed)', status: 'Vulnerable', parent: 'api-dev.shadownet-ai.com' },
    { endpoint: '/billing/checkout', protocol: 'REST / JWT', version: 'v1.0.2', auth: 'Bearer Session', status: 'Investigating', parent: 'billing.shadownet-ai.com' },
    { endpoint: '/v2/admin/config', protocol: 'REST / XML', version: 'v1.1', auth: 'Hardcoded (Leaked Key)', status: 'Vulnerable', parent: 'gitlab.shadownet-ai.com' }
  ];

  const filteredAPIs = useMemo(() => {
    return apiEndpoints.filter(item => {
      const matchesSearch = item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.parent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = riskFilter === 'ALL' || 
                            (riskFilter === 'CRITICAL' && item.status === 'Vulnerable') ||
                            (riskFilter === 'HIGH' && item.status === 'Investigating') ||
                            (riskFilter === 'LOW' && item.status === 'Secured');
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, riskFilter]);

  // Export action handler
  const handleExport = (format) => {
    setExporting(true);
    setExportComplete(false);

    // Simulate standard intelligence ledger bundling
    setTimeout(() => {
      setExporting(false);
      setExportComplete(true);
      
      // Auto dismiss success notice after 4 seconds
      setTimeout(() => setExportComplete(false), 4000);
      
      // Trigger native download simulation
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ subdomains, credentials, cloudExposures }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ShadowNet_Intel_Export_${activeTab}_2026.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1500);
  };

  const handlePivot = (subId) => {
    navigateToAssetProfile(subId);
    navigate('/asset-profile');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
            <Globe className="w-5 h-5 text-neon-blue" />
            <span>Digital Footprint Collection Engine</span>
          </h1>
          <p className="text-xs text-cyber-text-secondary leading-relaxed">
            Continuous reconnaissance mapping internet-exposed subdomains, discovered protocols, credentials leaked on dark web panels, and unsecured cloud storage.
          </p>
        </div>

        {/* Exporter triggers */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-3.5 py-2 cursor-pointer bg-cyber-gray border border-cyber-light/60 hover:border-neon-blue text-cyber-text-primary rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-all duration-200"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="w-3.5 h-3.5 text-neon-blue" />
            )}
            <span>Export Intel Ledger</span>
          </button>
        </div>
      </div>

      {/* Export Notifications */}
      {exportComplete && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-lg p-3 flex items-center gap-2.5 text-xs font-mono glow-blue">
          <CheckCircle className="w-4 h-4 shrink-0 animate-pulse" />
          <span>Ledger Compiled Successfully! Downloader triggered in background. (ShadowNet_Intel_Export_{activeTab}_2026.json)</span>
        </div>
      )}

      {/* Tabs navigation row */}
      <div className="flex flex-wrap border-b border-cyber-light/40 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm('');
            }}
            className={`px-4 py-3 flex items-center gap-2 text-xs font-bold transition-all border-b-2 cursor-pointer
              ${activeTab === tab.id 
                ? 'border-neon-blue text-neon-blue bg-neon-blue/5' 
                : 'border-transparent text-cyber-text-secondary hover:text-cyber-text-primary'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyber-light rounded text-cyber-text-primary border border-cyber-light/60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Inline Search and Filtering widgets */}
      <div className="flex flex-col md:flex-row gap-4 bg-cyber-dark/40 border border-cyber-light/20 p-4 rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyber-text-secondary" />
          <input
            type="text"
            placeholder={`Search across ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue/80 focus:outline-none rounded-lg text-xs text-cyber-text-primary font-mono"
          />
        </div>

        {/* Severity filtration selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-cyber-text-secondary" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-10 bg-cyber-black border border-cyber-light/60 rounded-lg text-xs text-cyber-text-primary px-3 focus:border-neon-blue focus:outline-none font-mono"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Data Render Tables */}
      <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden shadow-2xl">
        
        {/* SUBDOMAINS TAB */}
        {activeTab === 'subdomains' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase select-none">
                  <th className="p-4">Subdomain / IP</th>
                  <th className="p-4">Exposure Level</th>
                  <th className="p-4">Discovery Method</th>
                  <th className="p-4">Active Port Range</th>
                  <th className="p-4">Identified Services</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredSubdomains.map((sub) => (
                  <tr key={sub.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 space-y-1">
                      <div className="font-semibold text-cyber-text-primary flex items-center gap-1.5">
                        <span>{sub.name}</span>
                        <span className="text-[9px] font-mono text-cyan-400/80">({sub.cloudProvider})</span>
                      </div>
                      <div className="text-[10px] font-mono text-cyber-text-secondary">{sub.ip}</div>
                    </td>
                    <td className="p-4">{getRiskBadge(sub.riskScore)}</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{sub.source}</td>
                    <td className="p-4 font-mono">
                      <div className="flex gap-1.5 flex-wrap">
                        {sub.ports.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-cyber-light/60 text-neon-blue font-bold text-[9px] border border-cyber-light/60">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-cyber-text-secondary truncate max-w-sm">{sub.services}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handlePivot(sub.id)}
                        className="px-2.5 py-1 rounded bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/20 text-[10px] font-bold font-mono transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSubdomains.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-cyber-text-secondary font-mono">
                      No matching subdomain telemetry found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SERVICES AND APIS TAB */}
        {activeTab === 'apis' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase select-none">
                  <th className="p-4">API Endpoint</th>
                  <th className="p-4">Parent Exposed Domain</th>
                  <th className="p-4">Gateway Tech</th>
                  <th className="p-4">Authentication Schema</th>
                  <th className="p-4">Exposure State</th>
                  <th className="p-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredAPIs.map((api, idx) => (
                  <tr key={idx} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-neon-blue">{api.endpoint}</td>
                    <td className="p-4 font-semibold text-cyber-text-primary">{api.parent}</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{api.protocol} ({api.version})</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono
                        ${api.auth.includes('None') ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-cyber-light text-cyber-text-secondary'}
                      `}>
                        {api.auth}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold
                        ${api.status === 'Vulnerable' ? 'bg-red-500/10 text-red-400' : ''}
                        ${api.status === 'Investigating' ? 'bg-orange-500/10 text-orange-400' : ''}
                        ${api.status === 'Secured' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                      `}>
                        {api.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handlePivot("sub-3")}
                        className="px-2 py-1 rounded bg-cyber-light border border-cyber-light hover:border-neon-blue text-cyber-text-primary text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Audit Host</span>
                        <ExternalLink className="w-3 h-3 text-neon-blue" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAPIs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-cyber-text-secondary font-mono">
                      No matching API endpoint telemetry found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LEAKED CREDENTIALS TAB */}
        {activeTab === 'credentials' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase select-none">
                  <th className="p-4">Identified Email</th>
                  <th className="p-4">Platform Leak Source</th>
                  <th className="p-4">Credential Schema</th>
                  <th className="p-4">Plaintext / Cracking Telemetry</th>
                  <th className="p-4">Security Severity</th>
                  <th className="p-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredCredentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 font-semibold text-cyber-text-primary space-y-0.5">
                      <div>{cred.email}</div>
                      <div className="text-[10px] text-cyber-text-secondary font-mono">Owner: {cred.owner}</div>
                    </td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{cred.source} ({cred.leakDate})</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{cred.hashType}</td>
                    <td className="p-4 font-mono">
                      <span className="text-red-400 font-bold bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                        {cred.leakedPassword}
                      </span>
                    </td>
                    <td className="p-4">{getSeverityBadge(cred.severity)}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold
                        ${cred.verified ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyber-light text-cyber-text-secondary'}
                      `}>
                        {cred.verified ? 'VERIFIED AD ACTIVE' : 'UNCONFIRMED'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCredentials.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-cyber-text-secondary font-mono">
                      No matching credentials harvested.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CLOUD EXPOSURES TAB */}
        {activeTab === 'cloud' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase select-none">
                  <th className="p-4">Target Cloud Asset</th>
                  <th className="p-4">Provider Platform</th>
                  <th className="p-4">Exposure Configuration Issue</th>
                  <th className="p-4">PII Record Count</th>
                  <th className="p-4">Security Severity</th>
                  <th className="p-4 text-right">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredCloud.map((bucket) => (
                  <tr key={bucket.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 space-y-1">
                      <div className="font-semibold text-cyber-text-primary flex items-center gap-1.5">
                        <Cloud className="w-4 h-4 text-neon-blue" />
                        <span>{bucket.bucketName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-cyber-text-secondary">
                        Exposed Files: {bucket.filesExposed.map(f => f.name).join(', ')}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{bucket.provider}</td>
                    <td className="p-4 text-cyber-text-secondary text-[11px] leading-relaxed max-w-xs">{bucket.configurationIssue}</td>
                    <td className="p-4 font-mono font-bold text-red-400">{bucket.piiCount.toLocaleString()} Records</td>
                    <td className="p-4">{getSeverityBadge(bucket.riskRating)}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handlePivot("sub-6")}
                        className="px-2 py-1 rounded bg-red-950/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-[10px] font-mono font-bold transition-all cursor-pointer"
                      >
                        Block Bucket
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCloud.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-cyber-text-secondary font-mono">
                      No unsecured cloud buckets detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default DigitalFootprint;
