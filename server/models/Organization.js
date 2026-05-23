import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, default: 'Technology' },
  size: { type: Number, default: 0 },
  api_quota: { type: Number, default: 10000 },
  subscription_tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  monitoring_enabled: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Organization', organizationSchema);
