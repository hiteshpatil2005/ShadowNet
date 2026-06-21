/**
 * ShadowNet AI — Universal Target Detection
 * Detects: ip, domain, url, hash (md5/sha1/sha256), cve, email
 */

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MD5_RE = /^[a-f0-9]{32}$/i;
const SHA1_RE = /^[a-f0-9]{40}$/i;
const SHA256_RE = /^[a-f0-9]{64}$/i;
const CVE_RE = /^CVE-\d{4}-\d{4,}$/i;

export function detectTargetType(target) {
  const t = String(target || '').trim();
  if (!t) return 'unknown';

  // Order matters — check specific patterns first
  if (CVE_RE.test(t)) return 'cve';
  if (MD5_RE.test(t) || SHA1_RE.test(t) || SHA256_RE.test(t)) return 'hash';
  if (IP_RE.test(t)) return 'ip';
  if (t.includes('@') && EMAIL_RE.test(t)) return 'email';
  if (t.startsWith('http://') || t.startsWith('https://')) return 'url';

  const host = t.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (IP_RE.test(host)) return 'ip';
  if (DOMAIN_RE.test(host) || (host.includes('.') && !host.includes('@'))) return 'domain';

  return 'unknown';
}

export function detectHashType(hash) {
  if (MD5_RE.test(hash)) return 'md5';
  if (SHA1_RE.test(hash)) return 'sha1';
  if (SHA256_RE.test(hash)) return 'sha256';
  return 'unknown';
}

export function normalizeTarget(target) {
  const t = String(target || '').trim();
  const type = detectTargetType(t);

  if (type === 'url') return t;
  if (type === 'cve') return t.toUpperCase();
  if (type === 'hash') return t.toLowerCase();
  if (type === 'email') return t.toLowerCase();
  if (type === 'domain' || type === 'ip') {
    return t.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
  }
  return t;
}

export function getTypeLabel(type) {
  const labels = {
    ip: 'IPv4 Address',
    domain: 'Domain',
    url: 'URL',
    hash: 'File Hash',
    cve: 'CVE Identifier',
    email: 'Email Address',
    unknown: 'Unknown',
  };
  return labels[type] || 'Unknown';
}

export default { detectTargetType, normalizeTarget, detectHashType, getTypeLabel };
