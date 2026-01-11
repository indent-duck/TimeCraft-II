const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// Get all subjects with notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({});
    const subjects = [...new Set(notes.map(note => note.subjectName))];
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notes by subject name
router.get('/subject/:subjectName', async (req, res) => {
  try {
    const { subjectName } = req.params;
    const notes = await Note.find({ subjectName: decodeURIComponent(subjectName) });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific note by subject and title
router.get('/:subjectName/:title', async (req, res) => {
  try {
    const { subjectName, title } = req.params;
    const note = await Note.findOne({ 
      subjectName: decodeURIComponent(subjectName),
      title: decodeURIComponent(title)
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update note
router.post('/', async (req, res) => {
  try {
    const { subjectName, title, content } = req.body;
    
    if (!subjectName || !title) {
      return res.status(400).json({ error: 'Subject name and title are required' });
    }
    
    const note = await Note.findOneAndUpdate(
      { subjectName, title },
      { subjectName, title, content },
      { new: true, upsert: true }
    );
    
    res.json(note);
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;