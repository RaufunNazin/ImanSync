import PageHeader from '@/components/page-header';
import React, { useEffect, useState, useMemo } from 'react';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useThemeStore } from '@/store/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatNumber } from '@/utils/formatNumber';
import OptionsModal from '@/components/OptionsModal';
import SkeletonBox from '@/components/SkeletonBox';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const colors = Colors[theme === 'unspecified' ? 'light' : theme ?? 'light'];
  const prefs = usePreferencesStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  const fetchCalendar = async (year: number, month: number) => {
    setLoading(true);
    try {
      let isCityBased = !!prefs.manualCity || !prefs.location;
      let city = prefs.manualCity || prefs.location?.city || 'Dhaka';
      let country = 'Bangladesh';
      let method = prefs.calcMethod || 1;
      let madhab = prefs.madhab || 0;
      let adj = prefs.hijriOffset || 0;

      let url = isCityBased
        ? `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}&method=${method}&school=${madhab}&adj=${adj}`
        : `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${prefs.location?.latitude}&longitude=${prefs.location?.longitude}&method=${method}&school=${madhab}&adj=${adj}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setCalendarData(json.data);
      }
    } catch (e) {
      console.error('Calendar fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
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

  const renderGrid = () => {
    if (calendarData.length === 0) return null;

    const firstDayStr = calendarData[0].date.gregorian.date; // DD-MM-YYYY
    const parts = firstDayStr.split('-');
    const firstDayDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const startDayOfWeek = firstDayDate.getDay(); // 0 is Sunday

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const cells = [];
    
    // Header row
    const headerCells = days.map((day, idx) => (
      <View key={`header-${idx}`} style={styles.gridCellHeader}>
        <Text style={[styles.gridCellHeaderText, { color: colors.textSecondary }]}>
          {t(`calendar.${day}`)}
        </Text>
      </View>
    ));

    // Empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.gridCell} />);
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

      cells.push(
        <TouchableOpacity
          key={`day-${idx}`}
          style={[
            styles.gridCell,
            { 
              backgroundColor: isSelected ? (theme === 'dark' ? '#2a2640' : colors.backgroundElement) : 'transparent',
              borderColor: isSelected ? colors.highlight : (isToday ? colors.accent : 'transparent'),
              borderWidth: isSelected ? 1 : (isToday ? 1 : 0),
            }
          ]}
          onPress={() => setSelectedDate(dayData.date.gregorian.date)}
        >
          <Text style={[styles.gregorianText, { color: isSelected ? colors.highlight : colors.text }]}>
            {formatNumber(parseInt(dayData.date.gregorian.day).toString(), i18n.language)}
          </Text>
          <Text style={[styles.hijriText, { color: isSelected ? colors.accent : colors.textSecondary }]}>
            {formatNumber(parseInt(adjustedHijri.day).toString(), i18n.language)}
          </Text>
          {hasEvents && !isSelected && (
            <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
          )}
          {hasEvents && isSelected && (
            <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.highlight }} />
          )}
        </TouchableOpacity>
      );
    });

    return (
      <View style={{ flexShrink: 1, marginBottom: Spacing.four }}>
        <View style={[styles.daysBar, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {headerCells}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells}
        </View>
      </View>
    );
  };

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

  const formatGregorianDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return formatNumber(dateStr, i18n.language);
    const [d, m, y] = parts;
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return formatNumber(date.toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' }), i18n.language);
  };

  // Convert "03:45 (+06)" to "03:45 AM" roughly
  const formatTimeStr = (timeStr: string) => {
    const raw = timeStr.split(' ')[0];
    const [hStr, mStr] = raw.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
    return formatNumber(`${h}:${mStr}${ampm}`, i18n.language);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        showBack
        titleEn={t('calendar.titleEn')}
        titleAr={t('calendar.titleAr')}
        rightElement={
          <TouchableOpacity 
            activeOpacity={0.7}
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
              {t('settings.hijriOffset', { defaultValue: 'Hijri Offset' })}: {prefs.hijriOffset > 0 ? '+' : ''}{formatNumber(prefs.hijriOffset || 0, i18n.language)}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatNumber(getMonthName(currentDate), i18n.language)}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1 }}>
            {/* Days Bar skeleton */}
            <View style={[styles.daysBar, { backgroundColor: colors.backgroundElement, borderColor: colors.border, paddingVertical: 12 }]}>
              {Array.from({length: 7}).map((_, i) => (
                <View key={i} style={styles.gridCellHeader}>
                  <SkeletonBox width={24} height={12} borderRadius={6} color={colors.border} />
                </View>
              ))}
            </View>
            
            {/* Grid Cells Skeleton */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.four }}>
              {Array.from({length: 42}).map((_, i) => (
                <View key={i} style={styles.gridCell}>
                  <SkeletonBox width={28} height={20} borderRadius={6} color={colors.border} />
                  <SkeletonBox width={16} height={10} borderRadius={4} color={colors.border} style={{ marginTop: 2, marginBottom: 4 }} />
                </View>
              ))}
            </View>

            {/* Details Skeletons */}
            <View style={styles.detailsContainer}>
              <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                <SkeletonBox width={180} height={20} borderRadius={10} color={colors.border} style={{ marginBottom: 2 }} />
                <SkeletonBox width={120} height={14} borderRadius={7} color={colors.border} />
              </View>
              <View style={styles.timesRow}>
                <View style={[styles.infoCard, styles.timeBoxHalf, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginRight: 4, marginLeft: 0 }]}>
                  <SkeletonBox width={80} height={12} borderRadius={6} color={colors.border} style={{ marginBottom: 4 }} />
                  <SkeletonBox width={60} height={22} borderRadius={11} color={colors.border} />
                </View>
                <View style={[styles.infoCard, styles.timeBoxHalf, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginLeft: 4, marginRight: 0 }]}>
                  <SkeletonBox width={80} height={12} borderRadius={6} color={colors.border} style={{ marginBottom: 4 }} />
                  <SkeletonBox width={60} height={22} borderRadius={11} color={colors.border} />
                </View>
              </View>
              <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginBottom: 0 }]}>
                <SkeletonBox width={60} height={12} borderRadius={6} color={colors.border} style={{ marginBottom: 8 }} />
                <SkeletonBox width={140} height={16} borderRadius={8} color={colors.border} />
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Grid */}
            {renderGrid()}

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

              return (
              <View style={styles.detailsContainer}>
                {/* Date Card */}
                <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.detailDateMain, { color: colors.highlight }]}>
                    {formatNumber(adjustedHijri.day, i18n.language)} {getLocalizedHijriMonth(adjustedHijri.month.number)} {formatNumber(adjustedHijri.year, i18n.language)}
                  </Text>
                  <Text style={[styles.detailDateSub, { color: colors.textSecondary }]}>
                    {formatGregorianDate(selectedDayData.date.gregorian.date)}
                  </Text>
                </View>

                {/* Times Cards */}
                <View style={styles.timesRow}>
                  <View style={[styles.infoCard, styles.timeBoxHalf, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginRight: 4, marginLeft: 0 }]}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{t('calendar.sahriEnd')}</Text>
                    <Text style={[styles.timeValue, { color: colors.highlight }]}>
                      {formatTimeStr(selectedDayData.timings.Fajr)}
                    </Text>
                  </View>
                  <View style={[styles.infoCard, styles.timeBoxHalf, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginLeft: 4, marginRight: 0 }]}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{t('calendar.iftarTime')}</Text>
                    <Text style={[styles.timeValue, { color: colors.accent }]}>
                      {formatTimeStr(selectedDayData.timings.Maghrib)}
                    </Text>
                  </View>
                </View>

                {/* Events Card */}
                <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement, marginBottom: 0 }]}>
                  <Text style={[styles.eventsLabel, { color: colors.textSecondary }]}>{t('calendar.events')}</Text>
                  {adjustedHijri.holidays && adjustedHijri.holidays.length > 0 ? (
                    adjustedHijri.holidays.map((h: string, i: number) => (
                      <Text key={i} style={[styles.eventText, { color: colors.accent }]}>{h}</Text>
                    ))
                  ) : (
                    <Text style={[styles.eventText, { color: colors.textSecondary }]}>{t('calendar.noEvents')}</Text>
                  )}
                </View>
              </View>
            )})()}
          </>
        )}

      </View>

      <OptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        title={t('settings.hijriOffset', { defaultValue: 'Hijri Offset' })}
        options={[-2, -1, 0, 1, 2].map(val => ({
          name: `${val > 0 ? '+' : ''}${formatNumber(val, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}`,
          id: val
        }))}
        selectedValue={prefs.hijriOffset}
        onSelect={(val) => prefs.setPreferences({ hijriOffset: val as number })}
        colors={colors}
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
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  monthTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 20,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    marginBottom: 8,
  },
  gridCellHeader: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellHeaderText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  gridCell: {
    width: '14.28%',
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
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  timeBoxHalf: {
    flex: 1,
    marginBottom: 0,
  },
  timeLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  timeValue: {
    fontFamily: Fonts.outfit,
    fontSize: 22,
    textAlign: 'center',
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
