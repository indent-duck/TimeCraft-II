import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import Sidebar from '../../components/Sidebar';
import DashboardWidgets from '../../components/DashboardWidgets';

export default function Dashboard({ navigation }) {
  const { theme } = useTheme();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleNavigateToNote = (params) => {
    navigation.navigate('Notes', params);
    setSidebarVisible(false);
  };



  const dynamicStyles = StyleSheet.create({
    menuButton: {
      backgroundColor: theme.primary,
      padding: 8,
      borderRadius: 5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={dynamicStyles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>TimeCraft Dashboard</Text>
        <View style={styles.placeholder} />
      </View>
      
      <DashboardWidgets />

      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        onNavigateToNote={handleNavigateToNote}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },

});