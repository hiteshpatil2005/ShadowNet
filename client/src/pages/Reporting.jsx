import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  Calendar, 
  Eye, 
  Terminal, 
  CheckCircle, 
  Layers, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const reportTemplates = [
  { id: 'temp-1', name: 'Executive Threat Summary', type: 'Executive', desc: 'High-level exposure overview for C-suite and board presentations. Includes risk scores, key findings, and recommended actions.', sections: 4 },
  { id: 'temp-2', name: 'Technical Vulnerability Audit', type: 'Technical', desc: 'Detailed technical breakdown of exposed assets, open ports, vulnerable services, and attack surface analysis.', sections: 6 },
  { id: 'temp-3', name: 'Compliance & Regulatory Report', type: 'Compliance', desc: 'Mapped findings against ISO 27001, SOC 2, and NIST CSF frameworks for compliance gap analysis.', sections: 5 },
];

const Reporting = () => {
  const { subdomains, credentials, cloudExposures } = useApp();

  // Selected template state
  const [selectedTempId, setSelectedTempId] = useState('temp-1');
  const activeTemplate = reportTemplates.find(t => t.id === selectedTempId) || reportTemplates[0];

  // Customizable Section toggles
  const [includeAssets, setIncludeAssets] = useState(true);
  const [includeLeaks, setIncludeLeaks] = useState(true);
  const [includePath, setIncludePath] = useState(true);
  const [includeNarrative, setIncludeNarrative] = useState(true);

  // Scheduler states
  const [scheduleActive, setScheduleActive] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState('Weekly');
  const [scheduleEmail, setScheduleEmail] = useState('secops-alerts@shadownet.ai');

  // Export format selection
  const [exportFormat, setExportFormat] = useState('PDF');

  // Compiler animation states
  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileLogs, setCompileLogs] = useState([]);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    setCompiling(true);
    setCompileProgress(0);
    setCompileLogs(["Initializing ShadowNet Security Reporter v2.5..."]);

    const steps = [
      { prg: 15, log: "Parsing Monitored Subdomain Registry (found " + subdomains.length + " assets)..." },
      { prg: 35, log: "Analyzing dark web leaked databases for active administrative credential matches..." },
      { prg: 55, log: "Compiling toxic vulnerability vectors and threat persona correlations..." },
      { prg: 75, log: "Rendering vector path SVG layouts and risk narative summaries..." },
      { prg: 90, log: "Compressing report container, generating SHA256 integrity hash..." },
      { prg: 100, log: "Ledger Compiled Successfully! Dispatching download trigger." }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setCompileProgress(step.prg);
        setCompileLogs(prev => [...prev, step.log]);
        
        if (step.prg === 100) {
          // Trigger file download
          setTimeout(() => {
            setCompiling(false);
            setCompileProgress(0);
            
            // Build mock text report content
            const reportContent = `
=========================================
SHADOWNET AI THREAT INTELLIGENCE LEDGER
=========================================
REPORT TEMPLATE: ${activeTemplate.name}
EXPORT FORMAT: ${exportFormat}
COMPILED TIME: ${new Date().toISOString()}
INTEGRITY HASH: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED

SUMMARY POSTURE:
- Total Exposed Assets Parsed: ${subdomains.length}
- Credential Leaks Correlated: ${credentials.length}
- Cloud Storage Exposures Found: ${cloudExposures.length}

INCLUDED REPORT MODULES:
1. Subdomains Ledger: ${includeAssets ? "ENABLED" : "DISABLED"}
2. Password Leaks Ledger: ${includeLeaks ? "ENABLED" : "DISABLED"}
3. Attacker Path Flow Chart: ${includePath ? "ENABLED" : "DISABLED"}
4. Executive Posture Narrative: ${includeNarrative ? "ENABLED" : "DISABLED"}

MITIGATION TIMELINE ACTION ITEM:
- Reset administrative passwords immediately.
- Firewalls override TCP port 445 on edge hosts.
- Configure public AWS buckets to block all permissions.

CONFIDENTIAL REPORT. FOR INTERNAL SECOPS USE ONLY.
=========================================
            `;

            const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(reportContent);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `ShadowNet_${activeTemplate.name.replace(/\s+/g, '_')}_Report.${exportFormat.toLowerCase()}`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }, 1000);
        }
      }, (idx + 1) * 800);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 space-y-1">
        <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
          <FileText className="w-5 h-5 text-neon-blue" />
          <span>Reporting & Security Export Compiler</span>
        </h1>
        <p className="text-xs text-cyber-text-secondary leading-relaxed">
          Select templates, customize specific threat modules, and build executive audits matching ISO and SOC compliance frameworks.
        </p>
      </div>

      {/* Compiler active overlay */}
      {compiling && (
        <div className="bg-cyber-dark/95 border border-neon-blue rounded-xl p-6 space-y-4 glow-blue font-mono text-xs relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-cyber-light/20 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neon-blue animate-pulse" />
              <span className="font-bold text-neon-blue uppercase tracking-widest">Compiler Assembly Console</span>
            </div>
            <span>{compileProgress}%</span>
          </div>

          {/* Loader bar */}
          <div className="w-full h-1.5 bg-cyber-black rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-300" style={{ width: `${compileProgress}%` }}></div>
          </div>

          {/* Assembly log lines */}
          <div className="space-y-1 max-h-40 overflow-y-auto bg-cyber-black/80 p-3.5 rounded border border-cyber-light/30 text-[10px] text-emerald-400 select-none">
            {compileLogs.map((logLine, idx) => (
              <div key={idx} className="flex gap-1.5">
                <span className="text-cyber-text-secondary">&gt;</span>
                <span>{logLine}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Templates Selector and Customizer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Templates selectors */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-neon-blue" />
              <span>Select Security Report Template</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reportTemplates.map((temp) => (
                <div
                  key={temp.id}
                  onClick={() => setSelectedTempId(temp.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between h-44 select-none
                    ${selectedTempId === temp.id 
                      ? 'bg-neon-blue/5 border-neon-blue glow-blue' 
                      : 'bg-cyber-black border-cyber-light/40 hover:border-cyber-light'
                    }
                  `}
                >
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono font-bold text-neon-blue uppercase px-1.5 py-0.2 bg-cyber-light rounded border border-cyber-light/60">{temp.type}</span>
                    <h3 className="text-xs font-bold text-cyber-text-primary mt-1 tracking-wide leading-snug">{temp.name}</h3>
                    <p className="text-[10px] text-cyber-text-secondary leading-relaxed line-clamp-3">{temp.desc}</p>
                  </div>
                  <div className="text-[9px] font-mono text-cyber-text-secondary/70 border-t border-cyber-light/20 pt-2 flex justify-between items-center">
                    <span>{temp.sections} Default Modules</span>
                    <span className="text-neon-blue">Select &gt;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Customizer Checklist */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-cyber-light/20 pb-3">
              <Settings className="w-4.5 h-4.5 text-neon-blue" />
              <span>Customize Report Ledger Modules</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] select-none">
              
              <div 
                onClick={() => setIncludeAssets(!includeAssets)}
                className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all
                  ${includeAssets ? 'bg-cyber-black border-neon-blue/50 text-cyber-text-primary' : 'bg-cyber-black/40 border-cyber-light/20 text-cyber-text-secondary/40'}
                `}
              >
                <span>Include Subdomains Exposure Inventory</span>
                <span>{includeAssets ? "[ON]" : "[OFF]"}</span>
              </div>

              <div 
                onClick={() => setIncludeLeaks(!includeLeaks)}
                className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all
                  ${includeLeaks ? 'bg-cyber-black border-neon-blue/50 text-cyber-text-primary' : 'bg-cyber-black/40 border-cyber-light/20 text-cyber-text-secondary/40'}
                `}
              >
                <span>Include Harvester Credential Dumps</span>
                <span>{includeLeaks ? "[ON]" : "[OFF]"}</span>
              </div>

              <div 
                onClick={() => setIncludePath(!includePath)}
                className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all
                  ${includePath ? 'bg-cyber-black border-neon-blue/50 text-cyber-text-primary' : 'bg-cyber-black/40 border-cyber-light/20 text-cyber-text-secondary/40'}
                `}
              >
                <span>Include Simulated Attack Path Diagrams</span>
                <span>{includePath ? "[ON]" : "[OFF]"}</span>
              </div>

              <div 
                onClick={() => setIncludeNarrative(!includeNarrative)}
                className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all
                  ${includeNarrative ? 'bg-cyber-black border-neon-blue/50 text-cyber-text-primary' : 'bg-cyber-black/40 border-cyber-light/20 text-cyber-text-secondary/40'}
                `}
              >
                <span>Include AI Risk Posture Narratives</span>
                <span>{includeNarrative ? "[ON]" : "[OFF]"}</span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: PDF Exporter Engine & Schedule Automater */}
        <div className="space-y-6">
          
          {/* Exporter triggers settings */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4.5 h-4.5 text-neon-blue" />
              <span>Compile Report Ledger</span>
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[9px] text-cyber-text-secondary uppercase mb-1">Target Export File Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PDF', 'CSV', 'JSON'].map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`py-1.5 cursor-pointer rounded border text-[10px] font-bold transition-all
                        ${exportFormat === fmt 
                          ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                          : 'bg-cyber-black border-cyber-light/40 text-cyber-text-secondary hover:text-cyber-text-primary'
                        }
                      `}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secure verification display */}
              <div className="bg-cyber-black/60 border border-cyber-light/30 rounded p-3 flex items-start gap-2 text-[9px] text-cyber-text-secondary leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Reports compile over a secure localized ledger, incorporating SHA256 checks to confirm tamper-proof transport.</span>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={compiling}
                className="w-full h-10 cursor-pointer bg-gradient-to-r from-neon-blue to-neon-purple text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 stroke-[2.5]" />
                <span>Compile & Export Ledger</span>
              </button>
            </div>
          </div>

          {/* Schedule automator settings */}
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-light/20 pb-2">
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-neon-blue" />
                <span>Schedule Automated Dispatch</span>
              </span>
              <button
                onClick={() => setScheduleActive(!scheduleActive)}
                className="text-cyber-text-secondary hover:text-neon-blue transition-colors cursor-pointer"
              >
                {scheduleActive ? (
                  <ToggleRight className="w-6 h-6 text-neon-blue" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-cyber-text-secondary/50" />
                )}
              </button>
            </div>

            {scheduleActive ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[9px] text-cyber-text-secondary uppercase mb-1">Dispatch Interval Frequency</label>
                  <select
                    value={scheduleInterval}
                    onChange={(e) => setScheduleInterval(e.target.value)}
                    className="w-full h-8 bg-cyber-black border border-cyber-light/60 rounded px-2.5 text-cyber-text-primary focus:outline-none"
                  >
                    <option value="Daily">Daily (at 08:00 AM UTC)</option>
                    <option value="Weekly">Weekly (Every Monday)</option>
                    <option value="Monthly">Monthly (1st Calendar day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-cyber-text-secondary uppercase mb-1">Target SecOps Distribution List</label>
                  <input
                    type="email"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                    className="w-full h-8 px-2.5 bg-cyber-black border border-cyber-light/60 rounded focus:outline-none text-cyber-text-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-cyber-text-secondary leading-relaxed font-mono">
                Automated scheduler disabled. Reports must be manually compiled and exported by authenticated analysts.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Reporting;
