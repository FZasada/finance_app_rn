import CurrencyModal from '@/components/CurrencyModal';
import DailyReminderModal from '@/components/DailyReminderModal';
import DeleteDataModal from '@/components/DeleteDataModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
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
  
  // Use consistent colors matching the dashboard design
  const colors = {
    text: '#11181C',
    background: '#fff',
    tint: '#667eea',  // Match dashboard color
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
  
  // Get app version from expo constants
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const [showDeleteDataModal, setShowDeleteDataModal] = React.useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = React.useState(false);
  const [showDailyReminderModal, setShowDailyReminderModal] = React.useState(false);

  // Animation values for collapsible header
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [80, 44], // Minimaler kollabierter Header für beste UX
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0], // Großer Titel verschwindet
    extrapolate: 'clamp',
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1], // Kompakter Titel erscheint
    extrapolate: 'clamp',
  });
  
  // Dynamisches Padding für minimalen kollabierten Header
  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [10, 0], // Padding verschwindet im kollabierten Zustand
    extrapolate: 'clamp',
  });
  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [15, 0], // Padding verschwindet im kollabierten Zustand
    extrapolate: 'clamp',
  });

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

  const showThemeSelector = () => {
    Alert.alert(
      'Theme',
      'Theme selection',
      [
        { text: '☀️ Light', onPress: () => console.log('Light theme') },
        { text: '🌙 Dark', onPress: () => console.log('Dark theme') },
        { text: '📱 System', onPress: () => console.log('System theme') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const getCurrentThemeLabel = () => {
    return 'System';
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
  }) => {
    return (
      <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={onPress}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name={icon as any} size={20} color={colors.tint} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {rightElement || <Ionicons name="chevron-forward" size={16} color={colors.icon} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colors.tint }]} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={colors.tint} barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View style={[
          styles.header, 
          { 
            height: headerHeight,
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
            backgroundColor: colors.tint,
          }
        ]}>
          {/* Compact Title - erscheint beim Scrollen */}
          <Animated.Text style={[
            styles.compactTitle,
            { opacity: compactTitleOpacity }
          ]}>
            {t('settings.title')}
          </Animated.Text>
          
          {/* Header Content - verschwindet beim Scrollen */}
          <Animated.View style={[
            styles.headerContent,
            { opacity: titleOpacity }
          ]}>
            <Text style={styles.title}>
              {t('settings.title')}
            </Text>
          </Animated.View>
        </Animated.View>
        
        <Animated.ScrollView 
          style={[styles.content, { backgroundColor: colors.backgroundSecondary }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
        {/* User Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.account')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="person" size={32} color={colors.tint} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.email}</Text>
                <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                  {t('settings.user')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appSettings')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <SettingItem
              icon="language"
              title={t('settings.language')}
              subtitle={getCurrentLanguage()}
              onPress={showLanguageSelector}
            />
            
            <SettingItem
              icon="contrast"
              title={t('settings.theme')}
              subtitle={getCurrentThemeLabel()}
              onPress={showThemeSelector}
            />
          </View>
        </View>

        {/* Daily Reminders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.notifications')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <SettingItem
              icon="notifications"
              title={t('dailyReminder.title')}
              subtitle={t('dailyReminder.description')}
              onPress={() => setShowDailyReminderModal(true)}
            />
          </View>
        </View>

        {/* Household Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('household.title')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <SettingItem
              icon="people"
              title={t('household.manageHousehold')}
              subtitle={t('household.viewMembers')}
              onPress={() => router.push('/household')}
            />
          </View>
        </View>

        {/* Finance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.financeSettings')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.support')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
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
              subtitle={`Version ${appVersion}`}
              onPress={() => {
                Alert.alert('About', `Finance App v${appVersion}\nBuilt with React Native and Supabase`);
              }}
            />
          </View>
        </View>

        {/* Data Protection & Account Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.dataManagement')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <SettingItem
              icon="shield-checkmark"
              title="Datenschutz"
              subtitle="Datenschutzrichtlinie und Einstellungen"
              onPress={() => {
                Alert.alert('Datenschutz', 'Datenschutzrichtlinie wird hier angezeigt.');
              }}
            />
            
            <SettingItem
              icon="trash"
              title="Alle Daten löschen"
              subtitle="Alle Transaktionen und Daten unwiderruflich löschen"
              onPress={() => setShowDeleteDataModal(true)}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.error }]} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
          </TouchableOpacity>
        </View>
        </Animated.ScrollView>

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

      <DailyReminderModal
        visible={showDailyReminderModal}
        onClose={() => setShowDailyReminderModal(false)}
      />
      </View>
    </SafeAreaView>
  );
}

  const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
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
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
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
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteDataText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  compactTitle: {
    position: 'absolute',
    top: 0, // Startet ganz oben ohne Padding
    left: 0,
    right: 0,
    height: 44, // Exakt die minimale Header-Höhe
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 44, // Perfekte vertikale Zentrierung für 44px
    paddingTop: 0, // Kein zusätzliches Padding
    paddingBottom: 0,
    zIndex: 100, // Über anderen Inhalten
  },
  headerContent: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});