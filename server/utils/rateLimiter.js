// Token bucket rate limiter per source
const buckets = {};

const RATE_LIMITS = {
  virustotal: { maxTokens: 4, refillRate: 4, interval: 60000 },       // 4/min
  criminalip: { maxTokens: 5, refillRate: 5, interval: 60000 },       // 5/min (500 credits/month)
  zoomeye: { maxTokens: 10, refillRate: 10, interval: 60000 },         // 10/min
  abuseipdb: { maxTokens: 60, refillRate: 60, interval: 60000 },       // 60/min
  urlscan: { maxTokens: 5, refillRate: 5, interval: 60000 },           // 5/min
  alienvault: { maxTokens: 15, refillRate: 15, interval: 60000 },      // 15/min
  abusech: { maxTokens: 30, refillRate: 30, interval: 60000 },         // 30/min
  crtsh: { maxTokens: 10, refillRate: 10, interval: 60000 },           // 10/min
  viewdns: { maxTokens: 4, refillRate: 4, interval: 60000 },           // 4/min (250/day)
  dnsenum: { maxTokens: 20, refillRate: 20, interval: 60000 },         // 20/min
  openphish: { maxTokens: 10, refillRate: 10, interval: 60000 },       // 10/min
  phishtank: { maxTokens: 10, refillRate: 10, interval: 60000 },       // 10/min
  hybridanalysis: { maxTokens: 10, refillRate: 10, interval: 60000 },  // 10/min
};

const getBucket = (source) => {
  if (!buckets[source]) {
    const config = RATE_LIMITS[source] || { maxTokens: 10, refillRate: 10, interval: 60000 };
    buckets[source] = {
      tokens: config.maxTokens,
      maxTokens: config.maxTokens,
      refillRate: config.refillRate,
      interval: config.interval,
      lastRefill: Date.now(),
    };
  }
  return buckets[source];
};

export const checkRateLimit = (source) => {
  const bucket = getBucket(source);
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;

  if (elapsed >= bucket.interval) {
    bucket.tokens = bucket.maxTokens;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }
  return false;
};

export const waitForToken = (source) => {
  return new Promise((resolve) => {
    const check = () => {
      if (checkRateLimit(source)) {
        resolve(true);
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
};

export default { checkRateLimit, waitForToken };
