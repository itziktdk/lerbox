const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  icon: String,
  earnedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Achievement', achievementSchema);
