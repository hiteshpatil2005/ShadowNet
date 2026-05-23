import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true, trim: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
  is_active: { type: Boolean, default: true },
  last_login: { type: Date },
  refresh_token: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.index({ organization_id: 1 });

export default mongoose.model('User', userSchema);
