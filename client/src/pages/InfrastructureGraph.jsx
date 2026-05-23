import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Share2, 
  Globe, 
  Cpu, 
  Lock, 
  Cloud, 
  ShieldAlert, 
  Info,
  Maximize2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockInfrastructureGraph } from '../data/mockData';

// Custom Node Component to fit our high-end cyber theme
const CyberNode = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'domain': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'subdomain': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'service': return <Cpu className="w-4 h-4 text-orange-400" />;
      case 'credential': return <Lock className="w-4 h-4 text-red-400" />;
      case 'cloud': return <Cloud className="w-4 h-4 text-purple-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const borderClass = () => {
    if (data.risk === 'critical') return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] bg-red-950/20';
    if (data.risk === 'high') return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)] bg-orange-950/20';
    if (data.risk === 'medium') return 'border-blue-500 bg-blue-950/15';
    return 'border-emerald-500 bg-emerald-950/15';
  };

  return (
    <div className={`px-4 py-3 rounded-lg border text-cyber-text-primary font-mono text-[10px] min-w-44 select-none ${borderClass()}`}>
      <div className="flex items-center gap-2 mb-1.5 border-b border-cyber-light/20 pb-1.5 justify-between">
        <span className="text-[8px] font-bold text-cyber-text-secondary uppercase tracking-wider">{data.type}</span>
        {getIcon()}
      </div>
      <div className="font-bold truncate text-cyber-text-primary">{data.label}</div>
      {data.ip && <div className="text-cyber-text-secondary mt-0.5 font-bold">{data.ip}</div>}
      <div className="text-[8px] text-cyber-text-secondary/70 truncate mt-1">{data.details}</div>
      <div className="mt-1.5 flex justify-end">
        <span className={`text-[7px] px-1 rounded font-bold
          ${data.risk === 'critical' ? 'bg-red-500/20 text-red-300' : ''}
          ${data.risk === 'high' ? 'bg-orange-500/20 text-orange-300' : ''}
          ${data.risk === 'medium' ? 'bg-blue-500/20 text-blue-300' : ''}
          ${data.risk === 'low' ? 'bg-emerald-500/20 text-emerald-300' : ''}
        `}>
          RISK: {data.risk.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

const InfrastructureGraph = () => {
  const navigate = useNavigate();
  const { navigateToAssetProfile } = useApp();
  
  // Custom nodes definition mapping
  const nodeTypes = useMemo(() => ({ cyberNode: CyberNode }), []);

  // Map our static mock data to React Flow models
  const initialNodes = useMemo(() => {
    return mockInfrastructureGraph.nodes.map(node => ({
      id: node.id,
      type: 'cyberNode',
      position: { x: node.x, y: node.y },
      data: { 
        label: node.label,
        type: node.type,
        risk: node.risk,
        ip: node.ip,
        details: node.details
      }
    }));
  }, []);

  const initialEdges = useMemo(() => {
    return mockInfrastructureGraph.edges.map(edge => {
      const isCritical = edge.risk === 'critical';
      const isHigh = edge.risk === 'high';
      
      let edgeColor = '#202b3c'; // default light gray
      if (isCritical) edgeColor = '#ef4444';
      else if (isHigh) edgeColor = '#f97316';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        labelStyle: { fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' },
        labelBgPadding: 4,
        labelBgStyle: { fill: '#06090e', fillOpacity: 0.8 },
        style: { stroke: edgeColor, strokeWidth: isCritical ? 2.5 : 1.5 },
        animated: isCritical || isHigh,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 12,
          height: 12
        }
      };
    });
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Active click detail drawer state
  const [activeNode, setActiveNode] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    const originalNode = mockInfrastructureGraph.nodes.find(n => n.id === node.id);
    setActiveNode(originalNode);
  }, []);

  const handlePivot = () => {
    if (!activeNode) return;
    // Map custom node ID to asset profile
    navigateToAssetProfile(activeNode.id);
    navigate('/asset-profile');
  };

  const resetLayout = () => {
    setNodes(initialNodes);
    setActiveNode(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
            <Share2 className="w-5 h-5 text-neon-blue animate-pulse" />
            <span>Infrastructure Intelligence Graph Map</span>
          </h1>
          <p className="text-xs text-cyber-text-secondary leading-relaxed">
            Interactive node-link layout demonstrating domain resolution boundaries, certificate authorities, exposed microservices, and credential authorizations.
          </p>
        </div>

        {/* Layout controls */}
        <button
          onClick={resetLayout}
          className="px-3.5 py-2 cursor-pointer bg-cyber-gray border border-cyber-light/60 hover:border-neon-blue text-cyber-text-primary rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Network Topology</span>
        </button>
      </div>

      {/* Main Graph Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* React Flow Workspace */}
        <div className="lg:col-span-3 h-140 bg-cyber-dark border border-cyber-light/40 rounded-xl overflow-hidden relative shadow-2xl">
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="cyber-scanlines"
          >
            <Background color="#00f0ff" opacity={0.03} gap={20} />
            <Controls className="!m-4" />
          </ReactFlow>

          {/* Network instructions banner overlay */}
          <div className="absolute top-4 left-4 p-2.5 bg-cyber-black/80 border border-cyber-light/40 rounded text-[9px] font-mono text-cyber-text-secondary pointer-events-none select-none z-10 space-y-0.5">
            <div>• Drag nodes to manually organize topology</div>
            <div>• Use Scroll-Wheel to Zoom in/out</div>
            <div>• Click nodes to inspect dependency details</div>
          </div>
        </div>

        {/* Node Telemetry Inspector Drawer */}
        <div className="space-y-4">
          <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 h-140 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              <div className="space-y-1 border-b border-cyber-light/20 pb-3">
                <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-neon-blue" />
                  <span>Node Metadata Inspector</span>
                </span>
                <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
                  Deep network profile of the highlighted infrastructure component.
                </p>
              </div>

              {activeNode ? (
                <div className="space-y-4 font-mono text-xs">
                  
                  {/* Title & Classification */}
                  <div className="space-y-1 bg-cyber-black/75 p-3 rounded border border-cyber-light/30">
                    <span className="text-[8px] font-bold text-neon-blue uppercase tracking-wider">{activeNode.type} Details</span>
                    <h3 className="font-bold text-cyber-text-primary break-all">{activeNode.label}</h3>
                  </div>

                  {/* Node stats accordion */}
                  <div className="space-y-2.5">
                    {activeNode.ip && (
                      <div className="flex justify-between py-1.5 border-b border-cyber-light/20">
                        <span className="text-cyber-text-secondary text-[10px]">Resolved IP:</span>
                        <span className="text-cyber-text-primary font-bold">{activeNode.ip}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-cyber-light/20">
                      <span className="text-cyber-text-secondary text-[10px]">Threat Level:</span>
                      <span className={`font-bold uppercase
                        ${activeNode.risk === 'critical' ? 'text-red-400' : ''}
                        ${activeNode.risk === 'high' ? 'text-orange-400' : ''}
                        ${activeNode.risk === 'medium' ? 'text-blue-400' : ''}
                        ${activeNode.risk === 'low' ? 'text-emerald-400' : ''}
                      `}>
                        {activeNode.risk} RISK
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-cyber-text-secondary text-[10px]">Description:</span>
                      <p className="text-[10px] leading-relaxed text-cyber-text-primary bg-cyber-black/40 p-2 rounded border border-cyber-light/20">
                        {activeNode.details}
                      </p>
                    </div>
                  </div>

                  {/* Visual warning for critical nodes */}
                  {activeNode.risk === 'critical' && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-2 text-[10px] text-red-300 leading-relaxed">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>This node resides directly on active attack vectors and has been correlated in privilege takeover path simulations.</span>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-20 text-cyber-text-secondary font-mono text-[11px] leading-relaxed">
                  <Share2 className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse text-neon-blue" />
                  Select an active network node in the graph workspace to compile telemetry metrics.
                </div>
              )}
            </div>

            {/* Pivot confirmation triggers */}
            {activeNode && (
              <button
                onClick={handlePivot}
                className="w-full h-10 cursor-pointer bg-gradient-to-r from-neon-blue to-neon-purple text-cyber-black font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 mt-4"
              >
                <span>Pivot to Profile File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default InfrastructureGraph;
