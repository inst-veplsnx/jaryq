import { Audio, AVPlaybackStatus } from 'expo-av';
import { Chapter, Book } from '../types';
import { getLocalChapterUri } from './downloadService';

let soundObject: Audio.Sound | null = null;
let currentCallback: ((status: AVPlaybackStatus) => void) | null = null;
let loadGeneration = 0;
const LOAD_TIMEOUT_MS = 15_000;

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
    localUri?: string,
  ): Promise<void> {
    // Increment generation so any in-flight callbacks from a previous load are discarded
    const myGen = ++loadGeneration;

    // Clear the ref before the async unload so concurrent calls don't double-unload
    if (soundObject) {
      const previous = soundObject;
      soundObject = null;
      await previous.unloadAsync().catch(() => {});
    }

    // Wrap callback: discard status events from a superseded load
    const wrappedCallback = (status: AVPlaybackStatus) => {
      if (loadGeneration !== myGen) return;
      onStatusUpdate(status);
    };
    currentCallback = wrappedCallback;

    // overrideFileExtensionAndroid: hints ExoPlayer at the format when the URL has no extension
    const audioSource = {
      uri: localUri || chapter.audio_url,
      overrideFileExtensionAndroid: 'm4a',
    };

    const loadPromise = Audio.Sound.createAsync(
      audioSource,
      {
        shouldPlay: false,
        positionMillis: startPosition * 1000,
        progressUpdateIntervalMillis: 500,
      },
      wrappedCallback,
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Превышено время ожидания загрузки аудио')),
        LOAD_TIMEOUT_MS,
      ),
    );

    const { sound } = await Promise.race([loadPromise, timeoutPromise]);

    // If another loadChapter call raced past us, release this sound immediately
    if (loadGeneration !== myGen) {
      sound.unloadAsync().catch(() => {});
      return;
    }

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
    const status = await soundObject.getStatusAsync();
    if (!status.isLoaded) return null;
    return status;
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

  /** Получить локальный URI для главы, если он доступен */
  async getLocalUriForChapter(chapter: Chapter, book: Book): Promise<string | null> {
    return await getLocalChapterUri(book.id, chapter.id);
  },
};
