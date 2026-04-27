const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  role: { type: String, enum: ['teacher', 'student', 'parent', 'admin'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  parentOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  avatar: String,
  points: { type: Number, default: 0 },
  streaks: {
    attendance: { type: Number, default: 0 },
    homework: { type: Number, default: 0 },
    bestAttendance: { type: Number, default: 0 }
  },
  badges: [{ name: String, icon: String, earnedAt: Date }],
  otpCode: String,
  otpExpires: Date,
  password: String
}, { timestamps: true });

userSchema.index({ phone: 1, schoolId: 1 });
userSchema.index({ name: 1 });
userSchema.index({ points: -1 });
userSchema.index({ schoolId: 1 });
userSchema.index({ classId: 1 });
userSchema.index({ role: 1 });
module.exports = mongoose.model('User', userSchema);
