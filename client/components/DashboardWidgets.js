import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import StorageService from '../services/StorageService';

export default function DashboardWidgets() {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState({
    currentClass: null,
    nextClass: null,
    reminders: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      // Set up interval to refresh data every 30 seconds when screen is focused
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const schedule = await StorageService.getSchedule();
      const reminders = await StorageService.getReminders();
      
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // Find current and next class
      const todayClasses = schedule.filter(cls => cls.day === currentDay).sort((a, b) => parseTime(a.timeSlots[0]) - parseTime(b.timeSlots[0]));
      let currentClass = null;
      let nextClass = null;
      
      for (const cls of todayClasses) {
        const startTime = parseTime(cls.timeSlots[0]);
        const endTimeSlot = cls.timeSlots[cls.timeSlots.length - 1];
        const endTime = parseTime(endTimeSlot) + 60; // Add full hour to get actual end time
        
        if (currentTime >= startTime && currentTime < endTime) {
          // Calculate actual end time by adding 1 hour to the last time slot
          const actualEndTime = addHourToTime(endTimeSlot);
          currentClass = {
            name: cls.subjectName,
            time: `${cls.timeSlots[0]} - ${actualEndTime}`,
            room: `${cls.roomPrefix} ${cls.roomNumber}`
          };
        } else if (startTime > currentTime && !nextClass) {
          // Calculate actual end time by adding 1 hour to the last time slot
          const actualEndTime = addHourToTime(endTimeSlot);
          nextClass = {
            name: cls.subjectName,
            time: `${cls.timeSlots[0]} - ${actualEndTime}`,
            room: `${cls.roomPrefix} ${cls.roomNumber}`
          };
        }
      }
      
      // If no next class today, find next class in upcoming days
      if (!nextClass) {
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDayIndex = dayOrder.indexOf(currentDay);
        
        for (let i = 1; i <= 7; i++) {
          const nextDayIndex = (currentDayIndex + i) % 7;
          const nextDayName = dayOrder[nextDayIndex];
          const nextDayClasses = schedule.filter(cls => cls.day === nextDayName).sort((a, b) => parseTime(a.timeSlots[0]) - parseTime(b.timeSlots[0]));
          
          if (nextDayClasses.length > 0) {
            const cls = nextDayClasses[0];
            const endTimeSlot = cls.timeSlots[cls.timeSlots.length - 1];
            const actualEndTime = addHourToTime(endTimeSlot);
            nextClass = {
              name: cls.subjectName,
              time: `${cls.timeSlots[0]} - ${actualEndTime}`,
              room: `${cls.roomPrefix} ${cls.roomNumber}`,
              day: nextDayName
            };
            break;
          }
        }
      }
      
      // Format reminders
      const formattedReminders = reminders.slice(0, 3).map(reminder => ({
        title: reminder.title,
        subject: reminder.subject,
        deadline: new Date(reminder.deadlineDate).toLocaleDateString(),
        time: reminder.deadlineTime
      }));
      
      setDashboardData({
        currentClass,
        nextClass,
        reminders: formattedReminders
      });
    } catch (error) {
      console.log('Error fetching dashboard data:', error.message);
    }
  };
  
  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  };
  
  const addHourToTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Add 1 hour
    hours += 1;
    
    // Convert back to 12-hour format
    let newPeriod = 'AM';
    if (hours >= 12) {
      newPeriod = 'PM';
      if (hours > 12) hours -= 12;
    }
    if (hours === 0) hours = 12;
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${newPeriod}`;
  };

  const dynamicStyles = StyleSheet.create({
    widget: {
      backgroundColor: theme.surface || '#f9f9f9',
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.widget, dynamicStyles.widget]}>
        <View style={styles.widgetHeader}>
          <Ionicons name="school" size={24} color={theme.primary} />
          <Text style={styles.widgetTitle}>Current Class</Text>
        </View>
        <Text style={styles.className}>{dashboardData.currentClass?.name || 'No current class'}</Text>
        <Text style={styles.classDetails}>{dashboardData.currentClass?.time || ''}</Text>
        <Text style={styles.classDetails}>{dashboardData.currentClass?.room || ''}</Text>
      </View>

      <View style={[styles.widget, dynamicStyles.widget]}>
        <View style={styles.widgetHeader}>
          <Ionicons name="time" size={24} color={theme.primary} />
          <Text style={styles.widgetTitle}>Next Class</Text>
        </View>
        <Text style={styles.className}>{dashboardData.nextClass?.name || 'No upcoming class'}</Text>
        <Text style={styles.classDetails}>{dashboardData.nextClass?.time || ''}</Text>
        <Text style={styles.classDetails}>{dashboardData.nextClass?.room || ''}</Text>
        {dashboardData.nextClass?.day && dashboardData.nextClass.day !== new Date().toLocaleDateString('en-US', { weekday: 'long' }) && (
          <Text style={styles.classDay}>{dashboardData.nextClass.day}</Text>
        )}
      </View>

      <View style={[styles.widget, dynamicStyles.widget]}>
        <View style={styles.widgetHeader}>
          <Ionicons name="notifications" size={24} color={theme.primary} />
          <Text style={styles.widgetTitle}>Reminders</Text>
        </View>
        {dashboardData.reminders.map((reminder, index) => (
          <View key={index} style={styles.reminderItem}>
            <Text style={styles.reminderTitle}>{reminder.title}</Text>
            <Text style={styles.reminderSubject}>{reminder.subject}</Text>
            <Text style={styles.reminderDeadline}>Due: {reminder.deadline} at {reminder.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  widget: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  className: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  classDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  classDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 4,
  },
  reminder: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  reminderItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reminderSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  reminderDeadline: {
    fontSize: 14,
    color: '#666',
  },
});