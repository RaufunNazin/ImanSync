import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetTheme } from './WidgetTheme';
import { WidgetData } from './WidgetDataService';
import { formatNumber } from '@/utils/formatNumber';

const BANGLA_MONTHS: Record<string, string> = {
  'Boishakh': 'বৈশাখ',
  'Jaistha': 'জ্যৈষ্ঠ',
  'Ashar': 'আষাঢ়',
  'Srabon': 'শ্রাবণ',
  'Bhadro': 'ভাদ্র',
  'Ashwin': 'আশ্বিন',
  'Kartik': 'কার্তিক',
  'Ogrohayon': 'অগ্রহায়ণ',
  'Poush': 'পৌষ',
  'Magh': 'মাঘ',
  'Falgun': 'ফাল্গুন',
  'Chaitra': 'চৈত্র',
};

export const DateWidget = ({ data }: { data: WidgetData }) => {
  const theme = getWidgetTheme(data.isDarkTheme);
  
  let banglaDateStr = '';
  if (data.banglaDate) {
    const monthBn = BANGLA_MONTHS[data.banglaDate.monthName] || data.banglaDate.monthName;
    banglaDateStr = `${formatNumber(data.banglaDate.day, 'bn')} ${monthBn}, ${formatNumber(data.banglaDate.year, 'bn')} বঙ্গাব্দ`;
  }
  
  const hijriStr = data.hijri 
    ? `${data.hijri.day} ${data.hijri.monthEn} ${data.hijri.year} AH` 
    : '';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text={hijriStr}
        style={{
          fontSize: 16,
          fontFamily: 'sans-serif',
          color: theme.activeColor,
          fontWeight: 'bold',
          marginBottom: 4
        }}
      />
      <TextWidget
        text={banglaDateStr}
        style={{
          fontSize: 14,
          fontFamily: 'sans-serif-condensed',
          color: theme.textSecondary,
        }}
      />
    </FlexWidget>
  );
};
