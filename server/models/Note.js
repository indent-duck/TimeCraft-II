const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create compound index for subjectName and title
noteSchema.index({ subjectName: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);