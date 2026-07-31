import { Track } from '../types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class MusicAPI {
  public currentSource: 'jiosaavn' | 'youtube' | 'local' = 'jiosaavn';
  private localApiUrl = '/api/search/songs';
  private primaryUrl = 'https://saavn.sumit.co/api';
  private fallbackUrl = 'https://jiosaavn-api-v3.vercel.app/api';
  private cacheTTLMs = 20 * 60 * 1000; // 20 minutes API cache
  private memoryCache = new Map<string, CacheItem<any>>();

  private getCached<T>(key: string): T | null {
    // Check in-memory first
    const mem = this.memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < this.cacheTTLMs) {
      return mem.data;
    }

    // Check localStorage fallback
    try {
      const raw = localStorage.getItem(`sunofy_cache_${key}`);
      if (raw) {
        const item: CacheItem<T> = JSON.parse(raw);
        if (Date.now() - item.timestamp < this.cacheTTLMs) {
          this.memoryCache.set(key, item);
          return item.data;
        }
      }
    } catch (e) {}

    return null;
  }

  private setCache<T>(key: string, data: T) {
    const item: CacheItem<T> = { data, timestamp: Date.now() };
    this.memoryCache.set(key, item);
    try {
      localStorage.setItem(`sunofy_cache_${key}`, JSON.stringify(item));
    } catch (e) {}
  }

  async searchSongs(query: string, language?: string): Promise<Track[]> {
    if (!query || query.trim() === '') return [];

    if (this.currentSource === 'local') {
      return this.getLocalMockSongs(query);
    }

    const cacheKey = `songs_${query.trim().toLowerCase()}_${language || 'all'}`;
    const cached = this.getCached<Track[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    const langQuery = language ? `&language=${encodeURIComponent(language)}` : '';

    // 1. Try primary working mirror with extended limit of 50
    try {
      const res = await fetch(`${this.primaryUrl}/search/songs?query=${encodeURIComponent(query)}${langQuery}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const results = data.data?.results || data.data || (Array.isArray(data) ? data : null);
        if (results && Array.isArray(results) && results.length > 0) {
          const formatted = results.map((s: any) => this.formatSong(s));
          this.setCache(cacheKey, formatted);
          return formatted;
        }
      }
    } catch (e) {
      console.debug('Primary saavn mirror failed, trying local proxy...');
    }

    // 2. Try local express backend proxy with extended limit of 50
    try {
      const res = await fetch(`${this.localApiUrl}?query=${encodeURIComponent(query)}${langQuery}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const results = data.data?.results || data.data || (Array.isArray(data) ? data : null);
        if (results && Array.isArray(results) && results.length > 0) {
          const formatted = results.map((s: any) => this.formatSong(s));
          this.setCache(cacheKey, formatted);
          return formatted;
        }
      }
    } catch (e) {
      console.debug('Local proxy failed, trying secondary fallback...');
    }

    // 3. Try secondary public mirror with extended limit of 50
    try {
      const res = await fetch(`${this.fallbackUrl}/search/songs?query=${encodeURIComponent(query)}${langQuery}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.data?.results || data.data);
        if (results && Array.isArray(results) && results.length > 0) {
          const formatted = results.map((s: any) => this.formatSong(s));
          this.setCache(cacheKey, formatted);
          return formatted;
        }
      }
    } catch (e) {
      console.warn('All live JioSaavn APIs failed, serving emergency catalog');
    }

    // Placeholders are returned strictly if all APIs fail
    return this.getLocalMockSongs(query);
  }

  async searchPlaylists(query: string): Promise<any[]> {
    if (!query || query.trim() === '' || this.currentSource === 'local') return [];
    const cacheKey = `playlists_${query.trim().toLowerCase()}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    const urls = [
      `/api/search/playlists?query=${encodeURIComponent(query)}&limit=50`,
      `${this.primaryUrl}/search/playlists?query=${encodeURIComponent(query)}&limit=50`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const results = json.data?.results || json.data || (Array.isArray(json) ? json : null);
          if (results && Array.isArray(results) && results.length > 0) {
            this.setCache(cacheKey, results);
            return results;
          }
        }
      } catch (e) {}
    }
    return [];
  }

  async searchAlbums(query: string): Promise<any[]> {
    if (!query || query.trim() === '' || this.currentSource === 'local') return [];
    const cacheKey = `albums_${query.trim().toLowerCase()}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    const urls = [
      `/api/search/albums?query=${encodeURIComponent(query)}&limit=50`,
      `${this.primaryUrl}/search/albums?query=${encodeURIComponent(query)}&limit=50`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const results = json.data?.results || json.data || (Array.isArray(json) ? json : null);
          if (results && Array.isArray(results) && results.length > 0) {
            this.setCache(cacheKey, results);
            return results;
          }
        }
      } catch (e) {}
    }
    return [];
  }

  async getPlaylistDetails(id: string): Promise<{ name: string; songs: Track[] } | null> {
    if (!id) return null;
    const cacheKey = `pldetail_${id}`;
    const cached = this.getCached<{ name: string; songs: Track[] }>(cacheKey);
    if (cached) return cached;

    const urls = [
      `/api/playlists?id=${encodeURIComponent(id)}`,
      `${this.primaryUrl}/playlists?id=${encodeURIComponent(id)}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const songsRaw = data.songs || data.results || [];
          if (Array.isArray(songsRaw) && songsRaw.length > 0) {
            const result = {
              name: data.name || data.title || 'Public Playlist',
              songs: songsRaw.map((s: any) => this.formatSong(s)),
            };
            this.setCache(cacheKey, result);
            return result;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  public formatSong(s: any): Track {
    // Extract best image link
    let imgUrl = '/favicon.ico';
    if (Array.isArray(s.image) && s.image.length > 0) {
      const lastImg = s.image[s.image.length - 1];
      imgUrl = typeof lastImg === 'string' ? lastImg : (lastImg.link || lastImg.url || imgUrl);
    } else if (typeof s.image === 'string' && s.image.length > 5) {
      imgUrl = s.image;
    }

    // Extract best download audio stream URL
    let audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    if (Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0) {
      const bestStream = s.downloadUrl[s.downloadUrl.length - 1] || s.downloadUrl[2] || s.downloadUrl[0];
      audioUrl = typeof bestStream === 'string' ? bestStream : (bestStream.link || bestStream.url || audioUrl);
    } else if (typeof s.downloadUrl === 'string' && s.downloadUrl.length > 5) {
      audioUrl = s.downloadUrl;
    } else if (s.url && typeof s.url === 'string') {
      audioUrl = s.url;
    }

    // Clean up title & artists
    const title = (s.name || s.title || s.song || 'Untitled Song')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&');

    let artist = 'Sunofy Collection';
    if (typeof s.primaryArtists === 'string') artist = s.primaryArtists;
    else if (Array.isArray(s.artists?.primary) && s.artists.primary.length > 0) {
      artist = s.artists.primary.map((a: any) => a.name).join(', ');
    } else if (s.artist) artist = typeof s.artist === 'string' ? s.artist : s.artist.name || artist;
    else if (s.subtitle) artist = s.subtitle;

    artist = artist.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');

    return {
      id: s.id ? String(s.id) : 'tr_' + Math.random().toString(36).substring(2, 9),
      title,
      artist,
      album: (s.album?.name || s.album || 'Single').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      image: imgUrl,
      duration: s.duration ? Number(s.duration) : 210,
      downloadUrl: audioUrl,
      lyrics: s.hasLyrics ? s.lyrics || 'Lyrics loaded from JioSaavn.' : undefined,
    };
  }

  async searchYoutubeCobalt(query: string): Promise<Track[]> {
    if (!query || query.trim() === '' || this.currentSource === 'local') return [];
    const cacheKey = `yt_${query.trim().toLowerCase()}`;
    const cached = this.getCached<Track[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.results || data.items || [];
        if (items.length > 0) {
          const tracks = items.map((item: any, idx: number) => ({
            id: `yt_${item.videoId || item.id || idx}`,
            title: item.title,
            artist: item.artist || item.author || 'YouTube Music',
            album: 'YouTube Music Live',
            image: item.image || item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            duration: item.lengthSeconds || 210,
            downloadUrl: item.videoUrl || `https://www.youtube.com/watch?v=${item.videoId}`,
            isCobalt: true,
          }));
          this.setCache(cacheKey, tracks);
          return tracks;
        }
      }
    } catch (e) {
      console.warn('YouTube search API failed', e);
    }
    
    // Fallback to JioSaavn with YouTube tag if YT search endpoint fails
    const tracks = await this.searchSongs(query);
    return tracks.map(t => ({
      ...t,
      artist: t.artist + ' (YouTube Stream)',
      isCobalt: true
    }));
  }

  async extractCobaltStream(url: string): Promise<string | null> {
    try {
      // Connect directly to Cobalt API from client side for static hosting (Git Pages)
      const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          videoQuality: 'audio',
          audioFormat: 'mp3',
          audioBitrate: '320'
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          return data.url;
        }
      }
    } catch (err) {
      console.error('Cobalt extraction failed:', err);
    }
    return null;
  }

  getLocalMockSongs(query: string): Track[] {
    const catalog: Track[] = [
      {
        id: 'mock_1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: '/icon-192.png',
        duration: 200,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'mock_2',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: '/icon-192.png',
        duration: 215,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'mock_3',
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        image: '/icon-192.png',
        duration: 203,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        id: 'mock_4',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: '/icon-192.png',
        duration: 215,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: 'mock_5',
        title: 'As It Was',
        artist: 'Harry Styles',
        album: "Harry's House",
        image: '/icon-192.png',
        duration: 167,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      },
      {
        id: 'mock_6',
        title: 'Nuvvosthanante Neneddantana',
        artist: 'Devi Sri Prasad, Chitra',
        album: 'Varsham',
        image: '/icon-192.png',
        duration: 245,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      },
      {
        id: 'mock_7',
        title: 'Samajavaragamana',
        artist: 'Sid Sriram, Thaman S',
        album: 'Ala Vaikunthapurramuloo',
        image: '/icon-192.png',
        duration: 220,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      },
      {
        id: 'mock_8',
        title: 'Kesariya',
        artist: 'Arijit Singh, Pritam',
        album: 'Brahmastra',
        image: '/icon-192.png',
        duration: 268,
        downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      },
    ];

    const q = query.toLowerCase();
    const filtered = catalog.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q)
    );
    if (filtered.length > 0) return filtered;
    return catalog;
  }
}

export const musicApi = new MusicAPI();
