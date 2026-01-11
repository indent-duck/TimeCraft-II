const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Reminder = require('../models/Reminder');

// GET /api/dashboard - Get all dashboard data
router.get('/', async (req, res) => {
  try {
    const classes = await Schedule.find();
    
    // Quick check - if no classes, return early with debug info
    if (classes.length === 0) {
      return res.json({
        currentClass: null,
        nextClass: null,
        reminders: [],
        debug: { message: 'No classes found in database', totalClasses: 0 }
      });
    }
    const reminders = await Reminder.find().sort({ deadlineDate: 1 }).limit(5);
    
    console.log('Total classes found:', classes.length);
    console.log('All class days:', classes.map(c => c.day));
    console.log('Classes:', classes.map(c => ({ day: c.day, subject: c.subjectName, time: c.startTime })));
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    console.log('Current day:', currentDay);
    
    const todayClasses = classes.filter(cls => cls.day === currentDay);
    console.log('Today classes:', todayClasses.length);
    
    // Find current class (only today)
    const currentClass = todayClasses.find(cls => {
      const [startHour, startMin] = cls.startTime.split(':');
      const [endHour, endMin] = cls.endTime.split(':');
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMin);
      return now >= startTime && now <= endTime;
    });
    
    // Find next class (today first, then next days)
    let nextClass = todayClasses.find(cls => {
      const [startHour, startMin] = cls.startTime.split(':');
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin);
      return now < startTime;
    });
    
    console.log('Next class from today:', nextClass?.subjectName || 'none');
    
    // If no next class today, find next class in upcoming days
    if (!nextClass) {
      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const shortDayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDayIndex = dayOrder.indexOf(currentDay);
      
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = shortDayOrder[nextDayIndex]; // Use short format
        const nextDayClasses = classes.filter(cls => cls.day === nextDay);
        
        if (nextDayClasses.length > 0) {
          nextDayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
          nextClass = nextDayClasses[0];
          break;
        }
      }
    }
    
    const formatClass = (cls) => cls ? {
      name: cls.subjectName,
      time: `${cls.startTime} - ${cls.endTime}`,
      room: `${cls.roomPrefix} ${cls.roomNumber}`,
      day: cls.day
    } : null;
    
    console.log('Final result - Current class:', currentClass?.subjectName || 'none');
    console.log('Final result - Next class:', nextClass?.subjectName || 'none');
    
    res.json({
      currentClass: formatClass(currentClass),
      nextClass: formatClass(nextClass),
      reminders: reminders.map(r => ({
        title: r.title,
        subject: r.subject || 'General',
        deadline: r.deadlineDate.toLocaleDateString(),
        time: r.deadlineTime
      })),
      debug: {
        totalClasses: classes.length,
        currentDay: currentDay,
        todayClasses: todayClasses.length,
        classDays: classes.map(c => c.day),
        nextClassFound: nextClass ? nextClass.subjectName : 'none'
      }
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