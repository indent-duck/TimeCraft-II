import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Dashboard, Schedule, Reminders, Settings } from './screens';
import { ThemeProvider, useTheme } from './ThemeContext';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
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
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Schedule" component={Schedule} />
        <Tab.Screen name="Reminders" component={Reminders} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}