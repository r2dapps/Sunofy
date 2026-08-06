import { DownloadTrack, Track } from '../types';

const DB_NAME = 'sunofy_offline_db';
const STORE_NAME = 'downloaded_tracks';
const PLAYLIST_STORE = 'offline_playlists';
const DB_VERSION = 2; // Bumped to add offline_playlists store

export interface OfflinePlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  image?: string;
}

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
        if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {
          db.createObjectStore(PLAYLIST_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTrackForOffline(track: Track, onProgress?: (pct: number) => void): Promise<DownloadTrack> {
    let audioBlob: Blob | null = null;
    let sizeBytes = 0;

    onProgress?.(10);

    if (track.downloadUrl && track.downloadUrl.startsWith('blob:')) {
      try {
        const res = await fetch(track.downloadUrl);
        if (res.ok) audioBlob = await res.blob();
      } catch (e) {
        console.warn('Failed to fetch existing blob URL', e);
      }
    }

    if (!audioBlob && track.downloadUrl && track.downloadUrl !== '#') {
      onProgress?.(30);
      try {
        const res = await fetch(track.downloadUrl);
        if (res.ok) audioBlob = await res.blob();
      } catch (fetchErr) {
        console.debug('Direct audio fetch blocked, trying proxy...', fetchErr);
      }

      if (!audioBlob) {
        try {
          onProgress?.(50);
          const proxyRes = await fetch(`/api/proxy-audio?url=${encodeURIComponent(track.downloadUrl)}`);
          if (proxyRes.ok) audioBlob = await proxyRes.blob();
        } catch (proxyErr) {
          console.debug('Server proxy fetch failed:', proxyErr);
        }
      }
    }

    if (!audioBlob) {
      throw new Error('Failed to download audio blob. Aborting offline save to prevent ghost cards.');
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
    const offlineBlobUrl = URL.createObjectURL(audioBlob);
    return { ...downloadItem, offlineBlobUrl };
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
            const isValidBlob = item.blob && item.blob.size > 100000;
            if (isValidBlob) validItems.push(item);
            else if (item.blob) corruptedIds.push(item.id);
          });

          if (corruptedIds.length > 0) {
            console.info(`🧹 Auto-cleaned ${corruptedIds.length} corrupted downloads.`);
            setTimeout(() => {
              corruptedIds.forEach(id => this.removeOfflineTrack(id).catch(console.error));
            }, 1000);
          }

          const formatted = validItems.map((item: any) => ({
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
          }));
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
    // Also remove from any playlists that contain this track
    const playlists = await this.getAllOfflinePlaylists();
    for (const pl of playlists) {
      if (pl.trackIds.includes(id)) {
        await this.updateOfflinePlaylist(pl.id, { trackIds: pl.trackIds.filter(t => t !== id) });
      }
    }
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

  // ─── Offline Playlist Methods ─────────────────────────────────────────────

  async getAllOfflinePlaylists(): Promise<OfflinePlaylist[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PLAYLIST_STORE, 'readonly');
        const store = tx.objectStore(PLAYLIST_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  async createOfflinePlaylist(name: string): Promise<OfflinePlaylist> {
    const playlist: OfflinePlaylist = {
      id: `opl_${Date.now()}`,
      name: name.trim(),
      trackIds: [],
      createdAt: Date.now(),
    };
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PLAYLIST_STORE, 'readwrite');
      const store = tx.objectStore(PLAYLIST_STORE);
      const req = store.put(playlist);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return playlist;
  }

  async updateOfflinePlaylist(id: string, updates: Partial<OfflinePlaylist>): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYLIST_STORE, 'readwrite');
      const store = tx.objectStore(PLAYLIST_STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (!existing) { resolve(); return; }
        const updated = { ...existing, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async addTrackToOfflinePlaylist(playlistId: string, trackId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYLIST_STORE, 'readwrite');
      const store = tx.objectStore(PLAYLIST_STORE);
      const getReq = store.get(playlistId);
      getReq.onsuccess = () => {
        const pl = getReq.result as OfflinePlaylist | undefined;
        if (!pl) { resolve(); return; }
        if (!pl.trackIds.includes(trackId)) {
          pl.trackIds = [...pl.trackIds, trackId];
          const putReq = store.put(pl);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async removeTrackFromOfflinePlaylist(playlistId: string, trackId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYLIST_STORE, 'readwrite');
      const store = tx.objectStore(PLAYLIST_STORE);
      const getReq = store.get(playlistId);
      getReq.onsuccess = () => {
        const pl = getReq.result as OfflinePlaylist | undefined;
        if (!pl) { resolve(); return; }
        pl.trackIds = pl.trackIds.filter(id => id !== trackId);
        const putReq = store.put(pl);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async deleteOfflinePlaylist(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYLIST_STORE, 'readwrite');
      const store = tx.objectStore(PLAYLIST_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const offlineStore = new OfflineStore();
