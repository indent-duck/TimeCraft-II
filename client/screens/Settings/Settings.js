import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../../ThemeContext';

export default function Settings() {
  const { theme, currentTheme, setCurrentTheme } = useTheme();

  const themeOptions = [
    { key: 'blue', name: 'Blue', color: '#007AFF' },
    { key: 'green', name: 'Green', color: '#34C759' },
    { key: 'purple', name: 'Purple', color: '#AF52DE' },
    { key: 'orange', name: 'Orange', color: '#FF9500' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Color Theme</Text>
      
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.themeOption,
            currentTheme === option.key && { backgroundColor: '#f0f0f0' }
          ]}
          onPress={() => setCurrentTheme(option.key)}
        >
          <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
          <Text style={styles.themeName}>{option.name}</Text>
          {currentTheme === option.key && (
            <Text style={[styles.selected, { color: theme.primary }]}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
  },
  themeName: {
    fontSize: 16,
    flex: 1,
  },
  selected: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});