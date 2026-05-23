import NodeCache from 'node-cache';

// Per-source TTL configuration (in seconds)
const TTL_CONFIG = {
  virustotal: 7 * 24 * 3600,     // 7 days
  criminalip: 14 * 24 * 3600,    // 14 days
  zoomeye: 14 * 24 * 3600,       // 14 days
  abuseipdb: 7 * 24 * 3600,      // 7 days
  urlscan: 30 * 24 * 3600,       // 30 days
  alienvault: 7 * 24 * 3600,     // 7 days
  abusech: 1 * 24 * 3600,        // 1 day
  crtsh: 3600,                    // 1 hour
  viewdns: 30 * 24 * 3600,       // 30 days
  dnsenum: 7 * 24 * 3600,        // 7 days
  openphish: 3600,                // 1 hour
  phishtank: 3600,                // 1 hour
  hybridanalysis: 7 * 24 * 3600,  // 7 days
  gemini: 24 * 3600,              // 1 day
  default: 3600,                   // 1 hour
};

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false });

export const getCached = (source, key) => {
  const cacheKey = `${source}:${key}`;
  return cache.get(cacheKey);
};

export const setCache = (source, key, data) => {
  const cacheKey = `${source}:${key}`;
  const ttl = TTL_CONFIG[source] || TTL_CONFIG.default;
  cache.set(cacheKey, data, ttl);
};

export const deleteCache = (source, key) => {
  cache.del(`${source}:${key}`);
};

export const flushSource = (source) => {
  const keys = cache.keys().filter(k => k.startsWith(`${source}:`));
  cache.del(keys);
};

export const getStats = () => cache.getStats();

export default { getCached, setCache, deleteCache, flushSource, getStats, TTL_CONFIG };
