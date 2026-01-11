const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Reminder = require('../models/Reminder');

// GET /api/dashboard - Get all dashboard data
router.get('/', async (req, res) => {
  try {
    const classes = await Schedule.find();
    const reminders = await Reminder.find().sort({ deadlineDate: 1 }).limit(5);
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayClasses = classes.filter(cls => cls.day === currentDay);
    
    const currentClass = todayClasses.find(cls => {
      const [startHour, startMin] = cls.startTime.split(':');
      const [endHour, endMin] = cls.endTime.split(':');
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMin);
      return now >= startTime && now <= endTime;
    });
    
    const nextClass = todayClasses.find(cls => {
      const [startHour, startMin] = cls.startTime.split(':');
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin);
      return now < startTime;
    });
    
    const formatClass = (cls) => cls ? {
      name: cls.subjectName,
      time: `${cls.startTime} - ${cls.endTime}`,
      room: `${cls.roomPrefix} ${cls.roomNumber}`
    } : null;
    
    res.json({
      currentClass: formatClass(currentClass),
      nextClass: formatClass(nextClass),
      reminders: reminders.map(r => ({
        title: r.title,
        subject: r.subject || 'General',
        deadline: r.deadlineDate.toLocaleDateString(),
        time: r.deadlineTime
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dashboard/reminder - Add a new reminder
router.post('/reminder', async (req, res) => {
  try {
    const newReminder = new Reminder(req.body);
    await newReminder.save();
    res.json(newReminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;