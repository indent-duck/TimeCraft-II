import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.setupNotificationListeners();
  }

  setupNotificationListeners() {
    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TimeCraft Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return false;
      }
      console.log('Notification permissions granted');
      return true;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  }

  async scheduleReminderNotification(title, body, triggerDate) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    // Check if the trigger date is in the past
    if (triggerDate <= new Date()) {
      console.log('Trigger date is in the past, scheduling for 10 seconds from now for testing');
      triggerDate = new Date(Date.now() + 10000); // 10 seconds from now
    }

    try {
      console.log('Scheduling notification:', { title, body, triggerDate });
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          icon: './assets/icon.png',
          color: '#007AFF',
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        },
      });
      
      console.log('Notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      // Fallback for Expo Go or testing
      Alert.alert(
        'Notification Scheduled',
        `${title}\n${body}\nScheduled for: ${triggerDate.toLocaleString()}`,
        [{ text: 'OK' }]
      );
      return 'expo-go-fallback';
    }
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('All scheduled notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export default new NotificationService();