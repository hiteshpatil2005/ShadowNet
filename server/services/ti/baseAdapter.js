import axios from 'axios';
import { getCached, setCache } from '../../utils/cache.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

export default class BaseAdapter {
  constructor(sourceName, apiKey = '') {
    this.sourceName = sourceName;
    this.apiKey = apiKey;
    this.enabled = !!apiKey || this.isFreeNoKey();
    this.callCount = 0;
  }

  // Override in adapters that don't need an API key (crt.sh, abuse.ch, openphish, phishtank, dnsenum)
  isFreeNoKey() { return false; }

  async query(target, queryType = 'default') {
    // Check cache first
    const cacheKey = `${queryType}:${target}`;
    const cached = getCached(this.sourceName, cacheKey);
    if (cached) return { ...cached, _cached: true, _source: this.sourceName };

    // Check if adapter is enabled
    if (!this.enabled) return this.getFallback(target, queryType);

    // Check rate limit
    if (!checkRateLimit(this.sourceName)) {
      console.warn(`[TI:${this.sourceName}] Rate limit exceeded for ${target}`);
      return this.getFallback(target, queryType);
    }

    try {
      this.callCount++;
      const result = await this.fetchFromAPI(target, queryType);
      setCache(this.sourceName, cacheKey, result);
      return { ...result, _cached: false, _source: this.sourceName };
    } catch (error) {
      console.error(`[TI:${this.sourceName}] API error for ${target}:`, error.message);
      return this.getFallback(target, queryType);
    }
  }

  // Abstract: override in each adapter
  async fetchFromAPI(target, queryType) {
    throw new Error('fetchFromAPI must be implemented by adapter');
  }

  // Abstract: override to provide realistic fallback data
  getFallback(target, queryType) {
    return { _source: this.sourceName, _fallback: true, target, data: null };
  }

  async httpGet(url, headers = {}) {
    const res = await axios.get(url, { headers, timeout: 15000 });
    return res.data;
  }

  async httpPost(url, data = {}, headers = {}) {
    const res = await axios.post(url, data, { headers, timeout: 15000 });
    return res.data;
  }
}
