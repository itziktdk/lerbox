const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  grade: String,
  year: { type: Number, default: () => new Date().getFullYear() },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

classSchema.index({ schoolId: 1 });
classSchema.index({ name: 1 });

module.exports = mongoose.model('Class', classSchema);
