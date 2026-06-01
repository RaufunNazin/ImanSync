import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Bookmark, FolderOpen, Star } from 'lucide-react-native';
import { formatNumber } from '@/utils/formatNumber';

interface DuaCardProps {
  id: string;
  name: string;
  description: string;
  count?: number;
  isPinned?: boolean;
  isMyDuas?: boolean;
  isCustom?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  colors: any;
}

export default function DuaCard({
  id,
  name,
  description,
  count,
  isPinned,
  isMyDuas,
  isCustom,
  onPress,
  onLongPress,
  colors,
}: DuaCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      <BlurView intensity={40} tint={colors.glassTint as any} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={[
          styles.card,
          (isMyDuas || id === 'bookmarks') && { backgroundColor: colors.accent + '1A' },
          isCustom && { backgroundColor: colors.highlight + '1A' }
        ]}
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
      >
          {isPinned && (
            <View style={styles.pinBadge}>
              <Bookmark size={14} color={isCustom ? colors.highlight : colors.accent} fill={isCustom ? colors.highlight : colors.accent} />
            </View>
          )}

          <View style={styles.content}>
            <Text style={[styles.name, { color: isCustom ? colors.highlight : colors.accent }]} numberOfLines={2}>
              {name}
            </Text>
            {count !== undefined && (
              <Text style={[styles.countText, { color: colors.textSecondary }]}>{t('dua.duaCount', { count: formatNumber(count, i18n.language) })}</Text>
            )}
          </View>


        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    flex: 1,
  },
  card: {
    padding: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  pinBadge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 2,
    paddingHorizontal: Spacing.two,
  },
  name: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
  },

  bgIconBox: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    zIndex: 1,
    padding: Spacing.three,
  },

  countText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginTop: 2,
  },
});
