import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import bn from './locales/bn.json';

const LANGUAGE_KEY = '@deenjourney_language';

const resources = {
  en: { translation: en },
  bn: { translation: bn }
};

export const initI18n = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    let defaultLang = 'bn';

    if (savedLanguage) {
      defaultLang = savedLanguage;
    } else {
      const systemLocales = Localization.getLocales();
      if (systemLocales && systemLocales.length > 0) {
        const sysLang = systemLocales[0].languageCode;
        if (sysLang === 'en') {
          defaultLang = 'en';
        }
      }
    }

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: defaultLang,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false // React already escapes by default
        }
      });
  } catch (error) {
    console.error('Error initializing i18n', error);
  }
};

export const setLanguage = async (lang: 'en' | 'bn') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
