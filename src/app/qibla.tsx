import PageHeader from '@/components/page-header';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Kaaba Coordinates
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

// Calculate Qibla Bearing from given coordinates
const getQiblaBearing = (lat: number, lon: number) => {
  const PI = Math.PI;
  const latK = KAABA_LAT * (PI / 180);
  const lonK = KAABA_LON * (PI / 180);
  const phi = lat * (PI / 180);
  const lambda = lon * (PI / 180);

  const y = Math.sin(lonK - lambda);
  const x = Math.cos(phi) * Math.tan(latK) - Math.sin(phi) * Math.cos(lonK - lambda);
  let bearing = Math.atan2(y, x) * (180 / PI);
  return (bearing + 360) % 360;
};

const angleDifference = (a: number, b: number) => {
  return ((b - a + 540) % 360) - 180;
};

export default function QiblaScreen() {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();

  const [headingState, setHeadingState] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(260);
  const [accuracy, setAccuracy] = useState<'High' | 'Good' | 'Poor'>('Poor');
  const [interference, setInterference] = useState(false);
  
  const heading = useSharedValue(0);

  useEffect(() => {
    let isMounted = true;
    let headingSubscription: Location.LocationSubscription | null = null;
    let lastStateUpdate = Date.now();

    AsyncStorage.getItem('imansync_location').then(val => {
      if (val) {
        try {
          const loc = JSON.parse(val);
          if (loc.latitude && loc.longitude) {
            setQiblaBearing(getQiblaBearing(loc.latitude, loc.longitude));
          }
        } catch(e) {}
      } else {
        setQiblaBearing(getQiblaBearing(23.8103, 90.4125));
      }
    });

    (async () => {
      // NEW COMMENT: Verify global device location services are switched on
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setAccuracy('Poor');
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      try {
        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (currentLoc.coords) {
          setQiblaBearing(getQiblaBearing(currentLoc.coords.latitude, currentLoc.coords.longitude));
          AsyncStorage.setItem('imansync_location', JSON.stringify({
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude
          }));
        }

        const sub = await Location.watchHeadingAsync((headingData) => {
          const osHeading = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
          
          const deviation = headingData.accuracy;
          if (deviation > 15 || deviation === 0) {
            setInterference(true);
            setAccuracy('Poor');
          } else if (deviation > 10) {
            setInterference(false);
            setAccuracy('Good');
          } else {
            setInterference(false);
            setAccuracy('High');
          }

          let currentShared = heading.value;
          // NEW COMMENT: Handle JavaScript negative modulo behavior safely
          let normalizedShared = ((currentShared % 360) + 360) % 360;
          let diff = angleDifference(normalizedShared, osHeading);
          let targetHeading = currentShared + diff;

          heading.value = withSpring(targetHeading, { 
            damping: 20,
            stiffness: 200,
          });
          
          const now = Date.now();
          if (now - lastStateUpdate > 250) {
            setHeadingState(osHeading);
            lastStateUpdate = now;
          }
        });

        // NEW COMMENT: Safely handle unmounting during asynchronous initialization
        if (!isMounted) {
          sub.remove();
        } else {
          headingSubscription = sub;
        }
      } catch (e) {}
    })();

    return () => {
      isMounted = false;
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  const animatedDialStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${-heading.value}deg` }]
    };
  });

  let diffText = angleDifference(headingState, qiblaBearing);
  
  let turnText = '';
  if (Math.abs(diffText) <= 5) {
    turnText = t('qibla.facingQibla');
  } else if (diffText > 0) {
    turnText = t('qibla.turnRight', { degrees: formatNumber(Math.round(diffText), i18n.language) });
  } else {
    turnText = t('qibla.turnLeft', { degrees: formatNumber(Math.round(Math.abs(diffText)), i18n.language) });
  }

  const accuracyColor = accuracy === 'High' ? colors.success : accuracy === 'Good' ? colors.highlight : colors.error;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('qibla.titleEn')} titleAr={t('qibla.titleAr')} showBack />

      <View style={styles.container}>
        
        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <Text style={[styles.accuracyText, { color: accuracyColor }]}>
            {t('qibla.accuracy', { defaultValue: 'Compass Accuracy:' })} {accuracy}
          </Text>
          {interference && (
            <Text style={[styles.interferenceText, { color: colors.error }]}>
              {t('qibla.interference', { defaultValue: 'Magnetic interference detected. Move away from electronics.' })}
            </Text>
          )}
        </View>

        <View style={styles.compassWrapper}>
          {/* The Compass Dial that rotates based on phone's heading */}
          <Animated.View style={[styles.compassDial, animatedDialStyle]}>
            
            {/* Tick Marks for Degrees */}
            {[...Array(72)].map((_, i) => {
              const deg = i * 5;
              const isMajor = i % 18 === 0; // 0, 90, 180, 270
              const isMedium = i % 2 === 0;
              // Check if this pin is the closest one to the actual Qibla bearing
              const isQiblaPin = Math.abs(angleDifference(deg, qiblaBearing)) < 2.5;
              
              return (
                <View 
                  key={i} 
                  style={[
                    styles.tickMark, 
                    { 
                      backgroundColor: isQiblaPin ? colors.accent : isMajor ? colors.text : (isMedium ? colors.textSecondary : colors.border),
                      height: isQiblaPin ? 18 : isMajor ? 14 : (isMedium ? 10 : 6),
                      opacity: isQiblaPin ? 1 : isMajor ? 0.9 : 0.5,
                      transform: [{ rotate: `${deg}deg` }, { translateY: -130 }] 
                    }
                  ]} 
                />
              );
            })}

            {/* Markers */}
            <View style={[styles.markerContainer, { transform: [{ rotate: '0deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>{t('qibla.north', { defaultValue: 'N' })}</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '90deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>{t('qibla.east', { defaultValue: 'E' })}</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '180deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>{t('qibla.south', { defaultValue: 'S' })}</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '270deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>{t('qibla.west', { defaultValue: 'W' })}</Text>
            </View>

            {/* Qibla Fixed Indicator on the Dial */}
            <View style={[styles.qiblaFixedIndicator, { transform: [{ rotate: `${qiblaBearing}deg` }, { translateY: -130 }] }]}>
              <View style={[styles.qiblaBadge, { backgroundColor: '#4c956c' }]}>
                <View style={styles.kaabaIcon}>
                  <View style={styles.kaabaGoldBand} />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Fixed Central Needle pointing always UP */}
          <View style={styles.needleContainer}>
            <View style={styles.needleWrapper}>
              <View style={[styles.centerRing, { borderColor: colors.text }]} />
              <View style={[styles.centerPointer, { borderBottomColor: colors.text }]} />
            </View>
          </View>
        </View>

        <Text style={[styles.description, { color: Math.abs(diffText) <= 5 ? colors.accent : colors.text }]}>
          {turnText}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: Spacing.six,
    height: 40,
    justifyContent: 'center',
  },
  accuracyText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginBottom: 4,
  },
  interferenceText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: Spacing.six,
  },
  card: {
    padding: Spacing.six,
    borderRadius: 32,
    alignItems: 'center',
  },
  compassWrapper: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
    alignSelf: 'center',
  },
  compassDial: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
  qiblaFixedIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qiblaBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  kaabaIcon: {
    width: 16,
    height: 18,
    backgroundColor: '#000',
    borderRadius: 2,
    alignItems: 'center',
  },
  kaabaGoldBand: {
    width: '100%',
    height: 3,
    backgroundColor: '#FFD700',
    marginTop: 4,
  },
  needleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
  },
  centerPointer: {
    position: 'absolute',
    top: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  description: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  }
});
