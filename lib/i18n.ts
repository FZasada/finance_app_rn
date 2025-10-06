import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import de from './translations/de.json';
import en from './translations/en.json';
import nl from './translations/nl.json';
import pl from './translations/pl.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  pl: { translation: pl },
  nl: { translation: nl },
};

let deviceLanguage = 'en';
try {
  deviceLanguage = getLocales()[0]?.languageCode || 'en';
} catch (error) {
  console.warn('Failed to get device language, using English:', error);
}

// Initialize i18n properly
const initializeI18n = async () => {
  if (i18n.isInitialized) {
    return i18n;
  }

  try {
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: deviceLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        debug: false,
        react: {
          useSuspense: false, // Important for React Native
        },
      });
    
    console.log('i18n initialized successfully with language:', deviceLanguage);
    return i18n;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    return i18n;
  }
};

// Initialize immediately
initializeI18n();

export default i18n;