import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bn from './locales/bn.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@imansync_language';

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
