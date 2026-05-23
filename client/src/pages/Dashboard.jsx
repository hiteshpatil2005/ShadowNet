import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Globe, 
  Cpu, 
  Eye, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';
import { mockRiskTrends } from '../data/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    alerts, 
    subdomains, 
    credentials, 
    cloudExposures, 
    acknowledgeAlert, 
    resolveAlert, 
    navigateToAssetProfile 
  } = useApp();

  // Calculated overall posture statistics
  const stats = [
    {
      title: 'Exposed Assets',
      value: subdomains.length + credentials.length + cloudExposures.length,
      change: '+14%',
      isUp: true,
      icon: Globe,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderClass: 'border-cyan-500/30'
    },
    {
      title: 'Critical Vulnerabilities',
      value: 12,
      change: '-3',
      isUp: false,
      icon: ShieldAlert,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderClass: 'border-red-500/30'
    },
    {
      title: 'Active Threats',
      value: 3,
      change: '+1',
      isUp: true,
      icon: Cpu,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30'
    },
    {
      title: 'Monitoring Coverage',
      value: '98.4%',
      change: '+0.5%',
      isUp: true,
      icon: Eye,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30'
    }
  ];

  const handleInvestigatePivot = (asset) => {
    // Find the closest subdomain matching that alert asset title
    const foundSub = subdomains.find(sub => 
      asset.toLowerCase().includes(sub.name.toLowerCase()) || 
      asset.includes(sub.ip)
    );
    
    if (foundSub) {
      navigateToAssetProfile(foundSub.id);
    } else {
      navigateToAssetProfile("sub-2"); // Fallback default
    }
    navigate('/asset-profile');
  };

  return (
    <div className="space-y-6">
      
      {/* Risk Profile banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 gap-4 glow-blue">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
            <span>Threat Intelligence Command Center</span>
            <span className="text-[10px] font-mono font-normal tracking-widest px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 animate-pulse">
              LIVE SYSTEM STATE
            </span>
          </h1>
          <p className="text-xs text-cyber-text-secondary leading-relaxed">
            Correlating exposed corporate subdomains, leaked engineer credentials, and unsecured cloud storage to simulate threat vectors.
          </p>
        </div>

        {/* Executive Exposure Score */}
        <div className="flex items-center gap-4 bg-cyber-black/70 border border-cyber-light/60 p-3 rounded-lg w-full md:w-auto shrink-0 select-none">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-cyber-text-secondary uppercase tracking-widest">Exposure Rating</span>
            <span className="text-sm font-bold text-red-400 uppercase tracking-wider">HIGH EXPOSURE</span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-red-500/40 flex items-center justify-center bg-red-950/20 text-red-400 font-mono text-base font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)]">
            78
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.title} 
            className={`bg-cyber-dark border ${stat.borderClass} rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:bg-cyber-gray/30`}
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold text-cyber-text-secondary">{stat.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-cyber-text-primary font-mono">{stat.value}</span>
                <span className={`text-[10px] font-mono font-bold flex items-center ${stat.isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                  {stat.isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`w-11 h-11 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5.5 h-5.5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Trend Timeline Chart */}
        <div className="lg:col-span-2 bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-blue" />
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Organizational Risk & Exposure Index</span>
            </div>
            <span className="text-[10px] text-cyber-text-secondary font-mono">May 01 - May 23 (30 Days)</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRiskTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} fontStyle="italic" />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0b0f17', 
                    borderColor: '#202b3c', 
                    borderRadius: '8px', 
                    fontSize: '11px',
                    color: '#f8fafc' 
                  }} 
                />
                <Area type="monotone" dataKey="score" name="Risk Exposure" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                <Area type="monotone" dataKey="assets" name="Monitored Assets" stroke="#00f0ff" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAssets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Asset Breakdown */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Asset Severity Breakdown</span>
            </div>
            <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
              Target analysis of risk states distributed across current exposure classifications.
            </p>
          </div>

          <div className="flex-1 h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Critical', count: 6, fill: '#ef4444' },
                { name: 'High', count: 8, fill: '#f97316' },
                { name: 'Medium', count: 4, fill: '#3b82f6' },
                { name: 'Low', count: 12, fill: '#10b981' }
              ]}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0b0f17', 
                    borderColor: '#202b3c', 
                    borderRadius: '8px', 
                    fontSize: '10px' 
                  }} 
                />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {
                    [
                      { fill: '#ef4444' },
                      { fill: '#f97316' },
                      { fill: '#3b82f6' },
                      { fill: '#10b981' }
                    ].map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Module Navigation Fast Paths */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-cyber-light/20">
            <button 
              onClick={() => navigate('/footprint')}
              className="flex flex-col items-center p-2 rounded bg-cyber-black hover:bg-cyber-light/40 border border-cyber-light/30 transition-all text-center cursor-pointer group"
            >
              <Globe className="w-4 h-4 text-neon-blue group-hover:scale-110 duration-200" />
              <span className="text-[9px] font-mono text-cyber-text-secondary mt-1">Footprint</span>
            </button>
            <button 
              onClick={() => navigate('/monitoring')}
              className="flex flex-col items-center p-2 rounded bg-cyber-black hover:bg-cyber-light/40 border border-cyber-light/30 transition-all text-center cursor-pointer group"
            >
              <Eye className="w-4 h-4 text-emerald-400 group-hover:scale-110 duration-200" />
              <span className="text-[9px] font-mono text-cyber-text-secondary mt-1">Monitoring</span>
            </button>
            <button 
              onClick={() => navigate('/reporting')}
              className="flex flex-col items-center p-2 rounded bg-cyber-black hover:bg-cyber-light/40 border border-cyber-light/30 transition-all text-center cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 duration-200" />
              <span className="text-[9px] font-mono text-cyber-text-secondary mt-1">Reports</span>
            </button>
          </div>
        </div>

      </div>

      {/* Exposure Alerts List */}
      <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-light/20 pb-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500 animate-pulse" />
              <span>Prioritized Threat & Exposure Alerts Feed</span>
            </span>
            <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
              Active exposures flagged by intelligence correlation pipelines. Prompt remediation required.
            </p>
          </div>
          <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2.5 py-1 rounded select-none">
            {alerts.length} Active Threat Vectors
          </span>
        </div>

        <div className="space-y-3.5 max-h-120 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg bg-cyber-black border transition-all duration-200 hover:border-cyber-light/70 relative overflow-hidden group
                ${alert.severity === 'CRITICAL' ? 'border-red-900/30 border-l-4 border-l-red-500' : ''}
                ${alert.severity === 'HIGH' ? 'border-orange-900/30 border-l-4 border-l-orange-500' : ''}
                ${alert.severity === 'MEDIUM' ? 'border-blue-900/30 border-l-4 border-l-blue-500' : ''}
                ${alert.severity === 'LOW' ? 'border-emerald-900/30 border-l-4 border-l-emerald-500' : ''}
              `}
            >
              
              {/* Alert Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded select-none
                    ${alert.severity === 'CRITICAL' ? 'bg-red-950/40 text-red-400 border border-red-900/40' : ''}
                    ${alert.severity === 'HIGH' ? 'bg-orange-950/40 text-orange-400 border border-orange-900/40' : ''}
                    ${alert.severity === 'MEDIUM' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' : ''}
                    ${alert.severity === 'LOW' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : ''}
                  `}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-mono text-neon-blue/80 font-semibold">{alert.category}</span>
                  <span className="text-[10px] font-mono text-cyber-text-secondary/70">• {new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                
                {/* Actions indicators */}
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border select-none
                  ${alert.status === 'Active' ? 'bg-red-950/20 text-red-400 border-red-950' : ''}
                  ${alert.status === 'Acknowledged' ? 'bg-amber-950/20 text-amber-400 border-amber-950' : ''}
                  ${alert.status === 'Investigating' ? 'bg-indigo-950/20 text-indigo-400 border-indigo-950' : ''}
                  ${alert.status === 'Resolved' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950' : ''}
                `}>
                  {alert.status}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xs font-bold text-cyber-text-primary mb-1 tracking-wide group-hover:text-neon-blue transition-colors">{alert.title}</h3>
              <p className="text-[11px] text-cyber-text-secondary leading-relaxed mb-3">{alert.description}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-cyber-light/20 text-[10px] font-mono">
                <span className="text-cyber-text-secondary">Exposed: <span className="text-cyber-text-primary font-bold">{alert.asset}</span></span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-cyber-light/40 hover:bg-cyber-light hover:text-cyan-300 border border-cyber-light/60 transition-all cursor-pointer font-bold"
                  >
                    {alert.status === 'Acknowledged' ? 'Acknowledge Active' : 'Acknowledge'}
                  </button>
                  <button 
                    onClick={() => handleInvestigatePivot(alert.asset)}
                    className="px-2.5 py-1 rounded bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/30 transition-all cursor-pointer font-bold flex items-center gap-1"
                  >
                    <span>Pivot & Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 transition-all cursor-pointer font-bold"
                  >
                    Resolve Vector
                  </button>
                </div>
              </div>

            </div>
          ))}

          {alerts.length === 0 && (
            <div className="text-center py-10 bg-cyber-black/40 border border-dashed border-cyber-light/30 rounded-lg">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
              <p className="text-xs text-cyber-text-primary font-mono">All vectors remediated. Exposure level normal.</p>
              <p className="text-[10px] text-cyber-text-secondary mt-1">Digital footprint matches compliance frameworks.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
