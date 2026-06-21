/**
 * ShadowNet AI — Enhanced Gemini Service
 * AI agent for attack paths, reports, threat personas, correlation explanations.
 * All analysis is based ONLY on real collected data.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

let genAI = null;
let model = null;

if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  // gemini-1.5-flash has its own free quota pool (1500 req/day)
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}


const safeGenerate = async (prompt, retryCount = 0) => {
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try to extract a JSON block from the response (handles markdown fences)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      text.match(/(\{[\s\S]*\})/) ||
                      text.match(/(\[[\s\S]*\])/);

    const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
      return JSON.parse(raw);
    } catch {
      console.warn('[GEMINI] Could not parse as JSON, returning raw text. Length:', raw.length);
      return raw;
    }
  } catch (error) {
    // Auto-retry once on 429 quota errors after a short wait
    if (error.message?.includes('429') && retryCount === 0) {
      console.warn('[GEMINI] 429 quota hit — retrying in 8 seconds...');
      await new Promise(r => setTimeout(r, 8000));
      return safeGenerate(prompt, 1);
    }
    console.error('[GEMINI] Generation error:', error.message?.slice(0, 200));
    return null;
  }
};



/**
 * Generate attack paths from REAL discovered assets + credentials + investigations.
 */
export const generateAttackPaths = async (assets, correlations, credentials = [], investigations = []) => {
  if (!model) {
    return { error: 'GEMINI_API_KEY not configured. Set it in server/.env to enable AI attack path generation.', paths: [] };
  }
  if (!assets || assets.length === 0) {
    return { error: 'No assets discovered yet. Search an IP/domain first, then generate attack paths.', paths: [] };
  }

  const prompt = `You are a senior red team cybersecurity expert. Analyze ONLY the following REAL data and simulate realistic attack paths. Do NOT invent assets, services, or vulnerabilities not shown below.

REAL ASSETS (${assets.length}):
${JSON.stringify(assets.slice(0, 20), null, 2)}

REAL CORRELATIONS (${correlations.length}):
${JSON.stringify(correlations.slice(0, 8), null, 2)}

REAL LEAKED CREDENTIALS (${credentials.length}):
${JSON.stringify(credentials.slice(0, 8), null, 2)}

REAL THREAT INVESTIGATIONS — Malicious/Suspicious (${investigations.length}):
${JSON.stringify(investigations.slice(0, 8), null, 2)}

RULES:
1. Generate 2-4 attack paths using ONLY data above.
2. Each path MUST reference a specific real asset value as entry_point and target.
3. Each stage MUST reference the exact real asset/service/port/CVE it exploits.
4. Include leaked credentials in attack paths if they exist.
5. Map every stage to a real MITRE ATT&CK technique ID.
6. If data is limited, fewer paths with lower probability — never invent data.

Reply ONLY valid JSON:
{
  "attack_paths": [
    {
      "name": "Attack path name referencing real assets",
      "attack_scenario_type": "credential_abuse|lateral_movement|data_exfiltration|ransomware|supply_chain",
      "entry_point": "Exact asset value from data",
      "target": "What attacker ultimately targets",
      "probability": "XX%",
      "impact": "CRITICAL|HIGH|MEDIUM|LOW",
      "stages": [
        {
          "title": "Stage title",
          "technique": "T1078 — Valid Accounts",
          "details": "Specific details referencing exact real asset/service/CVE",
          "confidence": "XX%",
          "real_asset": "Exact asset value exploited in this stage"
        }
      ],
      "remediation": [
        {
          "priority": 1,
          "action": "Specific action",
          "details": "Exact remediation steps for this real issue",
          "effort": "Low|Medium|High",
          "timeline": "Immediate|24h|Week|Month"
        }
      ],
      "timeline_estimate": "X-Y hours",
      "cvss_max": 9.0,
      "ai_reasoning": "Why this path is viable given the specific real data above"
    }
  ]
}`;

  const result = await safeGenerate(prompt);
  if (!result) return { error: 'Gemini AI generation failed. Check your API key and quota.', paths: [] };
  if (result?.attack_paths) return { paths: result.attack_paths };
  if (Array.isArray(result)) return { paths: result };
  return { error: 'Gemini returned unexpected format.', paths: [] };
};

/**
 * Generate a comprehensive executive security report from ALL real data.
 */
export const generateFullReport = async (assets, credentials, correlations, investigations, attackPaths) => {
  if (!model) return { error: 'GEMINI_API_KEY not configured.', report: null };

  const totalAssets = assets.length;
  const criticalAssets = assets.filter(a => a.risk_level === 'critical' || a.risk_score >= 80).length;
  const maliciousInvestigations = investigations.filter(i => i.verdict === 'malicious').length;
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Keep payload small to stay within token limits
  const assetSummary = assets.slice(0, 8).map(a => ({
    v: a.asset_value || a.indicator, t: a.asset_type || a.indicator_type,
    r: a.risk_level || a.verdict, s: a.risk_score, ip: a.ip,
  }));
  const corrSummary = correlations.slice(0, 4).map(c => ({
    title: c.title, sev: c.severity, score: c.risk_score,
  }));
  const invSummary = investigations.slice(0, 6).map(i => ({
    ind: i.indicator, t: i.indicator_type, v: i.verdict, s: i.risk_score,
  }));
  const pathSummary = attackPaths.slice(0, 2).map(p => ({
    name: p.name, entry: p.entry_point, impact: p.impact, prob: p.probability,
  }));

  const prompt = `You are a CISO. Write an executive security report. Output ONLY a single valid JSON object — no markdown, no explanation, no text outside the JSON.

DATA (${now}):
Assets: ${totalAssets} total, ${criticalAssets} critical
Credentials leaked: ${credentials.length}
Correlations: ${correlations.length}
Investigations: ${investigations.length} (${maliciousInvestigations} malicious)
Attack paths: ${attackPaths.length}

ASSETS: ${JSON.stringify(assetSummary)}
CORRELATIONS: ${JSON.stringify(corrSummary)}
INVESTIGATIONS: ${JSON.stringify(invSummary)}
ATTACK PATHS: ${JSON.stringify(pathSummary)}

Return exactly this JSON structure:
{"report_title":"Security Posture Report — ${now}","executive_summary":"3 sentences about the overall security posture","overall_risk_level":"CRITICAL|HIGH|MEDIUM|LOW","overall_risk_score":75,"key_findings":[{"title":"finding","severity":"CRITICAL|HIGH|MEDIUM","description":"description","evidence":"evidence","business_impact":"impact"}],"immediate_actions":[{"priority":1,"action":"action","target":"target asset","timeline":"Immediate|24h|Week","rationale":"reason"}],"threat_landscape":"2 sentences on threat actors","compliance_gaps":["gap1","gap2"],"security_posture_trend":"improving|stable|deteriorating","confidence_level":"high|medium|low","data_sources_used":["source1"]}`;

  const result = await safeGenerate(prompt);

  if (!result) {
    console.error('[GEMINI] generateFullReport: safeGenerate returned null (API error or quota exceeded)');
    return { error: 'Gemini AI call failed. Check your GEMINI_API_KEY quota or network.', report: null };
  }

  if (typeof result === 'string') {
    console.error('[GEMINI] generateFullReport: response was plain text, not JSON. First 300 chars:', result.slice(0, 300));
    return { error: 'Gemini returned plain text instead of JSON. Try again.', report: null };
  }

  if (typeof result !== 'object' || !result.executive_summary) {
    console.error('[GEMINI] generateFullReport: unexpected structure:', JSON.stringify(result).slice(0, 300));
    return { error: 'Gemini returned unexpected data structure. Try again.', report: null };
  }

  return { report: result };
};


/**
 * Generate a narrative security posture from real data.
 */

export const generateNarrative = async (type, data) => {
  if (!model) return null;

  const result = await safeGenerate(`You are a cybersecurity executive communications specialist. Write a ${type} security narrative based ONLY on this real data. Reference specific indicators, assets, and findings. Do NOT make up threats not evidenced by the data.

REAL DATA:
${JSON.stringify(data, null, 2)}

Reply in JSON:
{
  "title": "Narrative title",
  "content": "Full narrative (2-3 paragraphs, professional tone, referencing specific real findings)",
  "summary": "One-sentence summary",
  "key_findings": ["Finding from data 1", "Finding 2", "Finding 3"],
  "business_impact": "Business impact from actual findings",
  "recommended_actions": ["Specific action 1", "Specific action 2"],
  "confidence_level": "high|medium|low"
}`);

  if (result?.title) return result;
  return null;
};

/**
 * Predict threat personas from REAL organization data.
 */
export const predictThreatPersonas = async (orgProfile, assets) => {
  if (!model) return { error: 'GEMINI_API_KEY not configured.', personas: [] };
  if (!assets || assets.length === 0) return { error: 'No assets to analyze.', personas: [] };

  const result = await safeGenerate(`You are a cyber threat intelligence analyst. Based ONLY on these REAL exposed assets, predict 2-4 likely threat actor personas that would target them. Reference specific services, ports, and technologies found in the data.

ORGANIZATION:
${JSON.stringify(orgProfile, null, 2)}

REAL EXPOSED ASSETS (${assets.length}):
${JSON.stringify(assets.slice(0, 12), null, 2)}

Only predict threats relevant to the actual services and technologies present. Reply in JSON:
{
  "personas": [
    {
      "name": "Threat actor name",
      "predicted_attacker_type": "APT|Cybercriminals|Insiders|Nation-State|Hacktivist",
      "category": "Category description",
      "origin": "Region/Country",
      "motivation": "Financial|Espionage|Disruption|Ideological",
      "confidence": "XX%",
      "capability_level": "beginner|intermediate|advanced|nation-state",
      "target_assets": "Specific assets from data they would target",
      "why_relevant": "Specific reason this actor is relevant to these real assets",
      "description": "Brief description referencing actual technology stack",
      "ransom_likelihood": "XX%",
      "phishing_risk": "XX%",
      "ttps": ["T1078 — Valid Accounts", "T1566 — Phishing"]
    }
  ]
}`);

  if (result?.personas) return { personas: result.personas };
  return { error: 'Gemini returned unexpected format.', personas: [] };
};

/**
 * Explain why two real assets/correlations are dangerous together using Gemini.
 */
export const explainCorrelation = async (asset1, asset2) => {
  if (!model) return null;

  const result = await safeGenerate(`You are a cybersecurity analyst. Explain the security risk of this correlation between two REAL discovered assets. Reference specific ports, services, CVEs, or credentials present.

ASSET 1: ${JSON.stringify(asset1)}
ASSET 2: ${JSON.stringify(asset2)}

Reply in JSON:
{
  "explanation": "Why this correlation is dangerous (reference real data)",
  "risk_score": 75,
  "attack_scenarios": ["Specific scenario using real data", "Scenario 2"],
  "impact": "Impact referencing actual assets",
  "mitre_techniques": ["T1078 — Valid Accounts", "T1110 — Brute Force"],
  "remediation_priority": "Immediate|High|Medium"
}`);

  if (result?.explanation) return result;
  return null;
};

/**
 * Generate remediation for a real attack path.
 */
export const generateRemediation = async (attackPath) => {
  if (!model) return null;

  const result = await safeGenerate(`You are a cybersecurity remediation specialist. Generate prioritized remediation for this REAL attack path. Reference specific real assets, services, and CVEs.

ATTACK PATH: ${JSON.stringify(attackPath)}

Reply in JSON:
{
  "recommendations": [
    {
      "priority": 1,
      "action": "Specific action title",
      "details": "Exact remediation steps for this real issue",
      "effort": "Low|Medium|High",
      "timeline": "Immediate|24h|Week|Month",
      "target_asset": "Which real asset this addresses"
    }
  ]
}`);

  if (result?.recommendations) return result.recommendations;
  return null;
};

/**
 * Analyze VirusTotal data and generate threat intelligence summary.
 */
export const analyzeVirusTotalData = async (vtData, indicator) => {
  if (!model || !vtData) return null;

  const result = await safeGenerate(`You are a malware analyst. Analyze this VirusTotal scan result for "${indicator}" and provide a threat assessment.

VIRUSTOTAL DATA:
${JSON.stringify(vtData, null, 2)}

Reply in JSON:
{
  "threat_assessment": "Overall assessment based on the VT data",
  "malware_family": "${vtData.popular_threat_name || vtData.meaningful_name || 'Unknown'}",
  "threat_categories": ["category from vt tags"],
  "ioc_context": "What this indicator is used for based on VT data",
  "attack_vector": "How this could be weaponized",
  "recommended_actions": ["Specific action based on VT findings"],
  "mitre_techniques": ["Relevant MITRE techniques based on behavior"]
}`);

  if (result?.threat_assessment) return result;
  return null;
};

/**
 * Generate a threat intelligence summary from investigation results.
 */
export const generateThreatIntelSummary = async (investigations) => {
  if (!model || !investigations?.length) return null;

  const malicious = investigations.filter(i => i.verdict === 'malicious');
  const suspicious = investigations.filter(i => i.verdict === 'suspicious');

  const result = await safeGenerate(`You are a threat intelligence analyst. Summarize the threat intelligence gathered from these real indicator investigations.

REAL INVESTIGATIONS (${investigations.length} total, ${malicious.length} malicious, ${suspicious.length} suspicious):
${JSON.stringify(investigations.slice(0, 15), null, 2)}

Reply in JSON:
{
  "summary": "2-paragraph threat intelligence summary referencing specific indicators",
  "threat_categories": ["category 1 based on data", "category 2"],
  "top_threats": [
    {
      "indicator": "specific indicator from data",
      "type": "ip|domain|hash|url|cve|email",
      "threat": "what this indicator represents",
      "severity": "CRITICAL|HIGH|MEDIUM"
    }
  ],
  "attack_patterns": ["Pattern observed from investigations"],
  "geolocation_insights": "Geographic insights from IP data",
  "recommended_blocks": ["Specific indicator to block"],
  "overall_threat_level": "CRITICAL|HIGH|MEDIUM|LOW"
}`);

  if (result?.summary) return result;
  return null;
};

export default {
  generateAttackPaths,
  generateFullReport,
  generateNarrative,
  predictThreatPersonas,
  explainCorrelation,
  generateRemediation,
  analyzeVirusTotalData,
  generateThreatIntelSummary,
};
