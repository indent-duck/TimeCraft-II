const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  instructor: { type: String, required: true },
  isLecture: { type: Boolean, required: true },
  isLab: { type: Boolean, required: true },
  roomNumber: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  day: { type: String, required: true },
  timeSlots: [String],
  roomPrefix: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);