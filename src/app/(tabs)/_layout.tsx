import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Home, BookOpen, Map, Heart, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarBackground: () => (
          <BlurView intensity={80} tint={colors.glassTint as any} style={{ flex: 1 }} />
        ),
        tabBarStyle: {
          backgroundColor: Platform.OS === 'android' ? colors.background : 'transparent',
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        },
        tabBarLabelStyle: {
          paddingBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.titleEn'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t('quran.titleEn'),
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: t('tracker.titleEn'),
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dua"
        options={{
          title: t('dua.titleEn'),
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.titleEn'),
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
