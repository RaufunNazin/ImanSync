import PageHeader from '@/components/page-header';
import React, { useEffect, useState, useMemo } from 'react';
import { Fonts, Spacing, useThemeColors, useActiveColor, useThemeStyles } from '@/constants/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useThemeStore } from '@/store/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatNumber } from '@/utils/formatNumber';
import OptionsModal from '@/components/OptionsModal';
import ThemeCard from '@/components/ThemeCard';
import SpecialTimeCard from '@/components/SpecialTimeCard';
import { getBanglaDate } from '@/utils/banglaCalendar';
import { generateLocalCalendar } from '@/utils/localCalendar';
import { Switch } from 'react-native';


export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();
  const activeColor = useActiveColor();
  const prefs = usePreferencesStore();
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = Math.floor((screenWidth - Spacing.four * 2 - 6) / 7);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const method = prefs.calcMethod || 1;
    const madhab = prefs.madhab || 0;
    const lat = prefs.location?.latitude || 23.8103;
    const lon = prefs.location?.longitude || 90.4125;
    return generateLocalCalendar(year, month, lat, lon, method, madhab);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const method = prefs.calcMethod || 1;
    const madhab = prefs.madhab || 0;
    const lat = prefs.location?.latitude || 23.8103;
    const lon = prefs.location?.longitude || 90.4125;
    
    setCalendarData(generateLocalCalendar(year, month, lat, lon, method, madhab));
  }, [currentDate.getFullYear(), currentDate.getMonth(), prefs.calcMethod, prefs.madhab, prefs.manualCity, prefs.location]);

  // Set default selection to today if in current month, else 1st of month
  useEffect(() => {
    if (calendarData.length > 0) {
      const today = new Date();
      if (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth()) {
        const todayStr = String(today.getDate()).padStart(2, '0');
        const match = calendarData.find(d => d.date.gregorian.day === todayStr);
        if (match) setSelectedDate(match.date.gregorian.date);
        else setSelectedDate(calendarData[0].date.gregorian.date);
      } else {
        setSelectedDate(calendarData[0].date.gregorian.date);
      }
    }
  }, [calendarData]);

  const changeMonth = (diff: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + diff);
    setCurrentDate(nextDate);
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDate || calendarData.length === 0) return null;
    return calendarData.find(d => d.date.gregorian.date === selectedDate);
  }, [selectedDate, calendarData]);

  const calendarGrid = useMemo(() => {
    if (calendarData.length === 0) return null;

    const firstDayStr = calendarData[0].date.gregorian.date; // DD-MM-YYYY
    const parts = firstDayStr.split('-');
    const firstDayDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const startDayOfWeek = firstDayDate.getDay(); // 0 is Sunday

    const cells = [];
    
    // Header row
    const headerCells = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
      <View key={`header-${day}`} style={[styles.gridCellHeader, { width: cellWidth }]}>
        <Text style={[styles.gridCellHeaderText, { color: colors.textSecondary }]}>{t(`calendar.${day}`)}</Text>
      </View>
    ));

    // Empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={[styles.gridCell, { width: cellWidth }]} />);
    }

    const getAdjustedHijriDate = (idx: number, offset: number) => {
      const targetIdx = idx + offset;
      if (targetIdx >= 0 && targetIdx < calendarData.length) {
        return calendarData[targetIdx].date.hijri;
      }
      const fallbackDay = parseInt(calendarData[idx].date.hijri.day, 10) + offset;
      return { ...calendarData[idx].date.hijri, day: fallbackDay.toString() };
    };

    // Days
    calendarData.forEach((dayData, idx) => {
      const isSelected = selectedDate === dayData.date.gregorian.date;
      const today = new Date();
      const isToday = dayData.date.gregorian.day === String(today.getDate()).padStart(2, '0') &&
                      currentDate.getMonth() === today.getMonth() &&
                      currentDate.getFullYear() === today.getFullYear();
      
      const adjustedHijri = getAdjustedHijriDate(idx, prefs.hijriOffset || 0);
      const hasEvents = adjustedHijri.holidays && adjustedHijri.holidays.length > 0;

      const bDate = getBanglaDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(dayData.date.gregorian.day, 10)),
        prefs.banglaOffset || 0
      );

      cells.push(
        <TouchableOpacity activeOpacity={1}
          key={`day-${idx}`}
          style={[
            styles.gridCell,
            { 
              width: cellWidth,
              backgroundColor: isSelected ? colors.backgroundSelected : 'transparent',
              borderColor: isSelected ? activeColor : (isToday ? colors.accent : 'transparent'),
              borderWidth: isSelected ? 1 : (isToday ? 1 : 0),
            }
          ]}
          onPress={() => setSelectedDate(dayData.date.gregorian.date)}
        >
          <Text style={[styles.gregorianText, { color: isSelected ? activeColor : colors.text }]}>
            {formatNumber(parseInt(dayData.date.gregorian.day).toString(), i18n.language)}
          </Text>

          {prefs.showBanglaCalendar ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4, marginTop: 2 }}>
              <Text style={[styles.hijriText, { color: isSelected ? colors.accent : colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>
                {formatNumber(parseInt(adjustedHijri.day).toString(), i18n.language)}
              </Text>
              <Text style={[styles.hijriText, { color: isSelected ? colors.accent : colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>
                {formatNumber(bDate.day.toString(), i18n.language)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.hijriText, { color: isSelected ? colors.accent : colors.textSecondary }]}>
              {formatNumber(parseInt(adjustedHijri.day).toString(), i18n.language)}
            </Text>
          )}

          {hasEvents && !isSelected && (
            <View style={{ position: 'absolute', bottom: prefs.showBanglaCalendar ? 2 : 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
          )}
          {hasEvents && isSelected && (
            <View style={{ position: 'absolute', bottom: prefs.showBanglaCalendar ? 2 : 4, width: 4, height: 4, borderRadius: 2, backgroundColor: activeColor }} />
          )}
        </TouchableOpacity>
      );
    });

    return (
      <View style={{ flexShrink: 1, marginBottom: Spacing.four }}>
        <View style={[styles.daysBar, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {headerCells}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
          {cells}
        </View>
      </View>
    );
  }, [calendarData, selectedDate, currentDate, colors, theme, prefs.hijriOffset, prefs.banglaOffset, prefs.showBanglaCalendar, i18n.language, t, activeColor]);

  const getMonthName = (date: Date) => {
    return date.toLocaleString(i18n.language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
  };

  const hijriMonthsByNumber = [
    'muharram',
    'safar',
    'rabi_al-awwal',
    'rabi_al-thani',
    'jumada_al-awwal',
    'jumada_al-thani',
    'rajab',
    "sha'ban",
    'ramadan',
    'shawwal',
    "dhu_al-qi'dah",
    'dhu_al-hijjah'
  ];

  const getLocalizedHijriMonth = (monthNumber: number) => {
    const key = `hijri.${hijriMonthsByNumber[monthNumber - 1]}`;
    return t(key);
  };



  // Convert "03:45 (+06)" to "03:45"
  const formatTimeStr = (timeStr: string) => {
    // timeStr is like "05:30 (EEST)"
    const clean = timeStr.split(' ')[0];
    const [h, m] = clean.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const timeEn = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return formatNumber(timeEn, i18n.language);
  };

  const getFullDate = (timeStr: string, dateStr: string) => {
    if (!timeStr || !dateStr) return null;
    const clean = timeStr.split(' ')[0];
    const [h, m] = clean.split(':').map(Number);
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    date.setHours(h, m, 0, 0);
    return date;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        showBack
        titleEn={t('calendar.titleEn')}
        titleAr={t('calendar.titleAr')}
        rightElement={
          <TouchableOpacity activeOpacity={1}
            onPress={() => setOptionsModalVisible(true)}
            style={{
              backgroundColor: colors.backgroundElement,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary }}>
              {t('settings.adjustments', { defaultValue: 'Adjustments' })}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity activeOpacity={1} onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatNumber(getMonthName(currentDate), i18n.language)}
          </Text>
          <TouchableOpacity activeOpacity={1} onPress={() => changeMonth(1)} style={styles.navBtn}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
            {/* Grid */}
            {calendarGrid}

            {selectedDayData && (() => {
              const idx = calendarData.findIndex(d => d.date.gregorian.date === selectedDayData.date.gregorian.date);
              const offset = prefs.hijriOffset || 0;
              let adjustedHijri = selectedDayData.date.hijri;
              if (idx !== -1) {
                const targetIdx = idx + offset;
                if (targetIdx >= 0 && targetIdx < calendarData.length) {
                  adjustedHijri = calendarData[targetIdx].date.hijri;
                } else {
                  const fallbackDay = parseInt(calendarData[idx].date.hijri.day, 10) + offset;
                  adjustedHijri = { ...calendarData[idx].date.hijri, day: fallbackDay.toString() };
                }
              }

              const parts = selectedDayData.date.gregorian.date.split('-');
              const bDate = getBanglaDate(
                new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])),
                prefs.banglaOffset || 0
              );

              return (
              <View style={styles.detailsContainer}>
                {/* Date Card */}
                <ThemeCard style={[styles.infoCard, { position: 'relative' }]}>
                  <Text style={[styles.detailDateMain, { color: colors.text, textAlign: 'center' }]}>
                    {formatNumber(adjustedHijri.day, i18n.language)} {getLocalizedHijriMonth(adjustedHijri.month.number)} {formatNumber(adjustedHijri.year, i18n.language)}
                  </Text>
                  {prefs.showBanglaCalendar && (
                    <Text style={[styles.detailDateSub, { color: colors.textSecondary }]}>
                      {formatNumber(bDate.day.toString(), i18n.language)} {t(`banglaMonths.${bDate.monthName}`)} {formatNumber(bDate.year.toString(), i18n.language)}
                    </Text>
                  )}

                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      const today = new Date();
                      setCurrentDate(today);
                      const y = today.getFullYear();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const d = String(today.getDate()).padStart(2, '0');
                      setSelectedDate(`${d}-${m}-${y}`);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: activeColor + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: activeColor, fontFamily: Fonts.outfit, fontSize: 10, fontWeight: '600' }}>
                      {t('calendar.today', { defaultValue: 'Today' })}
                    </Text>
                  </TouchableOpacity>
                </ThemeCard>

                {/* Times Cards */}
                <View style={styles.timesRow}>
                  <SpecialTimeCard
                    key={`sahri-${selectedDayData.date.gregorian.date}`}
                    item={{
                      label: t('calendar.sahriEnd'),
                      time: formatTimeStr(selectedDayData.timings.Imsak),
                      date: getFullDate(selectedDayData.timings.Imsak, selectedDayData.date.gregorian.date)
                    }}
                    colors={colors}
                    activeColor={activeColor}
                    i18nLanguage={i18n.language}
                    styles={styles}
                    t={t}
                    timeColor="#FFF"
                    disableInteractive={true}
                  />
                  <SpecialTimeCard
                    key={`iftar-${selectedDayData.date.gregorian.date}`}
                    item={{
                      label: t('calendar.iftarTime'),
                      time: formatTimeStr(selectedDayData.timings.Sunset),
                      date: getFullDate(selectedDayData.timings.Sunset, selectedDayData.date.gregorian.date)
                    }}
                    colors={colors}
                    activeColor={activeColor}
                    i18nLanguage={i18n.language}
                    styles={styles}
                    t={t}
                    timeColor="#FFF"
                    disableInteractive={true}
                  />
                </View>

              </View>
            )})()}
          </ScrollView>

      </View>

      <OptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        title={t('settings.adjustments', { defaultValue: 'Adjustments' })}
        options={[]}
        selectedValue={null}
        onSelect={() => {}}

        customContent={
          <View style={{ gap: Spacing.four }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text }}>
                {t('settings.showBanglaCalendar', { defaultValue: 'Show Bangla Calendar' })}
              </Text>
              <Switch 
                value={prefs.showBanglaCalendar} 
                onValueChange={(val) => prefs.setPreferences({ showBanglaCalendar: val })} 
                trackColor={{ true: colors.accent }}
              />
            </View>

            <View style={{ gap: Spacing.one }}>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: colors.textSecondary }}>
                {t('settings.hijriOffset', { defaultValue: 'Hijri Offset' })}: {prefs.hijriOffset > 0 ? '+' : ''}{prefs.hijriOffset}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[-2, -1, 0, 1, 2].map(val => (
                  <TouchableOpacity activeOpacity={1} 
                    key={`h-${val}`} 
                    onPress={() => prefs.setPreferences({ hijriOffset: val })}
                    style={[{ padding: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: prefs.hijriOffset === val ? activeColor : colors.backgroundElement, borderWidth: 1, borderColor: colors.border }, prefs.hijriOffset !== val && themeStyles.cardShadow]}
                  >
                    <Text style={{ fontFamily: Fonts.outfit, color: prefs.hijriOffset === val ? '#FFF' : colors.text }}>{val > 0 ? '+' : ''}{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {prefs.showBanglaCalendar && (
              <View style={{ gap: Spacing.one }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: colors.textSecondary }}>
                  {t('settings.banglaOffset', { defaultValue: 'Bangla Offset' })}: {prefs.banglaOffset > 0 ? '+' : ''}{prefs.banglaOffset}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[-2, -1, 0, 1, 2].map(val => (
                    <TouchableOpacity activeOpacity={1} 
                      key={`b-${val}`} 
                      onPress={() => prefs.setPreferences({ banglaOffset: val })}
                      style={[{ padding: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: prefs.banglaOffset === val ? activeColor : colors.backgroundElement, borderWidth: 1, borderColor: colors.border }, prefs.banglaOffset !== val && themeStyles.cardShadow]}
                    >
                      <Text style={{ fontFamily: Fonts.outfit, color: prefs.banglaOffset === val ? '#FFF' : colors.text }}>{val > 0 ? '+' : ''}{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.three,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  monthTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 20,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  daysBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    marginBottom: 8,
  },
  gridCellHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellHeaderText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  gridCell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 2,
  },
  gregorianText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  hijriText: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoCard: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDateMain: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    marginBottom: 2,
    textAlign: 'center',
  },
  detailDateSub: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textAlign: 'center',
  },
  timesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  specialCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specialCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventsLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  eventText: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
  }
});
