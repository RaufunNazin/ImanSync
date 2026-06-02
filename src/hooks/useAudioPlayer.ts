import { useAudioPlayer as useExpoAudioPlayer } from 'expo-audio';

import * as Speech from 'expo-speech';

export function useAudioPlayer() {
  const player = useExpoAudioPlayer(null);

  async function playAudio(url: string | null | undefined, fallbackText?: string) {
    if (!url) {
      if (fallbackText) {
        Speech.speak(fallbackText, { language: 'ar-SA' });
      }
      return;
    }
    
    // Ensure correct URL prefix if it's missing from API
    const fullUrl = url.startsWith('//') ? `https:${url}` : url;

    try {
      player.replace(fullUrl);
      player.play();
    } catch (e) {
      console.error("Audio playback failed", e);
      if (fallbackText) {
        Speech.speak(fallbackText, { language: 'ar-SA' });
      }
    }
  }

  return { playAudio, isPlaying: player.playing };
}
