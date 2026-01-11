import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_URL = 'http://192.168.1.14:3001/api';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchReminders();
    }, [])
  );

  const fetchReminders = async () => {
    try {
      const response = await axios.get(`${API_URL}/reminders`);
      setReminders(response.data);
    } catch (error) {
      console.log('Error fetching reminders:', error.message);
    }
  };

  const deleteReminder = async (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/reminders/${id}`);
              setReminders(reminders.filter(reminder => reminder._id !== id));
            } catch (error) {
              console.log('Error deleting reminder:', error.message);
            }
          }
        }
      ]
    );
  };

  const renderReminder = ({ item }) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{item.subject || item.title}</Text>
        {item.subject && <Text style={styles.reminderSubject}>{item.title}</Text>}
        <Text style={styles.reminderDate}>Deadline: {new Date(item.deadlineDate).toLocaleDateString()} at {item.deadlineTime}</Text>
        <Text style={styles.reminderTime}>Reminder: {item.reminderTime}</Text>
        {item.reminderDays.length > 0 && (
          <Text style={styles.reminderDays}>Days: {item.reminderDays.join(', ')}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteReminder(item._id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reminders</Text>
      {reminders.length === 0 ? (
        <Text style={styles.subtitle}>No reminders found</Text>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminder}
          keyExtractor={item => item._id}
          style={styles.reminderList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  reminderList: {
    flex: 1,
  },
  reminderCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reminderSubject: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  reminderDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  reminderTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  reminderDays: {
    fontSize: 12,
    color: '#888',
  },
});