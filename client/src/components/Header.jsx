import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldAlert, Database, RefreshCw, X, Globe, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchAPI } from '../services/api';

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const looksLikeDomain = (q) => /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(q);

const Header = () => {
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    navigateToAssetProfile,
    alerts,
    fetchAllData,
    loading,
    lastSyncAt,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [investigateError, setInvestigateError] = useState('');
  const [liveInsights, setLiveInsights] = useState(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runInvestigate = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setLiveInsights(null);
      setInvestigateError('');
      return;
    }
    const isIp = IP_RE.test(trimmed);
    const isDomain = looksLikeDomain(trimmed);
    if (!isIp && !isDomain) {
      setLiveInsights(null);
      setInvestigateError('');
      return;
    }

    setInvestigating(true);
    setInvestigateError('');
    try {
      const res = await searchAPI.investigate(trimmed);
      setLiveInsights(res.data);
      await fetchAllData();
    } catch (err) {
      setInvestigateError(err.message || 'Investigation failed');
      setLiveInsights(null);
    } finally {
      setInvestigating(false);
    }
  }, [fetchAllData]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q || (!IP_RE.test(q) && !looksLikeDomain(q))) {
      setLiveInsights(null);
      setInvestigateError('');
      return;
    }
    debounceRef.current = setTimeout(() => runInvestigate(q), 700);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, runInvestigate]);

  const handleSearchSelect = (asset) => {
    navigateToAssetProfile(asset.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setLiveInsights(null);
    navigate('/asset-profile');
  };

  const handleInvestigateSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (IP_RE.test(q) || looksLikeDomain(q)) runInvestigate(q);
  };

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const syncLabel = lastSyncAt
    ? `${Math.max(0, Math.round((Date.now() - lastSyncAt.getTime()) / 1000))}s ago`
    : '—';

  const insights = liveInsights?.insights;
  const abuse = insights?.abuseipdb;
  const ripe = insights?.ripestat;

  return (
    <header className="h-16 bg-cyber-dark/95 backdrop-blur-md border-b border-cyber-light/40 sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
      <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
        <form onSubmit={handleInvestigateSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-secondary" />
          <input
            type="text"
            placeholder="Search IP (8.8.8.8) or domain for live TI insights..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full h-9.5 pl-10 pr-20 bg-cyber-black/70 border border-cyber-light/50 focus:border-neon-blue/80 hover:border-cyber-light focus:outline-none rounded-lg text-xs text-cyber-text-primary font-mono"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {investigating && <Loader2 className="w-4 h-4 text-neon-blue animate-spin" />}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLiveInsights(null);
                  setIsDropdownOpen(false);
                }}
                className="text-cyber-text-secondary hover:text-cyber-text-primary cursor-pointer p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-11 left-0 right-0 max-h-[28rem] overflow-y-auto bg-cyber-gray border border-cyber-light/80 rounded-lg shadow-2xl p-2 z-50 glow-blue">
            {investigateError && (
              <p className="text-xs text-red-400 font-mono px-2 py-2">{investigateError}</p>
            )}

            {liveInsights && insights && (
              <div className="mb-3 p-3 rounded-lg bg-cyber-black/80 border border-neon-blue/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">
                    Live TI — {insights.type?.toUpperCase()} {insights.target}
                  </span>
                  <Globe className="w-3.5 h-3.5 text-neon-blue" />
                </div>
                <p className="text-[10px] text-cyber-text-secondary whitespace-pre-line leading-relaxed font-mono">
                  {insights.summary}
                </p>
                {abuse && !abuse._fallback && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded bg-red-950/20 border border-red-900/40">
                      <span className="text-red-400 font-bold">Abuse score</span>
                      <div className="text-cyber-text-primary">{abuse.abuse_score}%</div>
                    </div>
                    <div className="p-2 rounded bg-cyber-black border border-cyber-light/30">
                      <span className="text-cyber-text-secondary">Reports</span>
                      <div className="text-cyber-text-primary">{abuse.total_reports}</div>
                    </div>
                    <div className="p-2 rounded bg-cyber-black border border-cyber-light/30 col-span-2">
                      <span className="text-cyber-text-secondary">ISP / Country</span>
                      <div className="text-cyber-text-primary truncate">{abuse.isp} • {abuse.country}</div>
                    </div>
                  </div>
                )}
                {ripe && !ripe._fallback && (
                  <div className="p-2 rounded bg-purple-950/20 border border-purple-900/40 text-[10px] font-mono">
                    <span className="text-purple-300 font-bold">RIPEstat</span>
                    <div className="text-cyber-text-primary mt-1">{ripe.holder || '—'}</div>
                    <div className="text-cyber-text-secondary">{ripe.asn} • {ripe.country} • {ripe.inetnum}</div>
                  </div>
                )}
                {insights.crtsh && insights.crtsh.subdomain_count > 0 && (
                  <p className="text-[10px] text-cyan-400 font-mono">
                    crt.sh: {insights.crtsh.subdomain_count} related hostnames discovered
                  </p>
                )}
                <p className="text-[9px] text-emerald-400 font-mono">Saved to your footprint inventory</p>
              </div>
            )}

            {(IP_RE.test(searchQuery.trim()) || looksLikeDomain(searchQuery.trim())) && !investigating && !liveInsights && !investigateError && (
              <p className="text-[10px] text-cyber-text-secondary font-mono px-2 py-2 animate-pulse">
                Querying threat intelligence APIs…
              </p>
            )}

            <div className="text-[10px] text-neon-blue font-mono font-bold px-2 py-1 uppercase border-b border-cyber-light/30 mb-1">
              Inventory matches
            </div>

            {searchResults.subdomains.length > 0 && (
              <div className="mb-2">
                {searchResults.subdomains.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSearchSelect({ id: sub.id })}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyber-light/50 flex justify-between cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-cyber-text-primary truncate">{sub.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">Risk: {sub.riskScore}</span>
                  </button>
                ))}
              </div>
            )}

            {searchResults.credentials.length > 0 && (
              <div className="mb-2">
                {searchResults.credentials.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSearchSelect({ id: c.id })}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyber-light/50 flex justify-between cursor-pointer"
                  >
                    <span className="text-xs truncate">{c.email}</span>
                    <span className="text-[9px] text-red-400">{c.severity}</span>
                  </button>
                ))}
              </div>
            )}

            {!investigating &&
              searchResults.subdomains.length === 0 &&
              searchResults.credentials.length === 0 &&
              searchResults.cloudExposures.length === 0 &&
              !liveInsights &&
              !IP_RE.test(searchQuery.trim()) &&
              !looksLikeDomain(searchQuery.trim()) && (
                <p className="text-xs text-cyber-text-secondary text-center py-4 font-mono">
                  Enter an IPv4 address or domain for live investigation.
                </p>
              )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => fetchAllData()}
          disabled={loading}
          className="flex items-center gap-2 text-cyber-text-secondary border-r border-cyber-light/40 pr-6 text-[10px] font-mono hover:text-neon-blue cursor-pointer"
          title="Refresh data from API"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Synced: {syncLabel}</span>
        </button>

        <div className="relative cursor-pointer group" onClick={() => navigate('/monitoring')}>
          <Bell className="w-4.5 h-4.5 text-cyber-text-secondary group-hover:text-cyber-text-primary" />
          {criticalAlertsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-cyber-black">
              {criticalAlertsCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
