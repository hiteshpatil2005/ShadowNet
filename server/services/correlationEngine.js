import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import { explainCorrelation } from './geminiService.js';

export const runCorrelationAnalysis = async (organizationId) => {
  const assets = await DigitalAsset.find({ organization_id: organizationId });
  const credentials = await LeakedCredential.find({ organization_id: organizationId });
  const correlations = [];

  // 1. Shared credential analysis — find credentials used across services
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
        title: `Shared credentials: ${email}`,
        credential: email,
        correlation_type: 'credential_usage',
        risk_score: riskScore,
        severity: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MEDIUM',
        confidence: `${Math.min(95, 60 + creds.length * 10)}%`,
        description: `Email ${email} has credentials exposed in ${creds.length} different breaches: ${creds.map(c => c.source).join(', ')}`,
        explanation: `Multiple credential exposures for the same email significantly increases compromise risk through credential stuffing attacks.`,
        impact: 'Attacker can attempt credential reuse across all associated services.',
        attack_scenarios: ['Credential stuffing across services', 'Password spray attacks', 'Account takeover chain'],
      });
    }
  }

  // 2. Infrastructure correlations — assets sharing IPs or subnets
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
        title: `Shared IP hosting: ${ip}`,
        asset_id_1: grouped[0].asset_value,
        asset_id_2: grouped[1].asset_value,
        correlation_type: 'ip_hosting',
        risk_score: riskScore,
        severity: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MEDIUM',
        confidence: `${Math.min(90, 55 + grouped.length * 8)}%`,
        description: `${grouped.length} assets share IP address ${ip}: ${grouped.map(a => a.asset_value).join(', ')}`,
        explanation: 'Shared hosting means compromising one service could lead to lateral movement across all co-hosted services.',
        impact: 'Single point of failure — compromising the host affects all services.',
        attack_scenarios: ['Lateral movement via shared hosting', 'Privilege escalation on shared server'],
      });
    }
  }

  // 3. Service-credential correlations — leaked creds for exposed services
  for (const asset of assets.filter(a => a.risk_level === 'critical' || a.risk_level === 'high')) {
    const relatedCreds = credentials.filter(c =>
      c.email.includes(asset.asset_value.split('.').slice(-2).join('.'))
    );
    if (relatedCreds.length > 0) {
      const riskScore = Math.min(98, 70 + relatedCreds.length * 8);
      correlations.push({
        organization_id: organizationId,
        title: `Exposed service + leaked credentials: ${asset.asset_value}`,
        service: asset.asset_value,
        credential: relatedCreds[0].email,
        correlation_type: 'suspicious_relationship',
        risk_score: riskScore,
        severity: 'CRITICAL',
        confidence: `${Math.min(92, 65 + relatedCreds.length * 7)}%`,
        description: `High-risk asset ${asset.asset_value} has ${relatedCreds.length} associated leaked credentials.`,
        explanation: 'Combination of exposed services and leaked credentials creates a direct attack vector.',
        impact: 'Direct unauthorized access possible using leaked credentials on exposed service.',
        attack_scenarios: ['Direct login with leaked credentials', 'API abuse with leaked tokens', 'Privilege escalation post-authentication'],
      });
    }
  }

  // Try Gemini AI enrichment for top correlations
  for (const corr of correlations.slice(0, 3)) {
    try {
      const aiExplanation = await explainCorrelation(
        { value: corr.asset_id_1 || corr.service, type: corr.correlation_type },
        { value: corr.asset_id_2 || corr.credential, risk: corr.risk_score }
      );
      if (aiExplanation?.explanation) {
        corr.explanation = aiExplanation.explanation;
        if (aiExplanation.attack_scenarios) corr.attack_scenarios = aiExplanation.attack_scenarios;
      }
    } catch { /* AI enrichment is optional */ }
  }

  // Save correlations to DB
  if (correlations.length > 0) {
    await Correlation.deleteMany({ organization_id: organizationId });
    await Correlation.insertMany(correlations);
  }

  return correlations;
};

export const getCorrelationMatrix = async (organizationId) => {
  const correlations = await Correlation.find({ organization_id: organizationId });
  const assets = await DigitalAsset.find({ organization_id: organizationId });

  // Build a matrix of asset-to-asset risk scores
  const assetNames = [...new Set(assets.map(a => a.asset_value))].slice(0, 15);
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
