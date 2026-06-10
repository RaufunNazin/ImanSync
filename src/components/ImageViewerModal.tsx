import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';
import ZoomableImage from './ZoomableImage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ImageViewerModalProps {
  visible: boolean;
  source: ImageSourcePropType;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageViewerModal({ visible, source, onClose }: ImageViewerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Close button */}
          <TouchableOpacity activeOpacity={1} style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Zoomable image */}
          <GestureHandlerRootView style={styles.scrollContent}>
            <TouchableWithoutFeedback>
              <View>
                <ZoomableImage source={source} />
              </View>
            </TouchableWithoutFeedback>
          </GestureHandlerRootView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
});
