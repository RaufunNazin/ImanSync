import React from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { useThemeColors } from '@/constants/theme';
import { Home, BookOpen, Book, Activity, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

const TabBarButton = (props: BottomTabBarButtonProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const { style, onPress, onLongPress, accessibilityState, accessibilityLabel, testID, children, ...rest } = props as any;

  return (
    <Pressable
      style={style}
      onPress={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        if (onPress) onPress(e);
      }}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      onLongPress={onLongPress}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...rest}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const activeColor = colors.accent;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.textSecondary + '20',
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          marginTop: 0,
        },
        tabBarLabel: ({ children }) => (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
            {children}
          </Text>
        ),
        tabBarButton: (props) => <TabBarButton {...props} />,
        lazy: true,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="tracker"
        options={{
          title: t('tracker.titleEn'),
          tabBarIcon: ({ color, focused }) => <Activity size={20} color={color} fill={focused ? color + '40' : 'none'} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t('quran.titleEn'),
          tabBarIcon: ({ color, focused }) => <BookOpen size={20} color={color} fill={focused ? color + '40' : 'none'} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.tabTitle', { defaultValue: 'Home' }),
          tabBarIcon: ({ color, focused }) => <Home size={20} color={color} fill={focused ? color + '40' : 'none'} />,
        }}
      />
      <Tabs.Screen
        name="dua"
        options={{
          title: t('dua.titleEn'),
          tabBarIcon: ({ color, focused }) => <Book size={20} color={color} fill={focused ? color + '40' : 'none'} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.titleEn'),
          tabBarIcon: ({ color, focused }) => <Settings size={20} color={color} fill={focused ? color + '40' : 'none'} />,
        }}
      />
    </Tabs>
  );
}
