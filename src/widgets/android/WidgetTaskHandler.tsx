import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { getWidgetData } from './WidgetDataService';
import { TimelineWidget } from './TimelineWidget';
import { DateWidget } from './DateWidget';
import { SpecialTimesWidget } from './SpecialTimesWidget';
import { TrackerWidget } from './TrackerWidget';
import { storage } from '@/store/mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function widgetTaskHandler({
  widgetAction,
  widgetInfo,
  clickAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  const widgetName = widgetInfo.widgetName;
  
  const lang = await AsyncStorage.getItem('@imansync_language') || 'bn';
  const data = getWidgetData(lang);

  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED' || widgetAction === 'WIDGET_CLICK') {
    
    let activeSpecialTimeId = storage.getString('widget_special_active') || null;
    if (widgetAction === 'WIDGET_CLICK' && clickAction?.startsWith('toggle_')) {
       const clickedId = clickAction.replace('toggle_', '');
       activeSpecialTimeId = activeSpecialTimeId === clickedId ? null : clickedId;
       storage.set('widget_special_active', activeSpecialTimeId || '');
    }

    if (widgetName === 'Timeline') {
      renderWidget(<TimelineWidget data={data} />);
    } else if (widgetName === 'Date') {
      renderWidget(<DateWidget data={data} />);
    } else if (widgetName === 'SpecialTimes') {
      renderWidget(<SpecialTimesWidget data={data} activeSpecialTimeId={activeSpecialTimeId} />);
    } else if (widgetName === 'Tracker') {
      // For tracker, handle click to open app, since we can't easily mutate the main app's mmkv store without risking sync issues, or we can!
      // But typically widgets open the app or we can mutate it here. We'll just display it for now, and opening the app on click is standard.
      renderWidget(<TrackerWidget data={data} />);
    }
  }
}
