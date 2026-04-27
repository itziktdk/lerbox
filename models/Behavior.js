const mongoose = require('mongoose');

const behaviorSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, default: Date.now },
  period: Number,
  type: { type: String, enum: ['positive', 'disruption', 'lateness'], required: true },
  note: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  points: { type: Number, default: 0 }
}, { timestamps: true });

behaviorSchema.index({ date: -1 });
behaviorSchema.index({ schoolId: 1 });
behaviorSchema.index({ studentId: 1 });
behaviorSchema.index({ classId: 1 });

module.exports = mongoose.model('Behavior', behaviorSchema);
