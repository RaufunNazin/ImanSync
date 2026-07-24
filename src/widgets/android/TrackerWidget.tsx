import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetTheme } from './WidgetTheme';
import { WidgetData } from './WidgetDataService';

export const TrackerWidget = ({ data }: { data: WidgetData }) => {
  const theme = getWidgetTheme(data.isDarkTheme);
  
  const prayers = [
    { id: 'fajr', label: 'Fajr' },
    { id: 'dhuhr', label: 'Dhuhr' },
    { id: 'asr', label: 'Asr' },
    { id: 'maghrib', label: 'Maghrib' },
    { id: 'isha', label: 'Isha' },
  ];

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
      clickAction="OPEN_APP"
    >
      {prayers.map((prayer) => {
        const isDone = !!data.trackerData[prayer.id];
        return (
          <FlexWidget
            key={prayer.id}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <FlexWidget
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: isDone ? 0 : 2,
                borderColor: isDone ? '#00000000' : theme.border || '#33333333',
                backgroundColor: isDone ? theme.activeColor : '#00000000',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              {isDone && (
                <TextWidget
                  text="✓"
                  style={{
                    color: theme.backgroundElement || '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                />
              )}
            </FlexWidget>
            <TextWidget
              text={prayer.label}
              style={{
                fontSize: 10,
                color: isDone ? theme.text : theme.textSecondary,
                fontWeight: isDone ? 'bold' : 'normal',
              }}
            />
          </FlexWidget>
        );
      })}
    </FlexWidget>
  );
};
