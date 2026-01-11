const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  deadlineDate: {
    type: Date,
    required: true
  },
  deadlineTime: {
    type: String,
    required: true
  },
  reminderDays: [{
    type: String,
    enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }],
  reminderTime: {
    type: String,
    required: true
  },
  notificationIds: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reminder', reminderSchema);