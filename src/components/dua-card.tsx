import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useActiveColor } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react-native';
import { formatNumber } from '@/utils/formatNumber';

interface DuaCardProps {
  id: string;
  name: string;
  description: string;
  count?: number;
  isPinned?: boolean;
  isMyDuas?: boolean;
  isCustom?: boolean;
  isOneColumn?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  colors: any;
}

const DuaCard = React.memo(function DuaCard({
  id,
  name,
  count,
  isPinned,
  isMyDuas,
  isCustom,
  isOneColumn,
  onPress,
  onLongPress,
  colors,
}: DuaCardProps) {
  const { t, i18n } = useTranslation();
  const activeColor = useActiveColor();
  
  return (
    <ThemeCard intensity={40} style={[styles.wrapper, 
          (isMyDuas || id === 'bookmarks') && { borderColor: colors.accent },
          isCustom && { borderColor: activeColor }
    ]}>
      <TouchableOpacity activeOpacity={1}
        style={[styles.card, isOneColumn && styles.cardOneColumn]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
      >
          {isPinned && !isOneColumn && (
            <View style={styles.pinBadge}>
              <Bookmark size={14} color={isCustom ? activeColor : colors.accent} fill={isCustom ? activeColor : colors.accent} />
            </View>
          )}

          <View style={[styles.content, isOneColumn && styles.contentOneColumn]}>
            {isOneColumn && isPinned && (
              <Bookmark size={18} color={colors.accent} fill={colors.accent} style={{ marginRight: Spacing.two }} />
            )}
            <Text style={[styles.name, isOneColumn && styles.nameOneColumn, { color: colors.text }]} numberOfLines={2}>
              {name}
            </Text>
            {isOneColumn ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                {count !== undefined && (
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>{t('dua.duaCount', { count: formatNumber(count, i18n.language) })}</Text>
                )}
              </View>
            ) : (
              count !== undefined && (
                <Text style={[styles.countText, { color: colors.textSecondary }]}>{t('dua.duaCount', { count: formatNumber(count, i18n.language) })}</Text>
              )
            )}
          </View>
        </TouchableOpacity>
    </ThemeCard>
  );
});

export default DuaCard;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
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
  cardOneColumn: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
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
  contentOneColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    width: '100%',
  },
  name: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nameOneColumn: {
    textAlign: 'left',
    flex: 1,
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
