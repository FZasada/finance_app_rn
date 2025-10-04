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

const deviceLanguage = getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;