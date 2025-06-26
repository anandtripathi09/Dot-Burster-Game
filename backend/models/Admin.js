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

adminSchema.pre('save', async function(next) {
  // Only hash password if it's modified and not already hashed
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password.startsWith('$2')) return next();
  
  console.log('Hashing admin password...');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function(password) {
  console.log('Comparing passwords for admin');
  
  // If stored password is not hashed (for initial setup)
  if (!this.password.startsWith('$2')) {
    console.log('Using direct password comparison');
    return password === this.password;
  }
  
  console.log('Using bcrypt comparison');
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('Admin', adminSchema);
