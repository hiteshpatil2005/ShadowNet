import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, ShieldAlert, AlertTriangle, ArrowRight, Activity, Layers,
  RefreshCw, Trash2, Loader2, Brain, ChevronDown, ChevronUp,
  Link2, Server, Key, Globe, AlertCircle, Clock, CheckCircle2,
  Zap, Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { correlationsAPI } from '../services/api';

const SEVERITY_META = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40', bar: 'bg-red-500', dot: 'bg-red-400' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40', bar: 'bg-orange-500', dot: 'bg-orange-400' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', bar: 'bg-yellow-500', dot: 'bg-yellow-400' },
  LOW:      { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/40', bar: 'bg-green-500', dot: 'bg-green-400' },
};

const TYPE_ICON = {
  credential_usage:          Key,
  ip_hosting:               Server,
  suspicious_relationship:  AlertTriangle,
  ti_confirmed_threat:      ShieldAlert,
  vt_detection:             AlertCircle,
  malicious_domain_credential: Globe,
};

const TYPE_LABEL = {
  credential_usage:          'Multi-Breach Credentials',
  ip_hosting:               'Shared IP Hosting',
  suspicious_relationship:  'Asset + Credential',
  ti_confirmed_threat:      'TI Confirmed Threat',
  vt_detection:             'VirusTotal Detection',
  malicious_domain_credential: 'Malicious Domain + Creds',
};

const CorrelationCard = ({ corr, onDelete, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const sm = SEVERITY_META[corr.severity] || SEVERITY_META.MEDIUM;
  const Icon = TYPE_ICON[corr.correlation_type] || Link2;

  return (
    <div className={`rounded-xl border ${sm.bg} overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${sm.bg}`}>
          <Icon className={`w-4.5 h-4.5 ${sm.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${sm.color}`}>
                {TYPE_LABEL[corr.correlation_type] || corr.correlation_type?.replace(/_/g, ' ')}
              </p>
              <h3 className="text-sm font-bold text-cyber-text-primary mt-0.5 leading-tight">{corr.title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className={`text-lg font-bold font-mono ${sm.color}`}>{corr.risk_score}</p>
                <p className="text-[9px] text-cyber-text-secondary">Risk Score</p>
              </div>
            </div>
          </div>

          {/* Risk bar */}
          <div className="mt-2 h-1.5 rounded-full bg-cyber-light/20 overflow-hidden">
            <div className={`h-full rounded-full ${sm.bar} transition-all duration-700`} style={{ width: `${corr.risk_score}%` }} />
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sm.bg} ${sm.color}`}>{corr.severity}</span>
            <span className="text-[10px] font-mono text-cyber-text-secondary">Confidence: {corr.confidence}</span>
            {corr.correlation_type === 'vt_detection' && corr.sources_data?.vt_malicious && (
              <span className="text-[10px] font-mono text-red-400">
                VirusTotal: {corr.sources_data.vt_malicious}/{corr.sources_data.vt_total} engines
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-[11px] font-mono text-cyber-text-secondary leading-relaxed">{corr.description}</p>
      </div>

      {/* Actions row */}
      <div className="px-4 pb-3 flex items-center gap-2 justify-between">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-[10px] text-neon-blue hover:text-cyan-300 font-mono transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Less detail' : 'Full analysis'}
        </button>
        <div className="flex items-center gap-2">
          {corr.asset_id_1 && (
            <button
              onClick={() => onNavigate(corr)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 transition-colors"
            >
              Pivot to Asset <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onDelete(corr._id)}
            className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
            title="Delete correlation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-cyber-light/20 p-4 space-y-3 bg-cyber-black/40">
          {/* Gemini AI Explanation */}
          <div>
            <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider mb-1 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> AI Analysis
            </p>
            <p className="text-[11px] font-mono text-cyber-text-secondary leading-relaxed bg-cyber-dark/60 p-3 rounded border border-cyber-light/20">
              {corr.explanation || 'No AI explanation available for this correlation.'}
            </p>
          </div>

          {/* Attack Scenarios */}
          {corr.attack_scenarios?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Attack Scenarios</p>
              <ul className="space-y-1">
                {corr.attack_scenarios.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] font-mono text-cyber-text-secondary">
                    <span className="text-orange-400 mt-0.5">›</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MITRE Techniques */}
          {corr.mitre_techniques?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">MITRE ATT&CK</p>
              <div className="flex flex-wrap gap-1">
                {corr.mitre_techniques.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-300">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sources data */}
          {corr.sources_data && (
            <div>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Evidence Data</p>
              <pre className="text-[9px] font-mono text-cyber-text-secondary bg-cyber-black/60 p-2 rounded border border-cyber-light/20 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(corr.sources_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Impact */}
          {corr.impact && (
            <div className="p-2 bg-red-950/20 border border-red-900/40 rounded text-[11px] font-mono text-red-300">
              <span className="font-bold text-red-400">Impact: </span>{corr.impact}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExposureCorrelation = () => {
  const navigate = useNavigate();
  const { correlations, setCorrelations, navigateToAssetProfile, subdomains } = useApp();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [lastRun, setLastRun] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Load stats on mount
  useEffect(() => {
    correlationsAPI.getStats().then(res => {
      setStats(res.data);
      setLastRun(res.data?.last_analyzed);
    }).catch(() => {});
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await correlationsAPI.analyze();
      setCorrelations(res.data || []);
      const statsRes = await correlationsAPI.getStats();
      setStats(statsRes.data);
      setLastRun(new Date().toISOString());
    } catch (err) {
      alert('Analysis failed: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await correlationsAPI.delete(id);
      setCorrelations(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleDeleteAll = async () => {
    try {
      await correlationsAPI.deleteAll();
      setCorrelations([]);
      setDeleteConfirm(false);
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handlePivot = (corr) => {
    const asset = subdomains.find(s => s.name === corr.asset_id_1 || s.name === corr.service);
    if (asset) { navigateToAssetProfile(asset.id); navigate('/asset-profile'); }
  };

  const filtered = filter === 'ALL'
    ? correlations
    : correlations.filter(c => c.severity === filter || c.correlation_type === filter);

  const counts = {
    CRITICAL: correlations.filter(c => c.severity === 'CRITICAL').length,
    HIGH: correlations.filter(c => c.severity === 'HIGH').length,
    MEDIUM: correlations.filter(c => c.severity === 'MEDIUM').length,
  };

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
              <Cpu className="w-5 h-5 text-neon-blue" />
              Exposure Correlation Engine
            </h1>
            <p className="text-xs text-cyber-text-secondary mt-1 max-w-2xl leading-relaxed">
              Correlates threat intelligence signals, leaked credentials, VirusTotal detections, and discovered assets to identify toxic combinations and high-risk attack vectors. Powered by Gemini AI for deep analysis.
            </p>
            {lastRun && (
              <p className="text-[10px] text-cyber-text-secondary font-mono mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last analyzed: {new Date(lastRun).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {correlations.length > 0 && (
              <>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)}
                    className="px-3 py-2 text-[11px] font-bold border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={handleDeleteAll} className="px-3 py-2 text-[11px] font-bold bg-red-500/20 border border-red-500 text-red-400 rounded-lg">Confirm Delete</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-2 py-2 text-[11px] border border-cyber-light/40 text-cyber-text-secondary rounded-lg">Cancel</button>
                  </div>
                )}
              </>
            )}
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-4 py-2 bg-neon-blue text-cyber-black font-bold text-xs uppercase rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {loading ? 'Analyzing…' : 'Run Correlation Analysis'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-cyber-light/20">
            {[
              { label: 'Total Correlations', value: stats.total, color: 'text-neon-blue' },
              { label: 'Critical', value: counts.CRITICAL, color: 'text-red-400' },
              { label: 'High', value: counts.HIGH, color: 'text-orange-400' },
              { label: 'Medium', value: counts.MEDIUM, color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-cyber-black/40 rounded-lg border border-cyber-light/20">
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-[10px] text-cyber-text-secondary uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────────────── */}
      {correlations.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'credential_usage', 'ip_hosting', 'suspicious_relationship', 'ti_confirmed_threat', 'vt_detection'].map(f => {
            const isActive = filter === f;
            const count = f === 'ALL' ? correlations.length : correlations.filter(c => c.severity === f || c.correlation_type === f).length;
            if (count === 0 && f !== 'ALL') return null;
            return (
              <button key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  isActive ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'border-cyber-light/40 text-cyber-text-secondary hover:text-cyber-text-primary'
                }`}
              >
                {f === 'ALL' ? 'All' : f.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────── */}
      {correlations.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-cyber-light/20 rounded-xl bg-cyber-dark/40">
          <Cpu className="w-12 h-12 text-neon-blue/30 mx-auto mb-4" />
          <h3 className="text-base font-bold text-cyber-text-primary mb-2">No Correlations Yet</h3>
          <p className="text-xs text-cyber-text-secondary font-mono max-w-md mx-auto mb-4">
            First investigate some IPs or domains in the <strong>Investigate</strong> tab, then click "Run Correlation Analysis" to find toxic combinations.
          </p>
          <button onClick={runAnalysis} disabled={loading}
            className="px-5 py-2 bg-neon-blue text-cyber-black font-bold text-xs uppercase rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 mx-auto">
            <Zap className="w-4 h-4" /> Run Analysis Now
          </button>
        </div>
      )}

      {/* ─── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
          <p className="text-sm font-mono text-cyber-text-secondary">Analyzing assets, credentials, and threat intelligence…</p>
          <p className="text-xs font-mono text-cyber-text-secondary">Gemini AI is enriching the top correlations. This may take 15–30 seconds.</p>
        </div>
      )}

      {/* ─── Correlation Cards ────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyber-text-secondary font-mono">
              Showing {filtered.length} of {correlations.length} correlations
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-text-secondary">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Medium</span>
            </div>
          </div>
          {filtered.map((corr, i) => (
            <CorrelationCard key={corr._id || i} corr={corr} onDelete={handleDelete} onNavigate={handlePivot} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExposureCorrelation;
