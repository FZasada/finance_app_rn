import { useTheme } from '@/contexts/ThemeContext';
import { notificationService, type DailyReminderSettings } from '@/lib/notificationService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DailyReminderSettingsComponentProps {
  readonly onSettingsChange?: (settings: DailyReminderSettings) => void;
}

export default function DailyReminderSettingsComponent({ onSettingsChange }: DailyReminderSettingsComponentProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [settings, setSettings] = useState<DailyReminderSettings>({
    enabled: false,
    time: '20:00',
    messages: []
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await notificationService.getDailyReminderSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const saveSettings = async (newSettings: DailyReminderSettings) => {
    try {
      // Use translated messages if available
      const translatedMessages = t('dailyReminder.defaultMessages', { returnObjects: true }) as string[];
      const settingsWithTranslatedMessages = {
        ...newSettings,
        messages: Array.isArray(translatedMessages) ? translatedMessages : newSettings.messages
      };

      await notificationService.saveDailyReminderSettings(settingsWithTranslatedMessages);
      setSettings(settingsWithTranslatedMessages);
      onSettingsChange?.(settingsWithTranslatedMessages);
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      Alert.alert(
        t('common.error'),
        'Failed to save reminder settings. Please try again.'
      );
    }
  };

  const toggleReminders = async (enabled: boolean) => {
    if (enabled) {
      // Request notification permissions when enabling
      const status = await notificationService.initialize();
      if (status !== 'notification_initialized') {
        Alert.alert(
          t('common.error'),
          'Please enable notifications in your device settings to use daily reminders.'
        );
        return;
      }
    }

    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);
  };

  const changeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().substring(0, 5); // HH:MM format
      const newSettings = { ...settings, time: timeString };
      saveSettings(newSettings);
    }
  };

  const getTimeDate = () => {
    const [hours, minutes] = settings.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Calculate theme-appropriate colors
  const cardBackground = isDark ? '#1C1C1E' : '#F2F2F7';
  const borderColor = isDark ? '#3A3A3C' : '#E5E5EA';
  const secondaryTextColor = isDark ? '#8E8E93' : '#6D6D70';

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, shadowColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="notifications" size={24} color={colors.tint} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('dailyReminder.title')}
          </Text>
          <Text style={[styles.description, { color: secondaryTextColor }]}>
            {t('dailyReminder.description')}
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={toggleReminders}
          trackColor={{ false: borderColor, true: colors.tint + '40' }}
          thumbColor={settings.enabled ? colors.tint : secondaryTextColor}
        />
      </View>

      {/* Time Selection */}
      {settings.enabled && (
        <View style={[styles.timeSection, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.timeButton, { borderColor: borderColor }]}
            onPress={() => setShowTimePicker(true)}
          >
            <View style={styles.timeButtonContent}>
              <Ionicons name="time" size={20} color={secondaryTextColor} />
              <Text style={[styles.timeLabel, { color: secondaryTextColor }]}>
                {t('dailyReminder.reminderTime')}
              </Text>
            </View>
            <Text style={[styles.timeValue, { color: colors.text }]}>
              {settings.time}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={getTimeDate()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={changeTime}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
  },
  timeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});