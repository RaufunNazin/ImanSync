import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/lib/db';
import { setupNotificationChannels } from '@/lib/notifications';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Appearance } from 'react-native';
import { initStorage } from '@/utils/my-duas-storage';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';

import { initI18n } from '@/i18n';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import { useThemeStore } from '@/store/themeStore';
import SystemAnnouncer from '@/components/SystemAnnouncer';
import { usePreferencesStore } from '@/store/preferencesStore';
import { scheduleAllNotifications } from '@/services/notificationService';
import { AppState, AppStateStatus } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useThemeStore((s) => s.theme);
  const [i18nLoaded, setI18nLoaded] = React.useState(false);
  const [themeLoaded, setThemeLoaded] = React.useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
  });

  useEffect(() => {
    initI18n().then(() => setI18nLoaded(true));
    
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers'
    }).catch(e => console.log('Audio mode error:', e));

    // Load user preferences
    usePreferencesStore.getState().initialize().then(() => {
      scheduleAllNotifications(); // initial schedule
    });

    // Load user theme preference
    useThemeStore.getState().initialize().finally(() => {
      setThemeLoaded(true);
    });

    // Listen to app state changes to aggressively re-schedule
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        scheduleAllNotifications();
      }
    });

    // First-open storage setup
    AsyncStorage.getItem('imansync_my_duas_path').then(val => {
      if (!val) {
        // If not set up, prompt user
        Alert.alert(
          "Storage Permission Needed",
          "To permanently save your custom Duas and prevent them from being lost if you uninstall the app, we need to setup a folder.",
          [
            { text: "Ask Me Later", style: "cancel" },
            { 
              text: "Grant Access", 
              onPress: () => {
                initStorage().catch(e => console.log('Storage setup failed or cancelled', e));
              }
            }
          ]
        );
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nLoaded && themeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nLoaded, themeLoaded]);

  if (!(fontsLoaded || fontError) || !i18nLoaded || !themeLoaded) {
    return null;
  }

  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme || 'light'];

  const navTheme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colors.background }
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="islamic.db" onInit={migrateDbIfNeeded}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
          <View style={[styles.background, { backgroundColor: colors.background }]}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <AudioPlayerBar />
            <SystemAnnouncer />
          </View>
        </ThemeProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
