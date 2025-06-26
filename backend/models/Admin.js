import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' },
  qrImage: String,
  upiId: String
}, {
  timestamps: true
});

// Don't hash password for admin - keep it simple
adminSchema.pre('save', async function(next) {
  // Skip password hashing for admin
  next();
});

adminSchema.methods.comparePassword = async function(password) {
  // Simple direct comparison for admin
  return password === this.password;
};

export default mongoose.model('Admin', adminSchema);
