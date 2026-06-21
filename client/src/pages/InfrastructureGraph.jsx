import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow, Controls, Background, useNodesState, useEdgesState, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Share2, Globe, Cpu, Lock, Cloud, ShieldAlert, Info, Maximize2,
  RefreshCw, ArrowRight, Server, AlertTriangle, Network, Eye,
  Shield, Layers, Filter, ChevronDown, ChevronUp, Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── Custom Node ───────────────────────────────────────────────────────────
const CyberNode = ({ data }) => {
  const typeIcon = () => {
    switch (data.type) {
      case 'domain':     return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'subdomain':  return <Globe className="w-4 h-4 text-sky-400" />;
      case 'service':    return <Cpu className="w-4 h-4 text-orange-400" />;
      case 'credential': return <Lock className="w-4 h-4 text-red-400" />;
      case 'cloud':      return <Cloud className="w-4 h-4 text-purple-400" />;
      case 'ip':         return <Server className="w-4 h-4 text-amber-400" />;
      default:           return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  const borderClass = () => {
    const vt = data.vt_malicious || 0;
    if (data.risk === 'critical' || vt >= 10) return 'border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.35)] bg-red-950/25';
    if (data.risk === 'high'     || vt >= 3)  return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.25)] bg-orange-950/20';
    if (data.risk === 'medium')               return 'border-blue-500/80 bg-blue-950/15';
    return 'border-emerald-500/70 bg-emerald-950/12';
  };

  const riskColor = {
    critical: 'text-red-300 bg-red-500/15', high: 'text-orange-300 bg-orange-500/15',
    medium: 'text-blue-300 bg-blue-500/15', low: 'text-emerald-300 bg-emerald-500/15',
  }[data.risk] || 'text-slate-300 bg-slate-500/15';

  return (
    <div className={`px-4 py-3 rounded-xl border text-cyber-text-primary font-mono text-[10px] min-w-44 max-w-56 select-none ${borderClass()}`}
      style={{ background: 'rgba(6,9,14,0.92)' }}>
      <div className="flex items-center gap-2 mb-2 border-b border-cyber-light/15 pb-1.5 justify-between">
        <span className="text-[8px] font-bold text-cyber-text-secondary uppercase tracking-wider">{data.type}</span>
        {typeIcon()}
      </div>
      <div className="font-bold truncate text-cyber-text-primary text-[11px] mb-0.5">{data.label}</div>
      {data.ip && <div className="text-cyan-400 text-[9px] font-mono">{data.ip}</div>}
      {data.details && <div className="text-cyber-text-secondary/70 text-[9px] truncate mt-0.5">{data.details}</div>}
      {data.vt_malicious > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-red-300">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          VT: {data.vt_malicious}/{data.vt_total} engines
        </div>
      )}
      <div className="mt-1.5 flex justify-between items-center">
        <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold uppercase ${riskColor}`}>
          {data.risk}
        </span>
        {data.score > 0 && <span className="text-[9px] font-mono text-cyber-text-secondary">Score: {data.score}</span>}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const InfrastructureGraph = () => {
  const navigate = useNavigate();
  const { navigateToAssetProfile, subdomains, cloudExposures, credentials, correlations, investigations = [] } = useApp();

  const nodeTypes = useMemo(() => ({ cyberNode: CyberNode }), []);
  const [activeNode, setActiveNode] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [showExplainer, setShowExplainer] = useState(true);

  // ─── Build nodes ──────────────────────────────────────────────────────────
  const initialNodes = useMemo(() => {
    const nodes = [];
    const cols = 4;
    let idx = 0;

    const addNode = (id, label, type, risk, score, ip, details, vt_malicious = 0, vt_total = 0) => {
      if (filterRisk !== 'ALL' && risk !== filterRisk) return;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      nodes.push({
        id,
        type: 'cyberNode',
        position: { x: 80 + col * 300, y: 80 + row * 180 },
        data: { label, type, risk: risk || 'medium', score, ip, details, vt_malicious, vt_total },
      });
      idx++;
    };

    subdomains.forEach(s => {
      const vtMalicious = s.raw?.sources?.virustotal?.malicious || 0;
      const vtTotal = s.raw?.sources?.virustotal?.total || 0;
      addNode(s.id, s.name, s.asset_type === 'ip' ? 'ip' : 'subdomain', s.riskLevel, s.riskScore, s.ip, s.services, vtMalicious, vtTotal);
    });

    cloudExposures.forEach(c => {
      addNode(c.id, c.bucketName, 'cloud', c.riskRating?.toLowerCase() || 'high', c.riskScore, '', c.configurationIssue);
    });

    credentials.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').slice(0, 6).forEach(c => {
      addNode(c.id, c.email, 'credential', c.severity === 'CRITICAL' ? 'critical' : 'high', 0, '', `Source: ${c.source}`);
    });

    return nodes;
  }, [subdomains, cloudExposures, credentials, correlations, filterRisk]);

  // ─── Build edges ──────────────────────────────────────────────────────────
  const initialEdges = useMemo(() => {
    const edges = [];
    const nodeIds = new Set(initialNodes.map(n => n.id));

    // Shared IP edges
    const ipMap = {};
    subdomains.forEach(s => {
      if (s.ip && s.ip !== 'N/A') {
        if (!ipMap[s.ip]) ipMap[s.ip] = [];
        ipMap[s.ip].push(s.id);
      }
    });
    Object.entries(ipMap).forEach(([ip, ids]) => {
      for (let i = 0; i < ids.length - 1; i++) {
        if (nodeIds.has(ids[i]) && nodeIds.has(ids[i + 1])) {
          edges.push({
            id: `e-ip-${ids[i]}-${ids[i + 1]}`,
            source: ids[i], target: ids[i + 1],
            label: `shared: ${ip}`,
            labelStyle: { fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' },
            labelBgPadding: [3, 2], labelBgStyle: { fill: '#06090e', fillOpacity: 0.85 },
            style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '5 5' },
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 12, height: 12 },
          });
        }
      }
    });

    // Correlation edges
    correlations.forEach(corr => {
      const src = subdomains.find(s => s.name === corr.asset_id_1 || s.name === corr.service);
      const tgt = subdomains.find(s => s.name === corr.asset_id_2)
               || cloudExposures.find(c => c.bucketName === corr.asset_id_2);
      const cred = credentials.find(c => c.email === corr.credential);
      const isCrit = corr.severity === 'CRITICAL';

      if (src && tgt && nodeIds.has(src.id) && nodeIds.has(tgt.id)) {
        edges.push({
          id: `e-corr-${corr._id || Math.random()}`,
          source: src.id, target: tgt.id,
          label: corr.correlation_type?.replace(/_/g, ' ') || 'correlated',
          labelStyle: { fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' },
          labelBgPadding: [3, 2], labelBgStyle: { fill: '#06090e', fillOpacity: 0.85 },
          style: { stroke: isCrit ? '#ef4444' : '#f97316', strokeWidth: isCrit ? 2.5 : 1.5 },
          animated: isCrit,
          markerEnd: { type: MarkerType.ArrowClosed, color: isCrit ? '#ef4444' : '#f97316', width: 12, height: 12 },
        });
      }
      if (src && cred && nodeIds.has(src.id) && nodeIds.has(cred.id)) {
        edges.push({
          id: `e-cred-${corr._id || Math.random()}`,
          source: src.id, target: cred.id,
          label: 'leaked credential',
          labelStyle: { fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' },
          labelBgPadding: [3, 2], labelBgStyle: { fill: '#06090e', fillOpacity: 0.85 },
          style: { stroke: '#ef4444', strokeWidth: 2 },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444', width: 12, height: 12 },
        });
      }
    });

    return edges;
  }, [initialNodes, subdomains, cloudExposures, credentials, correlations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges); }, [initialNodes, initialEdges]);

  const onNodeClick = useCallback((_, node) => setActiveNode({ id: node.id, ...node.data }), []);
  const handlePivot = () => {
    if (!activeNode) return;
    navigateToAssetProfile(activeNode.id);
    navigate('/asset-profile');
  };
  const resetLayout = () => { setNodes(initialNodes); setActiveNode(null); };

  const stats = {
    total: nodes.length,
    critical: nodes.filter(n => n.data.risk === 'critical').length,
    high: nodes.filter(n => n.data.risk === 'high').length,
    edges: edges.length,
    vtFlagged: nodes.filter(n => (n.data.vt_malicious || 0) > 0).length,
  };

  return (
    <div className="space-y-5">

      {/* ─── Header + Stats ────────────────────────────────────────── */}
      <div className="bg-cyber-dark/80 border border-cyber-light/40 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
                <Share2 className="w-5 h-5 text-neon-blue animate-pulse" /> Infrastructure Intelligence Graph
              </h1>
              <p className="text-xs text-cyber-text-secondary mt-1 max-w-2xl leading-relaxed">
                A live, interactive visual map of your entire attack surface. Each node represents a discovered asset — domains, IPs, cloud resources, or credentials. Edges show relationships: shared IPs, correlation chains, and leaked credential links. Click any node to inspect its threat intelligence data.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <select
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className="px-3 py-2 text-[11px] bg-cyber-black border border-cyber-light/40 text-cyber-text-primary rounded-lg font-mono cursor-pointer"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
              <button onClick={resetLayout}
                className="px-3.5 py-2 bg-cyber-gray border border-cyber-light/60 hover:border-neon-blue text-cyber-text-primary rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Reset Layout
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-cyber-light/20">
            {[
              { label: 'Total Nodes', value: stats.total, color: 'text-neon-blue' },
              { label: 'Critical', value: stats.critical, color: 'text-red-400' },
              { label: 'High Risk', value: stats.high, color: 'text-orange-400' },
              { label: 'Connections', value: stats.edges, color: 'text-purple-400' },
              { label: 'VT Flagged', value: stats.vtFlagged, color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2.5 bg-cyber-black/40 rounded-lg border border-cyber-light/20">
                <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-[9px] text-cyber-text-secondary uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Explainer */}
        <button
          onClick={() => setShowExplainer(v => !v)}
          className="w-full px-6 py-2.5 flex items-center justify-between border-t border-cyber-light/20 bg-cyber-black/30 hover:bg-cyber-black/50 transition-colors"
        >
          <span className="text-[10px] font-bold text-cyber-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-neon-blue" /> How to use this graph
          </span>
          {showExplainer ? <ChevronUp className="w-4 h-4 text-cyber-text-secondary" /> : <ChevronDown className="w-4 h-4 text-cyber-text-secondary" />}
        </button>

        {showExplainer && (
          <div className="px-6 py-4 bg-cyber-black/20 border-t border-cyber-light/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Network, color: 'text-neon-blue', title: 'Nodes = Assets', desc: 'Each node is a discovered asset: domain, IP, cloud bucket, or credential. Border color = risk level.' },
              { icon: Share2, color: 'text-purple-400', title: 'Purple Dashed = Shared IP', desc: 'Two assets resolving to the same IP. Compromising one may affect all co-hosted services.' },
              { icon: AlertTriangle, color: 'text-orange-400', title: 'Orange Lines = Correlations', desc: 'Assets correlated by the Exposure Correlation Engine. Run it first to populate these edges.' },
              { icon: ShieldAlert, color: 'text-red-400', title: 'Red Lines = Credential Links', desc: 'Leaked credentials linked to a service. High priority attack vectors.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-[10px] font-bold ${color} uppercase tracking-wider`}>{title}</p>
                  <p className="text-[10px] text-cyber-text-secondary leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Graph + Inspector ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* React Flow */}
        <div className="lg:col-span-3 bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
              <Share2 className="w-12 h-12 text-neon-blue/20 animate-pulse" />
              <h3 className="text-base font-bold text-cyber-text-primary">No Assets to Graph</h3>
              <p className="text-xs text-cyber-text-secondary max-w-sm font-mono">
                Investigate IPs and domains in the <strong>Investigate</strong> tab first. Assets discovered through threat intelligence will appear as nodes here.
              </p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#00f0ff" opacity={0.025} gap={20} />
              <Controls className="!m-4" />
            </ReactFlow>
          )}

          {/* Instructions overlay */}
          {nodes.length > 0 && (
            <div className="absolute top-4 right-4 p-2.5 bg-cyber-black/80 border border-cyber-light/30 rounded-lg text-[9px] font-mono text-cyber-text-secondary pointer-events-none select-none space-y-0.5">
              <div>• Drag nodes to reorganize</div>
              <div>• Scroll to zoom in/out</div>
              <div>• Click node to inspect</div>
            </div>
          )}
        </div>

        {/* Node Inspector */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
          <div className="border-b border-cyber-light/20 pb-3">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-neon-blue" /> Node Inspector
            </span>
            <p className="text-[10px] text-cyber-text-secondary mt-1">Click any graph node to view its full threat profile here.</p>
          </div>

          {activeNode ? (
            <div className="space-y-4 font-mono text-xs flex-1">

              {/* Identity */}
              <div className="p-3 bg-cyber-black/70 rounded-lg border border-cyber-light/25">
                <p className="text-[8px] font-bold text-neon-blue uppercase tracking-wider mb-1">{activeNode.type}</p>
                <h3 className="font-bold text-cyber-text-primary break-all text-sm">{activeNode.label}</h3>
                {activeNode.ip && <p className="text-cyan-400 text-[10px] mt-0.5">{activeNode.ip}</p>}
              </div>

              {/* Risk badge */}
              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                activeNode.risk === 'critical' ? 'bg-red-950/25 border-red-500/40' :
                activeNode.risk === 'high' ? 'bg-orange-950/25 border-orange-500/40' :
                'bg-cyber-black/40 border-cyber-light/20'
              }`}>
                <span className="text-[10px] text-cyber-text-secondary">Threat Level</span>
                <span className={`font-bold uppercase text-xs ${
                  activeNode.risk === 'critical' ? 'text-red-400' :
                  activeNode.risk === 'high' ? 'text-orange-400' :
                  activeNode.risk === 'medium' ? 'text-blue-400' : 'text-emerald-400'
                }`}>{activeNode.risk}</span>
              </div>

              {activeNode.score > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-light/20">
                  <span className="text-[10px] text-cyber-text-secondary">Risk Score</span>
                  <span className="font-bold text-cyber-text-primary">{activeNode.score}/100</span>
                </div>
              )}

              {/* VT Data */}
              {activeNode.vt_malicious > 0 && (
                <div className="p-3 bg-red-950/20 border border-red-500/40 rounded-lg space-y-1.5">
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">VirusTotal Detection</p>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-cyber-text-secondary">Malicious Engines</span>
                    <span className="font-bold text-red-400">{activeNode.vt_malicious}/{activeNode.vt_total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cyber-light/20 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(activeNode.vt_malicious / Math.max(activeNode.vt_total, 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Details */}
              {activeNode.details && (
                <div className="space-y-1">
                  <span className="text-[10px] text-cyber-text-secondary">Services / Details</span>
                  <p className="text-[10px] leading-relaxed text-cyber-text-primary bg-cyber-black/40 p-2 rounded border border-cyber-light/20">{activeNode.details}</p>
                </div>
              )}

              {/* Critical warning */}
              {activeNode.risk === 'critical' && (
                <div className="p-3 bg-red-950/25 border border-red-900/50 rounded-lg flex items-start gap-2 text-[10px] text-red-300 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  This node is at critical risk and appears in active attack path simulations. Immediate attention required.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-cyber-text-secondary font-mono text-[11px] leading-relaxed flex-1 flex flex-col items-center justify-center">
              <Share2 className="w-8 h-8 mx-auto mb-3 opacity-25 animate-pulse text-neon-blue" />
              <p>Select a node in the graph to inspect its threat intelligence data.</p>
            </div>
          )}

          {activeNode && (
            <button onClick={handlePivot}
              className="w-full py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity mt-auto">
              Pivot to Asset Profile <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Legend ────────────────────────────────────────────────── */}
      <div className="bg-cyber-dark/60 border border-cyber-light/30 rounded-xl p-4">
        <p className="text-[10px] font-bold text-cyber-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-neon-blue" /> Graph Legend
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { color: 'border-red-500 shadow-red-500/25', bg: 'bg-red-950/20', label: 'Critical Risk Node' },
            { color: 'border-orange-500', bg: 'bg-orange-950/20', label: 'High Risk Node' },
            { color: 'border-blue-500', bg: 'bg-blue-950/15', label: 'Medium Risk Node' },
            { color: 'border-emerald-500', bg: 'bg-emerald-950/15', label: 'Low Risk Node' },
          ].map(({ color, bg, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-5 rounded border ${color} ${bg}`} />
              <span className="text-[10px] text-cyber-text-secondary">{label}</span>
            </div>
          ))}
          {[
            { stroke: 'bg-purple-500', dash: true, label: 'Shared IP Link' },
            { stroke: 'bg-orange-500', dash: false, label: 'Correlation Edge' },
            { stroke: 'bg-red-500', dash: false, label: 'Credential Link' },
          ].map(({ stroke, dash, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-0.5 w-8 ${stroke} ${dash ? 'opacity-60' : ''}`} style={{ backgroundImage: dash ? 'repeating-linear-gradient(90deg,currentColor,currentColor 4px,transparent 4px,transparent 8px)' : 'none' }} />
              <span className="text-[10px] text-cyber-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureGraph;
