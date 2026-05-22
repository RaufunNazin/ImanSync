import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import { Navigation } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumber } from '@/utils/formatNumber';
import { useThemeStore } from '@/store/themeStore';

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

  const [heading, setHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(260); // Default approx for Dhaka
  const [subscription, setSubscription] = useState<any>(null);

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

    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(result => {
      let { x, y } = result;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      
      angle = angle - 90;
      if (angle < 0) {
        angle = angle + 360;
      }
      setHeading(angle);
    });
    setSubscription(sub);
    return () => sub && sub.remove();
  }, []);

  const rotation = qiblaBearing - heading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('qibla.titleEn')} titleAr={t('qibla.titleAr')} showBack />

      <View style={styles.container}>
        <BlurView intensity={50} tint={colors.glassTint as any} style={styles.card}>
          
          <View style={styles.compassWrapper}>
            {/* The Compass Dial that rotates based on phone's heading */}
            <Animated.View style={[styles.compassDial, { transform: [{ rotate: `${-heading}deg` }] }]}>
              <View style={[styles.dialCircle, { borderColor: colors.border }]} />
              
              {/* Markers */}
              <View style={styles.markerN}>
                <Text style={[styles.markerText, { color: colors.accent, fontWeight: 'bold' }]}>N</Text>
              </View>
              <View style={styles.markerE}>
                <Text style={[styles.markerText, { color: colors.textSecondary }]}>E</Text>
              </View>
              <View style={styles.markerS}>
                <Text style={[styles.markerText, { color: colors.textSecondary }]}>S</Text>
              </View>
              <View style={styles.markerW}>
                <Text style={[styles.markerText, { color: colors.textSecondary }]}>W</Text>
              </View>

              {/* Minor Markers */}
              <View style={styles.markerNE}><Text style={[styles.markerTextSm, { color: colors.textSecondary }]}>NE</Text></View>
              <View style={styles.markerSE}><Text style={[styles.markerTextSm, { color: colors.textSecondary }]}>SE</Text></View>
              <View style={styles.markerSW}><Text style={[styles.markerTextSm, { color: colors.textSecondary }]}>SW</Text></View>
              <View style={styles.markerNW}><Text style={[styles.markerTextSm, { color: colors.textSecondary }]}>NW</Text></View>

              {/* Tick Marks for Degrees */}
              {[...Array(24)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.tickMark, 
                    { backgroundColor: colors.border, transform: [{ rotate: `${i * 15}deg` }, { translateY: -110 }] }
                  ]} 
                />
              ))}

              {/* Qibla Fixed Indicator on the Dial */}
              <View style={[styles.qiblaFixedIndicator, { transform: [{ rotate: `${qiblaBearing}deg` }, { translateY: -120 }] }]}>
                <Navigation size={20} color={colors.highlight} fill={colors.highlight} />
              </View>
            </Animated.View>

            {/* Central Needle pointing to Qibla relative to phone heading */}
            <Animated.View style={[styles.needleContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
              <Navigation size={80} color={colors.highlight} fill={colors.highlight} style={styles.needle} />
            </Animated.View>

            {/* Center Dot */}
            <View style={[styles.centerDot, { backgroundColor: colors.text }]} />
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('qibla.currentHeading')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatNumber(Math.round(heading), i18n.language)}°</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoBox}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('qibla.qiblaDirection')}</Text>
              <Text style={[styles.infoValue, { color: colors.highlight }]}>{formatNumber(Math.round(qiblaBearing), i18n.language)}°</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('qibla.align')}
          </Text>
        </BlurView>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compassWrapper: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
  },
  compassDial: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  markerText: {
    fontFamily: Fonts.outfit,
    fontSize: 22,
  },
  markerTextSm: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    opacity: 0.7,
  },
  markerN: { position: 'absolute', top: 5 },
  markerS: { position: 'absolute', bottom: 5 },
  markerE: { position: 'absolute', right: 10 },
  markerW: { position: 'absolute', left: 10 },
  markerNE: { position: 'absolute', top: 40, right: 40 },
  markerNW: { position: 'absolute', top: 40, left: 40 },
  markerSE: { position: 'absolute', bottom: 40, right: 40 },
  markerSW: { position: 'absolute', bottom: 40, left: 40 },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 8,
    opacity: 0.5,
  },
  qiblaFixedIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    marginBottom: 40,
  },
  centerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 40,
  },
  infoLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
  },
  description: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  }
});
