import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Home, BookOpen, Map, Heart, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();

  return (
    <SwipeableTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarIndicatorStyle: { display: 'none' }, // Remove the top tab underline
        swipeEnabled: true, // Enable swipe between tabs
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarItemStyle: {
          padding: 0,
          margin: 0,
          flex: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          textTransform: 'none', // Prevents ALL CAPS default
          margin: 0,
          marginTop: 4,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
      }}
    >
      <SwipeableTabs.Screen
        name="tracker"
        options={{
          title: t('tracker.titleEn'),
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <SwipeableTabs.Screen
        name="quran"
        options={{
          title: t('quran.titleEn'),
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <SwipeableTabs.Screen
        name="index"
        options={{
          title: t('home.titleEn'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <SwipeableTabs.Screen
        name="dua"
        options={{
          title: t('dua.titleEn'),
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
        }}
      />
      <SwipeableTabs.Screen
        name="settings"
        options={{
          title: t('settings.titleEn'),
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </SwipeableTabs>
  );
}
