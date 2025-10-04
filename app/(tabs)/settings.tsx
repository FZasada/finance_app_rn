import CurrencyModal from '@/components/CurrencyModal';
import DeleteDataModal from '@/components/DeleteDataModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const colorScheme = useColorScheme();

  const [darkMode, setDarkMode] = React.useState(colorScheme === 'dark');
  const [showDeleteDataModal, setShowDeleteDataModal] = React.useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = React.useState(false);

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (_error) {
              Alert.alert(t('common.error'), 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const showLanguageSelector = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.selectLanguage'),
      [
        ...LANGUAGES.map(lang => ({
          text: `${lang.flag} ${lang.name}`,
          onPress: () => changeLanguage(lang.code),
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const getCurrentLanguage = () => {
    const currentLang = LANGUAGES.find(lang => lang.code === i18n.language);
    return currentLang ? `${currentLang.flag} ${currentLang.name}` : 'Unknown';
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement || <Ionicons name="chevron-forward" size={16} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#007AFF" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.email}</Text>
                <Text style={styles.userRole}>
                  {t('settings.user')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
          <View style={styles.card}>
            <SettingItem
              icon="language"
              title={t('settings.language')}
              subtitle={getCurrentLanguage()}
              onPress={showLanguageSelector}
            />
            
            <SettingItem
              icon="moon"
              title={t('settings.darkMode')}
              subtitle={darkMode ? t('common.enabled') : t('common.disabled')}
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              }
            />
            
            <SettingItem
              icon="notifications"
              title={t('settings.notifications')}
              subtitle={t('settings.notificationSettings')}
              onPress={() => {
                Alert.alert('Coming Soon', 'Notification settings will be available in the next update.');
              }}
            />
          </View>
        </View>

        {/* Finance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.financeSettings')}</Text>
          <View style={styles.card}>
            <SettingItem
              icon="card"
              title={t('settings.defaultCurrency')}
              subtitle={`${currency.flag} ${currency.name} (${currency.symbol})`}
              onPress={() => setShowCurrencyModal(true)}
            />
            
            <SettingItem
              icon="calendar"
              title={t('settings.budgetPeriod')}
              subtitle={t('settings.monthly')}
              onPress={() => {
                Alert.alert('Coming Soon', 'Budget period settings will be available in the next update.');
              }}
            />
            
            <SettingItem
              icon="analytics"
              title={t('settings.categories')}
              subtitle={t('settings.manageCategories')}
              onPress={() => {
                Alert.alert('Coming Soon', 'Category management will be available in the next update.');
              }}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          <View style={styles.card}>
            <SettingItem
              icon="help-circle"
              title={t('settings.help')}
              subtitle={t('settings.helpCenter')}
              onPress={() => {
                Alert.alert('Help', 'For support, please contact us at support@financeapp.com');
              }}
            />
            
            <SettingItem
              icon="document-text"
              title={t('settings.privacy')}
              subtitle={t('settings.privacyPolicy')}
              onPress={() => {
                Alert.alert('Privacy Policy', 'Privacy policy information will be displayed here.');
              }}
            />
            
            <SettingItem
              icon="information-circle"
              title={t('settings.about')}
              subtitle="Version 1.0.0"
              onPress={() => {
                Alert.alert('About', 'Finance App v1.0.0\nBuilt with React Native and Supabase');
              }}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteDataButton} 
            onPress={() => setShowDeleteDataModal(true)}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.deleteDataText}>{t('settings.dataManagement')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteDataModal
        visible={showDeleteDataModal}
        onClose={() => setShowDeleteDataModal(false)}
      />

      <CurrencyModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        onCurrencyChanged={setCurrency}
        currentCurrency={currency}
      />
    </SafeAreaView>
  );
}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  deleteDataText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});