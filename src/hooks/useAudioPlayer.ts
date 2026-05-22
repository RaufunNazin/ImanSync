import { useAudioPlayer as useExpoAudioPlayer } from 'expo-audio';
import { useState } from 'react';

export function useAudioPlayer() {
  const player = useExpoAudioPlayer(null);

  async function playAudio(url: string) {
    if (!url) return;
    
    // Ensure correct URL prefix if it's missing from API
    const fullUrl = url.startsWith('//') ? `https:${url}` : url;

    try {
      player.replace(fullUrl);
      player.play();
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }

  return { playAudio, isPlaying: player.playing };
}
