import React, { useState, useEffect } from 'react';
import { Eye, Bell, Plus, Trash2, ToggleLeft, ToggleRight, Radio, RefreshCw, Target, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { monitoringAPI } from '../services/api';

const ContinuousMonitoring = () => {
  const {
    logs,
    monitoringRules,
    addMonitoringRule,
    toggleMonitoringRule,
    deleteMonitoringRule,
    fetchAllData,
    loading,
  } = useApp();

  const [scanTargets, setScanTargets] = useState([]);
  const [newTarget, setNewTarget] = useState('');
  const [scanMeta, setScanMeta] = useState(null);
  const [scanRunning, setScanRunning] = useState(false);

  const loadTargets = async () => {
    try {
      const res = await monitoringAPI.getTargets();
      setScanTargets(res.data?.targets || []);
      setScanMeta(res.data);
    } catch {}
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (!newTarget.trim()) return;
    await monitoringAPI.addTarget(newTarget.trim());
    setNewTarget('');
    await loadTargets();
  };

  const handleDeleteTarget = async (id) => {
    await monitoringAPI.deleteTarget(id);
    await loadTargets();
  };

  const handleRunScan = async () => {
    setScanRunning(true);
    try {
      await monitoringAPI.runScan();
      await fetchAllData();
      await loadTargets();
    } finally {
      setScanRunning(false);
    }
  };

  // Add rule inputs
  const [newKeyword, setNewKeyword] = useState('');
  const [newType, setNewType] = useState('Domain Lookup');
  const [formError, setFormError] = useState('');

  // Webhook Integrations states
  const [slackActive, setSlackActive] = useState(true);
  const [teamsActive, setTeamsActive] = useState(false);
  const [emailActive, setEmailActive] = useState(true);

  // Filter logs by severity
  const [logSeverityFilter, setLogSeverityFilter] = useState('ALL');

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) {
      setFormError('Keyword cannot be empty.');
      return;
    }
    
    addMonitoringRule(newKeyword.trim(), newType);
    setNewKeyword('');
    setFormError('');
  };

  const filteredLogs = logs.filter(log => {
    if (logSeverityFilter === 'ALL') return true;
    return log.severity === logSeverityFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <Eye className="w-5 h-5 text-neon-blue animate-pulse" />
          <span>Continuous Exposure Monitoring Portal</span>
        </h1>
        <p className="text-xs text-cyber-text-secondary leading-relaxed">
          Add domains or IPs for continuous TI scanning. Results are stored in MongoDB and appear across the platform.
        </p>
      </div>

      <div className="bg-cyber-dark border border-neon-blue/30 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" />
              Continuous scan targets
            </h2>
            <p className="text-[10px] text-cyber-text-secondary mt-1 font-mono">
              Last scan: {scanMeta?.last_scan_at ? new Date(scanMeta.last_scan_at).toLocaleString() : 'Never'} • Status: {scanMeta?.last_scan_status || 'idle'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={scanRunning || scanTargets.length === 0}
            className="px-4 py-2 bg-neon-blue text-cyber-black font-bold text-xs uppercase rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            {scanRunning ? 'Scanning…' : 'Run scan now'}
          </button>
        </div>
        <form onSubmit={handleAddTarget} className="flex gap-2">
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="example.com or 1.2.3.4"
            className="flex-1 h-9 px-3 bg-cyber-black border border-cyber-light/60 rounded-lg text-xs font-mono text-cyber-text-primary focus:border-neon-blue focus:outline-none"
          />
          <button type="submit" className="px-4 h-9 bg-cyber-gray border border-cyber-light/60 rounded-lg text-xs font-bold text-neon-blue cursor-pointer">
            Add target
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {scanTargets.map((t) => (
            <span key={t._id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-black border border-cyber-light/40 text-[10px] font-mono">
              <span className="text-cyan-400">{t.type}</span>
              <span className="text-cyber-text-primary">{t.target}</span>
              <button type="button" onClick={() => handleDeleteTarget(t._id)} className="text-red-400 hover:text-red-300 cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
          {scanTargets.length === 0 && (
            <p className="text-[10px] text-cyber-text-secondary font-mono">No targets — add a domain or IP to start continuous scanning.</p>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Live Crawler Log Stream */}
        <div className="lg:col-span-2 bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-light/20 pb-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-ping" />
                <span>Live Intelligence Telemetry Stream</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary">Alerts from TI scans (refreshes every ~90s).</p>
            </div>

            {/* Severity selection */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-cyber-text-secondary">Severity:</span>
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="h-8 bg-cyber-black border border-cyber-light/60 rounded text-[10px] text-cyber-text-primary px-2 focus:outline-none font-mono"
              >
                <option value="ALL">ALL LOGS</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
          </div>

          {/* Stream display feed */}
          <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3.5 rounded bg-cyber-black border border-cyber-light/30 transition-all font-mono text-[10px] space-y-1.5
                  ${log.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500 bg-red-950/5' : ''}
                  ${log.severity === 'HIGH' ? 'border-l-4 border-l-orange-500 bg-orange-950/5' : ''}
                  ${log.severity === 'INFO' ? 'border-l-4 border-l-blue-500 bg-blue-950/5' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold select-none
                      ${log.severity === 'CRITICAL' ? 'bg-red-500/25 text-red-400 border border-red-500/30' : ''}
                      ${log.severity === 'HIGH' ? 'bg-orange-500/25 text-orange-400 border border-orange-500/30' : ''}
                      ${log.severity === 'INFO' ? 'bg-blue-500/25 text-blue-400 border border-blue-500/30' : ''}
                    `}>
                      {log.severity}
                    </span>
                    <span className="text-neon-blue font-bold">[{log.event}]</span>
                  </div>
                  <span className="text-cyber-text-secondary/60 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <p className="text-cyber-text-primary text-[11px] leading-relaxed font-sans">{log.details}</p>
                <div className="text-[9px] text-cyber-text-secondary/70">ID: {log.id} • Target Engine: Scrubber-v1.4</div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-20 text-cyber-text-secondary font-mono">
                No crawler events matches filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Rules Editor & Integrations */}
        <div className="space-y-6">
          
          {/* Rules Editor Form */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-neon-blue" />
                <span>Exposure Rule Policy Manager</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                Add custom keyword search assets for ShadowNet scanners to capture on threat forums.
              </p>
            </div>

            {/* Keyword form input */}
            <form onSubmit={handleAddRule} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[9px] text-cyber-text-secondary uppercase mb-1">Scraper Keyword / Registry Name</label>
                <input
                  type="text"
                  placeholder="e.g. dev-admin-passphrase"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full h-9 px-3 bg-cyber-black border border-cyber-light/60 focus:border-neon-blue rounded focus:outline-none text-cyber-text-primary"
                />
              </div>

              <div>
                <label className="block text-[9px] text-cyber-text-secondary uppercase mb-1">Target Engine Class</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-9 bg-cyber-black border border-cyber-light/60 rounded px-2.5 text-cyber-text-primary focus:outline-none focus:border-neon-blue"
                >
                  <option value="Domain Lookup">Domain Lookup Tracker</option>
                  <option value="Credential Leak">Credential Leak Checker</option>
                  <option value="S3 Bucket Keyword">S3 Bucket Keyword Parser</option>
                  <option value="Pastebin Scraper">Pastebin / Gist Scraper</option>
                </select>
              </div>

              {formError && <span className="text-[10px] text-red-400">{formError}</span>}

              <button
                type="submit"
                className="w-full h-9 cursor-pointer bg-neon-blue text-cyber-black font-bold uppercase tracking-wider text-[11px] rounded transition-all duration-200 hover:bg-cyan-400 active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Initialize Scraper Policy</span>
              </button>
            </form>

            {/* Active rules panel list */}
            <div className="border-t border-cyber-light/20 pt-4 space-y-3">
              <span className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest block font-bold">Active Platform Rules ({monitoringRules.length})</span>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {monitoringRules.map((rule) => (
                  <div key={rule.id} className="p-2.5 rounded bg-cyber-black border border-cyber-light/30 flex items-center justify-between gap-3 text-[10px] font-mono">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-cyber-text-primary truncate">{rule.keyword}</span>
                      <span className="text-[8px] text-neon-blue mt-0.5">{rule.type}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMonitoringRule(rule.id)}
                        className="text-cyber-text-secondary hover:text-neon-blue transition-colors cursor-pointer"
                        title={rule.active ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.active ? (
                          <ToggleRight className="w-5.5 h-5.5 text-neon-blue" />
                        ) : (
                          <ToggleLeft className="w-5.5 h-5.5 text-cyber-text-secondary/50" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteMonitoringRule(rule.id)}
                        className="text-cyber-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Webhook notification integrations */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-neon-blue" />
                <span>Alert Webhook Integrations</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                Receive instant triggers on communications gateways when leak events are correlated.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-[10px] select-none">
              
              <div 
                onClick={() => setSlackActive(!slackActive)}
                className="flex items-center justify-between p-2.5 bg-cyber-black border border-cyber-light/30 rounded cursor-pointer hover:border-cyber-light transition-all"
              >
                <span>Slack Alert Integration</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${slackActive ? 'bg-emerald-500/25 text-emerald-400' : 'bg-cyber-light text-cyber-text-secondary'}`}>
                  {slackActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div 
                onClick={() => setTeamsActive(!teamsActive)}
                className="flex items-center justify-between p-2.5 bg-cyber-black border border-cyber-light/30 rounded cursor-pointer hover:border-cyber-light transition-all"
              >
                <span>Microsoft Teams Hook</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${teamsActive ? 'bg-emerald-500/25 text-emerald-400' : 'bg-cyber-light text-cyber-text-secondary'}`}>
                  {teamsActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div 
                onClick={() => setEmailActive(!emailActive)}
                className="flex items-center justify-between p-2.5 bg-cyber-black border border-cyber-light/30 rounded cursor-pointer hover:border-cyber-light transition-all"
              >
                <span>Email Secure Digest Dispatcher</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${emailActive ? 'bg-emerald-500/25 text-emerald-400' : 'bg-cyber-light text-cyber-text-secondary'}`}>
                  {emailActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContinuousMonitoring;
