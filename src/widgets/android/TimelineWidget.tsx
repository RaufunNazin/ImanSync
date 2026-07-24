import React from 'react';
import { FlexWidget, TextWidget, OverlapWidget } from 'react-native-android-widget';
import { getWidgetTheme } from './WidgetTheme';
import { WidgetData } from './WidgetDataService';

export const TimelineWidget = ({ data }: { data: WidgetData }) => {
  const theme = getWidgetTheme(data.isDarkTheme);
  
  const timelinePrayers = data.prayersWithStatus.filter((p: any) => p.id !== 'sunrise');
  if (timelinePrayers.length < 5) return null;

  const now = data.currentTime.getTime();
  const fajrTime = timelinePrayers[0].date.getTime();
  const ishaTime = timelinePrayers[4].date.getTime();
  
  let currentIdx = -1;
  let segmentProgress = 0;

  if (now < fajrTime || now >= ishaTime) {
    currentIdx = 4;
    segmentProgress = 1;
  } else {
    for (let i = 0; i < timelinePrayers.length - 1; i++) {
      if (now >= timelinePrayers[i].date.getTime() && now < timelinePrayers[i+1].date.getTime()) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx !== -1) {
      const segmentStart = timelinePrayers[currentIdx].date.getTime();
      let segmentEnd = timelinePrayers[currentIdx+1].date.getTime();
      
      if (currentIdx === 0) {
        const sunrise = data.prayersWithStatus.find((p: any) => p.id === 'sunrise');
        if (sunrise) segmentEnd = sunrise.date.getTime();
      }
      
      if (now >= segmentEnd) {
         segmentProgress = 1;
      } else {
         segmentProgress = (now - segmentStart) / (segmentEnd - segmentStart);
      }
      segmentProgress = Math.max(0, Math.min(1, segmentProgress));
    } else {
      currentIdx = 4;
    }
  }

  const leftPercent = currentIdx * 25;
  const widthPercent = segmentProgress * 25;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.cardBackground,
        borderRadius: 24,
        padding: 16,
        justifyContent: 'center',
      }}
      clickAction="OPEN_APP"
    >
      <OverlapWidget style={{ width: 'match_parent', height: 12, marginTop: 12, marginBottom: 12 }}>
         <FlexWidget style={{ width: 'match_parent', height: 'match_parent', justifyContent: 'center' }}>
            <FlexWidget style={{ height: 2, flexDirection: 'row', width: 'match_parent', backgroundColor: theme.border || '#33333333', borderRadius: 1 }}>
               {leftPercent > 0 && <FlexWidget style={{ flex: leftPercent, backgroundColor: '#00000000', height: 'match_parent' }} />}
               {widthPercent > 0 && <FlexWidget style={{ flex: widthPercent, backgroundColor: theme.activeColor, height: 'match_parent' }} />}
               {(100 - leftPercent - widthPercent) > 0 && <FlexWidget style={{ flex: 100 - leftPercent - widthPercent, backgroundColor: '#00000000', height: 'match_parent' }} />}
            </FlexWidget>
         </FlexWidget>
         <FlexWidget style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {timelinePrayers.map((p, i) => {
            const isActive = i === currentIdx;
            const isPast = i <= currentIdx;
            
            return (
              <FlexWidget key={p.id} style={{ alignItems: 'center' }}>
                <FlexWidget
                  style={{
                    width: isActive ? 10 : 8,
                    height: isActive ? 10 : 8,
                    borderRadius: isActive ? 5 : 4,
                    backgroundColor: isPast ? theme.activeColor : theme.background,
                    borderWidth: 2,
                    borderColor: isPast ? theme.activeColor : (theme.border || '#33333333'),
                  }}
                />
              </FlexWidget>
            );
          })}
         </FlexWidget>
      </OverlapWidget>
      
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {timelinePrayers.map((p, i) => {
          const isActive = i === currentIdx;
          const isPast = i < currentIdx;
          
          return (
            <FlexWidget key={p.id} style={{ flexDirection: 'column', alignItems: 'center', width: 40 }}>
              <TextWidget
                text={p.name}
                style={{
                  fontSize: 10,
                  color: isActive ? theme.activeColor : isPast ? theme.textSecondary : theme.text,
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              />
              <TextWidget
                text={p.time.replace(/ AM| PM/g, '')}
                style={{
                  fontSize: 9,
                  color: isActive ? theme.activeColor : theme.textSecondary,
                  marginTop: 2
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
};
