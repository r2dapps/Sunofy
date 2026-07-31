import { Favorites, Playlist, UserProfile } from '../types';

export interface CloudLibraryData {
  playlists: Playlist[];
  favorites: Favorites;
  profile: UserProfile;
  updatedAt: string;
}

class CloudSyncService {
  private syncEndpoint = '/api/library/sync';

  async syncToCloud(data: {
    playlists: Playlist[];
    favorites: Favorites;
    profile: UserProfile;
  }): Promise<{ success: boolean; timestamp: string }> {
    try {
      const payload: CloudLibraryData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(this.syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        return { success: true, timestamp: result.updatedAt || new Date().toLocaleTimeString() };
      }
    } catch (e) {
      console.warn('Cloud sync offline fallback active');
    }

    // Local storage fallback if offline
    localStorage.setItem('sunofy_cloud_backup', JSON.stringify({
      playlists: data.playlists,
      favorites: data.favorites,
      profile: data.profile,
      updatedAt: new Date().toISOString()
    }));

    return { success: true, timestamp: new Date().toLocaleTimeString() + ' (Local)' };
  }

  async fetchFromCloud(): Promise<CloudLibraryData | null> {
    try {
      const res = await fetch(this.syncEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.playlists) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Cloud fetch offline');
    }

    const backup = localStorage.getItem('sunofy_cloud_backup');
    if (backup) {
      try {
        return JSON.parse(backup);
      } catch (e) {
        return null;
      }
    }

    return null;
  }
}

export const cloudSync = new CloudSyncService();
