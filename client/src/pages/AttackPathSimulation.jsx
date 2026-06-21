import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route, ShieldAlert, Cpu, CheckCircle2, ArrowRight, FileText, Activity,
  AlertTriangle, Play, Loader2, Trash2, Brain, Target, Clock, Shield,
  ChevronDown, ChevronUp, ExternalLink, Zap, User2, Lock, Server,
  GitBranch, Eye, AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { attackPathsAPI, reportsAPI } from '../services/api';

const IMPACT_META = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40', dot: 'bg-red-500' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40', dot: 'bg-orange-500' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', dot: 'bg-yellow-500' },
  LOW:      { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/40', dot: 'bg-green-500' },
};

const STAGE_ICONS = {
  0: Target, 1: Eye, 2: Lock, 3: Server, 4: GitBranch, 5: Shield,
};

const AttackPathSimulation = () => {
  const navigate = useNavigate();
  const { attackPaths, setAttackPaths, threatPersonas, setThreatPersonas, subdomains, fetchAllData } = useApp();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [generatingPersonas, setGeneratingPersonas] = useState(false);
  const [geminiReport, setGeminiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});
  const [expandedStage, setExpandedStage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const activePath = attackPaths[selectedIdx];

  const handleRunSimulation = async () => {
    setSimulating(true);
    setGeminiReport(null);
    try {
      const res = await attackPathsAPI.simulate();
      const paths = (res.data || []).map(p => ({
        id: p._id,
        name: p.name,
        type: p.attack_scenario_type,
        entry_point: p.entry_point || '',
        target: p.target || '',
        probability: p.probability || '0%',
        impact: p.impact || 'HIGH',
        cvss_max: p.cvss_max || 0,
        timeline_estimate: p.timeline_estimate || '',
        stages: (p.stages || []).map(s => ({
          title: s.title,
          technique: s.technique || '',
          details: s.details || '',
          confidence: s.confidence || '0%',
          real_asset: s.real_asset || '',
        })),
        remediation: (p.remediation || []).map(r => ({
          priority: r.priority,
          action: r.action,
          details: r.details || '',
          effort: r.effort || 'Medium',
          timeline: r.timeline || '24h',
        })),
        aiReasoning: p.ai_reasoning || '',
        raw: p,
      }));
      if (paths.length) {
        setAttackPaths(paths);
        setSelectedIdx(0);
      }
    } catch (err) {
      alert('Simulation failed: ' + err.message);
    } finally { setSimulating(false); }
  };

  const handleDeletePath = async (id) => {
    try {
      await attackPathsAPI.delete(id);
      setAttackPaths(prev => prev.filter(p => p.id !== id));
      setSelectedIdx(0);
      setDeleteConfirm(null);
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleGeneratePersonas = async () => {
    setGeneratingPersonas(true);
    try {
      const res = await attackPathsAPI.simulate(); // uses personas endpoint via simulate
      const pred = await fetch('/api/threat-personas/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('shadownet_token')}` },
      });
      const data = await pred.json();
      if (data.data?.length) {
        setThreatPersonas(data.data.map(p => ({
          id: p._id, name: p.name, type: p.predicted_attacker_type, category: p.category,
          origin: p.origin, motivation: p.motivation, confidence: p.confidence,
          capabilityLevel: p.capability_level, targetAssets: p.target_assets,
          description: p.description, ransomLikelihood: p.ransom_likelihood,
          phishingRisk: p.phishing_risk, ttps: p.ttps || [],
        })));
      }
    } catch (err) { alert('Persona generation failed: ' + err.message); }
    finally { setGeneratingPersonas(false); }
  };

  const handleGeminiReport = async () => {
    setLoadingReport(true);
    try {
      const res = await reportsAPI.narrative('attack_path');
      setGeminiReport(res.data);
    } catch (err) {
      alert('Report failed: ' + err.message);
    } finally { setLoadingReport(false); }
  };

  const toggleTask = (key) => setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  const completedCount = activePath ? Object.keys(completedTasks).filter(k => k.startsWith(activePath.id) && completedTasks[k]).length : 0;
  const residualRisk = activePath ? Math.max(10, 82 - completedCount * 15) : 0;

  // ─── Empty State ──────────────────────────────────────────────────────────
  if (!simulating && attackPaths.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-8 text-center space-y-4">
          <Route className="w-12 h-12 text-neon-blue/40 mx-auto" />
          <h1 className="text-xl font-bold text-cyber-text-primary uppercase">Attack Path Simulator</h1>
          <p className="text-sm text-cyber-text-secondary max-w-lg mx-auto">
            No attack paths in the database yet. First investigate some assets in the <strong>Investigate</strong> tab so Gemini AI has real data to simulate attack paths.
          </p>
          <button onClick={handleRunSimulation} disabled={simulating}
            className="mx-auto px-6 py-2.5 bg-neon-blue text-cyber-black font-bold text-sm uppercase rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Generate AI Attack Paths
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
              <Route className="w-5 h-5 text-neon-blue" />
              AI Adversary Attack Path Simulator
            </h1>
            <p className="text-xs text-cyber-text-secondary mt-1 max-w-2xl">
              Gemini AI simulates realistic attack paths based on your real discovered assets, leaked credentials, VirusTotal detections, and threat intelligence. All paths reference actual indicators.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            {attackPaths.length > 0 && (
              <button onClick={handleGeminiReport} disabled={loadingReport}
                className="px-3 py-2 text-[11px] font-bold border border-purple-500/40 text-purple-400 rounded-lg hover:bg-purple-500/10 flex items-center gap-1.5 transition-colors disabled:opacity-50">
                {loadingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                AI Report
              </button>
            )}
            <button onClick={handleRunSimulation} disabled={simulating}
              className="px-4 py-2 bg-neon-blue text-cyber-black font-bold text-xs uppercase rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 transition-all">
              {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {simulating ? 'Generating Paths…' : 'Regenerate Paths'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Simulating overlay ────────────────────────────────────── */}
      {simulating && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-cyber-dark/60 rounded-xl border border-cyber-light/30">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
          <p className="text-sm font-mono text-cyber-text-secondary">Gemini AI is analyzing your real assets and building attack paths…</p>
          <p className="text-xs font-mono text-cyber-text-secondary opacity-70">This typically takes 20-40 seconds</p>
        </div>
      )}

      {!simulating && activePath && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Left: Attack Chain ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Scenario selector */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyber-light/20 pb-3 mb-4">
                <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Play className="w-4 h-4 text-neon-blue" /> Simulated Attack Paths ({attackPaths.length})
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {attackPaths.map((path, idx) => {
                    const im = IMPACT_META[path.impact] || IMPACT_META.MEDIUM;
                    return (
                      <button key={path.id} onClick={() => setSelectedIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          selectedIdx === idx ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-cyber-black border-cyber-light/50 text-cyber-text-secondary hover:text-cyber-text-primary'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${im.dot}`} />
                        Path {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Path metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Entry Point', value: activePath.entry_point || 'N/A', color: 'text-red-400', icon: Target },
                  { label: 'Target', value: activePath.target || 'N/A', color: 'text-orange-400', icon: ShieldAlert },
                  { label: 'Probability', value: activePath.probability, color: 'text-yellow-400', icon: Activity },
                  { label: 'Impact', value: activePath.impact, color: (IMPACT_META[activePath.impact] || IMPACT_META.MEDIUM).color, icon: AlertTriangle },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="p-3 bg-cyber-black/60 border border-cyber-light/20 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-[9px] text-cyber-text-secondary uppercase tracking-wider">{label}</span>
                    </div>
                    <p className={`text-xs font-bold font-mono ${color} truncate`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Path name + type + delete */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-cyber-text-primary">{activePath.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                      {activePath.type?.replace(/_/g, ' ')}
                    </span>
                    {activePath.timeline_estimate && (
                      <span className="text-[10px] font-mono text-cyber-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activePath.timeline_estimate}
                      </span>
                    )}
                    {activePath.cvss_max > 0 && (
                      <span className="text-[10px] font-mono text-red-400">CVSS: {activePath.cvss_max}</span>
                    )}
                  </div>
                </div>
                {deleteConfirm === activePath.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDeletePath(activePath.id)}
                      className="px-2.5 py-1.5 text-[11px] font-bold bg-red-500/20 border border-red-500 text-red-400 rounded-lg">Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 text-[11px] border border-cyber-light/40 text-cyber-text-secondary rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(activePath.id)}
                    className="p-2 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Kill Chain Stages */}
              <div className="relative space-y-4">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-orange-400/50 to-transparent" />

                {activePath.stages.map((stage, idx) => {
                  const StageIcon = STAGE_ICONS[idx] || Target;
                  const isExpanded = expandedStage === idx;
                  return (
                    <div key={idx} className="relative flex items-start gap-4 pl-12 group">
                      <div className="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border shrink-0 bg-red-500/20 border-red-500 text-red-300 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>

                      <div className="flex-1 bg-cyber-black/50 border border-cyber-light/25 hover:border-red-500/30 rounded-lg overflow-hidden transition-colors">
                        <div
                          className="flex items-start justify-between p-3.5 cursor-pointer select-none"
                          onClick={() => setExpandedStage(isExpanded ? null : idx)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-cyber-text-primary">{stage.title}</h4>
                              {stage.confidence && (
                                <span className="text-[9px] font-mono text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded">
                                  {stage.confidence} conf.
                                </span>
                              )}
                            </div>
                            {stage.technique && (
                              <p className="text-[10px] font-mono text-orange-400 mt-1">{stage.technique}</p>
                            )}
                            {stage.real_asset && (
                              <p className="text-[10px] font-mono text-red-300 mt-0.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Target: {stage.real_asset}
                              </p>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-cyber-text-secondary shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-cyber-text-secondary shrink-0 ml-2" />}
                        </div>
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 text-[11px] font-mono text-cyber-text-secondary leading-relaxed border-t border-cyber-light/20 pt-3">
                            {stage.details}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Reasoning block */}
            {activePath.aiReasoning && (
              <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4.5 h-4.5 text-purple-400" />
                  <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Gemini AI Reasoning</span>
                </div>
                <div className="p-4 bg-cyber-black border border-cyber-light/25 rounded-lg text-xs font-mono text-cyber-text-secondary leading-relaxed">
                  {activePath.aiReasoning}
                </div>
              </div>
            )}

            {/* Gemini Full Report */}
            {geminiReport && (
              <div className="bg-cyber-dark border border-purple-500/40 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4.5 h-4.5 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Gemini AI Security Narrative</span>
                  </div>
                  <button onClick={() => setGeminiReport(null)} className="text-[10px] text-cyber-text-secondary hover:text-red-400">✕ Close</button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-cyber-black/60 rounded-lg border border-cyber-light/20">
                    <p className="text-[10px] font-bold text-neon-blue mb-1">{geminiReport.title}</p>
                    <p className="text-xs text-cyber-text-primary font-mono leading-relaxed">{geminiReport.content}</p>
                  </div>
                  {geminiReport.key_findings?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-cyber-text-secondary uppercase mb-1">Key Findings</p>
                      <ul className="space-y-1">
                        {geminiReport.key_findings.map((f, i) => (
                          <li key={i} className="text-[11px] font-mono text-cyber-text-secondary flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5">›</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {geminiReport.business_impact && (
                    <div className="p-2 bg-red-950/20 border border-red-900/40 rounded text-[11px] font-mono text-red-300">
                      <span className="font-bold text-red-400">Business Impact: </span>{geminiReport.business_impact}
                    </div>
                  )}
                  {geminiReport.recommended_actions?.length > 0 && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Recommended Actions</p>
                      {geminiReport.recommended_actions.map((a, i) => (
                        <p key={i} className="text-[11px] font-mono text-emerald-300 flex items-start gap-1.5"><span>›</span>{a}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: Personas + Remediation ─────────────────────── */}
          <div className="space-y-5">

            {/* Threat Personas */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                  <User2 className="w-4 h-4 text-orange-400" /> Threat Actor Personas
                </span>
                <button onClick={handleGeneratePersonas} disabled={generatingPersonas}
                  className="px-2.5 py-1 text-[10px] font-bold border border-orange-500/40 text-orange-400 rounded hover:bg-orange-500/10 disabled:opacity-50 flex items-center gap-1">
                  {generatingPersonas ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Generate
                </button>
              </div>

              {threatPersonas.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-cyber-light/20 rounded-lg">
                  <User2 className="w-7 h-7 text-orange-400/30 mx-auto mb-2" />
                  <p className="text-[10px] font-mono text-cyber-text-secondary">No threat personas yet.</p>
                  <p className="text-[9px] font-mono text-cyber-text-secondary/60 mt-1">Click "Generate" to model attacker profiles.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threatPersonas.slice(0, 3).map((actor) => (
                    <div key={actor.id} className="p-3.5 rounded-lg bg-cyber-black border border-cyber-light/30">
                      <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                        <span className="text-red-400 font-bold uppercase">{actor.category || actor.type}</span>
                        <span className="text-neon-blue">{actor.origin}</span>
                      </div>
                      <h3 className="text-xs font-bold text-cyber-text-primary mb-1">{actor.name}</h3>
                      <p className="text-[10px] text-cyber-text-secondary leading-relaxed">{actor.description}</p>
                      {actor.targetAssets && (
                        <p className="text-[10px] font-mono text-orange-300 mt-1.5">
                          <span className="text-cyber-text-secondary">Targets: </span>{actor.targetAssets}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[9px] font-mono text-cyber-text-secondary border-t border-cyber-light/20 pt-2">
                        <span>Phishing: <span className="text-red-400 font-bold">{actor.phishingRisk}</span></span>
                        <span>Ransom: <span className="text-orange-400 font-bold">{actor.ransomLikelihood}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remediation Checklist */}
            <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Remediation Checklist
                </span>
                <span className="text-[10px] font-mono text-cyber-text-secondary">
                  {completedCount}/{activePath.remediation.length} done
                </span>
              </div>

              {activePath.remediation.length === 0 ? (
                <p className="text-[10px] font-mono text-cyber-text-secondary text-center py-4">No remediation steps generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {activePath.remediation.map((task, idx) => {
                    const key = `${activePath.id}-${idx}`;
                    const done = completedTasks[key];
                    return (
                      <div key={idx} onClick={() => toggleTask(key)}
                        className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                          done ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' : 'bg-cyber-black border-cyber-light/30 hover:border-cyber-light/60'
                        }`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-emerald-500 border-emerald-500' : 'border-cyber-light/60'}`}>
                          {done && <span className="text-cyber-black text-[9px] font-bold">✓</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-mono px-1 rounded font-bold ${done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/10 text-red-400'}`}>P{task.priority}</span>
                            <span className={`text-xs font-bold ${done ? 'line-through opacity-60' : 'text-cyber-text-primary'}`}>{task.action}</span>
                            <span className="text-[9px] font-mono text-cyber-text-secondary">{task.timeline}</span>
                          </div>
                          {task.details && (
                            <p className={`text-[10px] mt-1 leading-relaxed font-mono ${done ? 'opacity-50' : 'text-cyber-text-secondary'}`}>{task.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Residual risk meter */}
              <div className="pt-3.5 mt-2 border-t border-cyber-light/20">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-cyber-text-secondary font-mono">Simulated Residual Risk</span>
                  <span className={`text-xs font-bold font-mono ${residualRisk < 30 ? 'text-emerald-400' : residualRisk < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {residualRisk}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cyber-light/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${residualRisk < 30 ? 'bg-emerald-500' : residualRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${residualRisk}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttackPathSimulation;
