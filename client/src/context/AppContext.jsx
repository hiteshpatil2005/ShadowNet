import React, { createContext, useContext, useState, useMemo } from 'react';
import { 
  mockAlerts, 
  mockSubdomains, 
  mockCredentials, 
  mockCloudExposures, 
  mockMonitoringLogs,
  mockAttackPaths,
  mockThreatPersonas
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for ease of exploration, can logout
  const [user, setUser] = useState({ name: "Sarah Jenkins", role: "SecOps Director", avatar: "SJ" });

  // Core Data States
  const [alerts, setAlerts] = useState(mockAlerts);
  const [subdomains, setSubdomains] = useState(mockSubdomains);
  const [credentials, setCredentials] = useState(mockCredentials);
  const [cloudExposures, setCloudExposures] = useState(mockCloudExposures);
  const [logs, setLogs] = useState(mockMonitoringLogs);
  const [attackPaths, setAttackPaths] = useState(mockAttackPaths);
  const [threatPersonas, setThreatPersonas] = useState(mockThreatPersonas);

  // Active investigation/pivot state
  const [selectedAssetId, setSelectedAssetId] = useState("sub-2"); // Default to vpn.shadownet-ai.com
  
  // Custom Monitoring Rules
  const [monitoringRules, setMonitoringRules] = useState([
    { id: "rule-1", keyword: "shadownet-ai.com", type: "Domain Lookup", active: true },
    { id: "rule-2", keyword: "admin@shadownet-ai.com", type: "Credential Leak", active: true },
    { id: "rule-3", keyword: "shadownet-prod", type: "S3 Bucket Keyword", active: true }
  ]);

  // Global search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Alert actions
  const acknowledgeAlert = (id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: alert.status === "Active" ? "Acknowledged" : "Active" } : alert
    ));
    
    // Add custom monitoring log indicating user action
    const targetAlert = alerts.find(a => a.id === id);
    if (targetAlert) {
      const newLog = {
        id: `log-user-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: "Analyst Action",
        details: `Alert '${targetAlert.title}' status toggled to Acknowledged.`,
        severity: "INFO",
        status: "Closed"
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const resolveAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    
    // Add custom monitoring log indicating user action
    const targetAlert = alerts.find(a => a.id === id);
    if (targetAlert) {
      const newLog = {
        id: `log-user-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: "Analyst Action",
        details: `Alert '${targetAlert.title}' marked as Resolved/Remediated.`,
        severity: "INFO",
        status: "Closed"
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  // Add custom monitoring keyword rule
  const addMonitoringRule = (keyword, type) => {
    const newRule = {
      id: `rule-${Date.now()}`,
      keyword,
      type,
      active: true
    };
    setMonitoringRules(prev => [...prev, newRule]);

    // Log the added rule
    const newLog = {
      id: `log-user-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: "Configuration Update",
      details: `New active exposure monitoring rule added: [${type}] '${keyword}'.`,
      severity: "INFO",
      status: "New"
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const toggleMonitoringRule = (id) => {
    setMonitoringRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  const deleteMonitoringRule = (id) => {
    setMonitoringRules(prev => prev.filter(rule => rule.id !== id));
  };

  // Memoized Search Results across multiple sources
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { subdomains: [], credentials: [], cloudExposures: [] };
    const query = searchQuery.toLowerCase();
    
    return {
      subdomains: subdomains.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.ip.includes(query) || 
        s.services.toLowerCase().includes(query)
      ),
      credentials: credentials.filter(c => 
        c.email.toLowerCase().includes(query) || 
        c.owner.toLowerCase().includes(query) || 
        c.source.toLowerCase().includes(query)
      ),
      cloudExposures: cloudExposures.filter(e => 
        e.bucketName.toLowerCase().includes(query) || 
        e.configurationIssue.toLowerCase().includes(query)
      )
    };
  }, [searchQuery, subdomains, credentials, cloudExposures]);

  // Comprehensive list of all searchable elements for UI dropdowns
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
      selectedAssetId,
      setSelectedAssetId,
      monitoringRules,
      setMonitoringRules,
      searchQuery,
      setSearchQuery,
      searchResults,
      globalSearchList,
      acknowledgeAlert,
      resolveAlert,
      addMonitoringRule,
      toggleMonitoringRule,
      deleteMonitoringRule,
      navigateToAssetProfile
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
