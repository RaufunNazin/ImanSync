import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useActiveColor } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react-native';
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
    <View style={{ flex: 1 }}>
      <ThemeCard intensity={40} style={[styles.wrapper, 
            (isMyDuas || id === 'bookmarks') && { borderColor: activeColor },
            isCustom && { borderColor: activeColor }
      ]}>
        <TouchableOpacity activeOpacity={1}
          style={[styles.card, isOneColumn && styles.cardOneColumn]}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={300}
        >
          <View style={[styles.content, isOneColumn && styles.contentOneColumn]}>
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

      {isPinned && (
        <View style={styles.pinBadge} pointerEvents="none">
          <Pin size={14} color={activeColor} fill={activeColor} />
        </View>
      )}
    </View>
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
    top: 0,
    right: 0,
    zIndex: 99,
    transform: [{ rotate: '45deg' }],
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
