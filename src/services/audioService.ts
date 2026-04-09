import { Audio, AVPlaybackStatus } from 'expo-av';
import { Chapter, Book } from '../types';

let soundObject: Audio.Sound | null = null;
let currentCallback: ((status: AVPlaybackStatus) => void) | null = null;

export const audioService = {

  async setup(): Promise<void> {
    // Настройка аудио сессии — позволяет воспроизводить в фоне
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  },

  async loadChapter(
    chapter: Chapter,
    onStatusUpdate: (status: AVPlaybackStatus) => void,
    startPosition = 0,
  ): Promise<void> {
    // Выгружаем предыдущий звук
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }

    currentCallback = onStatusUpdate;

    const { sound } = await Audio.Sound.createAsync(
      { uri: chapter.audio_url },
      {
        shouldPlay: false,
        positionMillis: startPosition * 1000,
        progressUpdateIntervalMillis: 500,
      },
      onStatusUpdate,
    );

    soundObject = sound;
  },

  async play(): Promise<void> {
    if (soundObject) await soundObject.playAsync();
  },

  async pause(): Promise<void> {
    if (soundObject) await soundObject.pauseAsync();
  },

  async seekTo(seconds: number): Promise<void> {
    if (soundObject) await soundObject.setPositionAsync(seconds * 1000);
  },

  async setSpeed(speed: number): Promise<void> {
    if (soundObject) {
      await soundObject.setRateAsync(speed, true);
    }
  },

  async getStatus(): Promise<AVPlaybackStatus | null> {
    if (!soundObject) return null;
    return await soundObject.getStatusAsync();
  },

  async unload(): Promise<void> {
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }
  },

  isLoaded(): boolean {
    return soundObject !== null;
  },
};
