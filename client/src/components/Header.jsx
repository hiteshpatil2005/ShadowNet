import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, RefreshCw, X, Loader2, Hash, Globe, Link, FileCode, Mail, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Client-side indicator detection (mirrors server utils/targetDetect.js)
const detectType = (q) => {
  const t = (q || '').trim();
  if (!t) return null;
  if (/^CVE-\d{4}-\d{4,}$/i.test(t)) return 'cve';
  if (/^[a-f0-9]{32}$/i.test(t) || /^[a-f0-9]{40}$/i.test(t) || /^[a-f0-9]{64}$/i.test(t)) return 'hash';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) return 'ip';
  if (t.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'email';
  if (t.startsWith('http://') || t.startsWith('https://')) return 'url';
  if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(t)) return 'domain';
  return null;
};

const TYPE_META = {
  ip:     { label: 'IP',     icon: Globe,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30' },
  domain: { label: 'Domain', icon: Globe,    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  url:    { label: 'URL',    icon: Link,     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  hash:   { label: 'Hash',  icon: Hash,     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  cve:    { label: 'CVE',    icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  email:  { label: 'Email',  icon: Mail,     color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/30' },
};

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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (asset) => {
    navigateToAssetProfile(asset.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
    navigate('/asset-profile');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // Navigate to investigation page with query
    navigate(`/investigation?q=${encodeURIComponent(q)}`);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const detectedType = detectType(searchQuery);
  const typeMeta = detectedType ? TYPE_META[detectedType] : null;
  const TypeIcon = typeMeta?.icon || Search;

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const syncLabel = lastSyncAt
    ? `${Math.max(0, Math.round((Date.now() - lastSyncAt.getTime()) / 1000))}s ago`
    : '—';

  const hasInventoryMatches =
    searchResults.subdomains.length > 0 ||
    searchResults.credentials.length > 0 ||
    searchResults.cloudExposures.length > 0;

  return (
    <header className="h-16 bg-cyber-dark/95 backdrop-blur-md border-b border-cyber-light/40 sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
      <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center">
            <TypeIcon className={`w-4 h-4 ${typeMeta ? typeMeta.color : 'text-cyber-text-secondary'}`} />
          </div>
          <input
            id="global-search-input"
            type="text"
            placeholder="Search IP · domain · hash · CVE-XXXX · email · URL — press Enter to investigate"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full h-9.5 pl-10 pr-28 bg-cyber-black/70 border border-cyber-light/50 focus:border-neon-blue/80 hover:border-cyber-light focus:outline-none rounded-lg text-xs text-cyber-text-primary font-mono"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {typeMeta && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeMeta.bg} ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
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
          <div className="absolute top-11 left-0 right-0 bg-cyber-gray border border-cyber-light/80 rounded-lg shadow-2xl p-2 z-50 glow-blue">
            {/* Investigate CTA */}
            {detectedType && (
              <button
                type="button"
                onClick={handleSubmit}
                className={`w-full mb-2 p-2.5 rounded-lg border ${typeMeta.bg} text-left flex items-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <Shield className={`w-4 h-4 ${typeMeta.color} shrink-0`} />
                <div>
                  <p className={`text-[11px] font-bold ${typeMeta.color}`}>Investigate {typeMeta.label}</p>
                  <p className="text-[10px] text-cyber-text-secondary font-mono truncate">{searchQuery}</p>
                </div>
                <span className="ml-auto text-[9px] text-cyber-text-secondary font-mono">Enter ↵</span>
              </button>
            )}

            {/* Inventory matches */}
            {hasInventoryMatches && (
              <div className="text-[10px] text-neon-blue font-mono font-bold px-2 py-1 uppercase border-b border-cyber-light/30 mb-1">
                Inventory matches
              </div>
            )}

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

            {!detectedType && !hasInventoryMatches && (
              <p className="text-xs text-cyber-text-secondary text-center py-4 font-mono">
                Enter an IP, domain, hash, CVE, email, or URL to investigate
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
