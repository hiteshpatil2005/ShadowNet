import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

/**
 * NVD CVE API 2.0 — free, no key required (rate-limited).
 * Optional NVD_API_KEY from https://nvd.nist.gov/developers increases limits.
 */
export default class NvdAdapter extends BaseAdapter {
  constructor() {
    super('nvd', env.NVD_API_KEY || '');
  }

  isFreeNoKey() {
    return true;
  }

  async fetchFromAPI(target, queryType) {
    const headers = { Accept: 'application/json' };
    if (this.apiKey) headers.apiKey = this.apiKey;

    if (queryType === 'keyword') {
      const data = await this.httpGet(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(target)}&resultsPerPage=10`,
        headers
      );
      return this.normalizeList(data);
    }

    const cveId = target.toUpperCase().startsWith('CVE-') ? target.toUpperCase() : `CVE-${target}`;
    const data = await this.httpGet(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`,
      headers
    );
    return this.normalizeSingle(data, cveId);
  }

  normalizeSingle(data, cveId) {
    const vuln = data?.vulnerabilities?.[0]?.cve;
    if (!vuln) {
      return { cve_id: cveId, found: false, description: 'No NVD record found.', severity: null, cvss_score: null, published: null, references: [] };
    }
    const desc = vuln.descriptions?.find(d => d.lang === 'en')?.value || '';
    const cvss = vuln.metrics?.cvssMetricV31?.[0]?.cvssData || vuln.metrics?.cvssMetricV30?.[0]?.cvssData || vuln.metrics?.cvssMetricV2?.[0]?.cvssData;
    return {
      cve_id: vuln.id,
      found: true,
      description: desc,
      severity: cvss?.baseSeverity || null,
      cvss_score: cvss?.baseScore ?? null,
      vector: cvss?.vectorString || null,
      published: vuln.published,
      modified: vuln.lastModified,
      references: (vuln.references || []).slice(0, 8).map(r => ({ url: r.url, source: r.source })),
    };
  }

  normalizeList(data) {
    const items = (data?.vulnerabilities || []).map(v => {
      const cve = v.cve;
      const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
      const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      return {
        cve_id: cve.id,
        description: desc.slice(0, 200),
        severity: cvss?.baseSeverity || null,
        cvss_score: cvss?.baseScore ?? null,
        published: cve.published,
      };
    });
    return { keyword: data?.totalResults, total: data?.totalResults || items.length, cves: items };
  }

  getFallback(target, queryType) { return null; }
}
