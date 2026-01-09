const express = require('express');
const Schedule = require('../models/Schedule');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const classes = await Schedule.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const scheduleClass = new Schedule(req.body);
    await scheduleClass.save();
    res.status(201).json(scheduleClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const scheduleClass = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheduleClass) return res.status(404).json({ error: 'Class not found' });
    res.json(scheduleClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const scheduleClass = await Schedule.findByIdAndDelete(req.params.id);
    if (!scheduleClass) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;