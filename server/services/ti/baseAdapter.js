/**
 * ShadowNet AI — Base TI Adapter
 * All adapters extend this. getFallback() returns null — never fake data.
 */
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

  // Override in adapters that don't need an API key (crt.sh, abuse.ch, openphish, phishtank, dnsenum, ripestat)
  isFreeNoKey() { return false; }

  async query(target, queryType = 'default') {
    const cacheKey = `${queryType}:${target}`;
    const cached = getCached(this.sourceName, cacheKey);
    if (cached) return { ...cached, _cached: true, _source: this.sourceName };

    // Adapter disabled (no API key) — return null, never fake data
    if (!this.enabled) return null;

    // Rate limit exceeded — return null
    if (!checkRateLimit(this.sourceName)) {
      console.warn(`[TI:${this.sourceName}] Rate limit exceeded for ${target}`);
      return null;
    }

    try {
      this.callCount++;
      const result = await this.fetchFromAPI(target, queryType);
      if (result) setCache(this.sourceName, cacheKey, result);
      return result ? { ...result, _cached: false, _source: this.sourceName } : null;
    } catch (error) {
      const msg = error.response?.status
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;
      console.error(`[TI:${this.sourceName}] API error for ${target}: ${msg}`);
      return null;
    }
  }

  // Override in each adapter — never call super.getFallback()
  async fetchFromAPI(target, queryType) {
    throw new Error(`fetchFromAPI must be implemented by ${this.sourceName} adapter`);
  }

  // Returns null — real data only. Override only to return null (kept for interface compatibility).
  getFallback(target, queryType) {
    return null;
  }

  async httpGet(url, headers = {}, timeout = 15000) {
    const res = await axios.get(url, { headers, timeout });
    return res.data;
  }

  async httpPost(url, data = {}, headers = {}, timeout = 15000) {
    const res = await axios.post(url, data, { headers, timeout });
    return res.data;
  }
}
