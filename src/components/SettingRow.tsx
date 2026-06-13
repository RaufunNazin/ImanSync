import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';

export interface SettingRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  value?: any;
  type?: 'navigate' | 'toggle' | 'loading';
  onPress?: (val?: any) => void;
  isLast?: boolean;
  highlight?: boolean;
}

export default function SettingRow({ icon: Icon, title, value, type = 'navigate', onPress, isLast, highlight }: SettingRowProps) {
  const colors = useThemeColors();
  const activeColor = useActiveColor();

  return (
    <TouchableOpacity activeOpacity={1}
      style={[
        styles.settingRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        highlight && { backgroundColor: activeColor + '20', borderRadius: 12, paddingHorizontal: Spacing.three, marginHorizontal: -Spacing.three }
      ]}
      onPress={() => {
        if (type === 'toggle') {
          if (onPress) onPress(!value);
        } else if (onPress) {
          onPress();
        }
      }}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.textSecondary + '15' }]}>
          <Icon size={20} color={colors.text} />
        </View>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>

      {type === 'navigate' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: value ? 1 : undefined, flexShrink: 1, justifyContent: 'flex-end', paddingLeft: value ? 10 : 0 }}>
          {!!value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      ) : type === 'toggle' ? (
        <Switch
          value={!!value}
          onValueChange={(val) => {
            if (onPress) onPress(val);
          }}
          trackColor={{ false: colors.border, true: activeColor }}
          thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
        />
      ) : type === 'loading' ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  settingValue: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginRight: 4,
    textAlign: 'right',
  },
});
