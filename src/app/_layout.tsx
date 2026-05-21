import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/lib/db';
import { setupNotificationChannels } from '@/lib/notifications';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { initStorage } from '@/utils/my-duas-storage';
import { StatusBar } from 'expo-status-bar';

import { initI18n } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nLoaded, setI18nLoaded] = React.useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    setupNotificationChannels();
    initI18n().then(() => setI18nLoaded(true));

    // First-open storage setup
    AsyncStorage.getItem('deen_my_duas_path').then(val => {
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
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nLoaded]);

  if (!(fontsLoaded || fontError) || !i18nLoaded) {
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
    <SQLiteProvider databaseName="islamic.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent={true} />
        <View style={[styles.background, { backgroundColor: colors.background }]}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
