import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

interface PageHeaderProps {
  titleEn: string;
  titleAr?: string; // Kept for backwards compatibility but not rendered
  /** Show a muted chevron-left that routes back to home */
  showBack?: boolean;
  /** Optional small subtitle shown below the English title (e.g. Hijri date) */
  subtitle?: string;
  /** Custom back action */
  onBack?: () => void;
  /** Optional icon to show next to the title */
  icon?: any;
  /** Element to render on the far right (e.g., action icons) */
  rightElement?: React.ReactNode;
}

export default function PageHeader({
  titleEn,

  showBack = false,
  subtitle,
  onBack,
  icon,
  rightElement,
}: PageHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={[styles.header, { borderBottomColor: colors.textSecondary + '20', borderBottomWidth: 1 }]}>
      {/* Back button — only rendered when needed, no placeholder slot */}
      {showBack && (
        <TouchableOpacity
          onPress={onBack ? onBack : () => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* English title left */}
      <View style={styles.titleEnWrapper}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <Image source={icon} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 6 }} />
          )}
          <Text style={[styles.titleEn, { color: colors.text }]} numberOfLines={1}>
            {titleEn}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Optional right element */}
      {rightElement ? rightElement : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    height: 51,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.four,
  },
  backBtn: {
    marginRight: 8,
    padding: 2,
  },
  titleEnWrapper: {
    flex: 1,
  },
  titleEn: {
    fontFamily: Fonts.outfit,
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  titleAr: {
    fontFamily: Fonts.arabic,
    fontSize: 17,
    lineHeight: 22,
    minHeight: 22,
    textAlign: 'right',
  },
});
