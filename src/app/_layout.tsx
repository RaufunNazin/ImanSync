import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, SplashScreen } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Colors } from '@/constants/theme';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/lib/db';
import { setupNotificationChannels } from '@/lib/notifications';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';

import { initStorageOnStartup } from '@/utils/my-duas-storage';
import { StatusBar, setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
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

    // Fix #3: only re-schedule when the calendar date actually changes,
    // not on every app-foreground event (which fires many times per day).
    let lastScheduledDate = '';
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const today = new Date().toDateString();
        if (today !== lastScheduledDate) {
          lastScheduledDate = today;
          scheduleAllNotifications();
        }
      }
    });

    // Silently initialize storage on startup.
    // No blocking prompts — internal mode is automatic; permanent is opt-in via Settings.
    initStorageOnStartup().catch(e => console.log('Storage startup check failed', e));

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nLoaded && themeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nLoaded, themeLoaded]);



  const colors = useMemo(
    () => Colors[colorScheme === 'unspecified' ? 'light' : colorScheme || 'light'],
    [colorScheme]
  );

  // ── Imperative system bar sync ─────────────────────────────────────────────
  // Uses expo-status-bar's OWN imperative API (same module as <StatusBar>)
  // to avoid the conflict where RNStatusBar writes are overridden by
  // expo-status-bar re-applying its internal stack on navigation events.
  // Also attaches an AppState listener to re-apply on every app foreground,
  // countering Android's native window-flag reset on Activity focus change.
  useEffect(() => {
    const isDark = colorScheme === 'dark';

    const applyBars = () => {
      // expo-status-bar imperative — works on Android + iOS
      setStatusBarStyle(isDark ? 'light' : 'dark', true);
      
      // Sync the native root view background color to prevent white edge flashing during navigation
      SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});

      if (Platform.OS === 'android') {
        setStatusBarBackgroundColor(colors.background, true);
        // Bottom navigation bar — guarded: native module may not exist
        // on APKs built before expo-navigation-bar was added.
        try {
          NavigationBar.setBackgroundColorAsync(colors.background);
          NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        } catch (_) {}
      }
    };

    applyBars();

    // Re-apply every time app comes to foreground so Android can't
    // override our style via its windowLightStatusBar window flag reset.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') applyBars();
    });

    return () => sub.remove();
  }, [colorScheme, colors.background]);
  // ──────────────────────────────────────────────────────────────────────────

  const [prevColor, setPrevColor] = useState(colors.background);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    if (isMounted.current) {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      const timer = setTimeout(() => {
        setPrevColor(colors.background);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      isMounted.current = true;
      setPrevColor(colors.background);
    }
  }, [colors.background]);

  const navTheme = useMemo(() => colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colors.background }
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background }
  }, [colorScheme, colors.background]);

  if (!(fontsLoaded || fontError) || !i18nLoaded || !themeLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="islamic.db" onInit={migrateDbIfNeeded}>
        <ThemeProvider value={navTheme}>
          <StatusBar
            style={colorScheme === 'dark' ? 'light' : 'dark'}
            backgroundColor={colors.background}
            animated={true}
          />
          <View style={[styles.background, { backgroundColor: colors.background }]}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="quran-search" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="dua-search" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <AudioPlayerBar />
            <SystemAnnouncer />

            <Animated.View 
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: prevColor, 
                  opacity: fadeAnim,
                  zIndex: 9999 
                }
              ]} 
            />
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
