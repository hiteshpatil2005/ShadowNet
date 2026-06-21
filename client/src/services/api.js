const API_BASE = '/api';

// Token management
let accessToken = localStorage.getItem('shadownet_token') || null;
let refreshToken = localStorage.getItem('shadownet_refresh_token') || null;

export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('shadownet_token', access);
  else localStorage.removeItem('shadownet_token');
  if (refresh) localStorage.setItem('shadownet_refresh_token', refresh);
  else localStorage.removeItem('shadownet_refresh_token');
};

export const getToken = () => accessToken;
export const clearTokens = () => setTokens(null, null);

// Core fetch wrapper with auto-refresh
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(url, { ...options, headers });

  // If 401 and we have a refresh token, try to refresh
  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens(data.data.access_token, data.data.refresh_token);
      headers['Authorization'] = `Bearer ${data.data.access_token}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      // HashRouter: reload app root so Login gate renders
      window.location.hash = '#/';
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Request failed with status ${res.status}`);
  }

  return res.json();
};

// ═══════════════════════════════════════════════
// Auth API
// ═══════════════════════════════════════════════
export const authAPI = {
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }),

  getProfile: () =>
    apiFetch('/auth/profile'),
};

// ═══════════════════════════════════════════════
// Dashboard API
// ═══════════════════════════════════════════════
export const dashboardAPI = {
  getOverview: () => apiFetch('/dashboard/overview'),
  getMetrics: () => apiFetch('/dashboard/metrics'),
  getRecentActivity: () => apiFetch('/dashboard/recent-activity'),
  getRiskSummary: () => apiFetch('/dashboard/risk-summary'),
};

// ═══════════════════════════════════════════════
// Assets API
// ═══════════════════════════════════════════════
export const assetsAPI = {
  getFootprint: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/assets/footprint${qs ? `?${qs}` : ''}`);
  },
  getAsset: (id) => apiFetch(`/assets/${id}`),
  updateAsset: (id, data) => apiFetch(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id) => apiFetch(`/assets/${id}`, { method: 'DELETE' }),
  search: (q) => apiFetch(`/assets/search?q=${encodeURIComponent(q)}`),
  startScan: (targets) => apiFetch('/assets/scan', { method: 'POST', body: JSON.stringify({ targets }) }),
  getScanStatus: (scanId) => apiFetch(`/assets/scan/${scanId}/status`),
};

// ═══════════════════════════════════════════════
// Credentials API
// ═══════════════════════════════════════════════
export const credentialsAPI = {
  getLeaked: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/credentials/leaked${qs ? `?${qs}` : ''}`);
  },
  getCredential: (id) => apiFetch(`/credentials/${id}`),
  checkCredential: (email) => apiFetch('/credentials/check', { method: 'POST', body: JSON.stringify({ email }) }),
  updateCredential: (id, data) => apiFetch(`/credentials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/credentials/${id}`, { method: 'DELETE' }),
  deleteAll: () => apiFetch('/credentials', { method: 'DELETE' }),
};

// ═══════════════════════════════════════════════
// Correlations API
// ═══════════════════════════════════════════════
export const correlationsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/correlations${qs ? `?${qs}` : ''}`);
  },
  getCorrelation: (id) => apiFetch(`/correlations/${id}`),
  analyze: () => apiFetch('/correlations/analyze', { method: 'POST' }),
  getMatrix: () => apiFetch('/correlations/matrix'),
  getRiskyCombinations: () => apiFetch('/correlations/risky-combinations'),
  getStats: () => apiFetch('/correlations/stats'),
  delete: (id) => apiFetch(`/correlations/${id}`, { method: 'DELETE' }),
  deleteAll: () => apiFetch('/correlations', { method: 'DELETE' }),
};

// ═══════════════════════════════════════════════
// Attack Paths API
// ═══════════════════════════════════════════════
export const attackPathsAPI = {
  getAll: () => apiFetch('/attack-paths'),
  getPath: (id) => apiFetch(`/attack-paths/${id}`),
  simulate: () => apiFetch('/attack-paths/simulate', { method: 'POST' }),
  getRecommendations: (id) => apiFetch(`/attack-paths/${id}/recommendations`),
  update: (id, data) => apiFetch(`/attack-paths/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/attack-paths/${id}`, { method: 'DELETE' }),
  geminiReport: (id) => apiFetch(`/attack-paths/${id}/recommendations`),
};

// ═══════════════════════════════════════════════
// Threat Personas API
// ═══════════════════════════════════════════════
export const threatPersonasAPI = {
  getAll: () => apiFetch('/threat-personas'),
  getPersona: (id) => apiFetch(`/threat-personas/${id}`),
  predict: () => apiFetch('/threat-personas/predict', { method: 'POST' }),
};

// ═══════════════════════════════════════════════
// Narratives API
// ═══════════════════════════════════════════════
export const narrativesAPI = {
  getAll: () => apiFetch('/narratives'),
  getNarrative: (id) => apiFetch(`/narratives/${id}`),
  generate: (type) => apiFetch('/narratives/generate', { method: 'POST', body: JSON.stringify({ narrative_type: type }) }),
  getExecutiveSummary: () => apiFetch('/narratives/executive-summary'),
};

// ═══════════════════════════════════════════════
// Alerts API
// ═══════════════════════════════════════════════
export const alertsAPI = {
  getFeed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/alerts/feed${qs ? `?${qs}` : ''}`);
  },
  getCount: () => apiFetch('/alerts/count'),
  acknowledge: (id) => apiFetch(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  investigate: (id, data) => apiFetch(`/alerts/${id}/investigate`, { method: 'POST', body: JSON.stringify(data) }),
  getTimeline: () => apiFetch('/exposure/timeline'),
  getMetrics: () => apiFetch('/exposure/metrics'),
};

// ═══════════════════════════════════════════════
// Monitoring API
// ═══════════════════════════════════════════════
export const monitoringAPI = {
  getConfig: () => apiFetch('/monitoring/config'),
  updateConfig: (data) => apiFetch('/monitoring/config', { method: 'PUT', body: JSON.stringify(data) }),
  getRules: () => apiFetch('/monitoring/rules'),
  addRule: (keyword, type) => apiFetch('/monitoring/rules', { method: 'POST', body: JSON.stringify({ keyword, type }) }),
  toggleRule: (id, active) => apiFetch(`/monitoring/rules/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }),
  deleteRule: (id) => apiFetch(`/monitoring/rules/${id}`, { method: 'DELETE' }),
  getTargets: () => apiFetch('/monitoring/targets'),
  addTarget: (target, type) => apiFetch('/monitoring/targets', { method: 'POST', body: JSON.stringify({ target, type }) }),
  deleteTarget: (id) => apiFetch(`/monitoring/targets/${id}`, { method: 'DELETE' }),
  runScan: () => apiFetch('/monitoring/scan/run', { method: 'POST' }),
};

// ═══════════════════════════════════════════════
// Reports API
// ═══════════════════════════════════════════════
export const reportsAPI = {
  getAll: () => apiFetch('/reports'),
  getLiveStats: () => apiFetch('/reports/live-stats'),
  aiGenerate: () => apiFetch('/reports/ai-generate', { method: 'POST' }),
  threatIntelSummary: () => apiFetch('/reports/threat-intel-summary', { method: 'POST' }),
  narrative: (type) => apiFetch('/reports/narrative', { method: 'POST', body: JSON.stringify({ type }) }),
};

// ═══════════════════════════════════════════════
// Infrastructure API
// ═══════════════════════════════════════════════
export const infrastructureAPI = {
  getGraph: () => apiFetch('/infrastructure/graph'),
  searchGraph: (q) => apiFetch(`/infrastructure/graph/search?q=${encodeURIComponent(q)}`),
  getRelationships: () => apiFetch('/infrastructure/relationships'),
};

// ═══════════════════════════════════════════════
// Search / Investigate API
// ═══════════════════════════════════════════════
export const searchAPI = {
  investigate: (q) => apiFetch(`/search/investigate?q=${encodeURIComponent(q)}`),
  getHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/search/history${qs ? `?${qs}` : ''}`);
  },
};

// ═══════════════════════════════════════════════
// Investigations API
// ═══════════════════════════════════════════════
export const investigationsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/investigations${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiFetch(`/investigations/${id}`),
  delete: (id) => apiFetch(`/investigations/${id}`, { method: 'DELETE' }),
  deleteAll: () => apiFetch('/investigations', { method: 'DELETE' }),
  getSummary: () => apiFetch('/investigations/stats/summary'),
};


// ═══════════════════════════════════════════════
// Threat Intelligence API
// ═══════════════════════════════════════════════
export const tiAPI = {
  getStatus: () => apiFetch('/ti/status'),
  lookupCVE: (cveId) => apiFetch(`/ti/cve/${encodeURIComponent(cveId)}`),
  enrichIP: (ip) => apiFetch(`/ti/ip/${encodeURIComponent(ip)}`),
  enrichDomain: (domain) => apiFetch(`/ti/domain/${encodeURIComponent(domain)}`),
};

// ═══════════════════════════════════════════════
// Admin API
// ═══════════════════════════════════════════════
export const adminAPI = {
  getOrganization: () => apiFetch('/admin/organizations'),
  getUsers: () => apiFetch('/admin/users'),
  updateUser: (id, data) => apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
  getAPIUsage: () => apiFetch('/admin/api-usage'),
};
