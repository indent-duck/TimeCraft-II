import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function TimePicker({ selectedTime, onTimeSelect }) {
  const [hour, setHour] = useState(selectedTime ? parseInt(selectedTime.split(':')[0]) : 12);
  const [minute, setMinute] = useState(selectedTime ? parseInt(selectedTime.split(':')[1].split(' ')[0]) : 0);
  const [ampm, setAmpm] = useState(selectedTime ? selectedTime.split(' ')[1] : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (newHour, newMinute, newAmpm) => {
    const formattedTime = `${newHour}:${newMinute.toString().padStart(2, '0')} ${newAmpm}`;
    onTimeSelect(formattedTime);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <View style={styles.scrollContainer}>
          <Text style={styles.label}>Hour</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {hours.map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.timeItem, hour === h && styles.selectedItem]}
                onPress={() => {
                  setHour(h);
                  handleTimeChange(h, minute, ampm);
                }}
              >
                <Text style={[styles.timeText, hour === h && styles.selectedText]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.scrollContainer}>
          <Text style={styles.label}>Min</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {minutes.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.timeItem, minute === m && styles.selectedItem]}
                onPress={() => {
                  setMinute(m);
                  handleTimeChange(hour, m, ampm);
                }}
              >
                <Text style={[styles.timeText, minute === m && styles.selectedText]}>
                  {m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.ampmContainer}>
          <Text style={styles.label}>AM/PM</Text>
          <TouchableOpacity
            style={[styles.ampmButton, ampm === 'AM' && styles.selectedItem]}
            onPress={() => {
              setAmpm('AM');
              handleTimeChange(hour, minute, 'AM');
            }}
          >
            <Text style={[styles.timeText, ampm === 'AM' && styles.selectedText]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ampmButton, ampm === 'PM' && styles.selectedItem]}
            onPress={() => {
              setAmpm('PM');
              handleTimeChange(hour, minute, 'PM');
            }}
          >
            <Text style={[styles.timeText, ampm === 'PM' && styles.selectedText]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  scrollView: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  timeItem: {
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  timeText: {
    fontSize: 16,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  ampmContainer: {
    flex: 0.8,
    marginHorizontal: 5,
  },
  ampmButton: {
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 5,
  },
});