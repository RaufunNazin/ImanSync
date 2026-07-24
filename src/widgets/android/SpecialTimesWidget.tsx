import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetTheme } from './WidgetTheme';
import { WidgetData } from './WidgetDataService';
import { formatNumber } from '@/utils/formatNumber';

const formatCountdownText = (ms: number, lang: string): string => {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  
  let hoursStr = String(h).padStart(2, '0');
  let minsStr = String(m).padStart(2, '0');
  
  let str = '';
  if (h > 0) {
    if (lang === 'bn') {
      str = `${hoursStr} ঘণ্টা\n${minsStr} মিনিট`;
    } else {
      str = `${hoursStr} hr\n${minsStr} min`;
    }
  } else {
    if (lang === 'bn') {
      str = `${minsStr}\nমিনিট`;
    } else {
      str = `${minsStr}\nmin`;
    }
  }
  
  return formatNumber(str, lang);
};

export const SpecialTimesWidget = ({ data, activeSpecialTimeId }: { data: WidgetData, activeSpecialTimeId: string | null }) => {
  const theme = getWidgetTheme(data.isDarkTheme);
  
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.cardBackground,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {data.specialTimes.map((item, idx) => {
        const isLast = idx === data.specialTimes.length - 1;
        const isActive = activeSpecialTimeId === item.id;
        
        let displayTime = item.time;
        let isCountdown = false;
        
        if (isActive && item.date) {
           const timeDiff = item.date.getTime() - data.currentTime.getTime();
           if (timeDiff > 0) {
              displayTime = formatCountdownText(timeDiff, data.lang);
              isCountdown = true;
           }
        }

        return (
          <React.Fragment key={item.id}>
            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              clickAction={`toggle_${item.id}`}
            >
              <TextWidget
                text={item.label}
                style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginBottom: 4,
                }}
              />
              <TextWidget
                text={displayTime}
                style={{
                  fontSize: isCountdown ? 12 : 14,
                  color: isActive ? theme.activeColor : theme.text,
                  fontWeight: isActive ? 'bold' : 'normal',
                  textAlign: 'center',
                }}
              />
            </FlexWidget>
            
            {!isLast && (
              <FlexWidget
                style={{
                  width: 1,
                  height: 30,
                  backgroundColor: theme.border || '#33333333',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </FlexWidget>
  );
};
