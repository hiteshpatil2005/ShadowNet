/**
 * ShadowNet AI — Enhanced Correlation Engine
 * Analyzes real assets, credentials, and investigation results.
 * Enriches top correlations with Gemini AI explanations.
 */
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import Investigation from '../models/Investigation.js';
import { explainCorrelation } from './geminiService.js';

export const runCorrelationAnalysis = async (organizationId) => {
  const [assets, credentials, investigations] = await Promise.all([
    DigitalAsset.find({ organization_id: organizationId }),
    LeakedCredential.find({ organization_id: organizationId }),
    Investigation.find({ organization_id: organizationId, verdict: { $in: ['malicious', 'suspicious'] } }),
  ]);

  const correlations = [];

  // ─── 1. Shared credential breaches ──────────────────────────────────────
  const emailGroups = {};
  credentials.forEach(cred => {
    if (!emailGroups[cred.email]) emailGroups[cred.email] = [];
    emailGroups[cred.email].push(cred);
  });

  for (const [email, creds] of Object.entries(emailGroups)) {
    if (creds.length > 1) {
      const riskScore = Math.min(95, 50 + creds.length * 15);
      correlations.push({
        organization_id: organizationId,
        title: `Multi-breach credential exposure: ${email}`,
        credential: email,
        correlation_type: 'credential_usage',
        risk_score: riskScore,
        severity: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MEDIUM',
        confidence: `${Math.min(95, 60 + creds.length * 10)}%`,
        description: `${email} was found in ${creds.length} separate breaches: ${creds.map(c => c.source).join(', ')}`,
        explanation: `Multiple credential exposures for the same email enable credential stuffing attacks across all associated services.`,
        impact: 'Attacker can replay credentials across all services used by this email.',
        attack_scenarios: ['Credential stuffing', 'Password spray', 'Account takeover chain'],
        sources_data: { breach_count: creds.length, breaches: creds.map(c => ({ source: c.source, severity: c.severity, date: c.leak_date })) },
      });
    }
  }

  // ─── 2. Shared IP hosting ────────────────────────────────────────────────
  const ipGroups = {};
  assets.filter(a => a.ip).forEach(asset => {
    if (!ipGroups[asset.ip]) ipGroups[asset.ip] = [];
    ipGroups[asset.ip].push(asset);
  });

  for (const [ip, grouped] of Object.entries(ipGroups)) {
    if (grouped.length > 1) {
      const riskScore = Math.min(90, 40 + grouped.length * 12);
      correlations.push({
        organization_id: organizationId,
        title: `Shared server hosting: ${ip} (${grouped.length} assets)`,
        asset_id_1: grouped[0].asset_value,
        asset_id_2: grouped[1].asset_value,
        ip_address: ip,
        correlation_type: 'ip_hosting',
        risk_score: riskScore,
        severity: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MEDIUM',
        confidence: `${Math.min(90, 55 + grouped.length * 8)}%`,
        description: `${grouped.length} assets share IP ${ip}: ${grouped.map(a => a.asset_value).join(', ')}`,
        explanation: 'Shared hosting means one compromised service enables lateral movement to all co-hosted services.',
        impact: 'Single point of failure — all co-hosted services are at risk.',
        attack_scenarios: ['Lateral movement via shared hosting', 'Server-level privilege escalation'],
        sources_data: { shared_assets: grouped.map(a => ({ value: a.asset_value, type: a.asset_type, risk: a.risk_level, ports: a.ports })) },
      });
    }
  }

  // ─── 3. Service + credential overlap ────────────────────────────────────
  for (const asset of assets.filter(a => a.risk_level === 'critical' || a.risk_level === 'high')) {
    const domain = asset.asset_value.split('.').slice(-2).join('.');
    const relatedCreds = credentials.filter(c => c.email.toLowerCase().includes(domain));
    if (relatedCreds.length > 0) {
      const vtMalicious = asset.sources?.virustotal?.malicious || 0;
      const riskScore = Math.min(98, 70 + relatedCreds.length * 8 + (vtMalicious > 0 ? 10 : 0));
      correlations.push({
        organization_id: organizationId,
        title: `Exposed ${asset.risk_level} asset with leaked credentials: ${asset.asset_value}`,
        service: asset.asset_value,
        asset_id_1: asset.asset_value,
        credential: relatedCreds[0].email,
        correlation_type: 'suspicious_relationship',
        risk_score: riskScore,
        severity: 'CRITICAL',
        confidence: `${Math.min(92, 65 + relatedCreds.length * 7)}%`,
        description: `${asset.risk_level.toUpperCase()} risk asset "${asset.asset_value}" has ${relatedCreds.length} associated leaked credential(s). VirusTotal detections: ${vtMalicious}.`,
        explanation: 'Leaked credentials + exposed high-risk service = direct unauthorized access vector.',
        impact: 'Direct authentication attack possible using leaked credentials on this exposed service.',
        attack_scenarios: ['Direct login with leaked creds', 'API abuse with leaked tokens', 'Post-auth privilege escalation'],
        sources_data: {
          asset_risk: asset.risk_level,
          asset_score: asset.risk_score,
          ports: asset.ports,
          services: asset.services,
          vt_malicious: vtMalicious,
          leaked_creds: relatedCreds.map(c => ({ email: c.email, source: c.source, severity: c.severity })),
        },
      });
    }
  }

  // ─── 4. Malicious investigation ↔ asset overlap ──────────────────────────
  for (const inv of investigations) {
    // Find assets that match the malicious indicator
    const matchingAssets = assets.filter(a =>
      a.asset_value === inv.indicator ||
      a.ip === inv.indicator ||
      (inv.indicator_type === 'domain' && a.asset_value.endsWith(inv.indicator))
    );

    if (matchingAssets.length > 0) {
      const riskScore = Math.min(99, 75 + (inv.risk_score / 10));
      correlations.push({
        organization_id: organizationId,
        title: `Confirmed ${inv.verdict} indicator in asset inventory: ${inv.indicator}`,
        asset_id_1: matchingAssets[0].asset_value,
        indicator_id: inv._id,
        correlation_type: 'ti_confirmed_threat',
        risk_score: Math.round(riskScore),
        severity: inv.verdict === 'malicious' ? 'CRITICAL' : 'HIGH',
        confidence: `${inv.risk_score}%`,
        description: `Asset "${matchingAssets[0].asset_value}" is confirmed ${inv.verdict} by ${inv.active_sources?.length || 0} threat intelligence sources (risk score: ${inv.risk_score}/100).`,
        explanation: `Live threat intelligence confirms this asset is ${inv.verdict}. Immediate action required.`,
        impact: `Asset is a confirmed threat actor-controlled or compromised indicator.`,
        attack_scenarios: ['Active C2 communication', 'Malware distribution', 'Data exfiltration channel'],
        sources_data: { indicator: inv.indicator, verdict: inv.verdict, ti_score: inv.risk_score, sources: inv.active_sources },
      });
    }

    // Malicious IP/domain → leaked credentials from same domain
    if (inv.indicator_type === 'domain' || inv.indicator_type === 'ip') {
      const relatedCreds = credentials.filter(c => inv.indicator_type === 'domain' && c.email.includes(inv.indicator));
      if (relatedCreds.length > 0) {
        correlations.push({
          organization_id: organizationId,
          title: `Malicious domain with leaked credentials: ${inv.indicator}`,
          asset_id_1: inv.indicator,
          credential: relatedCreds[0].email,
          correlation_type: 'malicious_domain_credential',
          risk_score: 90,
          severity: 'CRITICAL',
          confidence: '88%',
          description: `Domain ${inv.indicator} is flagged as ${inv.verdict} by TI and has ${relatedCreds.length} leaked credentials associated with it.`,
          explanation: 'Combination of malicious domain + leaked credentials creates a severe phishing/account takeover risk.',
          impact: 'Users of this domain are at extreme risk of account takeover and phishing.',
          attack_scenarios: ['Phishing campaign targeting users', 'Credential takeover', 'Domain hijacking'],
          sources_data: { verdict: inv.verdict, ti_score: inv.risk_score, leaked_creds: relatedCreds.length },
        });
      }
    }
  }

  // ─── 5. VirusTotal high-detection assets ────────────────────────────────
  for (const asset of assets) {
    const vtMalicious = asset.sources?.virustotal?.malicious || 0;
    const vtTotal = asset.sources?.virustotal?.total || 1;
    if (vtMalicious >= 3) {
      const vtRatio = vtMalicious / vtTotal;
      const riskScore = Math.min(99, Math.round(vtRatio * 100 * 0.7 + 30));
      const existing = correlations.find(c => c.asset_id_1 === asset.asset_value && c.correlation_type === 'vt_detection');
      if (!existing) {
        correlations.push({
          organization_id: organizationId,
          title: `VirusTotal multi-engine detection: ${asset.asset_value}`,
          asset_id_1: asset.asset_value,
          correlation_type: 'vt_detection',
          risk_score: riskScore,
          severity: vtMalicious >= 10 ? 'CRITICAL' : 'HIGH',
          confidence: `${Math.min(99, 50 + vtMalicious * 4)}%`,
          description: `${asset.asset_value} flagged by ${vtMalicious}/${vtTotal} VirusTotal engines as malicious. ${asset.sources?.virustotal?.popular_threat_name ? `Malware family: ${asset.sources.virustotal.popular_threat_name}.` : ''}`,
          explanation: 'Multiple AV engines detecting this asset indicates active malware or known threat infrastructure.',
          impact: 'Any connection to this asset risks malware infection or data compromise.',
          attack_scenarios: ['Drive-by malware download', 'C2 beacon', 'Malicious redirect'],
          sources_data: {
            vt_malicious: vtMalicious,
            vt_total: vtTotal,
            threat_name: asset.sources?.virustotal?.popular_threat_name,
            tags: asset.sources?.virustotal?.tags,
          },
        });
      }
    }
  }

  // ─── Gemini AI enrichment for top 5 correlations ────────────────────────
  const top = correlations.sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  for (const corr of top) {
    try {
      const a1 = { value: corr.asset_id_1 || corr.service || corr.credential, type: corr.correlation_type, data: corr.sources_data };
      const a2 = { value: corr.asset_id_2 || corr.indicator_id || corr.credential, risk: corr.risk_score };
      const aiResult = await explainCorrelation(a1, a2);
      if (aiResult?.explanation) {
        corr.explanation = aiResult.explanation;
        if (aiResult.attack_scenarios) corr.attack_scenarios = aiResult.attack_scenarios;
        if (aiResult.mitre_techniques) corr.mitre_techniques = aiResult.mitre_techniques;
        if (aiResult.remediation_priority) corr.remediation_priority = aiResult.remediation_priority;
      }
    } catch { /* AI enrichment is optional, never blocks */ }
  }

  // ─── Save to DB ──────────────────────────────────────────────────────────
  if (correlations.length > 0) {
    await Correlation.deleteMany({ organization_id: organizationId });
    await Correlation.insertMany(correlations);
  }

  return correlations;
};

export const getCorrelationMatrix = async (organizationId) => {
  const correlations = await Correlation.find({ organization_id: organizationId });
  const assets = await DigitalAsset.find({ organization_id: organizationId });
  const assetNames = [...new Set(assets.map(a => a.asset_value))].slice(0, 12);

  const matrix = assetNames.map(row => ({
    asset: row,
    scores: assetNames.map(col => {
      if (row === col) return 0;
      const corr = correlations.find(c =>
        (c.asset_id_1 === row && c.asset_id_2 === col) ||
        (c.asset_id_1 === col && c.asset_id_2 === row) ||
        (c.service === row && c.credential?.includes(col.split('.').pop())) ||
        (c.service === col && c.credential?.includes(row.split('.').pop()))
      );
      return corr ? corr.risk_score : 0;
    }),
  }));

  return { labels: assetNames, matrix, total_correlations: correlations.length };
};

export default { runCorrelationAnalysis, getCorrelationMatrix };
