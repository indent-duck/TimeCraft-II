import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Dashboard, Schedule, Reminders, Settings, Notes } from './screens';
import { ThemeProvider, useTheme } from './ThemeContext';
import NotificationService from './services/NotificationService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={Dashboard} />
      <Stack.Screen name="Notes" component={Notes} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState('Schedule');
  const [noteParams, setNoteParams] = useState(null);

  const navigateToNotes = (params) => {
    setNoteParams(params);
    setCurrentScreen('Notes');
  };

  const navigateBack = () => {
    setCurrentScreen('Schedule');
    setNoteParams(null);
  };

  if (currentScreen === 'Notes') {
    return (
      <Notes route={{ params: noteParams }} navigation={{ goBack: navigateBack }} />
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Schedule"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            
            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Schedule') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Reminders') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerStatusBarHeight: 44,
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen 
          name="Schedule" 
          children={() => <Schedule navigation={{ navigate: navigateToNotes }} />}
        />
        <Tab.Screen name="Reminders" component={Reminders} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Request notification permissions on app startup
    NotificationService.requestPermissions();
  }, []);

  return (
    <ThemeProvider>
      <StatusBar style="light" backgroundColor="#000" />
      <AppNavigator />
    </ThemeProvider>
  );
}