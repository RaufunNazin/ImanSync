import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WidgetPreview } from 'react-native-android-widget';
import PageHeader from '@/components/page-header';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';

import { TimelineWidget } from '@/widgets/android/TimelineWidget';
import { DateWidget } from '@/widgets/android/DateWidget';
import { SpecialTimesWidget } from '@/widgets/android/SpecialTimesWidget';
import { TrackerWidget } from '@/widgets/android/TrackerWidget';
import { getWidgetData } from '@/widgets/android/WidgetDataService';

export default function WidgetsScreen() {
  const colors = useThemeColors();
  const { i18n } = useTranslation();
  
  const [widgetData] = useState(() => getWidgetData(i18n.language));

  const renderWidgetSection = (title: string, widgetComponent: React.ReactNode, width: number, height: number) => (
    <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      
      <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
         {Platform.OS === 'android' ? (
           <WidgetPreview
              renderWidget={() => widgetComponent as any}
              width={width}
              height={height}
           />
         ) : (
           <Text style={{ color: colors.textSecondary }}>Android Only</Text>
         )}
      </View>

    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn="Manage Widgets" 
        titleAr="أدوات" 
        showBack 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
          Preview the available widgets. Long press on your home screen to add them.
        </Text>

        {renderWidgetSection('Prayer Timeline', <TimelineWidget data={widgetData} />, 320, 100)}
        {renderWidgetSection('Special Times', <SpecialTimesWidget data={widgetData} activeSpecialTimeId={null} />, 320, 100)}
        {renderWidgetSection('Daily Tracker', <TrackerWidget data={widgetData} />, 320, 80)}
        {renderWidgetSection('Islamic Date', <DateWidget data={widgetData} />, 100, 100)}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four, gap: Spacing.four },
  headerDesc: { fontFamily: Fonts.outfit, fontSize: 14, marginBottom: Spacing.two, lineHeight: 20 },
  section: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
  },
  sectionTitle: { fontFamily: Fonts.outfit, fontSize: 18, fontWeight: '600' },
  previewContainer: {
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  pinBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  }
});
