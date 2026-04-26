const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'submitted', 'late', 'graded'], default: 'pending' },
    submittedAt: Date,
    grade: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
