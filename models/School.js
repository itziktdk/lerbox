const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  address: String,
  principal: String,
  settings: {
    leaderboardEnabled: { type: Boolean, default: true },
    gamificationEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

schoolSchema.index({ slug: 1 });

module.exports = mongoose.model('School', schoolSchema);
