import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Route, 
  ShieldAlert, 
  Cpu, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Activity, 
  AlertTriangle,
  Play,
  RotateCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AttackPathSimulation = () => {
  const navigate = useNavigate();
  const { attackPaths, threatPersonas, navigateToAssetProfile } = useApp();
  
  // Scenario Selection
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const activePath = attackPaths[selectedScenarioIdx];

  // Interactive checklist state
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handlePersonaPivot = () => {
    // Navigate to asset vpn or api
    if (selectedScenarioIdx === 0) {
      navigateToAssetProfile("sub-2");
    } else {
      navigateToAssetProfile("sub-3");
    }
    navigate('/asset-profile');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <Route className="w-5 h-5 text-neon-blue" />
          <span>AI Adversary Reasoning & Attack Path Simulator</span>
        </h1>
        <p className="text-xs text-cyber-text-secondary leading-relaxed">
          ShadowNet AI uses deep exposure metrics to simulate attacker decision-trees and predict active attack paths before exploitation.
        </p>
      </div>

      {/* Selector and Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Attack Chain Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scenario Selector & Header */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-light/20 pb-3">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-neon-blue" />
                <span>Simulated Attack Vectors</span>
              </span>
              
              <div className="flex items-center gap-2">
                {attackPaths.map((path, idx) => (
                  <button
                    key={path.id}
                    onClick={() => setSelectedScenarioIdx(idx)}
                    className={`px-3 py-1.5 cursor-pointer rounded-lg text-xs font-semibold transition-all border
                      ${selectedScenarioIdx === idx
                        ? 'bg-neon-blue/10 border-neon-blue text-neon-blue'
                        : 'bg-cyber-black border-cyber-light/50 text-cyber-text-secondary hover:text-cyber-text-primary'
                      }
                    `}
                  >
                    Scenario {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Metadata */}
            <div className="flex flex-col sm:flex-row justify-between bg-cyber-black/70 border border-cyber-light/20 p-4 rounded-lg gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-cyber-text-primary">{activePath.name}</h2>
                <p className="text-[10px] text-cyber-text-secondary">AI correlation engine predictive reasoning.</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-cyber-text-secondary uppercase">Takeover Prob.</span>
                  <span className="text-red-400 font-bold">{activePath.probability}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-cyber-text-secondary uppercase">Severity Impact</span>
                  <span className="text-red-400 font-bold">{activePath.impact}</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Flow diagram */}
            <div className="relative mt-6 space-y-6">
              
              {/* Connector Vertical Line */}
              <div className="absolute left-6.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500 via-orange-500 to-cyber-light/30"></div>

              {activePath.stages.map((stage, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-12 group">
                  
                  {/* Step Number Dot indicator */}
                  <div className={`absolute left-4.5 w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold border shrink-0 transition-all duration-300 group-hover:scale-115
                    ${stage.status === 'Completed' 
                      ? 'bg-red-500 border-red-500 text-cyber-black glow-critical' 
                      : 'bg-cyber-gray border-orange-500 text-orange-400'
                    }
                  `}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 bg-cyber-black/45 border border-cyber-light/30 hover:border-cyber-light/60 p-4 rounded-lg transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-1.5">
                      <h4 className="text-xs font-bold text-cyber-text-primary tracking-wide">{stage.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-cyber-text-secondary">Technique: {stage.technique}</span>
                        <span className="text-[9px] font-mono text-neon-blue bg-neon-blue/10 px-1.5 py-0.2 rounded">Conf: {stage.confidence}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-cyber-text-secondary leading-relaxed">{stage.details}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* executive Narrative */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-3">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-neon-blue" />
              <span>AI Security Posture Narrative</span>
            </span>
            
            <div className="p-4 bg-cyber-black border border-cyber-light/30 rounded-lg text-xs leading-relaxed text-cyber-text-secondary font-mono space-y-3">
              <p>
                <span className="text-red-400 font-bold">ANALYSIS SUMMARY:</span> Attacker path simulation confirms a severe correlation chain between our exposed credentials and network entry points.
              </p>
              <p>
                A malicious actor using automated scraping techniques discovers the exposed VPN host. By replaying the active plaintext admin keys leaked on BlackByte, the threat actor achieves instant network traversal. 
                Subsequent scanning will identify the Active Directory domain controller, leading to Kerberos exploitation and full domain compromise within <span className="text-red-400 font-bold">48 hours of initial ingress</span>.
              </p>
              <p>
                <span className="text-emerald-400 font-bold">REMEDIATION RECOMMENDATION:</span> Revoking active administrative key chains, block port 445 on external routing policies, and secure all S3 billing assets.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: Threat Personas & Prioritized Recommendations */}
        <div className="space-y-6">
          
          {/* Threat Persona Predictions */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />
                <span>Threat Actor Persona Profiles</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                Active hacker syndicates modeled to match these exposed technology layouts.
              </p>
            </div>

            <div className="space-y-3">
              {threatPersonas.map((actor) => (
                <div key={actor.id} className="p-3.5 rounded-lg bg-cyber-black border border-cyber-light/40 space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-red-400 font-bold uppercase">{actor.category}</span>
                    <span className="text-neon-blue">Origin: {actor.origin}</span>
                  </div>
                  <h3 className="text-xs font-bold text-cyber-text-primary">{actor.name}</h3>
                  <p className="text-[10px] text-cyber-text-secondary leading-relaxed">{actor.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-mono border-t border-cyber-light/20 pt-2 text-cyber-text-secondary">
                    <div>
                      <span>Phishing Risk: </span>
                      <span className="text-red-400 font-bold">{actor.phishingRisk}</span>
                    </div>
                    <div>
                      <span>Ransom Risk: </span>
                      <span className="text-orange-400 font-bold">{actor.ransomLikelihood.replace('Demands: ', '')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritized Remediation Task List */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                <span>Prioritized Remediation Checklist</span>
              </span>
              <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                Check off mitigated vectors to simulate post-remediation exposure decline.
              </p>
            </div>

            <div className="space-y-2.5">
              {activePath.reremediation ? null : activePath.remediation.map((task, index) => {
                const isCompleted = completedTasks[`${activePath.id}-${index}`];
                
                return (
                  <div 
                    key={index}
                    onClick={() => toggleTask(`${activePath.id}-${index}`)}
                    className={`p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 flex items-start gap-2.5
                      ${isCompleted 
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-cyber-black border-cyber-light/40 hover:border-cyber-light'
                      }
                    `}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5
                      ${isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-cyber-black' 
                        : 'border-cyber-light'
                      }
                    `}>
                      {isCompleted && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-mono px-1 rounded font-bold
                          ${isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/10 text-red-400'}
                        `}>
                          P{task.priority}
                        </span>
                        <span className={`text-xs font-bold ${isCompleted ? 'line-through opacity-60' : 'text-cyber-text-primary'}`}>
                          {task.action}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 leading-relaxed ${isCompleted ? 'opacity-50' : 'text-cyber-text-secondary'}`}>
                        {task.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Post Remediation Index */}
            <div className="pt-3.5 border-t border-cyber-light/20 flex items-center justify-between text-xs font-mono select-none">
              <span className="text-cyber-text-secondary">Expected Residual Risk:</span>
              <span className="text-emerald-400 font-bold uppercase pulse-text">
                {Object.keys(completedTasks).filter(k => k.startsWith(activePath.id) && completedTasks[k]).length === activePath.reremediation ? null :
                 Object.keys(completedTasks).filter(k => k.startsWith(activePath.id) && completedTasks[k]).length === activePath.reremediation ? null :
                 Math.max(12, 78 - Object.keys(completedTasks).filter(k => k.startsWith(activePath.id) && completedTasks[k]).length * 15)
                }% (LOW)
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AttackPathSimulation;
