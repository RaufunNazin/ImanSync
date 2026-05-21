import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View, Image } from 'react-native';

interface PageHeaderProps {
  titleEn: string;
  titleAr: string;
  /** Show a muted chevron-left that routes back to home */
  showBack?: boolean;
  /** Optional small subtitle shown below the English title (e.g. Hijri date) */
  subtitle?: string;
  /** Custom back action */
  onBack?: () => void;
  /** Optional icon to show next to the title */
  icon?: any;
}

export default function PageHeader({
  titleEn,
  titleAr,
  showBack = false,
  subtitle,
  onBack,
  icon,
}: PageHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme ?? 'light'];
  const router = useRouter();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
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

      {/* Arabic title right */}
      <Text style={[styles.titleAr, { color: colors.textSecondary }]} numberOfLines={1}>
        {titleAr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontFamily: Fonts.outfit,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'right',
  },
});
