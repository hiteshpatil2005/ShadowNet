const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function detectTargetType(target) {
  const t = String(target || '').trim();
  if (!t) return 'unknown';
  if (IP_RE.test(t)) return 'ip';
  if (t.includes('@') && EMAIL_RE.test(t)) return 'email';
  if (t.startsWith('http://') || t.startsWith('https://')) return 'url';
  const host = t.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (IP_RE.test(host)) return 'ip';
  if (DOMAIN_RE.test(host) || host.includes('.')) return 'domain';
  return 'unknown';
}

export function normalizeTarget(target) {
  const t = String(target || '').trim();
  const type = detectTargetType(t);
  if (type === 'url') return t;
  if (type === 'domain' || type === 'ip') {
    return t.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
  }
  return t;
}

export default { detectTargetType, normalizeTarget };
