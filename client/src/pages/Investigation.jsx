import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Shield, AlertTriangle, CheckCircle, HelpCircle, Clock,
  Globe, Hash, Mail, Link, FileCode, Database, ExternalLink,
  ChevronDown, ChevronUp, BookOpen, Loader2, X, History, Trash2,
  RefreshCw, Server, Activity, Eye, Lock, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { searchAPI, investigationsAPI } from '../services/api';

// ─── Detection helpers (client-side for instant feedback) ───────────────────
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
  ip:     { label: 'IPv4 Address',   icon: Globe,    color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30' },
  domain: { label: 'Domain',         icon: Globe,    color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/30' },
  url:    { label: 'URL',            icon: Link,     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
  hash:   { label: 'File Hash',      icon: Hash,     color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30' },
  cve:    { label: 'CVE',            icon: FileCode, color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  email:  { label: 'Email Address',  icon: Mail,     color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/30' },
};

const VERDICT_META = {
  malicious:  { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    label: 'MALICIOUS' },
  suspicious: { icon: AlertCircle,   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'SUSPICIOUS' },
  clean:      { icon: ShieldCheck,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  label: 'CLEAN' },
  unknown:    { icon: HelpCircle,    color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/30',    label: 'UNKNOWN' },
};

// ─── Source Card ────────────────────────────────────────────────────────────
const SourceCard = ({ sourceName, data }) => {
  const [expanded, setExpanded] = useState(false);
  if (!data) return (
    <div className="p-3 rounded-lg border border-cyber-light/20 bg-cyber-black/30 opacity-40 flex items-center gap-2">
      <span className="text-[11px] font-mono text-cyber-text-secondary uppercase">{sourceName}</span>
      <span className="text-[10px] text-gray-600 ml-auto">No data</span>
    </div>
  );

  const sourceLabels = {
    virustotal: 'VirusTotal', abuseipdb: 'AbuseIPDB', alienvault: 'AlienVault OTX',
    criminalip: 'CriminalIP', hybridanalysis: 'Hybrid Analysis', urlscan: 'URLScan.io',
    nvd: 'NIST NVD', ripestat: 'RIPEstat', crtsh: 'crt.sh', dnsenum: 'DNS Enumeration',
    openphish: 'OpenPhish', phishtank: 'PhishTank', abusech: 'abuse.ch', zoomeye: 'ZoomEye',
    viewdns: 'ViewDNS',
  };

  return (
    <div className="rounded-lg border border-cyber-light/30 bg-cyber-black/40 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-cyber-light/10 transition-colors"
      >
        <span className="text-[11px] font-bold font-mono text-neon-blue uppercase tracking-wider">
          {sourceLabels[sourceName] || sourceName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-mono">✓ Data received</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-cyber-text-secondary" /> : <ChevronDown className="w-3.5 h-3.5 text-cyber-text-secondary" />}
        </div>
      </button>
      {expanded && (
        <pre className="p-3 text-[10px] font-mono text-cyber-text-secondary overflow-x-auto whitespace-pre-wrap border-t border-cyber-light/20 bg-cyber-black/60 max-h-80 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ─── IP Rich View ────────────────────────────────────────────────────────────
const IPDetails = ({ enrichment }) => {
  const { abuseipdb, virustotal, ripestat, alienvault, criminalip } = enrichment;
  return (
    <div className="space-y-3">
      {abuseipdb && (
        <div className={`p-4 rounded-xl border ${abuseipdb.abuse_score >= 50 ? 'border-red-500/40 bg-red-950/20' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">AbuseIPDB</span>
            <span className={`text-2xl font-bold font-mono ${abuseipdb.abuse_score >= 70 ? 'text-red-400' : abuseipdb.abuse_score >= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
              {abuseipdb.abuse_score}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><span className="text-cyber-text-secondary">Reports:</span> <span className="text-cyber-text-primary">{abuseipdb.total_reports}</span></div>
            <div><span className="text-cyber-text-secondary">Country:</span> <span className="text-cyber-text-primary">{abuseipdb.country || '—'}</span></div>
            <div className="col-span-2"><span className="text-cyber-text-secondary">ISP:</span> <span className="text-cyber-text-primary">{abuseipdb.isp || '—'}</span></div>
            <div><span className="text-cyber-text-secondary">Tor:</span> <span className="text-cyber-text-primary">{abuseipdb.is_tor ? '⚠ Yes' : 'No'}</span></div>
            <div><span className="text-cyber-text-secondary">Public:</span> <span className="text-cyber-text-primary">{abuseipdb.is_public ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}
      {virustotal && (
        <div className={`p-4 rounded-xl border ${(virustotal.malicious || 0) > 0 ? 'border-red-500/40 bg-red-950/20' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neon-blue uppercase tracking-wider">VirusTotal</span>
            <span className={`text-xl font-bold font-mono ${(virustotal.malicious || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {virustotal.malicious || 0}/{virustotal.total || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><span className="text-cyber-text-secondary">Country:</span> <span className="text-cyber-text-primary">{virustotal.country || '—'}</span></div>
            <div><span className="text-cyber-text-secondary">AS Owner:</span> <span className="text-cyber-text-primary truncate">{virustotal.as_owner || '—'}</span></div>
          </div>
        </div>
      )}
      {ripestat && (
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/10">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-2">RIPEstat</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="col-span-2"><span className="text-cyber-text-secondary">Org:</span> <span className="text-cyber-text-primary">{ripestat.holder || '—'}</span></div>
            <div><span className="text-cyber-text-secondary">ASN:</span> <span className="text-cyber-text-primary">{ripestat.asn || '—'}</span></div>
            <div><span className="text-cyber-text-secondary">Country:</span> <span className="text-cyber-text-primary">{ripestat.country || '—'}</span></div>
            <div className="col-span-2"><span className="text-cyber-text-secondary">Range:</span> <span className="text-cyber-text-primary">{ripestat.inetnum || '—'}</span></div>
          </div>
        </div>
      )}
      {alienvault && (
        <div className={`p-4 rounded-xl border ${(alienvault.pulse_count || 0) > 0 ? 'border-orange-500/40 bg-orange-950/10' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">AlienVault OTX</span>
            <span className={`text-xl font-bold font-mono ${(alienvault.pulse_count || 0) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {alienvault.pulse_count || 0} pulses
            </span>
          </div>
          {alienvault.pulses?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {alienvault.pulses.slice(0, 4).map((p, i) => (
                <li key={i} className="text-[10px] font-mono text-cyber-text-secondary">• {p.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {criminalip && (
        <div className="p-4 rounded-xl border border-cyber-light/30 bg-cyber-black/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">CriminalIP</span>
            <span className={`text-xl font-bold font-mono ${criminalip.is_malicious ? 'text-red-400' : 'text-green-400'}`}>
              Score: {criminalip.score ?? '—'}
            </span>
          </div>
          {criminalip.ports?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {criminalip.ports.slice(0, 8).map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-light/20 text-cyber-text-primary">
                  {p.port}/{p.protocol} {p.service && `— ${p.service}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Domain Rich View ─────────────────────────────────────────────────────
const DomainDetails = ({ enrichment }) => {
  const { virustotal, alienvault, crtsh, dnsenum, openphish, phishtank, urlscan } = enrichment;
  const isPhishing = openphish?.is_phishing || phishtank?.is_phish;

  return (
    <div className="space-y-3">
      {isPhishing && (
        <div className="p-4 rounded-xl border border-red-500/60 bg-red-950/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">PHISHING CONFIRMED</p>
            <p className="text-[11px] text-red-300 font-mono">
              {openphish?.is_phishing && 'Found in OpenPhish feed. '}
              {phishtank?.is_phish && 'Verified in PhishTank database.'}
            </p>
          </div>
        </div>
      )}
      {virustotal && (
        <div className={`p-4 rounded-xl border ${(virustotal.malicious || 0) > 0 ? 'border-red-500/40 bg-red-950/20' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neon-blue uppercase tracking-wider">VirusTotal</span>
            <span className={`text-xl font-bold font-mono ${(virustotal.malicious || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {virustotal.malicious || 0}/{virustotal.total || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><span className="text-cyber-text-secondary">Registrar:</span> <span className="text-cyber-text-primary truncate">{virustotal.registrar || '—'}</span></div>
            <div><span className="text-cyber-text-secondary">Reputation:</span> <span className="text-cyber-text-primary">{virustotal.reputation ?? '—'}</span></div>
          </div>
        </div>
      )}
      {crtsh && crtsh.subdomains?.length > 0 && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">crt.sh — {crtsh.subdomains.length} Hostnames</span>
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
            {crtsh.subdomains.slice(0, 50).map((sub, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-black/60 border border-cyber-light/20 text-cyber-text-primary">{sub}</span>
            ))}
          </div>
        </div>
      )}
      {dnsenum && dnsenum.subdomains?.length > 0 && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/10">
          <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider block mb-2">DNS Enum — {dnsenum.subdomains.length} Live Subdomains</span>
          <div className="space-y-1">
            {dnsenum.subdomains.slice(0, 20).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-green-400">•</span>
                <span className="text-cyber-text-primary">{s.subdomain}</span>
                <span className="text-cyber-text-secondary">{s.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {alienvault && (
        <div className={`p-4 rounded-xl border ${(alienvault.pulse_count || 0) > 0 ? 'border-orange-500/40 bg-orange-950/10' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">AlienVault OTX</span>
            <span className={`font-bold font-mono text-sm ${(alienvault.pulse_count || 0) > 0 ? 'text-orange-400' : 'text-green-400'}`}>{alienvault.pulse_count || 0} pulses</span>
          </div>
          {alienvault.pulses?.map((p, i) => (
            <p key={i} className="text-[10px] font-mono text-cyber-text-secondary">• {p.name}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Hash Rich View ──────────────────────────────────────────────────────
const HashDetails = ({ enrichment }) => {
  const { virustotal, hybridanalysis, abusech } = enrichment;
  return (
    <div className="space-y-3">
      {virustotal && (
        <div className={`p-4 rounded-xl border ${(virustotal.malicious || 0) > 0 ? 'border-red-500/60 bg-red-950/25' : 'border-green-500/40 bg-green-950/10'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neon-blue uppercase tracking-wider">VirusTotal File Scan</span>
            <span className={`text-2xl font-bold font-mono ${(virustotal.malicious || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {virustotal.malicious || 0}/{virustotal.total || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {virustotal.meaningful_name && <div className="col-span-2"><span className="text-cyber-text-secondary">File Name:</span> <span className="text-cyber-text-primary">{virustotal.meaningful_name}</span></div>}
            {virustotal.popular_threat_name && <div className="col-span-2"><span className="text-red-400 font-bold">Malware Family:</span> <span className="text-red-300">{virustotal.popular_threat_name}</span></div>}
            {virustotal.type_description && <div><span className="text-cyber-text-secondary">Type:</span> <span className="text-cyber-text-primary">{virustotal.type_description}</span></div>}
            {virustotal.size && <div><span className="text-cyber-text-secondary">Size:</span> <span className="text-cyber-text-primary">{(virustotal.size / 1024).toFixed(1)} KB</span></div>}
            {virustotal.first_submission_date && <div className="col-span-2"><span className="text-cyber-text-secondary">First Seen:</span> <span className="text-cyber-text-primary">{new Date(virustotal.first_submission_date).toLocaleDateString()}</span></div>}
          </div>
          <div className="mt-2 flex gap-1 flex-wrap">
            {virustotal.tags?.map((t, i) => <span key={i} className="px-1.5 py-0.5 text-[9px] bg-red-900/40 text-red-300 rounded font-mono">{t}</span>)}
          </div>
        </div>
      )}
      {hybridanalysis?.results?.[0] && (
        <div className="p-4 rounded-xl border border-cyber-light/30 bg-cyber-black/40">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-2">Hybrid Analysis Sandbox</span>
          {hybridanalysis.results.slice(0, 3).map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
              <div><span className="text-cyber-text-secondary">Verdict:</span> <span className={r.verdict === 'malicious' ? 'text-red-400' : 'text-green-400'}>{r.verdict || '—'}</span></div>
              <div><span className="text-cyber-text-secondary">Threat Score:</span> <span className="text-cyber-text-primary">{r.threat_score ?? '—'}</span></div>
              {r.malware_family && <div className="col-span-2"><span className="text-red-400">Family:</span> <span className="text-red-300">{r.malware_family}</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CVE Rich View ───────────────────────────────────────────────────────
const CVEDetails = ({ enrichment }) => {
  const nvd = enrichment.nvd;
  if (!nvd?.found) return <p className="text-cyber-text-secondary font-mono text-sm p-4">No NVD record found for this CVE ID.</p>;
  const cvssColor = nvd.cvss_score >= 9 ? 'text-red-400' : nvd.cvss_score >= 7 ? 'text-orange-400' : nvd.cvss_score >= 4 ? 'text-yellow-400' : 'text-green-400';
  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-xl border ${nvd.cvss_score >= 7 ? 'border-red-500/40 bg-red-950/20' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-cyber-text-primary font-mono">{nvd.cve_id}</p>
            <p className="text-[11px] text-cyber-text-secondary font-mono">{nvd.severity || 'N/A'} Severity</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold font-mono ${cvssColor}`}>{nvd.cvss_score ?? '—'}</p>
            <p className="text-[10px] text-cyber-text-secondary">CVSS Score</p>
          </div>
        </div>
        <p className="text-[12px] text-cyber-text-secondary font-mono leading-relaxed">{nvd.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div><span className="text-cyber-text-secondary">Published:</span> <span className="text-cyber-text-primary">{nvd.published ? new Date(nvd.published).toLocaleDateString() : '—'}</span></div>
          <div><span className="text-cyber-text-secondary">Modified:</span> <span className="text-cyber-text-primary">{nvd.modified ? new Date(nvd.modified).toLocaleDateString() : '—'}</span></div>
          {nvd.vector && <div className="col-span-2"><span className="text-cyber-text-secondary">Vector:</span> <span className="text-[10px] text-cyber-text-primary break-all">{nvd.vector}</span></div>}
        </div>
        {nvd.references?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-cyber-text-secondary mb-1 uppercase">References</p>
            {nvd.references.slice(0, 5).map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-neon-blue hover:underline font-mono truncate">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {r.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Email Rich View ─────────────────────────────────────────────────────
const EmailDetails = ({ enrichment }) => {
  const av = enrichment.alienvault;
  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-xl border ${(av?.pulse_count || 0) > 0 ? 'border-orange-500/40 bg-orange-950/10' : 'border-cyber-light/30 bg-cyber-black/40'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">AlienVault OTX</span>
          <span className={`text-xl font-bold font-mono ${(av?.pulse_count || 0) > 0 ? 'text-orange-400' : 'text-green-400'}`}>{av?.pulse_count || 0} pulses</span>
        </div>
        {(av?.pulse_count || 0) === 0 ? (
          <p className="text-[11px] font-mono text-cyber-text-secondary">No threat intelligence found for this email via available APIs.</p>
        ) : (
          av.pulses?.map((p, i) => <p key={i} className="text-[10px] font-mono text-cyber-text-secondary">• {p.name}</p>)
        )}
      </div>
    </div>
  );
};

// ─── URL Rich View ───────────────────────────────────────────────────────
const URLDetails = ({ enrichment }) => {
  const { openphish, phishtank, urlscan, virustotal, abusech } = enrichment;
  const isPhishing = openphish?.is_phishing || phishtank?.is_phish;
  return (
    <div className="space-y-3">
      {isPhishing && (
        <div className="p-4 rounded-xl border border-red-500/60 bg-red-950/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">PHISHING URL DETECTED</p>
            <p className="text-[11px] text-red-300 font-mono">
              {openphish?.is_phishing && 'Listed in OpenPhish active feed. '}
              {phishtank?.is_phish && 'Verified phishing in PhishTank database.'}
            </p>
          </div>
        </div>
      )}
      {urlscan && <div className="p-4 rounded-xl border border-cyber-light/30 bg-cyber-black/40">
        <span className="text-[11px] font-bold text-neon-blue uppercase tracking-wider block mb-2">URLScan.io — {urlscan.total || 0} scans</span>
        {urlscan.results?.slice(0, 3).map((r, i) => (
          <div key={i} className="text-[10px] font-mono text-cyber-text-secondary mb-1">• {r.url} ({r.status || '—'}) — {r.ip}</div>
        ))}
      </div>}
      {abusech && <div className="p-4 rounded-xl border border-cyber-light/30 bg-cyber-black/40">
        <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-2">abuse.ch URLhaus</span>
        <p className="text-[11px] font-mono text-cyber-text-secondary">
          Status: {abusech.query_status || 'N/A'}
          {abusech.threat && <span className="ml-2 text-red-400">Threat: {abusech.threat}</span>}
        </p>
      </div>}
    </div>
  );
};

// ─── History Sidebar ─────────────────────────────────────────────────────
const HistorySidebar = ({ onSelect }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await investigationsAPI.getAll({ limit: 30 });
      setHistory(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await investigationsAPI.delete(id).catch(() => {});
    setHistory(prev => prev.filter(h => h._id !== id));
  };

  return (
    <div className="w-72 shrink-0 border-r border-cyber-light/30 bg-cyber-dark/60 flex flex-col h-full">
      <div className="p-4 border-b border-cyber-light/30 flex items-center gap-2">
        <History className="w-4 h-4 text-neon-blue" />
        <span className="text-sm font-bold text-cyber-text-primary">Investigation History</span>
        <button onClick={loadHistory} className="ml-auto text-cyber-text-secondary hover:text-neon-blue">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-neon-blue" /></div>}
        {!loading && history.length === 0 && (
          <p className="text-[11px] text-cyber-text-secondary font-mono text-center p-4">No investigations yet</p>
        )}
        {history.map(h => {
          const meta = TYPE_META[h.indicator_type] || TYPE_META.ip;
          const vMeta = VERDICT_META[h.verdict] || VERDICT_META.unknown;
          const Icon = meta.icon;
          return (
            <button
              key={h._id}
              onClick={() => onSelect(h.indicator)}
              className="w-full text-left p-2.5 rounded-lg hover:bg-cyber-light/10 transition-colors group flex items-start gap-2"
            >
              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-cyber-text-primary truncate">{h.indicator}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-cyber-text-secondary">{meta.label}</span>
                  <span className={`text-[9px] font-bold ${vMeta.color} ml-auto`}>{vMeta.label}</span>
                </div>
              </div>
              <button onClick={(e) => handleDelete(e, h._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Investigation Page ──────────────────────────────────────────────
const Investigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const detectedType = detectType(inputVal);
  const typeLabel = detectedType ? TYPE_META[detectedType]?.label : null;
  const TypeIcon = detectedType ? TYPE_META[detectedType]?.icon : Search;

  const runInvestigation = useCallback(async (q) => {
    const trimmed = (q || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setQuery(trimmed);
    setSearchParams({ q: trimmed });
    try {
      const res = await searchAPI.investigate(trimmed);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Investigation failed. Check API keys and try again.');
    } finally { setLoading(false); }
  }, [setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== query) {
      setInputVal(q);
      setQuery(q);
      runInvestigation(q);
    }
  }, [searchParams, query, runInvestigation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runInvestigation(inputVal);
  };

  const handleHistorySelect = (indicator) => {
    setInputVal(indicator);
    runInvestigation(indicator);
  };

  const verdictMeta = result ? (VERDICT_META[result.verdict] || VERDICT_META.unknown) : null;
  const VerdictIcon = verdictMeta?.icon || HelpCircle;
  const typeMeta = result ? (TYPE_META[result.indicator_type] || null) : null;
  const TypeResultIcon = typeMeta?.icon || Globe;

  const renderDetails = () => {
    if (!result?.enrichment) return null;
    switch (result.indicator_type) {
      case 'ip': return <IPDetails enrichment={result.enrichment} />;
      case 'domain': return <DomainDetails enrichment={result.enrichment} />;
      case 'hash': return <HashDetails enrichment={result.enrichment} />;
      case 'cve': return <CVEDetails enrichment={result.enrichment} />;
      case 'email': return <EmailDetails enrichment={result.enrichment} />;
      case 'url': return <URLDetails enrichment={result.enrichment} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-cyber-dark">
      {/* Sidebar */}
      <HistorySidebar onSelect={handleHistorySelect} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b border-cyber-light/30 bg-cyber-dark/80">
          <div className="max-w-3xl">
            <h1 className="text-xl font-bold text-cyber-text-primary mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-blue" />
              Universal Threat Investigation
            </h1>
            <p className="text-xs text-cyber-text-secondary font-mono mb-4">
              Supports: IP address · Domain · URL · MD5/SHA1/SHA256 hash · CVE-XXXX-XXXXX · Email
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <TypeIcon className={`w-4 h-4 ${detectedType ? TYPE_META[detectedType]?.color : 'text-cyber-text-secondary'}`} />
                </div>
                <input
                  ref={inputRef}
                  id="investigation-search-input"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder="8.8.8.8 · example.com · https://... · CVE-2024-3400 · hash · email@..."
                  className="w-full pl-9 pr-32 py-3 bg-cyber-black/70 border border-cyber-light/50 focus:border-neon-blue/80 focus:outline-none rounded-xl text-sm text-cyber-text-primary font-mono"
                />
                {detectedType && (
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_META[detectedType]?.bg} ${TYPE_META[detectedType]?.color}`}>
                    {typeLabel}
                  </div>
                )}
              </div>
              <button
                id="investigation-submit-btn"
                type="submit"
                disabled={loading || !inputVal.trim()}
                className="px-5 py-3 bg-neon-blue text-cyber-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Investigate
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
              <p className="text-cyber-text-secondary font-mono text-sm">Querying threat intelligence APIs…</p>
              <p className="text-cyber-text-secondary font-mono text-xs">This may take 5–15 seconds</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="max-w-2xl p-4 rounded-xl border border-red-500/40 bg-red-950/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400">Investigation Failed</p>
                <p className="text-[11px] font-mono text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-neon-blue" />
              </div>
              <div>
                <p className="text-lg font-bold text-cyber-text-primary">Start an Investigation</p>
                <p className="text-xs text-cyber-text-secondary font-mono mt-1 max-w-md">
                  Enter any IP address, domain, URL, file hash, CVE identifier, or email address.<br />
                  Real threat intelligence is pulled from live APIs instantly.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 max-w-lg text-[11px] font-mono">
                {[['8.8.8.8', 'ip'], ['example.com', 'domain'], ['CVE-2024-3400', 'cve'],
                  ['44d88612fea8a8f36de82e1278abb02f', 'hash'], ['https://example.com', 'url'], ['test@example.com', 'email']].map(([ex, type]) => (
                  <button key={ex} onClick={() => { setInputVal(ex); runInvestigation(ex); }}
                    className={`px-2 py-1.5 rounded-lg border text-left ${TYPE_META[type]?.bg} ${TYPE_META[type]?.color} hover:opacity-80 transition-opacity truncate`}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="max-w-4xl space-y-6">
              {/* Header Bar */}
              <div className={`p-4 rounded-xl border ${verdictMeta?.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeMeta?.bg}`}>
                      <TypeResultIcon className={`w-5 h-5 ${typeMeta?.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-cyber-text-primary font-mono text-base break-all">{result.indicator}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeMeta?.bg} ${typeMeta?.color}`}>{result.type_label}</span>
                        <span className="text-[10px] text-cyber-text-secondary font-mono">
                          {result.active_sources?.length || 0} sources returned data
                        </span>
                        {result.enrichment?._from_cache && <span className="text-[10px] text-yellow-400 font-mono">• cached</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`flex items-center gap-1.5 ${verdictMeta?.color}`}>
                      <VerdictIcon className="w-4 h-4" />
                      <span className="font-bold text-lg">{verdictMeta?.label}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <Activity className="w-3 h-3 text-cyber-text-secondary" />
                      <span className="text-cyber-text-secondary text-[11px] font-mono">Risk: {result.risk_score}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="p-4 rounded-xl border border-cyber-light/30 bg-cyber-black/40">
                  <p className="text-[11px] font-bold text-neon-blue uppercase tracking-wider mb-2">Intelligence Summary</p>
                  <pre className="text-[11px] font-mono text-cyber-text-secondary whitespace-pre-wrap leading-relaxed">{result.summary}</pre>
                </div>
              )}

              {/* Rich Details */}
              <div>
                <p className="text-[11px] font-bold text-neon-blue uppercase tracking-wider mb-3">Detailed Intelligence</p>
                {renderDetails()}
              </div>

              {/* DB Matches */}
              {result.db_matches && (
                <>
                  {result.db_matches.assets?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-neon-blue uppercase tracking-wider mb-2">
                        <Database className="w-3.5 h-3.5 inline mr-1" />
                        {result.db_matches.assets.length} Assets in Inventory
                      </p>
                      <div className="space-y-1">
                        {result.db_matches.assets.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-cyber-light/20 bg-cyber-black/30 text-[11px] font-mono">
                            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="text-cyber-text-primary">{a.asset_value}</span>
                            <span className="text-cyber-text-secondary">{a.asset_type}</span>
                            <span className={`ml-auto font-bold ${a.risk_score >= 70 ? 'text-red-400' : a.risk_score >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                              Risk: {a.risk_score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.db_matches.credentials?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2">
                        <Lock className="w-3.5 h-3.5 inline mr-1" />
                        {result.db_matches.credentials.length} Leaked Credentials Found
                      </p>
                      <div className="space-y-1">
                        {result.db_matches.credentials.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-red-500/30 bg-red-950/10 text-[11px] font-mono">
                            <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-cyber-text-primary">{c.email}</span>
                            <span className="text-cyber-text-secondary">{c.source}</span>
                            <span className="text-red-400 ml-auto">{c.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Raw Source Data */}
              {result.enrichment && (
                <div>
                  <p className="text-[11px] font-bold text-neon-blue uppercase tracking-wider mb-3">
                    <Eye className="w-3.5 h-3.5 inline mr-1" />
                    Raw Source Data
                  </p>
                  <div className="space-y-2">
                    {Object.entries(result.enrichment)
                      .filter(([k]) => !['type', 'enriched_at', 'hash_type', '_from_cache', 'ip', 'domain', 'url', 'hash', 'email', 'cve_id'].includes(k))
                      .map(([k, v]) => <SourceCard key={k} sourceName={k} data={v} />)
                    }
                  </div>
                </div>
              )}

              {/* Investigated at */}
              <p className="text-[10px] text-cyber-text-secondary font-mono">
                <Clock className="w-3 h-3 inline mr-1" />
                Investigated at {result.investigated_at ? new Date(result.investigated_at).toLocaleString() : '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Investigation;
