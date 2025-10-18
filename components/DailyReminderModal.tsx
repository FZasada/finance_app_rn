import { notificationService, type DailyReminderSettings } from '@/lib/notificationService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DailyReminderModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function DailyReminderModal({ visible, onClose }: DailyReminderModalProps) {
  const { t } = useTranslation();
  
  // Consistent colors matching the app design
  const colors = {
    text: '#11181C',
    background: '#fff',
    tint: '#667eea',
    icon: '#687076',
    border: '#E2E8F0',
    textSecondary: '#64748B',
    surface: '#ffffff',
    shadow: '#64748B',
    surfaceSecondary: '#F2F2F7',
    backgroundSecondary: '#F8F9FA',
    error: '#FF3B30',
    iconSecondary: '#8E8E93'
  };
  
  const [settings, setSettings] = useState<DailyReminderSettings>({
    enabled: true,  // Default to enabled
    time: '12:00',  // Default to 12:00 CET
    messages: []
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

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
    // On Android, always hide the picker after selection
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
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

  // Use consistent app colors instead of dynamic ones
  const backgroundColor = colors.backgroundSecondary;
  const cardBackground = colors.surface;
  const borderColor = colors.border;
  const secondaryTextColor = colors.textSecondary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('dailyReminder.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <Text style={[styles.description, { color: secondaryTextColor }]}>
            {t('dailyReminder.description')}
          </Text>

          {/* Enable/Disable Switch */}
          <View style={[styles.settingRow, { backgroundColor: cardBackground }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color={colors.tint} />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('dailyReminder.enableReminders')}
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
            <View style={[styles.settingRow, { backgroundColor: cardBackground }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="time" size={24} color={colors.tint} />
                <View>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {t('dailyReminder.reminderTime')}
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.tint }]}>
                    {settings.time}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.timeButton, { borderColor: colors.tint }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.timeButtonText]}>
                  {t('dailyReminder.changeTime')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showTimePicker && (
            <View style={styles.timePickerContainer}>
              <Text style={[styles.timePickerTitle, { color: colors.text }]}>
                {t('dailyReminder.selectTime')}
              </Text>
              <DateTimePicker
                value={getTimeDate()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={changeTime}
                style={styles.timePicker}
                textColor={colors.text}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: colors.tint }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.doneButtonText}>{t('dailyReminder.done')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#11181C',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
    color: '#64748B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#11181C',
  },
  timeValue: {
    fontSize: 14,
    marginLeft: 12,
    marginTop: 2,
    color: '#64748B',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 8,
    backgroundColor: '#667eea',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  timePicker: {
    backgroundColor: '#fff',
    width: '100%',
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});