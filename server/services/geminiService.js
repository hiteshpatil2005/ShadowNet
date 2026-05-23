import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

let genAI = null;
let model = null;

if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const safeGenerate = async (prompt) => {
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Try to parse as JSON if it looks like JSON
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        // Strip markdown code fences if present
        const clean = trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(clean);
      } catch { return text; }
    }
    return text;
  } catch (error) {
    console.error('[GEMINI] Generation error:', error.message);
    return null;
  }
};

export const generateAttackPaths = async (assets, correlations) => {
  const result = await safeGenerate(`You are a cybersecurity expert AI. Analyze these exposed assets and correlations for a security assessment. Generate 3 realistic attack path simulations.

ASSETS:
${JSON.stringify(assets.slice(0, 10), null, 2)}

CORRELATIONS:
${JSON.stringify(correlations.slice(0, 5), null, 2)}

Respond in JSON format:
{
  "attack_paths": [
    {
      "name": "Attack path name",
      "attack_scenario_type": "ransomware|credential_abuse|lateral_movement|data_exfiltration",
      "probability": "XX%",
      "impact": "CRITICAL|HIGH|MEDIUM|LOW",
      "stages": [
        { "title": "Stage name", "technique": "MITRE ATT&CK technique", "details": "Description", "confidence": "XX%" }
      ],
      "remediation": [
        { "priority": 1, "action": "Action title", "details": "Detailed steps" }
      ],
      "timeline_estimate": "X-Y hours/days",
      "ai_reasoning": "Explanation of why this path is realistic"
    }
  ]
}`);

  if (result?.attack_paths) return result.attack_paths;
  return getFallbackAttackPaths();
};

export const generateNarrative = async (type, data) => {
  const result = await safeGenerate(`You are a cybersecurity executive communications specialist. Generate a ${type} security narrative.

DATA:
${JSON.stringify(data, null, 2)}

Respond in JSON:
{
  "title": "Narrative title",
  "content": "Full narrative text (2-3 paragraphs, professional tone)",
  "summary": "One sentence summary",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "business_impact": "Business impact statement",
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "confidence_level": "high|medium|low"
}`);

  if (result?.title) return result;
  return { title: `${type} Security Assessment`, content: 'Based on our analysis, your organization has several exposed assets that require immediate attention. The correlation between exposed services, leaked credentials, and infrastructure misconfigurations creates exploitable attack surfaces.', summary: 'Multiple security exposures identified requiring remediation.', key_findings: ['Exposed services detected', 'Credential leaks identified', 'Infrastructure misconfigurations found'], business_impact: 'Potential data breach risk if not addressed.', recommended_actions: ['Rotate all exposed credentials', 'Patch vulnerable services', 'Review infrastructure security'], confidence_level: 'medium' };
};

export const predictThreatPersonas = async (orgProfile, assets) => {
  const result = await safeGenerate(`You are a cyber threat intelligence analyst. Based on this organization profile and exposed assets, predict 3-4 likely threat actor personas that would target this organization.

ORGANIZATION:
${JSON.stringify(orgProfile, null, 2)}

EXPOSED ASSETS:
${JSON.stringify(assets.slice(0, 10), null, 2)}

Respond in JSON:
{
  "personas": [
    {
      "name": "Persona name (e.g., 'FIN7', 'Lazarus Group')",
      "predicted_attacker_type": "APT|Cybercriminals|Insiders|Nation-State|Hacktivist",
      "category": "Category description",
      "origin": "Region/Country",
      "motivation": "Financial|Espionage|Disruption|Ideological",
      "confidence": "XX%",
      "capability_level": "beginner|intermediate|advanced|nation-state",
      "target_assets": "What they'd target",
      "description": "Brief description",
      "ransom_likelihood": "XX%",
      "phishing_risk": "XX%"
    }
  ]
}`);

  if (result?.personas) return result.personas;
  return getFallbackPersonas();
};

export const explainCorrelation = async (asset1, asset2) => {
  const result = await safeGenerate(`You are a cybersecurity analyst. Explain why the correlation between these two assets is dangerous and what attack scenarios it enables.

ASSET 1: ${JSON.stringify(asset1)}
ASSET 2: ${JSON.stringify(asset2)}

Respond in JSON:
{
  "explanation": "Why this correlation is dangerous",
  "risk_score": 75,
  "attack_scenarios": ["scenario 1", "scenario 2"],
  "impact": "Impact description"
}`);

  if (result?.explanation) return result;
  return { explanation: 'These assets share infrastructure or credentials that could enable lateral movement.', risk_score: 65, attack_scenarios: ['Credential reuse attack', 'Lateral movement via shared infrastructure'], impact: 'Potential unauthorized access to connected systems.' };
};

export const generateRemediation = async (attackPath) => {
  const result = await safeGenerate(`You are a cybersecurity remediation specialist. Generate prioritized remediation recommendations for this attack path.

ATTACK PATH: ${JSON.stringify(attackPath)}

Respond in JSON:
{
  "recommendations": [
    { "priority": 1, "action": "Action title", "details": "Detailed remediation steps", "effort": "Low|Medium|High", "timeline": "Immediate|Days|Weeks" }
  ]
}`);

  if (result?.recommendations) return result.recommendations;
  return [{ priority: 1, action: 'Rotate exposed credentials', details: 'Immediately rotate all credentials that appear in leaked databases.', effort: 'Low', timeline: 'Immediate' }, { priority: 2, action: 'Patch vulnerable services', details: 'Apply security patches to all exposed services.', effort: 'Medium', timeline: 'Days' }];
};

// Fallback data when Gemini API is not available
function getFallbackAttackPaths() {
  return [{
    name: 'Credential Stuffing to Internal Access',
    attack_scenario_type: 'credential_abuse',
    probability: '72%', impact: 'CRITICAL',
    stages: [
      { title: 'Credential Harvesting', technique: 'T1589 - Gather Victim Identity Info', details: 'Attacker collects leaked credentials from dark web databases.', confidence: '90%' },
      { title: 'Credential Stuffing', technique: 'T1110.004 - Credential Stuffing', details: 'Automated login attempts using harvested credentials across exposed services.', confidence: '78%' },
      { title: 'Internal Reconnaissance', technique: 'T1087 - Account Discovery', details: 'Map internal systems and identify high-value targets.', confidence: '65%' },
      { title: 'Data Exfiltration', technique: 'T1041 - Exfiltration Over C2 Channel', details: 'Extract sensitive data through established command and control channels.', confidence: '55%' },
    ],
    remediation: [
      { priority: 1, action: 'Enforce MFA on all external services', details: 'Deploy multi-factor authentication to prevent credential stuffing attacks.' },
      { priority: 2, action: 'Implement credential monitoring', details: 'Set up dark web monitoring for organizational credentials.' },
    ],
    timeline_estimate: '2-5 days', ai_reasoning: 'Multiple leaked credentials detected for organizational email accounts with password reuse patterns.',
  }];
}

function getFallbackPersonas() {
  return [
    { name: 'FIN7 (Carbanak)', predicted_attacker_type: 'Cybercriminals', category: 'Financial Crime Syndicate', origin: 'Eastern Europe', motivation: 'Financial', confidence: '68%', capability_level: 'advanced', target_assets: 'Payment systems, customer databases', description: 'Sophisticated financial crime group known for targeting organizations with exposed payment infrastructure.', ransom_likelihood: '45%', phishing_risk: '82%' },
    { name: 'Scattered Spider', predicted_attacker_type: 'Cybercriminals', category: 'Social Engineering Specialists', origin: 'United States/UK', motivation: 'Financial', confidence: '55%', capability_level: 'intermediate', target_assets: 'Identity systems, cloud infrastructure', description: 'Young threat actors using advanced social engineering and SIM swapping techniques.', ransom_likelihood: '60%', phishing_risk: '90%' },
  ];
}

export default { generateAttackPaths, generateNarrative, predictThreatPersonas, explainCorrelation, generateRemediation };
