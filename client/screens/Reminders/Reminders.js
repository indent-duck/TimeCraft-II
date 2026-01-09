import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function Reminders() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reminders</Text>
      <Text style={styles.subtitle}>Your reminders and notifications</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});