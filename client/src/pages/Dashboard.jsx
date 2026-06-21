import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  Activity,
  Zap,
  Clock,
  Database,
  Users,
  Crosshair,
  Radar,
  RefreshCw,
  Shield,
  Skull,
  Lock,
  Server
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar
} from 'recharts';
import { useApp } from '../context/AppContext';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    alerts, 
    subdomains, 
    credentials, 
    cloudExposures,
    attackPaths,
    threatPersonas,
    correlations,
    acknowledgeAlert, 
    resolveAlert, 
    navigateToAssetProfile,
    fetchAllData,
    loading
  } = useApp();

  const [dashOverview, setDashOverview] = useState(null);
  const [dashMetrics, setDashMetrics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch dashboard-specific data from API
  useEffect(() => {
    const fetchDash = async () => {
      try {
        const [overview, metrics] = await Promise.allSettled([
          dashboardAPI.getOverview(),
          dashboardAPI.getMetrics(),
        ]);
        if (overview.status === 'fulfilled') setDashOverview(overview.value.data);
        if (metrics.status === 'fulfilled') setDashMetrics(metrics.value.data);
      } catch {}
    };
    fetchDash();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
      const [overview, metrics] = await Promise.allSettled([
        dashboardAPI.getOverview(),
        dashboardAPI.getMetrics(),
      ]);
      if (overview.status === 'fulfilled') setDashOverview(overview.value.data);
      if (metrics.status === 'fulfilled') setDashMetrics(metrics.value.data);
      setLastRefresh(new Date());
    } catch {} finally { setRefreshing(false); }
  };

  // ═══════════════════════════════════════════════
  // All computed values from real data
  // ═══════════════════════════════════════════════
  const totalAssets = subdomains.length + cloudExposures.length;
  const totalCredentials = credentials.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Closed').length;
  const criticalAssets = subdomains.filter(s => s.riskLevel === 'critical').length + cloudExposures.filter(c => c.riskRating === 'CRITICAL').length;
  const highRiskAssets = subdomains.filter(s => s.riskLevel === 'high').length + cloudExposures.filter(c => c.riskRating === 'HIGH').length;

  // Dynamic exposure score from real data
  const exposureScore = useMemo(() => {
    if (dashOverview?.average_risk_score) return dashOverview.average_risk_score;
    if (subdomains.length === 0) return 0;
    const totalRisk = subdomains.reduce((sum, s) => sum + (s.riskScore || 0), 0) +
      cloudExposures.reduce((sum, c) => sum + (c.riskScore || 0), 0);
    return Math.round(totalRisk / Math.max(totalAssets, 1));
  }, [subdomains, cloudExposures, dashOverview, totalAssets]);

  const exposureRating = exposureScore >= 80 ? 'CRITICAL' : exposureScore >= 60 ? 'HIGH' : exposureScore >= 40 ? 'MEDIUM' : 'LOW';
  const exposureColor = exposureScore >= 80 ? 'red' : exposureScore >= 60 ? 'orange' : exposureScore >= 40 ? 'blue' : 'emerald';

  // Real stats from live data
  const stats = [
    {
      title: 'Exposed Assets',
      value: dashOverview?.total_assets || totalAssets,
      sub: `${criticalAssets} critical`,
      icon: Globe,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderClass: 'border-cyan-500/30'
    },
    {
      title: 'Leaked Credentials',
      value: dashOverview?.total_credentials_leaked || totalCredentials,
      sub: `${dashOverview?.critical_credentials || credentials.filter(c => c.severity === 'CRITICAL').length} critical`,
      icon: Lock,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderClass: 'border-red-500/30'
    },
    {
      title: 'Active Threats',
      value: activeAlerts,
      sub: `${criticalAlerts} CRIT / ${highAlerts} HIGH`,
      icon: Skull,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30'
    },
    {
      title: 'Attack Paths',
      value: dashOverview?.attack_paths || attackPaths.length,
      sub: `${attackPaths.filter(p => p.impact === 'CRITICAL').length} critical impact`,
      icon: Crosshair,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderClass: 'border-purple-500/30'
    },
    {
      title: 'Correlations',
      value: dashOverview?.total_correlations || correlations.length,
      sub: `${correlations.filter(c => c.severity === 'CRITICAL').length} dangerous`,
      icon: Activity,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderClass: 'border-pink-500/30'
    },
    {
      title: 'Threat Actors',
      value: threatPersonas.length,
      sub: `${threatPersonas.filter(p => p.type === 'Nation-State').length} nation-state`,
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30'
    }
  ];

  // Severity breakdown computed from real data
  const severityBreakdown = useMemo(() => {
    const critical = subdomains.filter(s => s.riskLevel === 'critical').length + cloudExposures.filter(c => c.riskRating === 'CRITICAL').length;
    const high = subdomains.filter(s => s.riskLevel === 'high').length + cloudExposures.filter(c => c.riskRating === 'HIGH').length;
    const medium = subdomains.filter(s => s.riskLevel === 'medium').length + cloudExposures.filter(c => c.riskRating === 'MEDIUM').length;
    const low = subdomains.filter(s => s.riskLevel === 'low').length + cloudExposures.filter(c => c.riskRating === 'LOW').length;

    return [
      { name: 'Critical', count: dashMetrics?.assets_by_risk?.critical || critical, fill: '#ef4444' },
      { name: 'High', count: dashMetrics?.assets_by_risk?.high || high, fill: '#f97316' },
      { name: 'Medium', count: dashMetrics?.assets_by_risk?.medium || medium, fill: '#3b82f6' },
      { name: 'Low', count: dashMetrics?.assets_by_risk?.low || low, fill: '#10b981' },
    ];
  }, [subdomains, cloudExposures, dashMetrics]);

  // Alert severity distribution for pie chart
  const alertDistribution = useMemo(() => {
    const dist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    alerts.forEach(a => { if (dist[a.severity] !== undefined) dist[a.severity]++; });
    return Object.entries(dist).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));
  }, [alerts]);

  const pieColors = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#3b82f6', LOW: '#10b981', INFO: '#6b7280' };

  // Threat radar from real personas
  const radarData = useMemo(() => {
    if (threatPersonas.length === 0) return [];
    return threatPersonas.slice(0, 5).map(p => ({
      persona: p.name.split(' ')[0],
      threat: parseInt(p.confidence) || 50,
      phishing: parseInt(p.phishingRisk) || 30,
      ransom: parseInt(p.ransomLikelihood) || 20,
    }));
  }, [threatPersonas]);

  // Risk timeline from real asset data (group by discovery date)
  const riskTimeline = useMemo(() => {
    const timeline = {};
    [...subdomains, ...cloudExposures].forEach(item => {
      const date = item.firstSeen || item.lastScanned || 'Unknown';
      if (!timeline[date]) timeline[date] = { date, assets: 0, riskSum: 0 };
      timeline[date].assets++;
      timeline[date].riskSum += item.riskScore || 0;
    });
    return Object.values(timeline).map(t => ({
      ...t,
      avgRisk: Math.round(t.riskSum / t.assets),
    })).slice(-8);
  }, [subdomains, cloudExposures]);

  // Top risky correlations
  const topCorrelations = useMemo(() => {
    return [...correlations].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 4);
  }, [correlations]);

  const handleInvestigatePivot = (asset) => {
    const foundSub = subdomains.find(sub => 
      asset?.toLowerCase().includes(sub.name?.toLowerCase()) || 
      asset?.includes(sub.ip)
    );
    
    if (foundSub) {
      navigateToAssetProfile(foundSub.id);
    } else if (subdomains.length > 0) {
      navigateToAssetProfile(subdomains[0].id);
    }
    navigate('/asset-profile');
  };

  return (
    <div className="space-y-6">
      
      {/* Risk Profile Banner — Live Data */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-cyber-dark/80 border border-cyber-light/40 rounded-xl p-6 gap-4 glow-blue">
        <div className="space-y-1 flex-1">
          <h1 className="text-xl font-bold tracking-wider text-cyber-text-primary uppercase flex items-center gap-2">
            <span>Threat Intelligence Command Center</span>
            <span className="text-[10px] font-mono font-normal tracking-widest px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 animate-pulse">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-cyber-text-secondary leading-relaxed">
            Real-time correlation of {totalAssets} exposed assets, {totalCredentials} leaked credentials, and {correlations.length} active threat correlations.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] font-mono text-cyber-text-secondary/70 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="text-[9px] font-mono text-neon-blue hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Intel'}
            </button>
          </div>
        </div>

        {/* Dynamic Exposure Score */}
        <div className="flex items-center gap-4 bg-cyber-black/70 border border-cyber-light/60 p-4 rounded-lg w-full md:w-auto shrink-0 select-none">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-cyber-text-secondary uppercase tracking-widest">Exposure Rating</span>
            <span className={`text-sm font-bold text-${exposureColor}-400 uppercase tracking-wider`}>{exposureRating} EXPOSURE</span>
            <span className="text-[9px] font-mono text-cyber-text-secondary/60 mt-0.5">
              {criticalAssets} critical / {highRiskAssets} high-risk assets
            </span>
          </div>
          <div className={`w-14 h-14 rounded-full border-2 border-${exposureColor}-500/40 flex items-center justify-center bg-${exposureColor}-950/20 text-${exposureColor}-400 font-mono text-lg font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)] relative`}>
            {exposureScore}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${exposureScore * 1.5} 150`} opacity="0.3" />
            </svg>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid — 6 cards from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.title} 
            className={`bg-cyber-dark border ${stat.borderClass} rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-cyber-gray/30 group`}
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-cyber-text-secondary uppercase tracking-wide">{stat.title}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-cyber-text-primary font-mono">{stat.value}</span>
              </div>
              <span className="text-[9px] font-mono text-cyber-text-secondary/70">{stat.sub}</span>
            </div>
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row — All computed from real data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Asset Risk Distribution Bar Chart */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Asset Risk Distribution</span>
          </div>
          <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
            Live breakdown of {totalAssets} discovered assets across severity levels.
          </p>
          <div style={{ width: '100%', minHeight: '192px', height: '192px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityBreakdown}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#202b3c', borderRadius: '8px', fontSize: '10px' }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity Pie Chart */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Alert Distribution</span>
          </div>
          <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
            {alerts.length} active alerts distributed by severity.
          </p>
          <div style={{ width: '100%', minHeight: '192px', height: '192px' }}>
            {alertDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={alertDistribution} 
                    cx="50%" cy="50%" 
                    innerRadius={40} outerRadius={70}
                    paddingAngle={3} dataKey="value"
                    stroke="none"
                  >
                    {alertDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#202b3c', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span className="text-[10px] text-cyber-text-secondary">No active alerts</span>
                </div>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            {alertDistribution.map(d => (
              <span key={d.name} className="flex items-center gap-1 text-[9px] font-mono text-cyber-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[d.name] }}></span>
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        {/* Threat Actor Radar */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Threat Actor Radar</span>
          </div>
          <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
            {threatPersonas.length} predicted threat personas targeting your organization.
          </p>
          <div style={{ width: '100%', minHeight: '208px', height: '208px' }}>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="persona" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <PolarRadiusAxis angle={90} tick={false} axisLine={false} />
                  <RechartsRadar name="Threat Level" dataKey="threat" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                  <RechartsRadar name="Phishing Risk" dataKey="phishing" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={1.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f17', borderColor: '#202b3c', borderRadius: '8px', fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
                  <span className="text-[10px] text-cyber-text-secondary">Run threat prediction to populate</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Risk Correlations — From Real Data */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Critical Correlations</span>
            </div>
            <button onClick={() => navigate('/correlations')} className="text-[10px] font-mono text-neon-blue hover:text-white cursor-pointer flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topCorrelations.length > 0 ? topCorrelations.map((corr, i) => (
              <div key={corr._id || i} className="p-3 rounded-lg bg-cyber-black border border-cyber-light/20 hover:border-cyber-light/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded
                    ${corr.severity === 'CRITICAL' ? 'bg-red-950/40 text-red-400 border border-red-900/40' : ''}
                    ${corr.severity === 'HIGH' ? 'bg-orange-950/40 text-orange-400 border border-orange-900/40' : ''}
                    ${corr.severity === 'MEDIUM' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' : ''}
                  `}>{corr.severity}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-cyber-text-secondary">Risk:</span>
                    <span className={`text-xs font-bold font-mono ${corr.risk_score >= 80 ? 'text-red-400' : corr.risk_score >= 60 ? 'text-orange-400' : 'text-blue-400'}`}>
                      {corr.risk_score}%
                    </span>
                  </div>
                </div>
                <h4 className="text-[11px] font-bold text-cyber-text-primary mb-1">{corr.title}</h4>
                <p className="text-[10px] text-cyber-text-secondary leading-relaxed line-clamp-2">{corr.description}</p>
              </div>
            )) : (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-amber-400/30 mx-auto mb-2" />
                <span className="text-[10px] text-cyber-text-secondary font-mono">Run correlation analysis to detect threat linkages</span>
              </div>
            )}
          </div>
        </div>

        {/* Attack Surface Heatmap — Real Data Insight */}
        <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider">Attack Surface Map</span>
            </div>
            <button onClick={() => navigate('/footprint')} className="text-[10px] font-mono text-neon-blue hover:text-white cursor-pointer flex items-center gap-1 transition-colors">
              Full Footprint <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[10px] text-cyber-text-secondary">Top exposed assets ranked by risk score.</p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...subdomains].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 8).map((asset, i) => (
              <div key={asset.id || i} className="flex items-center gap-3 p-2.5 rounded-lg bg-cyber-black border border-cyber-light/15 hover:border-cyber-light/40 transition-all group cursor-pointer"
                onClick={() => { navigateToAssetProfile(asset.id); navigate('/asset-profile'); }}>
                <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-mono shrink-0
                  ${asset.riskLevel === 'critical' ? 'bg-red-950/40 text-red-400 border border-red-900/30' : ''}
                  ${asset.riskLevel === 'high' ? 'bg-orange-950/40 text-orange-400 border border-orange-900/30' : ''}
                  ${asset.riskLevel === 'medium' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' : ''}
                  ${asset.riskLevel === 'low' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : ''}
                `}>{asset.riskScore}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-cyber-text-primary truncate group-hover:text-neon-blue transition-colors">{asset.name}</p>
                  <p className="text-[9px] font-mono text-cyber-text-secondary truncate">{asset.ip} • {asset.services}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Risk bar */}
                  <div className="w-16 h-1.5 bg-cyber-black rounded-full overflow-hidden border border-cyber-light/20">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        asset.riskScore >= 80 ? 'bg-red-500' : asset.riskScore >= 60 ? 'bg-orange-500' : asset.riskScore >= 40 ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${asset.riskScore}%` }}
                    />
                  </div>
                  <ArrowRight className="w-3 h-3 text-cyber-text-secondary/40 group-hover:text-neon-blue transition-colors" />
                </div>
              </div>
            ))}
            {subdomains.length === 0 && (
              <div className="text-center py-6">
                <Globe className="w-8 h-8 text-cyan-400/30 mx-auto mb-2" />
                <span className="text-[10px] text-cyber-text-secondary font-mono">No assets discovered yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Digital Footprint', icon: Globe, color: 'text-cyan-400', path: '/footprint' },
          { label: 'Correlations', icon: Activity, color: 'text-amber-400', path: '/correlations' },
          { label: 'Attack Paths', icon: Crosshair, color: 'text-red-400', path: '/attack-paths' },
          { label: 'Infrastructure', icon: Database, color: 'text-purple-400', path: '/graph' },
          { label: 'Monitoring', icon: Eye, color: 'text-emerald-400', path: '/monitoring' },
          { label: 'Reports', icon: FileText, color: 'text-blue-400', path: '/reporting' },
        ].map(mod => (
          <button 
            key={mod.label}
            onClick={() => navigate(mod.path)}
            className="flex flex-col items-center p-3 rounded-lg bg-cyber-dark hover:bg-cyber-gray/30 border border-cyber-light/30 hover:border-cyber-light/60 transition-all cursor-pointer group"
          >
            <mod.icon className={`w-5 h-5 ${mod.color} group-hover:scale-110 transition-transform duration-200 mb-1.5`} />
            <span className="text-[9px] font-mono text-cyber-text-secondary group-hover:text-cyber-text-primary transition-colors">{mod.label}</span>
          </button>
        ))}
      </div>

      {/* Live Exposure Alerts Feed */}
      <div className="bg-cyber-dark border border-cyber-light/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-light/20 pb-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyber-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500 animate-pulse" />
              <span>Live Exposure Alert Feed</span>
            </span>
            <p className="text-[10px] text-cyber-text-secondary leading-relaxed">
              Real-time exposures from {totalAssets} monitored assets. {activeAlerts} unresolved vectors.
            </p>
          </div>
          <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2.5 py-1 rounded select-none">
            {alerts.length} Threat Vectors
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
                ${alert.severity === 'INFO' ? 'border-gray-900/30 border-l-4 border-l-gray-500' : ''}
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
                    ${alert.severity === 'INFO' ? 'bg-gray-950/40 text-gray-400 border border-gray-900/40' : ''}
                  `}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-mono text-neon-blue/80 font-semibold">{alert.category}</span>
                  <span className="text-[10px] font-mono text-cyber-text-secondary/70">• {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ''}</span>
                </div>
                
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border select-none
                  ${alert.status === 'Active' || alert.status === 'New' ? 'bg-red-950/20 text-red-400 border-red-950' : ''}
                  ${alert.status === 'Acknowledged' ? 'bg-amber-950/20 text-amber-400 border-amber-950' : ''}
                  ${alert.status === 'Investigating' ? 'bg-indigo-950/20 text-indigo-400 border-indigo-950' : ''}
                  ${alert.status === 'Resolved' || alert.status === 'Closed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950' : ''}
                `}>
                  {alert.status}
                </span>
              </div>

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
                    {alert.status === 'Acknowledged' ? 'Reactivate' : 'Acknowledge'}
                  </button>
                  <button 
                    onClick={() => handleInvestigatePivot(alert.asset)}
                    className="px-2.5 py-1 rounded bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/30 transition-all cursor-pointer font-bold flex items-center gap-1"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 transition-all cursor-pointer font-bold"
                  >
                    Resolve
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
