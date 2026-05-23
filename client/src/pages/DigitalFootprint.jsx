import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Cpu,
  Cloud,
  Search,
  Filter,
  Download,
  ArrowRight,
  ExternalLink,
  Lock,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const safeLower = (v) => (v != null ? String(v).toLowerCase() : '');

const DigitalFootprint = () => {
  const navigate = useNavigate();
  const {
    subdomains,
    credentials,
    cloudExposures,
    navigateToAssetProfile,
    fetchAllData,
    loading,
    initialLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState('subdomains');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const apiServices = useMemo(() => {
    return subdomains
      .filter((s) => {
        const svc = safeLower(s.services);
        return svc.includes('api') || svc.includes('swagger') || svc.includes('rest') || svc.includes('graphql') || svc.includes('jenkins');
      })
      .map((s) => {
        const isVuln = s.riskScore >= 70 || safeLower(s.services).includes('no auth') || safeLower(s.services).includes('unauthenticated');
        return {
          id: s.id,
          endpoint: s.services?.split(',')[0]?.trim() || s.name,
          parent: s.name,
          protocol: s.techStack || 'HTTP',
          version: '—',
          auth: isVuln ? 'Weak / Exposed' : 'Review required',
          status: isVuln ? 'Vulnerable' : s.riskScore >= 50 ? 'Investigating' : 'Secured',
        };
      });
  }, [subdomains]);

  const tabs = [
    { id: 'subdomains', label: 'Subdomains', icon: Globe, count: subdomains.length },
    { id: 'apis', label: 'Services & APIs', icon: Cpu, count: apiServices.length },
    { id: 'credentials', label: 'Leaked Credentials', icon: Lock, count: credentials.length },
    { id: 'cloud', label: 'Cloud Exposures', icon: Cloud, count: cloudExposures.length },
  ];

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

  const filteredSubdomains = useMemo(() => {
    return subdomains.filter((item) => {
      const matchesSearch =
        safeLower(item.name).includes(safeLower(searchTerm)) ||
        safeLower(item.ip).includes(safeLower(searchTerm)) ||
        safeLower(item.services).includes(safeLower(searchTerm));
      const matchesFilter =
        riskFilter === 'ALL' ||
        (riskFilter === 'CRITICAL' && item.riskScore >= 80) ||
        (riskFilter === 'HIGH' && item.riskScore >= 60 && item.riskScore < 80) ||
        (riskFilter === 'MEDIUM' && item.riskScore >= 40 && item.riskScore < 60) ||
        (riskFilter === 'LOW' && item.riskScore < 40);
      return matchesSearch && matchesFilter;
    });
  }, [subdomains, searchTerm, riskFilter]);

  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      const matchesSearch =
        safeLower(item.email).includes(safeLower(searchTerm)) ||
        safeLower(item.owner).includes(safeLower(searchTerm)) ||
        safeLower(item.source).includes(safeLower(searchTerm));
      const matchesFilter = riskFilter === 'ALL' || item.severity === riskFilter;
      return matchesSearch && matchesFilter;
    });
  }, [credentials, searchTerm, riskFilter]);

  const filteredCloud = useMemo(() => {
    return cloudExposures.filter((item) => {
      const matchesSearch =
        safeLower(item.bucketName).includes(safeLower(searchTerm)) ||
        safeLower(item.configurationIssue).includes(safeLower(searchTerm));
      const matchesFilter = riskFilter === 'ALL' || item.riskRating === riskFilter;
      return matchesSearch && matchesFilter;
    });
  }, [cloudExposures, searchTerm, riskFilter]);

  const filteredAPIs = useMemo(() => {
    return apiServices.filter((item) => {
      const matchesSearch =
        safeLower(item.endpoint).includes(safeLower(searchTerm)) ||
        safeLower(item.parent).includes(safeLower(searchTerm));
      const matchesFilter =
        riskFilter === 'ALL' ||
        (riskFilter === 'CRITICAL' && item.status === 'Vulnerable') ||
        (riskFilter === 'HIGH' && item.status === 'Investigating') ||
        (riskFilter === 'LOW' && item.status === 'Secured');
      return matchesSearch && matchesFilter;
    });
  }, [apiServices, searchTerm, riskFilter]);

  const handleExport = () => {
    setExporting(true);
    setExportComplete(false);
    setTimeout(() => {
      setExporting(false);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 4000);
      const payload = { subdomains, credentials, cloudExposures, exportedAt: new Date().toISOString() };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = dataStr;
      downloadAnchor.download = `ShadowNet_Footprint_${activeTab}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 800);
  };

  const handlePivot = (assetId) => {
    if (!assetId) return;
    navigateToAssetProfile(assetId);
    navigate('/asset-profile');
  };

  const isEmpty = !initialLoading && subdomains.length === 0 && credentials.length === 0 && cloudExposures.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
            <Globe className="w-5 h-5 text-neon-blue" />
            <span>Digital Footprint Collection Engine</span>
          </h1>
          <p className="text-xs text-cyber-text-secondary leading-relaxed">
            Subdomains, services, leaked credentials, and cloud exposures from your organization inventory.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAllData()}
            disabled={loading}
            className="px-3.5 py-2 cursor-pointer bg-cyber-gray border border-cyber-light/60 hover:border-neon-blue text-cyber-text-primary rounded-lg text-xs font-semibold font-mono flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || isEmpty}
            className="px-3.5 py-2 cursor-pointer bg-cyber-gray border border-cyber-light/60 hover:border-neon-blue text-cyber-text-primary rounded-lg text-xs font-semibold font-mono flex items-center gap-2"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-neon-blue" />
            )}
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {isEmpty && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5 flex gap-3 text-amber-200 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="space-y-2">
            <p className="font-bold text-amber-300">No footprint data loaded</p>
            <p>Run <code className="text-neon-blue">npm run seed</code> in the <code>server</code> folder, then log in as <strong>analyst@shadownet.ai</strong> / <strong>ShadowNet2026!</strong> and click Refresh.</p>
          </div>
        </div>
      )}

      {exportComplete && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-lg p-3 flex items-center gap-2.5 text-xs font-mono">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Export downloaded successfully.</span>
        </div>
      )}

      <div className="flex flex-wrap border-b border-cyber-light/40 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm('');
            }}
            className={`px-4 py-3 flex items-center gap-2 text-xs font-bold transition-all border-b-2 cursor-pointer
              ${activeTab === tab.id
                ? 'border-neon-blue text-neon-blue bg-neon-blue/5'
                : 'border-transparent text-cyber-text-secondary hover:text-cyber-text-primary'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyber-light rounded text-cyber-text-primary border border-cyber-light/60">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-cyber-dark/40 border border-cyber-light/20 p-4 rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyber-text-secondary" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue/80 focus:outline-none rounded-lg text-xs text-cyber-text-primary font-mono"
          />
        </div>
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

      <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden shadow-2xl">
        {(loading || initialLoading) && (
          <div className="p-12 text-center text-cyber-text-secondary font-mono text-xs animate-pulse">
            Loading footprint telemetry...
          </div>
        )}

        {!loading && !initialLoading && activeTab === 'subdomains' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase">
                  <th className="p-4">Subdomain / IP</th>
                  <th className="p-4">Exposure Level</th>
                  <th className="p-4">Discovery Method</th>
                  <th className="p-4">Active Ports</th>
                  <th className="p-4">Identified Services</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredSubdomains.map((sub) => (
                  <tr key={sub.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 space-y-1">
                      <div className="font-semibold text-cyber-text-primary">{sub.name}</div>
                      <div className="text-[10px] font-mono text-cyber-text-secondary">{sub.ip}</div>
                    </td>
                    <td className="p-4">{getRiskBadge(sub.riskScore)}</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{sub.source}</td>
                    <td className="p-4 font-mono">
                      <div className="flex gap-1.5 flex-wrap">
                        {(sub.ports?.length ? sub.ports : []).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-cyber-light/60 text-neon-blue font-bold text-[9px] border border-cyber-light/60">
                            {p}
                          </span>
                        ))}
                        {!sub.ports?.length && (
                          <span className="text-cyber-text-secondary text-[10px]">{sub.portsDisplay || '—'}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-cyber-text-secondary max-w-sm truncate">{sub.services}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handlePivot(sub.id)}
                        className="px-2.5 py-1 rounded bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/20 text-[10px] font-bold font-mono cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        Investigate
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSubdomains.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cyber-text-secondary font-mono">
                      No subdomains match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !initialLoading && activeTab === 'apis' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase">
                  <th className="p-4">Service / API</th>
                  <th className="p-4">Host</th>
                  <th className="p-4">Stack</th>
                  <th className="p-4">Auth posture</th>
                  <th className="p-4">State</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredAPIs.map((api) => (
                  <tr key={api.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-neon-blue truncate max-w-xs">{api.endpoint}</td>
                    <td className="p-4 font-semibold text-cyber-text-primary">{api.parent}</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{api.protocol}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${api.auth.includes('Exposed') || api.auth.includes('Weak') ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-cyber-light text-cyber-text-secondary'}`}>
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
                        type="button"
                        onClick={() => handlePivot(api.id)}
                        className="px-2 py-1 rounded bg-cyber-light border border-cyber-light hover:border-neon-blue text-cyber-text-primary text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        Audit Host
                        <ExternalLink className="w-3 h-3 text-neon-blue" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAPIs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cyber-text-secondary font-mono">
                      No API or high-risk services found in asset inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !initialLoading && activeTab === 'credentials' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase">
                  <th className="p-4">Email</th>
                  <th className="p-4">Leak source</th>
                  <th className="p-4">Hash type</th>
                  <th className="p-4">Credential</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredCredentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4 font-semibold text-cyber-text-primary">
                      <div>{cred.email}</div>
                      <div className="text-[10px] text-cyber-text-secondary font-mono">Owner: {cred.owner}</div>
                    </td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{cred.source} ({cred.leakDate})</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{cred.hashType}</td>
                    <td className="p-4 font-mono text-red-400">{cred.leakedPassword}</td>
                    <td className="p-4">{getSeverityBadge(cred.severity)}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${cred.verified ? 'bg-red-500/10 text-red-400' : 'bg-cyber-light text-cyber-text-secondary'}`}>
                        {cred.verified ? 'VERIFIED' : 'UNCONFIRMED'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCredentials.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cyber-text-secondary font-mono">
                      No credentials match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !initialLoading && activeTab === 'cloud' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-black/75 border-b border-cyber-light/50 font-mono text-cyber-text-secondary text-[10px] uppercase">
                  <th className="p-4">Cloud asset</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Issue</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-light/20">
                {filteredCloud.map((bucket) => (
                  <tr key={bucket.id} className="hover:bg-cyber-gray/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-cyber-text-primary flex items-center gap-1.5">
                        <Cloud className="w-4 h-4 text-neon-blue" />
                        {bucket.bucketName}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{bucket.cloudProvider || bucket.provider}</td>
                    <td className="p-4 text-cyber-text-secondary text-[11px] max-w-xs">{bucket.configurationIssue}</td>
                    <td className="p-4 font-mono text-cyber-text-secondary">{bucket.region}</td>
                    <td className="p-4">{getSeverityBadge(bucket.riskRating)}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handlePivot(bucket.id)}
                        className="px-2 py-1 rounded bg-red-950/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCloud.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cyber-text-secondary font-mono">
                      No cloud exposures match your filters.
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
