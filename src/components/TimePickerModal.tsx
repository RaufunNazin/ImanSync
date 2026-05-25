import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, PanResponder, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import * as Haptics from 'expo-haptics';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
  initialHour: number;
  initialMinute: number;
  colors: any;
  title: string;
}

const RADIUS = 110;
const PADDING = 25; // Distance of numbers from edge
const NUMBER_RADIUS = RADIUS - PADDING;
const CLOCK_DIAMETER = RADIUS * 2;

export default function TimePickerModal({
  visible,
  onClose,
  onSave,
  initialHour,
  initialMinute,
  colors,
  title,
}: TimePickerModalProps) {
  const { t, i18n } = useTranslation();
  
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  
  // Internal state 0-23 and 0-59
  const [selectedHour, setSelectedHour] = useState(Number(initialHour) || 0);
  const [selectedMinute, setSelectedMinute] = useState(Number(initialMinute) || 0);
  
  const isAM = selectedHour < 12;

  // Refs for PanResponder stale closures
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isAMRef = useRef(isAM);
  isAMRef.current = isAM;
  const selectedHourRef = useRef(selectedHour);
  selectedHourRef.current = selectedHour;
  const selectedMinuteRef = useRef(selectedMinute);
  selectedMinuteRef.current = selectedMinute;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleModeChange = (newMode: 'hour' | 'minute') => {
    if (newMode === modeRef.current) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMode(newMode);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    if (visible) {
      setSelectedHour(Number(initialHour) || 0);
      setSelectedMinute(Number(initialMinute) || 0);
      setMode('hour');
      fadeAnim.setValue(1);
    }
  }, [visible, initialHour, initialMinute]);

  const handleSetAM = () => {
    if (!isAM) setSelectedHour(selectedHour - 12);
  };
  
  const handleSetPM = () => {
    if (isAM) setSelectedHour(selectedHour + 12);
  };

  // 1-12 value based on selectedHour
  const displayHour = selectedHour % 12 === 0 ? 12 : selectedHour % 12;

  // The angle for the hand (in degrees)
  let currentAngle = 0;
  if (mode === 'hour') {
    currentAngle = displayHour * 30; // 360 / 12
  } else {
    currentAngle = selectedMinute * 6; // 360 / 60
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderRelease: () => {
        if (modeRef.current === 'hour') {
          handleModeChange('minute');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    })
  ).current;

  // Since PanResponder is on the touch overlay (which spans exactly the clock circle),
  // center is at (RADIUS, RADIUS).
  const handleTouch = (x: number, y: number) => {
    const dx = x - RADIUS;
    const dy = y - RADIUS;
    let angleRad = Math.atan2(dy, dx);
    let deg = angleRad * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (modeRef.current === 'hour') {
      let val = Math.round(deg / 30) % 12;
      if (val === 0) val = 12;
      
      const newHour = isAMRef.current ? (val === 12 ? 0 : val) : (val === 12 ? 12 : val + 12);
      if (newHour !== selectedHourRef.current) {
        setSelectedHour(newHour);
        Haptics.selectionAsync();
      }
    } else {
      let val = Math.round(deg / 6) % 60;
      if (val !== selectedMinuteRef.current) {
        setSelectedMinute(val);
        Haptics.selectionAsync();
      }
    }
  };

  if (!visible) return null;

  // Generate Numbers to render
  const renderNumbers = () => {
    const elements = [];
    const count = mode === 'hour' ? 12 : 12; 
    // for minutes, we only draw 00, 05, 10... etc (which is also 12 items)
    
    for (let i = 1; i <= count; i++) {
      let val = mode === 'hour' ? i : (i === 12 ? 0 : i * 5);
      let text = mode === 'hour' ? val.toString() : val.toString().padStart(2, '0');
      
      const angleDeg = i * 30 - 90;
      const angleRad = angleDeg * (Math.PI / 180);
      const x = RADIUS + Math.cos(angleRad) * NUMBER_RADIUS;
      const y = RADIUS + Math.sin(angleRad) * NUMBER_RADIUS;

      // Localize numerals
      text = formatNumber(parseInt(text), i18n.language).padStart(mode === 'minute' ? 2 : 1, formatNumber(0, i18n.language));

      const isActive = mode === 'hour' ? displayHour === val : selectedMinute % 5 === 0 && selectedMinute === val;

      elements.push(
        <View key={i} style={[styles.numberContainer, { left: x - 16, top: y - 16 }]}>
          <Text style={[styles.numberText, { color: isActive ? '#FFF' : colors.text }]}>
            {text}
          </Text>
        </View>
      );
    }
    return elements;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
          
          {/* Header Display */}
          <View style={styles.headerDisplay}>
            <View style={styles.timeGroup}>
              <TouchableOpacity onPress={() => handleModeChange('hour')}>
                <Text style={[styles.timeText, { color: mode === 'hour' ? colors.highlight : colors.textSecondary }]}>
                  {formatNumber(displayHour, i18n.language).padStart(2, formatNumber(0, i18n.language))}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>:</Text>
              <TouchableOpacity onPress={() => handleModeChange('minute')}>
                <Text style={[styles.timeText, { color: mode === 'minute' ? colors.highlight : colors.textSecondary }]}>
                  {formatNumber(selectedMinute, i18n.language).padStart(2, formatNumber(0, i18n.language))}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* AM/PM Toggle */}
            <View style={[styles.amPmContainer, { borderColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.amPmBtn, isAM && { backgroundColor: colors.highlight + '33' }]} 
                onPress={handleSetAM}
              >
                <Text style={[styles.amPmText, { color: isAM ? colors.highlight : colors.textSecondary }]}>AM</Text>
              </TouchableOpacity>
              <View style={[styles.amPmDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={[styles.amPmBtn, !isAM && { backgroundColor: colors.highlight + '33' }]} 
                onPress={handleSetPM}
              >
                <Text style={[styles.amPmText, { color: !isAM ? colors.highlight : colors.textSecondary }]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Radial Clock Face */}
          <View style={[styles.clockFace, { backgroundColor: colors.backgroundElement }]}>
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim, justifyContent: 'center', alignItems: 'center' }]}>
              {renderNumbers()}

              {/* Hand Line Wrapper centered in clock */}
              <View style={[styles.handWrapper, { transform: [{ rotate: `${currentAngle}deg` }] }]}>
                {/* The visible part of the hand pointing UP (since 0 degrees is top) */}
                <View style={[styles.handLine, { backgroundColor: colors.highlight }]} />
                <View style={styles.handLineSpacer} />
              </View>

              {/* Selection Circle at the tip of the hand */}
              <View style={[
                styles.handCircle, 
                { 
                  backgroundColor: colors.highlight,
                  left: RADIUS + Math.cos((currentAngle - 90) * (Math.PI / 180)) * NUMBER_RADIUS - 20,
                  top: RADIUS + Math.sin((currentAngle - 90) * (Math.PI / 180)) * NUMBER_RADIUS - 20,
                }
              ]}>
                {mode === 'minute' && selectedMinute % 5 !== 0 && (
                  <Text style={styles.minuteDotText}>
                    {formatNumber(selectedMinute, i18n.language)}
                  </Text>
                )}
              </View>

              {/* Center Dot */}
              <View style={[styles.centerDot, { backgroundColor: colors.highlight }]} />
            </Animated.View>

            {/* Touch Overlay spanning the exact circle */}
            <View {...panResponder.panHandlers} style={styles.touchOverlay} />
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.backgroundElement }]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.accent }]} 
              onPress={() => onSave(selectedHour, selectedMinute)}
            >
              <Text style={[styles.buttonText, { color: '#FFF' }]}>{t('settings.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
  },
  headerDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.six,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: Fonts.outfit,
    fontSize: 48,
  },
  timeSeparator: {
    fontFamily: Fonts.outfit,
    fontSize: 48,
    marginHorizontal: 4,
    marginTop: -4,
  },
  amPmContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    width: 60,
  },
  amPmBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  amPmText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontWeight: 'bold',
  },
  amPmDivider: {
    height: 1,
    width: '100%',
  },
  clockFace: {
    width: CLOCK_DIAMETER,
    height: CLOCK_DIAMETER,
    borderRadius: RADIUS,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    zIndex: 10,
  },
  numberContainer: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Above hand line, below touch overlay
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    zIndex: 3,
  },
  handWrapper: {
    position: 'absolute',
    width: 2,
    height: NUMBER_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  handLine: {
    flex: 1,
    width: '100%',
  },
  handLineSpacer: {
    flex: 1,
  },
  handCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minuteDotText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.five,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
});
