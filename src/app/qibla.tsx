import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import { Compass, Navigation } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Mock Qibla bearing from Dhaka (approx 260 degrees from North)
const QIBLA_BEARING = 260; 

export default function QiblaScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t } = useTranslation();

  const [heading, setHeading] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(result => {
      let { x, y } = result;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      
      // Adjust angle for portrait orientation
      angle = angle - 90;
      if (angle < 0) {
        angle = angle + 360;
      }
      setHeading(angle);
    });
    setSubscription(sub);
    return () => sub && sub.remove();
  }, []);

  // Calculate the rotation needed to point to Qibla
  // If the phone is pointing at 'heading', and Qibla is at 'QIBLA_BEARING',
  // the arrow should point at QIBLA_BEARING - heading.
  const rotation = QIBLA_BEARING - heading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader titleEn={t('qibla.titleEn')} titleAr={t('qibla.titleAr')} showBack />

      <View style={styles.container}>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          
          <View style={styles.compassWrapper}>
            <View style={[styles.compassCircle, { borderColor: colors.border }]} />
            <Text style={[styles.northMarker, { color: colors.textSecondary }]}>{t('qibla.north')}</Text>
            
            <Animated.View style={{ transform: [{ rotate: `${-heading}deg` }], position: 'absolute' }}>
               <Compass size={220} color={colors.textSecondary} strokeWidth={1} />
            </Animated.View>

            <Animated.View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
              <Navigation size={80} color={colors.accent} fill={colors.accent} style={styles.needle} />
            </Animated.View>
          </View>

          <Text style={[styles.headingText, { color: colors.text }]}>
            {Math.round(heading)}°
          </Text>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  backBtn: {
    padding: Spacing.two,
    marginLeft: -Spacing.two,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
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
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
  },
  compassCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  northMarker: {
    position: 'absolute',
    top: -30,
    fontFamily: Fonts.outfit,
    fontSize: 20,
  },
  needle: {
    marginBottom: 40,
  },
  headingText: {
    fontFamily: Fonts.outfit,
    fontSize: 32,
    marginBottom: Spacing.two,
  },
  description: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  }
});
