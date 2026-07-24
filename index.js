import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/android/WidgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

// Pass execution to Expo Router
import 'expo-router/entry';
