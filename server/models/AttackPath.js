import mongoose from 'mongoose';

const attackStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, default: 'Simulated Vulnerable' },
  technique: { type: String, default: '' },
  details: { type: String, default: '' },
  confidence: { type: String, default: '0%' },
}, { _id: false });

const remediationSchema = new mongoose.Schema({
  priority: { type: Number, required: true },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
}, { _id: false });

const attackPathSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  attack_scenario_type: { type: String, enum: ['ransomware', 'credential_abuse', 'insider', 'lateral_movement', 'data_exfiltration', 'supply_chain'], default: 'ransomware' },
  involved_assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DigitalAsset' }],
  stages: [attackStepSchema],
  probability: { type: String, default: '0%' },
  success_probability: { type: Number, default: 0 },
  impact: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
  detected_vulnerabilities: [{ type: String }],
  attacker_prerequisites: [{ type: String }],
  timeline_estimate: { type: String, default: '' },
  remediation: [remediationSchema],
  ai_reasoning: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

attackPathSchema.index({ organization_id: 1 });

export default mongoose.model('AttackPath', attackPathSchema);
