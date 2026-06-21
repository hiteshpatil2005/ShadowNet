import React, { useState, useEffect } from 'react';
import {
  FileText, Brain, Download, RefreshCw, Loader2, Shield, AlertTriangle,
  CheckCircle2, Target, Activity, Database, TrendingUp, TrendingDown,
  Minus, Clock, Zap, Lock, Globe, Server, AlertCircle, Info, ShieldAlert,
} from 'lucide-react';

import { reportsAPI } from '../services/api';

const RISK_META = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40', icon: AlertTriangle },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40', icon: AlertCircle },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', icon: Info },
  LOW:      { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/40', icon: CheckCircle2 },
};

const StatCard = ({ label, value, subLabel, color = 'text-neon-blue', icon: Icon }) => (
  <div className="p-4 bg-cyber-black/60 border border-cyber-light/25 rounded-xl">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-cyber-text-secondary uppercase tracking-wider">{label}</span>
      {Icon && <Icon className={`w-4 h-4 ${color} opacity-70`} />}
    </div>
    <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    {subLabel && <p className="text-[10px] text-cyber-text-secondary mt-1">{subLabel}</p>}
  </div>
);

const FindingCard = ({ finding, idx }) => {
  const sm = RISK_META[finding.severity] || RISK_META.MEDIUM;
  const Icon = sm.icon;
  return (
    <div className={`p-4 rounded-xl border ${sm.bg} space-y-2`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4.5 h-4.5 ${sm.color} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-bold uppercase ${sm.color}`}>{finding.severity}</span>
            <span className="text-[9px] text-cyber-text-secondary font-mono">Finding #{idx + 1}</span>
          </div>
          <h3 className="text-sm font-bold text-cyber-text-primary">{finding.title}</h3>
        </div>
      </div>
      <p className="text-[11px] font-mono text-cyber-text-secondary leading-relaxed">{finding.description}</p>
      {finding.evidence && (
        <div className="p-2 bg-cyber-black/50 rounded border border-cyber-light/15 text-[10px] font-mono text-cyber-text-secondary">
          <span className="text-neon-blue font-bold">Evidence: </span>{finding.evidence}
        </div>
      )}
      {finding.business_impact && (
        <div className={`p-2 rounded border ${sm.bg} text-[10px] font-mono ${sm.color}`}>
          <span className="font-bold">Business Impact: </span>{finding.business_impact}
        </div>
      )}
    </div>
  );
};

const Reporting = () => {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    reportsAPI.getLiveStats().then(res => setStats(res.data)).catch(() => {}).finally(() => setStatsLoading(false));
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await reportsAPI.aiGenerate();
      setReport(res.data.report);
      setGeneratedAt(res.data.generated_at);
      const statsRes = await reportsAPI.getLiveStats();
      setStats(statsRes.data);
    } catch (err) {
      const msg = err.message || 'Unknown error';
      const isQuota = msg.toLowerCase().includes('quota') || msg.includes('429') || msg.includes('500');
      setError({
        title: isQuota ? 'Gemini API Quota Exhausted' : 'Report Generation Failed',
        message: isQuota
          ? 'The free-tier Gemini API quota has been exhausted for today. Quotas reset at midnight Pacific time (UTC-8). Try again in a few hours.'
          : msg,
        isQuota,
      });
    } finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  const riskTrendIcon = {
    improving: <TrendingDown className="w-4 h-4 text-emerald-400" />,
    deteriorating: <TrendingUp className="w-4 h-4 text-red-400" />,
    stable: <Minus className="w-4 h-4 text-yellow-400" />,
  }[report?.security_posture_trend] || null;

  return (
    <div className="space-y-6">

      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
              <FileText className="w-5 h-5 text-neon-blue" />
              Intelligence Reporting & Export
            </h1>
            <p className="text-xs text-cyber-text-secondary mt-1 max-w-2xl leading-relaxed">
              Gemini AI synthesizes your live threat intelligence data — discovered assets, leaked credentials, TI investigations, and attack paths — into a comprehensive executive security posture report.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {report && (
              <button onClick={handlePrint}
                className="px-3.5 py-2 text-xs font-bold border border-cyber-light/40 text-cyber-text-secondary rounded-lg hover:border-neon-blue hover:text-neon-blue flex items-center gap-2 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            )}
            <button onClick={handleGenerate} disabled={loading || statsLoading}
              className="px-5 py-2 bg-neon-blue text-cyber-black font-bold text-xs uppercase rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? 'Generating Report…' : 'Generate AI Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Live Stats ─────────────────────────────────────────────── */}
      {stats && (
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
          <p className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-neon-blue" /> Live Intelligence Data
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Assets" value={stats.total_assets} color={stats.total_assets > 0 ? 'text-neon-blue' : 'text-cyber-text-secondary'} icon={Globe} />
            <StatCard label="Critical Assets" value={stats.critical_assets} color={stats.critical_assets > 0 ? 'text-red-400' : 'text-cyber-text-secondary'} icon={AlertTriangle} />
            <StatCard label="Credentials Leaked" value={stats.total_credentials} color={stats.total_credentials > 0 ? 'text-orange-400' : 'text-cyber-text-secondary'} icon={Lock} />
            <StatCard label="Correlations" value={stats.total_correlations} color={stats.total_correlations > 0 ? 'text-yellow-400' : 'text-cyber-text-secondary'} icon={Activity} />
            <StatCard label="Investigations" value={stats.total_investigations} color={stats.total_investigations > 0 ? 'text-purple-400' : 'text-cyber-text-secondary'} icon={Target} />
            <StatCard label="Malicious IPs" value={stats.malicious_indicators} color={stats.malicious_indicators > 0 ? 'text-red-400' : 'text-cyber-text-secondary'} icon={Shield} />
          </div>

          {!stats.has_data && (
            <div className="mt-4 p-3 bg-yellow-950/20 border border-yellow-500/30 rounded-lg text-[11px] font-mono text-yellow-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No data to report yet.</span> First use the <strong>Investigate</strong> tab to search IPs, domains, and CVEs. Then run <strong>Correlation Analysis</strong>. Then come back to generate your AI report.
              </div>
            </div>
          )}

          {stats.has_data && !report && (
            <div className="mt-4 p-3 bg-neon-blue/5 border border-neon-blue/20 rounded-lg text-[11px] font-mono text-neon-blue flex items-center gap-2">
              <Brain className="w-4 h-4 shrink-0" />
              You have live data available. Click "Generate AI Report" to create your Gemini-powered executive security posture report.
            </div>
          )}
        </div>
      )}

      {/* ─── Error Banner ───────────────────────────────────────────── */}
      {error && !loading && (
        <div className={`rounded-xl border p-5 ${error.isQuota ? 'bg-orange-950/20 border-orange-500/40' : 'bg-red-950/20 border-red-500/40'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${error.isQuota ? 'text-orange-400' : 'text-red-400'}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${error.isQuota ? 'text-orange-300' : 'text-red-300'}`}>{error.title}</p>
              <p className="text-[11px] font-mono text-cyber-text-secondary mt-1 leading-relaxed">{error.message}</p>
              {error.isQuota && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-mono text-orange-300/70">💡 <strong>Workaround options:</strong></p>
                  <ul className="text-[10px] font-mono text-cyber-text-secondary space-y-0.5 ml-4">
                    <li>• Wait for quota reset (midnight UTC / 5:30 AM IST)</li>
                    <li>• Add billing to your Google AI Studio project for higher limits</li>
                    <li>• Correlation Analysis still works — only AI report generation is affected</li>
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-cyber-text-secondary hover:text-cyber-text-primary text-xs font-mono shrink-0"
            >✕</button>
          </div>
        </div>
      )}

      {/* ─── Generating overlay ─────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-cyber-dark/60 rounded-xl border border-cyber-light/30">
          <div className="relative">
            <Brain className="w-12 h-12 text-purple-400" />
            <Loader2 className="w-6 h-6 text-neon-blue animate-spin absolute -top-1 -right-1" />
          </div>
          <p className="text-sm font-mono text-cyber-text-secondary">Gemini AI is analyzing all your threat intelligence data…</p>
          <p className="text-xs font-mono text-cyber-text-secondary opacity-70">Building executive report from real findings. This takes 20-40 seconds.</p>
        </div>
      )}


      {/* ─── Report Output ───────────────────────────────────────────── */}
      {!loading && report && (
        <div className="space-y-5" id="report-content">

          {/* Report meta */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-cyber-text-primary">{report.report_title}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {generatedAt && (
                    <span className="text-[10px] font-mono text-cyber-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Generated: {new Date(generatedAt).toLocaleString()}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-cyber-text-secondary">
                    Confidence: <span className="text-neon-blue font-bold">{report.confidence_level?.toUpperCase()}</span>
                  </span>
                  {report.security_posture_trend && (
                    <span className="text-[10px] font-mono text-cyber-text-secondary flex items-center gap-1">
                      Trend: {riskTrendIcon}
                      <span className={report.security_posture_trend === 'improving' ? 'text-emerald-400' : report.security_posture_trend === 'deteriorating' ? 'text-red-400' : 'text-yellow-400'}>
                        {report.security_posture_trend}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              {report.overall_risk_level && (() => {
                const rm = RISK_META[report.overall_risk_level] || RISK_META.MEDIUM;
                return (
                  <div className={`px-5 py-3 rounded-xl border ${rm.bg} text-center`}>
                    <p className="text-[9px] text-cyber-text-secondary uppercase tracking-wider mb-1">Overall Risk</p>
                    <p className={`text-2xl font-bold font-mono ${rm.color}`}>{report.overall_risk_score}</p>
                    <p className={`text-[10px] font-bold uppercase ${rm.color}`}>{report.overall_risk_level}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Executive Summary */}
          {report.executive_summary && (
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Executive Summary
              </h3>
              <div className="text-[12px] font-mono text-cyber-text-secondary leading-relaxed bg-cyber-black/40 p-4 rounded-lg border border-cyber-light/20 whitespace-pre-line">
                {report.executive_summary}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {report.key_findings?.length > 0 && (
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Key Security Findings ({report.key_findings.length})
              </h3>
              <div className="space-y-3">
                {report.key_findings.map((f, i) => (
                  <FindingCard key={i} finding={f} idx={i} />
                ))}
              </div>
            </div>
          )}

          {/* Immediate Actions */}
          {report.immediate_actions?.length > 0 && (
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Immediate Actions
              </h3>
              <div className="space-y-3">
                {report.immediate_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 bg-cyber-black/50 border border-emerald-500/20 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold text-emerald-400 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-cyber-text-primary">{action.action}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{action.timeline}</span>
                      </div>
                      {action.target && (
                        <p className="text-[10px] font-mono text-cyan-400 mt-0.5">Target: {action.target}</p>
                      )}
                      {action.rationale && (
                        <p className="text-[10px] font-mono text-cyber-text-secondary mt-1">{action.rationale}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threat Landscape + Compliance + Data Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {report.threat_landscape && (
              <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Threat Landscape
                </h3>
                <p className="text-[11px] font-mono text-cyber-text-secondary leading-relaxed">{report.threat_landscape}</p>
              </div>
            )}

            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Compliance Gaps
              </h3>
              {report.compliance_gaps?.length > 0 ? (
                <ul className="space-y-1.5">
                  {report.compliance_gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-cyber-text-secondary">
                      <span className="text-red-400 mt-0.5">›</span> {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] font-mono text-cyber-text-secondary">No compliance gaps identified from available data.</p>
              )}

              {report.data_sources_used?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-cyber-light/20">
                  <p className="text-[9px] font-bold text-cyber-text-secondary uppercase tracking-wider mb-2">Data Sources Used</p>
                  <div className="flex flex-wrap gap-1">
                    {report.data_sources_used.map((src, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[9px] font-mono bg-neon-blue/10 border border-neon-blue/20 text-neon-blue">{src}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reporting;
