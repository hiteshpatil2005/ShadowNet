import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  authAPI,
  dashboardAPI,
  assetsAPI,
  credentialsAPI,
  alertsAPI,
  attackPathsAPI,
  threatPersonasAPI,
  monitoringAPI,
  correlationsAPI,
  setTokens,
  clearTokens,
  getToken,
} from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Core Data States
  const [alerts, setAlerts] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [cloudExposures, setCloudExposures] = useState([]);
  const [logs, setLogs] = useState([]);
  const [attackPaths, setAttackPaths] = useState([]);
  const [threatPersonas, setThreatPersonas] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [correlations, setCorrelations] = useState([]);

  // Active investigation/pivot state
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Custom Monitoring Rules
  const [monitoringRules, setMonitoringRules] = useState([]);

  // Global search input state
  const [searchQuery, setSearchQuery] = useState("");

  // ═══════════════════════════════════════════════
  // Data Fetching
  // ═══════════════════════════════════════════════

  const fetchAllData = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const [
        assetsRes,
        credsRes,
        alertsRes,
        attackRes,
        personasRes,
        rulesRes,
        corrRes,
        overviewRes,
      ] = await Promise.allSettled([
        assetsAPI.getFootprint({ limit: 200 }),
        credentialsAPI.getLeaked({ limit: 200 }),
        alertsAPI.getFeed({ limit: 200 }),
        attackPathsAPI.getAll(),
        threatPersonasAPI.getAll(),
        monitoringAPI.getRules(),
        correlationsAPI.getAll(),
        dashboardAPI.getOverview(),
      ]);

      // Process assets — separate subdomains from cloud resources
      if (assetsRes.status === 'fulfilled') {
        const allAssets = assetsRes.value.data || [];
        setSubdomains(allAssets.filter(a => a.asset_type !== 'cloud_resource').map(a => ({
          id: a._id,
          name: a.asset_value,
          ip: a.ip || 'N/A',
          ports: Array.isArray(a.ports) ? a.ports : [],
          portsDisplay: Array.isArray(a.ports) && a.ports.length ? a.ports.join(', ') : 'N/A',
          riskScore: a.risk_score || 0,
          riskLevel: a.risk_level || 'medium',
          services: a.services || 'N/A',
          cloudProvider: a.cloud_provider || a.metadata?.cloud_provider || 'Self-Hosted',
          firstSeen: a.first_discovered ? new Date(a.first_discovered).toLocaleDateString() : 'N/A',
          lastSeen: a.last_seen ? new Date(a.last_seen).toLocaleDateString() : 'N/A',
          source: (a.sources || []).join(', ') || 'N/A',
          sslExpiry: a.metadata?.ssl_expiry || 'N/A',
          techStack: a.metadata?.tech_stack || 'N/A',
          asset_type: a.asset_type,
          raw: a,
        })));
        setCloudExposures(allAssets.filter(a => a.asset_type === 'cloud_resource').map(a => ({
          id: a._id,
          bucketName: a.asset_value,
          cloudProvider: a.cloud_provider || 'AWS',
          provider: a.cloud_provider || 'AWS',
          riskRating: (a.risk_level || 'high').toUpperCase(),
          riskScore: a.risk_score || 0,
          configurationIssue: a.services || 'Misconfiguration detected',
          piiCount: a.metadata?.pii_count ?? a.metadata?.estimated_records ?? 0,
          filesExposed: a.metadata?.files_exposed || a.metadata?.exposed_files || [],
          region: a.metadata?.region || 'us-east-1',
          lastScanned: a.last_seen ? new Date(a.last_seen).toLocaleDateString() : 'N/A',
          raw: a,
        })));
      }

      if (credsRes.status === 'fulfilled') {
        setCredentials((credsRes.value.data || []).map(c => ({
          id: c._id,
          email: c.email,
          owner: c.owner || 'Unknown',
          source: c.source || 'Unknown',
          severity: c.severity || 'MEDIUM',
          hashType: c.hash_type || 'Unknown',
          leakDate: c.leak_date || 'N/A',
          exposureCount: c.exposure_count || 1,
          leakedPassword: c.leaked_password ? '[REDACTED]' : '—',
          verified: c.verified ?? false,
          raw: c,
        })));
      }

      if (alertsRes.status === 'fulfilled') {
        const alertData = alertsRes.value.data || [];
        setAlerts(alertData.map(a => ({
          id: a._id,
          title: a.title || a.event || 'Alert',
          description: a.description || a.details || '',
          severity: a.severity || 'MEDIUM',
          status: a.status || 'New',
          category: a.category || a.event_type || 'General',
          asset: a.asset || '',
          timestamp: a.timestamp || a.created_at,
          acknowledged: a.acknowledged || false,
          raw: a,
        })));
        // Also use as monitoring logs
        setLogs(alertData.map(a => ({
          id: a._id,
          timestamp: a.timestamp || a.created_at,
          event: a.event || a.title || 'Event',
          details: a.description || a.details || '',
          severity: a.severity || 'INFO',
          status: a.status || 'New',
        })));
      }

      if (attackRes.status === 'fulfilled') {
        setAttackPaths((attackRes.value.data || []).map(p => ({
          id: p._id,
          name: p.name,
          type: p.attack_scenario_type,
          probability: p.probability || '0%',
          impact: p.impact || 'HIGH',
          stages: (p.stages || []).map(s => ({
            title: s.title,
            status: s.status || 'Simulated Vulnerable',
            technique: s.technique || '',
            details: s.details || '',
            confidence: s.confidence || '0%',
          })),
          remediation: (p.remediation || []).map(r => ({
            priority: r.priority,
            action: r.action,
            details: r.details || '',
            status: r.status || 'Pending',
          })),
          timelineEstimate: p.timeline_estimate || '',
          aiReasoning: p.ai_reasoning || '',
          raw: p,
        })));
      }

      if (personasRes.status === 'fulfilled') {
        setThreatPersonas((personasRes.value.data || []).map(p => ({
          id: p._id,
          name: p.name,
          type: p.predicted_attacker_type,
          category: p.category || '',
          origin: p.origin || '',
          motivation: p.motivation || '',
          confidence: p.confidence || '0%',
          capabilityLevel: p.capability_level || 'intermediate',
          targetAssets: p.target_assets || '',
          description: p.description || '',
          ransomLikelihood: p.ransom_likelihood || '0%',
          phishingRisk: p.phishing_risk || '0%',
          raw: p,
        })));
      }

      if (rulesRes.status === 'fulfilled') {
        setMonitoringRules((rulesRes.value.data || []).map(r => ({
          id: r._id?.toString?.() ?? r.id,
          keyword: r.keyword,
          type: r.type,
          active: r.active,
        })));
      }

      if (corrRes.status === 'fulfilled') {
        setCorrelations(corrRes.value.data || []);
      }

      if (overviewRes.status === 'fulfilled') {
        setDashboardData(overviewRes.value.data || null);
      }

    } catch (error) {
      console.error('[AppContext] Data fetch error:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch data on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && getToken()) {
      // Load user profile
      authAPI.getProfile().then(res => {
        if (res.data?.user) {
          setUser({
            name: res.data.user.full_name,
            role: res.data.user.role,
            email: res.data.user.email,
            avatar: res.data.user.full_name.split(' ').map(n => n[0]).join(''),
            id: res.data.user.id,
          });
        }
      }).catch(() => {});
      fetchAllData();
    } else {
      setInitialLoading(false);
    }
  }, [isAuthenticated, fetchAllData]);

  // ═══════════════════════════════════════════════
  // Auth Actions
  // ═══════════════════════════════════════════════

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    setTokens(res.data.access_token, res.data.refresh_token);
    setUser({
      name: res.data.user.full_name,
      role: res.data.user.role,
      email: res.data.user.email,
      avatar: res.data.user.full_name.split(' ').map(n => n[0]).join(''),
      id: res.data.user.id,
    });
    setIsAuthenticated(true);
    return res;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    setTokens(res.data.access_token, res.data.refresh_token);
    setUser({
      name: res.data.user.full_name,
      role: res.data.user.role,
      email: res.data.user.email,
      avatar: res.data.user.full_name.split(' ').map(n => n[0]).join(''),
      id: res.data.user.id,
    });
    setIsAuthenticated(true);
    return res;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setAlerts([]);
    setSubdomains([]);
    setCredentials([]);
    setCloudExposures([]);
    setLogs([]);
    setAttackPaths([]);
    setThreatPersonas([]);
    setDashboardData(null);
    setCorrelations([]);
    setMonitoringRules([]);
  };

  // ═══════════════════════════════════════════════
  // Alert Actions (API-backed)
  // ═══════════════════════════════════════════════

  const acknowledgeAlert = async (id) => {
    try {
      await alertsAPI.acknowledge(id);
      setAlerts(prev => prev.map(alert =>
        alert.id === id ? { ...alert, status: alert.status === "Active" ? "Acknowledged" : "Active", acknowledged: true } : alert
      ));
    } catch (error) {
      // Fallback to local state update
      setAlerts(prev => prev.map(alert =>
        alert.id === id ? { ...alert, status: alert.status === "Active" ? "Acknowledged" : "Active" } : alert
      ));
    }
  };

  const resolveAlert = async (id) => {
    try {
      await alertsAPI.investigate(id, { investigation_status: 'resolved' });
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (error) {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }
  };

  // ═══════════════════════════════════════════════
  // Monitoring Rule Actions (API-backed)
  // ═══════════════════════════════════════════════

  const addMonitoringRule = async (keyword, type) => {
    try {
      const res = await monitoringAPI.addRule(keyword, type);
      setMonitoringRules((res.data || []).map(r => ({
        id: r._id, keyword: r.keyword, type: r.type, active: r.active,
      })));
    } catch (error) {
      // Fallback to local
      setMonitoringRules(prev => [...prev, { id: `rule-${Date.now()}`, keyword, type, active: true }]);
    }
  };

  const toggleMonitoringRule = async (id) => {
    const rule = monitoringRules.find(r => r.id === id);
    if (!rule) return;
    try {
      const res = await monitoringAPI.toggleRule(id, !rule.active);
      setMonitoringRules((res.data || []).map(r => ({
        id: r._id, keyword: r.keyword, type: r.type, active: r.active,
      })));
    } catch (error) {
      setMonitoringRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    }
  };

  const deleteMonitoringRule = async (id) => {
    try {
      const res = await monitoringAPI.deleteRule(id);
      setMonitoringRules((res.data || []).map(r => ({
        id: r._id, keyword: r.keyword, type: r.type, active: r.active,
      })));
    } catch (error) {
      setMonitoringRules(prev => prev.filter(r => r.id !== id));
    }
  };

  // ═══════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { subdomains: [], credentials: [], cloudExposures: [] };
    const query = searchQuery.toLowerCase();

    return {
      subdomains: subdomains.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.ip?.includes(query) ||
        s.services?.toLowerCase().includes(query)
      ),
      credentials: credentials.filter(c =>
        c.email?.toLowerCase().includes(query) ||
        c.owner?.toLowerCase().includes(query) ||
        c.source?.toLowerCase().includes(query)
      ),
      cloudExposures: cloudExposures.filter(e =>
        e.bucketName?.toLowerCase().includes(query) ||
        e.configurationIssue?.toLowerCase().includes(query)
      )
    };
  }, [searchQuery, subdomains, credentials, cloudExposures]);

  const globalSearchList = useMemo(() => {
    const list = [];
    subdomains.forEach(s => list.push({ id: s.id, type: "Subdomain", title: s.name, subtitle: `IP: ${s.ip} | Risk: ${s.riskScore}` }));
    credentials.forEach(c => list.push({ id: c.id, type: "Credential", title: c.email, subtitle: `Owner: ${c.owner} | Source: ${c.source}` }));
    cloudExposures.forEach(e => list.push({ id: e.id, type: "Cloud Storage", title: e.bucketName, subtitle: `PII Records: ${e.piiCount} | Risk: ${e.riskRating}` }));
    return list;
  }, [subdomains, credentials, cloudExposures]);

  // Pivot asset explorer helper
  const navigateToAssetProfile = (id) => {
    setSelectedAssetId(id);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      user,
      setUser,
      loading,
      initialLoading,
      alerts,
      setAlerts,
      subdomains,
      setSubdomains,
      credentials,
      setCredentials,
      cloudExposures,
      setCloudExposures,
      logs,
      setLogs,
      attackPaths,
      setAttackPaths,
      threatPersonas,
      setThreatPersonas,
      correlations,
      setCorrelations,
      dashboardData,
      setDashboardData,
      selectedAssetId,
      setSelectedAssetId,
      monitoringRules,
      setMonitoringRules,
      searchQuery,
      setSearchQuery,
      searchResults,
      globalSearchList,
      login,
      register,
      logout,
      acknowledgeAlert,
      resolveAlert,
      addMonitoringRule,
      toggleMonitoringRule,
      deleteMonitoringRule,
      navigateToAssetProfile,
      fetchAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
