import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Home, BookOpen, Map, Heart, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          textTransform: 'none',
          marginTop: 2,
        },
        lazy: true,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="tracker"
        options={{
          title: t('tracker.titleEn'),
          tabBarIcon: ({ color }: { color: string }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t('quran.titleEn'),
          tabBarIcon: ({ color }: { color: string }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.tabTitle', { defaultValue: 'Home' }),
          tabBarIcon: ({ color }: { color: string }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dua"
        options={{
          title: t('dua.titleEn'),
          tabBarIcon: ({ color }: { color: string }) => <Map size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.titleEn'),
          tabBarIcon: ({ color }: { color: string }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
