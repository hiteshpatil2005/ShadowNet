import mongoose from 'mongoose';

const leakedCredentialSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  credential_type: { type: String, enum: ['email', 'username', 'api_key', 'token', 'database_password'], default: 'email' },
  email: { type: String, required: true },
  credential_value: { type: String, default: '' },
  hash_type: { type: String, default: '' },
  leaked_password: { type: String, default: '' },
  owner: { type: String, default: '' },
  source: { type: String, required: true },
  breach_name: { type: String, default: '' },
  breach_date: { type: Date },
  leak_date: { type: String },
  exposure_count: { type: Number, default: 1 },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  verified: { type: Boolean, default: false },
  remediation_status: { type: String, enum: ['not_started', 'in_progress', 'remediated', 'false_positive'], default: 'not_started' },
  related_assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DigitalAsset' }],
  notes: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

leakedCredentialSchema.index({ organization_id: 1 });
leakedCredentialSchema.index({ email: 1 });
leakedCredentialSchema.index({ severity: 1 });

export default mongoose.model('LeakedCredential', leakedCredentialSchema);
