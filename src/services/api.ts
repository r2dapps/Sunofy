import { Track } from '../types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class MusicAPI {
  public currentSource: 'jiosaavn' | 'youtube' | 'local' = 'jiosaavn';
  
  /**
   * Cascading API mirrors for JioSaavn query execution with environment detection:
   * - Localhost: tries local backend proxy first, then primary public CORS endpoints.
   * - GitHub Pages: tries high-speed CORS-enabled saavn.dev & saavn.sumit.co endpoints, with fallback mirrors.
   * - Other hosts: iterates through all available public & local endpoints.
   */
  private get apiMirrors(): string[] {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return [
        'http://localhost:3000/api',             // Local Node/Express proxy
        'https://saavn.sumit.co/api',             // Primary public Saavn API mirror
        'https://saavn-api.vercel.app',          // Secondary Vercel API mirror
        'https://jiosaavn-api.vercel.app/api'    // Fallback API mirror
      ];
    } else if (hostname.includes('github.io')) {
      return [
        'https://saavn.sumit.co/api',             // Primary public mirror for GitHub Pages
        'https://saavn-api.vercel.app',          // Secondary Vercel API mirror
        'https://jiosaavn-api.vercel.app/api'    // Fallback API mirror
      ];
    } else {
      return [
        'https://saavn.sumit.co/api',
        'https://saavn-api.vercel.app',
        'https://jiosaavn-api.vercel.app/api',
        '/api'
      ];
    }
  }

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

    // Iterate through configured apiMirrors until one returns valid song data
    for (let i = 0; i < this.apiMirrors.length; i++) {
      const base = this.apiMirrors[i];
      try {
        const res = await fetch(`${base}/search/songs?query=${encodeURIComponent(query)}${langQuery}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          const results = data.data?.results || data.data || (Array.isArray(data) ? data : null);
          if (results && Array.isArray(results) && results.length > 0) {
            const formatted = results.map((s: any) => this.formatSong(s));
            this.setCache(cacheKey, formatted);
            return formatted;
          }
        }
      } catch (e) {}
    }
    return this.getLocalMockSongs(query);
  }

  async searchPlaylists(query: string): Promise<any[]> {
    if (!query || query.trim() === '' || this.currentSource === 'local') return [];
    const cacheKey = `playlists_${query.trim().toLowerCase()}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    // Iterate through configured apiMirrors for playlist search
    for (let i = 0; i < this.apiMirrors.length; i++) {
      const base = this.apiMirrors[i];
      try {
        const res = await fetch(`${base}/search/playlists?query=${encodeURIComponent(query)}&limit=50`);
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

    // Iterate through configured apiMirrors for album search
    for (let i = 0; i < this.apiMirrors.length; i++) {
      const base = this.apiMirrors[i];
      try {
        const res = await fetch(`${base}/search/albums?query=${encodeURIComponent(query)}&limit=50`);
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

    // Iterate through configured apiMirrors for playlist details
    for (let i = 0; i < this.apiMirrors.length; i++) {
      const base = this.apiMirrors[i];
      try {
        const res = await fetch(`${base}/playlists?id=${encodeURIComponent(id)}`);
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
    let imgUrl = './favicon.ico';
    if (Array.isArray(s.image) && s.image.length > 0) {
      const lastImg = s.image[s.image.length - 1];
      imgUrl = typeof lastImg === 'string' ? lastImg : (lastImg.link || lastImg.url || imgUrl);
    } else if (typeof s.image === 'string' && s.image.length > 5) {
      imgUrl = s.image;
    }

    // Extract best download audio stream URL
    let audioUrl = 'https://aac.saavncdn.com/274/b7a2d39893d56f6c94481bc265e38600_160.mp3';
    if (Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0) {
      const bestStream = s.downloadUrl[s.downloadUrl.length - 1] || s.downloadUrl[2] || s.downloadUrl[0];
      audioUrl = typeof bestStream === 'string' ? bestStream : (bestStream.link || bestStream.url || audioUrl);
    } else if (typeof s.downloadUrl === 'string' && s.downloadUrl.length > 5) {
      audioUrl = s.downloadUrl;
    } else if (s.url && typeof s.url === 'string') {
      audioUrl = s.url;
    }

    if (audioUrl.startsWith('http:')) {
      audioUrl = audioUrl.replace('http:', 'https:');
    }
    if (imgUrl.startsWith('http:')) {
      imgUrl = imgUrl.replace('http:', 'https:');
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

    // 1. Try local Express proxy endpoint first if running on localhost
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.results || data.items || [];
          if (items.length > 0) {
            const tracks: Track[] = items.map((item: any, idx: number) => ({
              id: `yt_${item.videoId || item.id || idx}`,
              title: item.title,
              artist: item.artist || item.author || 'YouTube Music',
              album: 'YouTube Music Live',
              image: item.image || item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
              duration: item.lengthSeconds || 210,
              downloadUrl: item.videoUrl || `https://www.youtube.com/watch?v=${item.videoId}`,
              mediaType: 'video',
              isVideo: true,
              isCobalt: true,
            }));
            this.setCache(cacheKey, tracks);
            return tracks;
          }
        }
      } catch (e) {}
    }

    // 2. Try Piped API public CORS mirrors (Fastest & 100% CORS-enabled)
    const pipedMirrors = [
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      `https://api.piped.yt/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      `https://pipedapi.mha.fi/search?q=${encodeURIComponent(query)}&filter=music_songs`
    ];

    for (const mirror of pipedMirrors) {
      try {
        const res = await fetch(mirror, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const pData = await res.json();
          const items = pData.items || pData;
          if (Array.isArray(items) && items.length > 0) {
            const tracks: Track[] = items
              .filter((it: any) => it.type === 'stream' || it.url || it.videoId)
              .slice(0, 25)
              .map((it: any) => {
                const videoId = it.url ? it.url.replace('/watch?v=', '') : (it.videoId || 'yt_id');
                return {
                  id: `yt_${videoId}`,
                  title: it.title || 'YouTube Song',
                  artist: it.uploaderName || 'YouTube Artist',
                  album: 'YouTube Music Live',
                  image: it.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                  duration: it.duration || 210,
                  downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
                  mediaType: 'video',
                  isVideo: true,
                  isCobalt: true,
                };
              });
            if (tracks.length > 0) {
              this.setCache(cacheKey, tracks);
              return tracks;
            }
          }
        }
      } catch (e) {}
    }

    // 3. Fallback to JioSaavn with YouTube Music tag if all mirrors fail
    const tracks = await this.searchSongs(query);
    return tracks.map(t => ({
      ...t,
      artist: t.artist + ' (YouTube Music)',
      mediaType: 'video',
      isVideo: true,
      isCobalt: true
    }));
  }

  async extractCobaltStream(url: string): Promise<string | null> {
    const extractYtId = (link: string): string => {
      const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? match[1] : '';
    };

    const videoId = extractYtId(url);

    // 1. Try Piped Streams API (100% CORS-enabled direct audio stream extraction)
    if (videoId) {
      const pipedStreamUrls = [
        `https://pipedapi.kavin.rocks/streams/${videoId}`,
        `https://api.piped.yt/streams/${videoId}`,
        `https://pipedapi.mha.fi/streams/${videoId}`
      ];

      for (const pUrl of pipedStreamUrls) {
        try {
          const res = await fetch(pUrl);
          if (res.ok) {
            const data = await res.json();
            const audioStreams = data.audioStreams || [];
            if (audioStreams.length > 0) {
              const bestStream = audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
              if (bestStream && bestStream.url) {
                return bestStream.url;
              }
            }
          }
        } catch (e) {}
      }
    }

    // 2. Try Cobalt API instances with updated payload schema
    const cobaltInstances = [
      'https://api.cobalt.tools/',
      'https://co.wuk.sh/api/json',
      'https://cobalt.qtfy.dev/'
    ];

    for (const cobUrl of cobaltInstances) {
      try {
        const res = await fetch(cobUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            downloadMode: 'audio',
            audioFormat: 'mp3',
            videoQuality: 'audio'
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.url || data.audio)) {
            return data.url || data.audio;
          }
        }
      } catch (err) {}
    }

    return null;
  }

  getLocalMockSongs(query: string): Track[] {
    const catalog: Track[] = [
      {
        id: 'mock_1',
        title: 'Telugu Melodies Anthem',
        artist: 'Tollywood Express',
        album: 'Top Hits 2026',
        image: './icon-192.png',
        duration: 200,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_theme_park.ogg',
      },
      {
        id: 'mock_2',
        title: 'Tollywood Mass Beats',
        artist: 'Thaman S & DSP',
        album: 'Mass Beats 2026',
        image: './icon-192.png',
        duration: 215,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      },
      {
        id: 'mock_3',
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        image: './icon-192.png',
        duration: 203,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/thunderstorm.ogg',
      },
      {
        id: 'mock_4',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: './icon-192.png',
        duration: 215,
        downloadUrl: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
      },
      {
        id: 'mock_5',
        title: 'As It Was',
        artist: 'Harry Styles',
        album: "Harry's House",
        image: './icon-192.png',
        duration: 167,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
      },
      {
        id: 'mock_6',
        title: 'Nuvvosthanante Neneddantana',
        artist: 'Devi Sri Prasad, Chitra',
        album: 'Varsham',
        image: './icon-192.png',
        duration: 245,
        downloadUrl: 'https://actions.google.com/sounds/v1/transportation/car_passing.ogg',
      },
      {
        id: 'mock_7',
        title: 'Samajavaragamana',
        artist: 'Sid Sriram, Thaman S',
        album: 'Ala Vaikunthapurramuloo',
        image: './icon-192.png',
        duration: 220,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg',
      },
      {
        id: 'mock_8',
        title: 'Kesariya',
        artist: 'Arijit Singh, Pritam',
        album: 'Brahmastra',
        image: './icon-192.png',
        duration: 268,
        downloadUrl: 'https://actions.google.com/sounds/v1/ambiences/forest.ogg',
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
