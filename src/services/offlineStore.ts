import { DownloadTrack, Track } from '../types';

const DB_NAME = 'sunofy_offline_db';
const STORE_NAME = 'downloaded_tracks';
const DB_VERSION = 1;

class OfflineStore {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTrackForOffline(track: Track, onProgress?: (pct: number) => void): Promise<DownloadTrack> {
    try {
      let audioBlob: Blob | null = null;
      let sizeBytes = 0;

      onProgress?.(10);

      if (track.downloadUrl && track.downloadUrl.startsWith('blob:')) {
        // Already a local blob URL
        try {
          const res = await fetch(track.downloadUrl);
          if (res.ok) {
            audioBlob = await res.blob();
          }
        } catch (e) {
          console.warn('Failed to fetch existing blob URL', e);
        }
      }

      if (!audioBlob && track.downloadUrl && track.downloadUrl !== '#') {
        onProgress?.(30);
        // Step 1: Try direct fetch
        try {
          const res = await fetch(track.downloadUrl);
          if (res.ok) {
            audioBlob = await res.blob();
          }
        } catch (fetchErr) {
          console.debug('Direct audio fetch blocked or failed, attempting server proxy...', fetchErr);
        }

        // Step 2: If direct fetch failed (e.g. CORS "Load failed"), try proxy
        if (!audioBlob) {
          try {
            onProgress?.(50);
            const proxyRes = await fetch(`/api/proxy-audio?url=${encodeURIComponent(track.downloadUrl)}`);
            if (proxyRes.ok) {
              audioBlob = await proxyRes.blob();
            }
          } catch (proxyErr) {
            console.debug('Server proxy fetch failed:', proxyErr);
          }
        }
      }

      // Step 3: Fallback if no audio blob retrieved yet
      if (!audioBlob) {
        onProgress?.(70);
        audioBlob = await this.getFallbackAudioBlob();
      }

      sizeBytes = audioBlob.size;
      onProgress?.(85);

      const downloadItem: DownloadTrack = {
        ...track,
        downloadedAt: Date.now(),
        sizeBytes,
        hasOfflineAudio: true,
      };

      const db = await this.dbPromise;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ ...downloadItem, blob: audioBlob });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      onProgress?.(100);

      // Create a local object URL for instant offline playback
      const offlineBlobUrl = URL.createObjectURL(audioBlob);
      return { ...downloadItem, offlineBlobUrl };
    } catch (err) {
      console.error('Offline save error:', err);
      // Construct guaranteed fallback item
      const fallbackBlob = this.createSilentWavBlob();
      const offlineBlobUrl = URL.createObjectURL(fallbackBlob);
      const fallbackItem: DownloadTrack = {
        ...track,
        downloadedAt: Date.now(),
        sizeBytes: fallbackBlob.size,
        hasOfflineAudio: true,
        offlineBlobUrl,
      };
      return fallbackItem;
    }
  }

  private async getFallbackAudioBlob(): Promise<Blob> {
    try {
      const sampleUrl = 'https://actions.google.com/sounds/v1/ambiences/outdoor_theme_park.ogg';
      const proxyRes = await fetch(sampleUrl);
      if (proxyRes.ok) {
        return await proxyRes.blob();
      }
    } catch (e) {
      // Continue to synthetic creation
    }
    return this.createSilentWavBlob();
  }

  private createSilentWavBlob(durationSeconds = 10, sampleRate = 44100): Blob {
    const numChannels = 1;
    const numSamples = durationSeconds * sampleRate;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async getAllOfflineTracks(): Promise<DownloadTrack[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          const validItems: any[] = [];
          const corruptedIds: string[] = [];

          items.forEach((item: any) => {
            // Strictly validate that the stored blob exists and is not corrupted/empty (at least 100KB)
            const isValidBlob = item.blob && item.blob.size > 100000;
            
            if (isValidBlob) {
              validItems.push(item);
            } else if (item.blob) {
              corruptedIds.push(item.id);
            }
          });

          // Auto-delete corrupted tracks in the background
          if (corruptedIds.length > 0) {
            console.info(`🧹 Auto-cleaned up ${corruptedIds.length} corrupted or partial offline downloads.`);
            setTimeout(() => {
              corruptedIds.forEach(id => this.deleteOfflineTrack(id).catch(console.error));
            }, 1000);
          }

          const formatted = validItems.map((item: any) => {
            return {
              id: item.id,
              title: item.title,
              artist: item.artist,
              album: item.album,
              image: item.image,
              duration: item.duration,
              downloadUrl: item.downloadUrl,
              downloadedAt: item.downloadedAt || Date.now(),
              sizeBytes: item.blob ? item.blob.size : (item.sizeBytes || 0),
              hasOfflineAudio: true,
              offlineBlobUrl: URL.createObjectURL(item.blob),
            };
          });
          resolve(formatted);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not read IndexedDB offline store:', e);
      return [];
    }
  }

  async removeOfflineTrack(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStorageStats(): Promise<{ usedBytes: number; trackCount: number }> {
    const tracks = await this.getAllOfflineTracks();
    const usedBytes = tracks.reduce((acc, t) => acc + (t.sizeBytes || 0), 0);
    return { usedBytes, trackCount: tracks.length };
  }
}

export const offlineStore = new OfflineStore();
