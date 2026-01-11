import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const API_URL = 'http://192.168.1.100:3001/api';

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
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data from:', `${API_URL}/dashboard`);
      const response = await axios.get(`${API_URL}/dashboard`);
      console.log('Dashboard data received:', response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.log('Error fetching dashboard data:', error.message);
    }
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