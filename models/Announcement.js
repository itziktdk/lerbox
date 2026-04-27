const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorRole: String,
  audience: { type: String, enum: ['all', 'class', 'parents', 'students', 'teachers'], default: 'all' }
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
