const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  icon: String,
  earnedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ earnedAt: -1 });
achievementSchema.index({ schoolId: 1 });
achievementSchema.index({ studentId: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
