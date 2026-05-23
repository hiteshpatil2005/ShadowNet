import mongoose from 'mongoose';

const riskNarrativeSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  narrative_type: { type: String, enum: ['executive_summary', 'technical_deep_dive', 'threat_assessment', 'incident_scenario'], default: 'executive_summary' },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  key_findings: [{ type: String }],
  business_impact: { type: String, default: '' },
  recommended_actions: [{ type: String }],
  supporting_data: { type: mongoose.Schema.Types.Mixed, default: {} },
  confidence_level: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  generated_at: { type: Date, default: Date.now },
  valid_until: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

riskNarrativeSchema.index({ organization_id: 1 });

export default mongoose.model('RiskNarrative', riskNarrativeSchema);
