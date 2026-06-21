import BaseAdapter from './baseAdapter.js';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);

const SUBDOMAIN_WORDLIST = ['www', 'mail', 'ftp', 'remote', 'blog', 'webmail', 'server', 'ns1', 'ns2', 'smtp', 'secure', 'vpn', 'api', 'dev', 'staging', 'app', 'admin', 'portal', 'cdn', 'static', 'assets', 'img', 'images', 'docs', 'status', 'test', 'demo', 'beta', 'intranet', 'support', 'help', 'git', 'ci', 'jenkins', 'monitor', 'grafana', 'kibana', 'elastic', 'redis', 'db', 'mysql', 'postgres', 'mongo', 'backup', 'mx', 'pop', 'imap'];

export default class DnsEnumAdapter extends BaseAdapter {
  constructor() { super('dnsenum', ''); }
  isFreeNoKey() { return true; }

  async fetchFromAPI(target, queryType) {
    if (queryType === 'records') return await this.getRecords(target);
    return await this.enumerate(target);
  }

  async enumerate(domain) {
    const found = [];
    const checks = SUBDOMAIN_WORDLIST.map(async (sub) => {
      const fqdn = `${sub}.${domain}`;
      try {
        const addrs = await resolve4(fqdn);
        if (addrs.length > 0) found.push({ subdomain: fqdn, ip: addrs[0], type: 'A' });
      } catch { /* not found */ }
    });
    await Promise.allSettled(checks);
    return { subdomains: found, count: found.length };
  }

  async getRecords(domain) {
    const records = {};
    const tasks = [
      resolve4(domain).then(r => records.A = r).catch(() => records.A = []),
      resolve6(domain).then(r => records.AAAA = r).catch(() => records.AAAA = []),
      resolveMx(domain).then(r => records.MX = r).catch(() => records.MX = []),
      resolveTxt(domain).then(r => records.TXT = r.flat()).catch(() => records.TXT = []),
      resolveNs(domain).then(r => records.NS = r).catch(() => records.NS = []),
      resolveCname(domain).then(r => records.CNAME = r).catch(() => records.CNAME = []),
    ];
    await Promise.allSettled(tasks);
    return records;
  }

  getFallback(target) { return null; }
}
