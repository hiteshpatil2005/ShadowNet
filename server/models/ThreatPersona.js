import mongoose from 'mongoose';

const threatPersonaSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  predicted_attacker_type: { type: String, enum: ['APT', 'Cybercriminals', 'Insiders', 'Nation-State', 'Hacktivist'], default: 'Cybercriminals' },
  category: { type: String, default: '' },
  origin: { type: String, default: '' },
  motivation: { type: String, default: '' },
  confidence: { type: String, default: '0%' },
  confidence_score: { type: Number, default: 0, min: 0, max: 1 },
  capability_level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'nation-state'], default: 'intermediate' },
  targeting_probability: { type: Number, default: 0 },
  target_assets: { type: String, default: '' },
  attack_style: { type: mongoose.Schema.Types.Mixed, default: {} },
  historical_patterns: { type: mongoose.Schema.Types.Mixed, default: {} },
  description: { type: String, default: '' },
  ransom_likelihood: { type: String, default: '' },
  phishing_risk: { type: String, default: '' },
  reasoning: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

threatPersonaSchema.index({ organization_id: 1 });

export default mongoose.model('ThreatPersona', threatPersonaSchema);
