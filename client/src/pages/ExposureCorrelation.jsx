import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ShieldAlert, AlertTriangle, ArrowRight, Activity, Percent, Layers, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ExposureCorrelation = () => {
  const navigate = useNavigate();
  const { navigateToAssetProfile, subdomains, credentials, correlations } = useApp();
  
  // Matrix hover highlight state
  const [hoveredCell, setHoveredCell] = useState(null);

  // Build matrix headers dynamically from real data
  const services = subdomains.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').slice(0, 6).map(s => ({
    name: s.name, id: s.id
  }));

  const vectors = credentials.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').slice(0, 5).map(c => ({
    name: `${c.owner} (${c.source})`, id: c.id, type: 'Credential'
  }));

  // Dynamic matrix threat intersection: check if a correlation exists linking the service and credential
  const getMatrixThreat = (serviceId, vectorId) => {
    const service = subdomains.find(s => s.id === serviceId);
    const cred = credentials.find(c => c.id === vectorId);
    if (!service || !cred) return null;

    // Find matching correlation
    const corr = correlations.find(c =>
      (c.service === service.name || c.asset_id_1 === service.name || c.asset_id_2 === service.name) &&
      (c.credential?.includes(cred.email?.split('@')[0]) || c.title?.toLowerCase().includes(cred.email?.split('@')[0]?.toLowerCase()))
    );

    if (corr) {
      return { severity: corr.severity, score: corr.risk_score, desc: corr.description || corr.explanation };
    }

    // Heuristic: if same org domain in both service and credential email
    const serviceDomain = service.name.split('.').slice(-2).join('.');
    if (cred.email?.includes(serviceDomain)) {
      const score = Math.min(85, (service.riskScore || 50) + (cred.exposureCount || 1) * 10);
      const severity = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : 'MEDIUM';
      return { severity, score, desc: `Leaked credentials for ${cred.email} could be used against ${service.name}.` };
    }

    return null;
  };

  const getHeatmapColor = (threat) => {
    if (!threat) return 'bg-cyber-black/40 border-cyber-light/20 text-cyber-text-secondary/20';
    if (threat.severity === 'CRITICAL') return 'bg-red-500/25 border-red-500/60 text-red-400 font-bold hover:bg-red-500/40 glow-critical';
    if (threat.severity === 'HIGH') return 'bg-orange-500/20 border-orange-500/50 text-orange-400 font-bold hover:bg-orange-500/35';
    if (threat.severity === 'MEDIUM') return 'bg-blue-500/10 border-blue-500/40 text-blue-400 hover:bg-blue-500/25';
    return 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15';
  };

  const handlePivot = (serviceId) => {
    navigateToAssetProfile(serviceId);
    navigate('/asset-profile');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <Cpu className="w-5 h-5 text-neon-blue" />
          <span>Exposure Correlation Engine</span>
        </h1>
        <p className="text-xs text-cyber-text-secondary leading-relaxed">
          The correlation engine correlates isolated footprint findings to identify high-risk attacker entry points and toxic combinations.
        </p>
      </div>

      {/* 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Correlation Grid Matrix */}
        <div className="lg:col-span-2 bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-neon-blue" />
              <span>Multi-Vector Risk Correlation Matrix</span>
            </span>
            <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
              Hover over heat cells to parse the security logic of correlated exposures.
            </p>
          </div>

          {/* Heat Grid Rendering */}
          <div className="overflow-x-auto mt-4 pb-2">
            <div className="min-w-160 grid grid-cols-6 gap-2">
              {/* Top-Left Empty Core */}
              <div className="p-2 text-[9px] font-mono text-cyber-text-secondary uppercase tracking-wider flex items-end">
                Threat Vectors →
              </div>

              {/* Service Headers */}
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => handlePivot(s.id)}
                  className="p-2 bg-cyber-black border border-cyber-light/40 rounded text-[9px] font-mono font-semibold text-cyber-text-primary text-center truncate hover:border-neon-blue transition-colors cursor-pointer"
                  title="Click to pivot"
                >
                  {s.name.replace('.shadownet-ai.com', '')}
                </button>
              ))}

              {/* Vector Rows */}
              {vectors.map((vec, vIdx) => (
                <React.Fragment key={vec.id}>
                  {/* Row Header */}
                  <div className="p-2.5 bg-cyber-black/60 border border-cyber-light/20 rounded text-[9px] font-mono text-cyber-text-secondary flex flex-col justify-center max-w-44">
                    <span className="font-bold text-cyber-text-primary truncate">{vec.name}</span>
                    <span className="text-[8px] opacity-75 text-cyan-400 mt-0.5">{vec.type}</span>
                  </div>

                  {/* Grid cells */}
                  {services.map(sub => {
                    const threat = getMatrixThreat(sub.id, vec.id);
                    const isHovered = hoveredCell && hoveredCell.subId === sub.id && hoveredCell.vecId === vec.id;

                    return (
                      <div
                        key={`${sub.id}-${vec.id}`}
                        onMouseEnter={() => setHoveredCell({ subId: sub.id, vecId: vec.id, threat })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-4 border rounded flex items-center justify-center font-mono text-xs transition-all duration-200 cursor-help select-none min-h-16
                          ${getHeatmapColor(threat)}
                          ${isHovered ? 'scale-105 ring-1 ring-neon-blue/80' : ''}
                        `}
                      >
                        {threat ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{threat.score}</span>
                            <span className="text-[8px] opacity-70 tracking-widest">{threat.severity[0]}</span>
                          </div>
                        ) : (
                          <span className="text-cyber-text-secondary/10">-</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Matrix Cell Explainer */}
          <div className="p-3 bg-cyber-black/80 border border-cyber-light/30 rounded-lg min-h-16 mt-4 flex items-center gap-3">
            {hoveredCell && hoveredCell.threat ? (
              <>
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wide">
                    CORRELATED RISK FOUND (SCORE: {hoveredCell.threat.score})
                  </span>
                  <span className="text-xs text-cyber-text-primary mt-0.5 leading-relaxed">
                    {hoveredCell.threat.desc}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 text-cyber-text-secondary/60 shrink-0" />
                <span className="text-xs text-cyber-text-secondary/80 font-mono">
                  Hover over active threat cells to parse the security logic of correlated exposures.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Toxic Infrastructure Patterns Side List */}
        <div className="space-y-4">
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />
                <span>Toxic Exposure Combinations</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                Aggregated assets whose concurrent exposure results in immediate risk escalation.
              </p>
            </div>

            <div className="space-y-3">
              {correlations.length > 0 ? [...correlations].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 6).map((rel, idx) => (
                <div key={rel._id || idx} className={`p-4 rounded-lg bg-cyber-black border border-l-2 space-y-2 ${
                  rel.severity === 'CRITICAL' ? 'border-red-950/40 border-l-red-500' : rel.severity === 'HIGH' ? 'border-orange-950/40 border-l-orange-500' : 'border-blue-950/40 border-l-blue-500'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold uppercase ${rel.severity === 'CRITICAL' ? 'text-red-400' : rel.severity === 'HIGH' ? 'text-orange-400' : 'text-blue-400'}`}>{rel.severity} RISK</span>
                    <span className="text-cyber-text-secondary flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-red-400" />
                      <span>{rel.confidence} Confidence</span>
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-cyber-text-primary tracking-wide leading-snug">{rel.title}</h3>
                  <p className="text-[11px] text-cyber-text-secondary leading-relaxed">{rel.description}</p>
                  {(rel.impact || rel.explanation) && (
                    <div className="text-[10px] p-2 bg-red-950/20 text-red-300 rounded border border-red-950/40 mt-2 leading-relaxed">
                      <span className="font-bold font-mono">Impact: </span>{rel.impact || rel.explanation}
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handlePivot(subdomains[0]?.id)}
                      className="px-2.5 py-1 cursor-pointer rounded bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-[9px] font-bold font-mono flex items-center gap-1 transition-colors"
                    >
                      <span>Remediate Pathway</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 border border-dashed border-cyber-light/20 rounded-lg">
                  <Activity className="w-8 h-8 text-orange-400/30 mx-auto mb-2" />
                  <p className="text-[10px] text-cyber-text-secondary font-mono">No correlations detected yet.</p>
                  <p className="text-[9px] text-cyber-text-secondary/60 font-mono mt-1">Data will populate after correlation analysis runs.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExposureCorrelation;
