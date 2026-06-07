import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

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

export default function QiblaScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();

  const [headingState, setHeadingState] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(260); // Default approx for Dhaka
  
  const heading = useSharedValue(0);

  useEffect(() => {
    // Load coordinates to calculate exact Qibla direction
    AsyncStorage.getItem('imansync_location').then(val => {
      if (val) {
        try {
          const loc = JSON.parse(val);
          if (loc.latitude && loc.longitude) {
            setQiblaBearing(getQiblaBearing(loc.latitude, loc.longitude));
          }
        } catch(e) {}
      } else {
        // Default Dhaka
        setQiblaBearing(getQiblaBearing(23.8103, 90.4125));
      }
    });

    let magSub: any = null;
    let accSub: any = null;
    let lastUpdate = 0;

    const LPF = 0.1;
    let smoothedM = { x: 0, y: 0, z: 0 };
    let smoothedA = { x: 0, y: 0, z: 1 };
    let hasInitialM = false;
    let hasInitialA = false;

    (async () => {
      Magnetometer.setUpdateInterval(50);
      Accelerometer.setUpdateInterval(50);

      accSub = Accelerometer.addListener(result => {
        if (!hasInitialA) {
          smoothedA = result;
          hasInitialA = true;
        } else {
          smoothedA.x = smoothedA.x + LPF * (result.x - smoothedA.x);
          smoothedA.y = smoothedA.y + LPF * (result.y - smoothedA.y);
          smoothedA.z = smoothedA.z + LPF * (result.z - smoothedA.z);
        }
      });

      magSub = Magnetometer.addListener(result => {
        if (!hasInitialM) {
          smoothedM = result;
          hasInitialM = true;
        } else {
          smoothedM.x = smoothedM.x + LPF * (result.x - smoothedM.x);
          smoothedM.y = smoothedM.y + LPF * (result.y - smoothedM.y);
          smoothedM.z = smoothedM.z + LPF * (result.z - smoothedM.z);
        }

        if (hasInitialA && hasInitialM) {
          const A = smoothedA;
          const M = smoothedM;

          // Normalize A
          const normA = Math.sqrt(A.x * A.x + A.y * A.y + A.z * A.z);
          const ax = A.x / normA, ay = A.y / normA, az = A.z / normA;

          // Normalize M
          const normM = Math.sqrt(M.x * M.x + M.y * M.y + M.z * M.z);
          const mx = M.x / normM, my = M.y / normM, mz = M.z / normM;

          // E = M x A
          let Ex = my * az - mz * ay;
          let Ey = mz * ax - mx * az;
          let Ez = mx * ay - my * ax;
          const normE = Math.sqrt(Ex * Ex + Ey * Ey + Ez * Ez);
          Ex /= normE; Ey /= normE; Ez /= normE;

          // N = A x E
          let Ny = az * Ex - ax * Ez;

          let newHeading = Math.atan2(Ey, Ny) * (180 / Math.PI);
          if (newHeading < 0) newHeading += 360;

          // Fix the 360 -> 0 wrap around for reanimated
          let currentHeading = heading.value;
          let diff = newHeading - (currentHeading % 360);
          diff = diff % 360; // handle negative modulo
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          
          let targetHeading = currentHeading + diff;
          
          heading.value = withTiming(targetHeading, { 
            duration: 100,
            easing: Easing.linear 
          });
          
          // Throttle React state updates to ~200ms
          const now = Date.now();
          if (now - lastUpdate > 200) {
            setHeadingState(newHeading);
            lastUpdate = now;
          }
        }
      });
    })();

    return () => {
      if (magSub) magSub.remove();
      if (accSub) accSub.remove();
    };
  }, []);

  const animatedDialStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${-heading.value}deg` }]
    };
  });

  const rotation = qiblaBearing - headingState;
  
  let diffText = (rotation + 360) % 360;
  if (diffText > 180) diffText -= 360;
  
  let turnText = '';
  if (Math.abs(diffText) <= 2) {
    turnText = t('qibla.facingQibla');
  } else if (diffText > 0) {
    turnText = t('qibla.turnRight', { degrees: formatNumber(Math.round(diffText), i18n.language) });
  } else {
    turnText = t('qibla.turnLeft', { degrees: formatNumber(Math.round(Math.abs(diffText)), i18n.language) });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('qibla.titleEn')} titleAr={t('qibla.titleAr')} showBack />

      <View style={styles.container}>
        <View style={styles.compassWrapper}>
          {/* The Compass Dial that rotates based on phone's heading */}
          <Animated.View style={[styles.compassDial, animatedDialStyle]}>
            
            {/* Tick Marks for Degrees */}
            {[...Array(72)].map((_, i) => {
              const deg = i * 5;
              const isMajor = i % 18 === 0; // 0, 90, 180, 270
              const isMedium = i % 2 === 0;
              // Check if this pin is the closest one to the actual Qibla bearing
              const isQiblaPin = Math.abs(deg - qiblaBearing) < 2.5 || Math.abs(deg - qiblaBearing) > 357.5;
              
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
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>N</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '90deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>E</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '180deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>S</Text>
            </View>
            <View style={[styles.markerContainer, { transform: [{ rotate: '270deg' }, { translateY: -100 }] }]}>
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>W</Text>
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

        <Text style={[styles.description, { color: Math.abs(diffText) <= 2 ? colors.accent : colors.text }]}>
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
    paddingTop: 0,
    justifyContent: 'center',
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
