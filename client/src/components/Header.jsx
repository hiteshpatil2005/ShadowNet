import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldAlert, Cpu, Database, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = () => {
  const navigate = useNavigate();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    globalSearchList, 
    navigateToAssetProfile,
    alerts 
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [heartbeatTime, setHeartbeatTime] = useState("2s ago");
  const dropdownRef = useRef(null);

  // Simple live telemetry effect for sync status
  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor(Math.random() * 4) + 1;
      setHeartbeatTime(`${seconds}s ago`);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSelect = (asset) => {
    // Pivot to asset profile by registry id
    navigateToAssetProfile(asset.id);
    setSearchQuery("");
    setIsDropdownOpen(false);
    navigate('/asset-profile');
  };

  const criticalAlertsCount = alerts.filter(a => a.severity === "CRITICAL").length;

  return (
    <header className="h-16 bg-cyber-dark/95 backdrop-blur-md border-b border-cyber-light/40 sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
      
      {/* Left Search Bar Area */}
      <div className="flex-1 max-w-md relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-secondary" />
          <input
            type="text"
            placeholder="Global Investigation Pivot (Search IP, Domain, Credentials...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full h-9.5 pl-10 pr-10 bg-cyber-black/70 border border-cyber-light/50 focus:border-neon-blue/80 hover:border-cyber-light focus:outline-none rounded-lg text-xs text-cyber-text-primary transition-all duration-200 placeholder:text-cyber-text-secondary/50 font-mono tracking-wide"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-secondary hover:text-cyber-text-primary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-11 left-0 right-0 max-h-80 overflow-y-auto bg-cyber-gray border border-cyber-light/80 rounded-lg shadow-2xl p-2 z-50 glow-blue">
            <div className="text-[10px] text-neon-blue font-mono font-bold px-2 py-1 uppercase border-b border-cyber-light/30 tracking-widest mb-1.5 flex justify-between">
              <span>Matching Exposed Assets</span>
              <span>Select to Pivot</span>
            </div>

            {/* Subdomains Results */}
            {searchResults.subdomains.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-cyber-text-secondary font-mono px-2 py-0.5 uppercase tracking-wide flex items-center gap-1 font-bold">
                  <Database className="w-2.5 h-2.5 text-blue-400" />
                  <span>Subdomains ({searchResults.subdomains.length})</span>
                </div>
                {searchResults.subdomains.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSearchSelect({ id: sub.id, type: "Subdomain" })}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyber-light/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-cyber-text-primary truncate">{sub.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">Risk: {sub.riskScore}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Credentials Results */}
            {searchResults.credentials.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-cyber-text-secondary font-mono px-2 py-0.5 uppercase tracking-wide flex items-center gap-1 font-bold">
                  <Cpu className="w-2.5 h-2.5 text-purple-400" />
                  <span>Leaked Credentials ({searchResults.credentials.length})</span>
                </div>
                {searchResults.credentials.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSearchSelect({ id: c.id, type: "Credential" })}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyber-light/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-cyber-text-primary truncate">{c.email}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-red-950/40 text-red-400 border border-red-900/40">{c.severity}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Cloud Exposures Results */}
            {searchResults.cloudExposures.length > 0 && (
              <div>
                <div className="text-[9px] text-cyber-text-secondary font-mono px-2 py-0.5 uppercase tracking-wide flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-2.5 h-2.5 text-orange-400" />
                  <span>Cloud Buckets ({searchResults.cloudExposures.length})</span>
                </div>
                {searchResults.cloudExposures.map(bucket => (
                  <button
                    key={bucket.id}
                    onClick={() => handleSearchSelect({ id: bucket.id, type: "Cloud Storage" })}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyber-light/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-cyber-text-primary truncate">{bucket.bucketName}</span>
                    <span className="text-[9px] font-mono text-orange-400 uppercase">{bucket.riskRating}</span>
                  </button>
                ))}
              </div>
            )}

            {searchResults.subdomains.length === 0 && 
             searchResults.credentials.length === 0 && 
             searchResults.cloudExposures.length === 0 && (
              <div className="text-xs text-cyber-text-secondary font-mono text-center py-4">
                No matching telemetry or assets found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Stats and Sync telemetry */}
      <div className="flex items-center gap-6">
        
        {/* Sync Telemetry */}
        <div className="flex items-center gap-2 text-cyber-text-secondary border-r border-cyber-light/40 pr-6 select-none">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-mono tracking-wider">Syncing: {heartbeatTime}</span>
          <RefreshCw className="w-3 h-3 text-emerald-500/80 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Notifications and Alert Summary */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group" onClick={() => navigate('/monitoring')}>
            <Bell className="w-4.5 h-4.5 text-cyber-text-secondary group-hover:text-cyber-text-primary transition-colors" />
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-cyber-black glow-critical">
                {criticalAlertsCount}
              </span>
            )}
          </div>
        </div>

      </div>

    </header>
  );
};

export default Header;
