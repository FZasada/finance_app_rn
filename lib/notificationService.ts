import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'transaction_added' | 'transaction_updated' | 'transaction_deleted' | 'budget_exceeded' | 'daily_reminder';
  title: string;
  body: string;
  data?: any;
}

export interface DailyReminderSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
  messages: string[];
}

class NotificationService {
  private readonly expoPushToken: string | null = null;

  /**
   * Initialize notification service and register for push notifications
   */
  async initialize() {
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }

      // Get push token (simplified for development)
      console.log('Notification permissions granted');
      
      // Configure for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return 'notification_initialized';
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Register user's push token in the database
   */
  async registerPushToken(userId: string) {
    if (!this.expoPushToken) {
      await this.initialize();
    }

    if (!this.expoPushToken) {
      console.warn('No push token available');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: this.expoPushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error registering push token:', error);
      } else {
        console.log('Push token registered successfully');
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Send a local notification
   */
  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Send push notification to specific users
   */
  async sendPushNotification(userIds: string[], notification: NotificationData) {
    try {
      // Get push tokens for the users
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('push_token, platform')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching push tokens:', error);
        return;
      }

      if (!tokens || tokens.length === 0) {
        console.log('No push tokens found for users');
        return;
      }

      // Send notifications via Expo's push service
      const messages = tokens.map(token => ({
        to: token.push_token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ...notification.data,
        },
      }));

      // You would typically send this to Expo's push service
      // For now, we'll just log it
      console.log('Would send push notifications:', messages);
      
      // In a real implementation, you'd send this to your backend
      // which would then forward to Expo's push service
      
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Handle notification received while app is running
   */
  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Handle notification tapped by user
   */
  addNotificationResponseReceivedListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get the current push token
   */
  getPushToken() {
    return this.expoPushToken;
  }

  /**
   * Schedule daily reminder notifications
   */
  async scheduleDailyReminder(settings: DailyReminderSettings) {
    try {
      // Cancel existing daily reminders
      await this.cancelDailyReminder();

      if (!settings.enabled) {
        return;
      }

      // Parse time
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      // Get a random message for variety
      const message = settings.messages[Math.floor(Math.random() * settings.messages.length)];

      // Create trigger for daily notification
      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Finanz-Erinnerung',
          body: message,
          data: {
            type: 'daily_reminder',
          },
          sound: true,
        },
        trigger,
        identifier: 'daily_expense_reminder',
      });

      console.log('Daily reminder scheduled for', settings.time);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  /**
   * Cancel daily reminder notifications
   */
  async cancelDailyReminder() {
    try {
      await Notifications.cancelScheduledNotificationAsync('daily_expense_reminder');
      console.log('Daily reminder cancelled');
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
    }
  }

  /**
   * Get daily reminder settings from AsyncStorage
   */
  async getDailyReminderSettings(): Promise<DailyReminderSettings> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const settings = await AsyncStorage.getItem('daily_reminder_settings');
      
      if (settings) {
        return JSON.parse(settings);
      }

      // Default settings
      return {
        enabled: true,
        time: '12:00', // 12 PM CET default
        messages: [
          'Vergiss nicht, deine heutigen Ausgaben einzutragen! 📝',
          'Hast du heute schon alle Transaktionen erfasst? 💸',
          'Zeit für einen kurzen Finanz-Check! 🔍',
          'Denk daran, deine Einkäufe zu dokumentieren! 🛒',
          'Kurze Erinnerung: Ausgaben des Tages eintragen! ✨'
        ]
      };
    } catch (error) {
      console.error('Error getting daily reminder settings:', error);
      return {
        enabled: true,
        time: '12:00',
        messages: ['Zeit, deine Ausgaben einzutragen! 💰']
      };
    }
  }

  /**
   * Save daily reminder settings to AsyncStorage
   */
  async saveDailyReminderSettings(settings: DailyReminderSettings) {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('daily_reminder_settings', JSON.stringify(settings));
      
      // Reschedule with new settings
      await this.scheduleDailyReminder(settings);
      
      console.log('Daily reminder settings saved:', settings);
    } catch (error) {
      console.error('Error saving daily reminder settings:', error);
    }
  }
}

export const notificationService = new NotificationService();