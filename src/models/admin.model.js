import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    login: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: null },
  },
  { timestamps: true },
);

adminSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const Admin = mongoose.model('Admin', adminSchema);

/** @param {string} password */
export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
