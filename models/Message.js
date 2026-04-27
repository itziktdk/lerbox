const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ toId: 1, read: 1 });
messageSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Message', messageSchema);
