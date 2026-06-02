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

  try {
    const quranSettingsRaw = await AsyncStorage.getItem('imansync_quran_settings');
    const duaSettingsRaw = await AsyncStorage.getItem('imansync_dua_settings');

    const quranSettings = quranSettingsRaw ? JSON.parse(quranSettingsRaw) : {};
    const duaSettings = duaSettingsRaw ? JSON.parse(duaSettingsRaw) : {};

    if (lang === 'bn') {
      quranSettings.showBangla = true;
      quranSettings.showEnglish = false;
      quranSettings.showEnglishTranslit = false;

      duaSettings.showBnTrans = true;
      duaSettings.showBnTranslit = true;
      duaSettings.showEnTrans = false;
      duaSettings.showEnTranslit = false;
    } else {
      quranSettings.showBangla = false;
      quranSettings.showEnglish = true;
      quranSettings.showEnglishTranslit = true;

      duaSettings.showBnTrans = false;
      duaSettings.showBnTranslit = false;
      duaSettings.showEnTrans = true;
      duaSettings.showEnTranslit = true;
    }

    await AsyncStorage.setItem('imansync_quran_settings', JSON.stringify(quranSettings));
    await AsyncStorage.setItem('imansync_dua_settings', JSON.stringify(duaSettings));
  } catch (e) {
    console.error('Failed to sync reading settings on language change', e);
  }
};

export default i18n;
