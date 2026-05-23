import mongoose from 'mongoose';

const exposureEventSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  event_type: { type: String, enum: ['new_exposure', 'exposure_removed', 'credential_leak', 'certificate_issued', 'infrastructure_change', 'correlation_detected'], default: 'new_exposure' },
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalAsset' },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], default: 'INFO' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  details: { type: String, default: '' },
  event: { type: String, default: '' },
  asset: { type: String, default: '' },
  category: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'New', 'Acknowledged', 'Investigating', 'Resolved', 'Closed'], default: 'New' },
  acknowledged: { type: Boolean, default: false },
  acknowledged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledged_at: { type: Date },
  investigation_status: { type: String, enum: ['new', 'in_progress', 'resolved', 'false_positive'], default: 'new' },
  notes: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

exposureEventSchema.index({ organization_id: 1 });
exposureEventSchema.index({ severity: 1 });
exposureEventSchema.index({ timestamp: -1 });

export default mongoose.model('ExposureEvent', exposureEventSchema);
