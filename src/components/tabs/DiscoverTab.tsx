import React, { useState, useEffect } from 'react';
import {
  Play, Search, Heart, Download, ListPlus, Radio, Flame, FolderOpen, FolderPlus,
  Music, ChevronRight, ChevronDown, CheckCircle2, Headphones, Activity, X, Plus, 
  Youtube, HardDrive, User, Server, Bookmark, Disc, Compass, Mic, Zap, Check
} from 'lucide-react';
import { musicApi } from '../../services/api';
import { Track, Playlist, Favorites } from '../../types';

interface DiscoverTabProps {
  onPlayTrack: (track: Track) => void;
  onSetQueue?: (queue: Track[]) => void;
  onOpenSearch: () => void;
  onAddToQueue?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  onToggleFavoritePlaylist?: (playlist: Playlist) => void;
  onToggleFavoriteAlbum?: (album: { id: string; title: string; artist: string; image: string; trackCount?: string }) => void;
  onDownloadTrack?: (track: Track) => void;
  playlists?: Playlist[];
  favorites?: Favorites;
  downloads?: Track[];
  localFolderTracks?: Track[];
  onAddSongToPlaylist?: (playlistId: string, song: Track) => void;
  onCreatePlaylist?: (name: string) => void;
  onImportCollectionAsPlaylist?: (name: string, query: string, image?: string) => void;
  musicSource?: 'jiosaavn' | 'cobalt' | 'youtube' | 'local';
  onMusicSourceChange?: (source: 'jiosaavn' | 'cobalt' | 'youtube' | 'local') => void;
  discoverQuery?: string;
  onClearDiscoverQuery?: () => void;
  onImportLocalFiles?: (files: FileList) => void;
  onClearLocalFolderTracks?: () => void;
  isAppLocked?: boolean;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  onPlayTrack,
  onSetQueue,
  onOpenSearch,
  onAddToQueue,
  onToggleFavorite,
  onToggleFavoritePlaylist,
  onToggleFavoriteAlbum,
  onDownloadTrack,
  playlists = [],
  favorites,
  downloads = [],
  localFolderTracks = [],
  onAddSongToPlaylist,
  onCreatePlaylist,
  onImportCollectionAsPlaylist,
  musicSource = 'jiosaavn' as 'jiosaavn' | 'cobalt' | 'youtube' | 'local',
  onMusicSourceChange,
  discoverQuery = '',
  onClearDiscoverQuery,
  onImportLocalFiles,
  onClearLocalFolderTracks,
  isAppLocked = false,
}) => {
  const [selectedTag, setSelectedTag] = useState(() => {
    try {
      const saved = localStorage.getItem('sunofy_discover_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].query;
      }
    } catch(e) {}
    return 'Trending Hits';
  });

  useEffect(() => {
    if (discoverQuery) {
      setSelectedTag(discoverQuery);
      if (onClearDiscoverQuery) {
        onClearDiscoverQuery();
      }
    }
  }, [discoverQuery, onClearDiscoverQuery]);

  const [discoveryTab, setDiscoveryTab] = useState<'songs' | 'playlists' | 'albums'>('songs');
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const [dynamicPlaylists, setDynamicPlaylists] = useState<any[]>([]);
  const [dynamicAlbums, setDynamicAlbums] = useState<any[]>([]);
  
  // Playlist Modal State
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [playlistModalAlbum, setPlaylistModalAlbum] = useState<{name: string, query: string, image?: string} | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  useEffect(() => {
    if (isAppLocked) return;
    let isMounted = true;
    async function loadTracks() {
      setLoading(true);
      setApiError(false);
      try {
        const query = selectedTag ? `${selectedTag}` : 'Trending Hits';
        let tracks: Track[] = [];
        
        if (musicSource === 'youtube' || musicSource === 'cobalt') {
           tracks = await musicApi.searchYoutubeCobalt(query);
        } else if (musicSource === 'local') {
           const offlineList = downloads || [];
           const folderList = localFolderTracks || [];
           tracks = [...offlineList, ...folderList];
        } else {
           tracks = await musicApi.searchSongs(query);
        }

        // Helper to get best image quality
        const getBestImage = (img: any): string => {
          if (!img) return './favicon.ico';
          if (typeof img === 'string') return img;
          if (Array.isArray(img) && img.length > 0) {
            const lastImg = img[img.length - 1];
            return typeof lastImg === 'string' ? lastImg : (lastImg.link || lastImg.url || './favicon.ico');
          }
          return img.link || img.url || './favicon.ico';
        };

        // Fetch dynamic playlists and albums for the active tag/search query
        let plist: any[] = [];
        let alist: any[] = [];
        if (musicSource === 'local') {
          const offlineList = downloads || [];
          const folderList = localFolderTracks || [];
          plist = [
            {
              id: 'local_pl_1',
              name: 'Offline Cache Melodies',
              query: 'Offline Cache Melodies',
              image: './icon-192.png',
              trackCount: `${offlineList.length} tracks`
            },
            {
              id: 'local_pl_2',
              name: 'Imported Device Tracks',
              query: 'Imported Device Tracks',
              image: './icon-192.png',
              trackCount: `${folderList.length} tracks`
            }
          ];
          alist = [
            {
              id: 'local_al_1',
              name: 'Local Collection',
              artist: 'Device Storage',
              query: 'Local Collection',
              image: './icon-192.png',
              trackCount: `${tracks.length} tracks`
            }
          ];
        } else if (musicSource === 'jiosaavn') {
          try {
            const searchQuery = selectedTag ? `${selectedTag}` : 'Trending Hits';
            const [fetchedPlaylists, fetchedAlbums] = await Promise.all([
              musicApi.searchPlaylists(searchQuery).catch(() => []),
              musicApi.searchAlbums(searchQuery).catch(() => [])
            ]);

            if (fetchedPlaylists && fetchedPlaylists.length > 0) {
              plist = fetchedPlaylists.slice(0, 8).map((p: any) => ({
                id: p.id || String(Math.random()),
                name: (p.name || p.title || 'Dynamic Playlist').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                query: (p.name || p.title || searchQuery),
                image: getBestImage(p.image),
                trackCount: p.songCount ? `${p.songCount} tracks` : 'Live Mix'
              }));
            }

            if (fetchedAlbums && fetchedAlbums.length > 0) {
              alist = fetchedAlbums.slice(0, 8).map((a: any) => ({
                id: a.id || String(Math.random()),
                name: (a.name || a.title || 'Dynamic Album').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                query: (a.name || a.title || searchQuery),
                artist: (a.artist || a.music || a.primaryArtists || 'Tollywood Hits').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                image: getBestImage(a.image),
                trackCount: a.songCount ? `${a.songCount} tracks` : 'Album Mix'
              }));
            }
          } catch (e) {
            console.warn('Failed to load dynamic collections', e);
          }
        }
        
        if (isMounted) {
          if (tracks.length === 0 && musicSource !== 'local') {
            setApiError(true);
          }
          setTrendingTracks(tracks);
          if (tracks.length > 0) {
            setFeaturedTrack(tracks[0]);
          } else {
            setFeaturedTrack(null);
          }

          if (plist.length > 0) {
            setDynamicPlaylists(plist);
          } else {
            setDynamicPlaylists([]);
          }

          if (alist.length > 0) {
            setDynamicAlbums(alist);
          } else {
            setDynamicAlbums([]);
          }
        }
      } catch (err) {
        console.error('Failed to load discover tracks', err);
        if (isMounted && musicSource !== 'local') {
          setApiError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, [selectedTag, musicSource, downloads, localFolderTracks, isAppLocked]);

  const [savedTags, setSavedTags] = useState<{label:string, query:string}[]>(() => {
    try {
      const saved = localStorage.getItem('sunofy_discover_tags');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { label: 'Trending', query: 'Trending Hits' },
      { label: 'Global', query: 'Global Top 50' },
      { label: 'Vibe', query: 'Lofi & Chill' },
      { label: 'New', query: 'Latest Releases' }
    ];
  });

  const [editingTagLabel, setEditingTagLabel] = useState<string | null>(null);
  const [newTagQuery, setNewTagQuery] = useState('');

  const handleUpdateTag = (label: string, newQuery: string) => {
    if (!newQuery.trim()) return;
    const updated = savedTags.map(t => t.label === label ? { ...t, query: newQuery.trim() } : t);
    setSavedTags(updated);
    localStorage.setItem('sunofy_discover_tags', JSON.stringify(updated));
    setSelectedTag(newQuery.trim());
    setEditingTagLabel(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isFavorited = (track: Track) => favorites?.songs.some(s => s.id === track.id);
  const isDownloaded = (track: Track) => downloads?.some(s => s.id === track.id);
  const isPlaylistFavorited = (playlistName: string) => favorites?.playlists?.some((p) => p.name === playlistName);
  const isAlbumFavorited = (albumTitle: string) => favorites?.albums?.some((a) => a.title === albumTitle);

  const handleCreateAndAdd = () => {
    if (newPlaylistName.trim() && onCreatePlaylist) {
      if (playlistModalTrack) {
        onCreatePlaylist(newPlaylistName.trim());
        setNewPlaylistName('');
        setShowCreateInput(false);
        setPlaylistModalTrack(null);
      } else if (playlistModalAlbum) {
        onCreatePlaylist(newPlaylistName.trim());
        const query = playlistModalAlbum.query;
        setNewPlaylistName('');
        setShowCreateInput(false);
        setPlaylistModalAlbum(null);
        
        setTimeout(async () => {
           try {
             const tracks = await musicApi.searchSongs(query);
             setTimeout(() => {
                if (playlists && playlists.length > 0 && onAddSongToPlaylist) {
                   const pl = playlists[playlists.length - 1];
                   tracks.forEach(t => onAddSongToPlaylist(pl.id, t));
                }
             }, 300);
           } catch (e) {}
        }, 100);
      }
    }
  };

  const handlePlayCollection = async (query: string) => {
    try {
      let tracks: Track[] = [];
      if (musicSource === 'local') {
        const offlineList = downloads || [];
        const folderList = localFolderTracks || [];
        if (query === 'local_offline') {
          tracks = offlineList;
        } else if (query === 'local_folder') {
          tracks = folderList;
        } else {
          tracks = [...offlineList, ...folderList];
        }
      } else {
        tracks = await musicApi.searchSongs(query);
      }

      if (tracks.length > 0) {
        // Deduplicate tracks to prevent any duplicates in player queue
        const uniqueTracks = tracks.filter((track, index, self) =>
          self.findIndex((t) => t.id === track.id) === index
        );
        onPlayTrack(uniqueTracks[0]);
        if (onSetQueue && uniqueTracks.length > 1) {
          onSetQueue(uniqueTracks.slice(1));
        }
      }
    } catch (e) {
      console.error('Failed to play collection', e);
    }
  };

  return (
    <div className="space-y-7 pb-28 animate-fade">
      {/* Personalized Greeting */}
      <div className="px-2 pt-2">
        <h2 className="text-2xl font-black text-[var(--text-sunofy)] tracking-tight">
          {getGreeting()}<span className="text-[var(--accent-sunofy)]">.</span>
        </h2>
        <p className="text-xs font-semibold text-[var(--muted-sunofy)] mt-1">
          Explore music {musicSource === 'jiosaavn' ? 'from JioSaavn' : musicSource === 'youtube' ? 'from YT Music' : 'from your library'}
        </p>
      </div>

      {/* Top Header Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        {savedTags.map((tag) => {
          const isActive = selectedTag === tag.query;
          if (editingTagLabel === tag.label) {
            return (
              <form key={tag.label} onSubmit={(e) => { e.preventDefault(); handleUpdateTag(tag.label, newTagQuery); }} className="flex items-center gap-1">
                <input autoFocus type="text" value={newTagQuery} onChange={e => setNewTagQuery(e.target.value)} onBlur={() => handleUpdateTag(tag.label, newTagQuery)} placeholder={`Enter ${tag.label}...`} className="bg-[var(--surface-sunofy)] text-xs text-[var(--text-sunofy)] px-3 py-1.5 rounded-full border border-[var(--border-sunofy)] focus:outline-none w-32" />
              </form>
            );
          }
          return (
            <button
              key={tag.label}
              onClick={() => setSelectedTag(tag.query)}
              onDoubleClick={() => { setEditingTagLabel(tag.label); setNewTagQuery(tag.query); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shadow-sm border ${
                isActive
                  ? 'bg-[var(--accent-sunofy)] text-black border-[var(--accent-sunofy)] shadow-[var(--accent-sunofy)]/20'
                  : 'bg-[var(--surface-sunofy)] text-[var(--text-muted-sunofy)] border-[var(--border-sunofy)] hover:border-[var(--text-muted-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <span className="font-bold mr-1 opacity-60">{tag.label}:</span> {tag.query}
            </button>
          );
        })}
        <div className="text-[10px] text-[var(--muted-sunofy)] ml-2 whitespace-nowrap opacity-70 flex items-center">(Double-click to edit)</div>
      </div>

      {apiError && !loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--card-sunofy)] border border-red-500/30 rounded-3xl mx-4 text-center space-y-3 animate-fade shadow-2xl">
          <Server className="w-10 h-10 text-red-500 mb-2 opacity-80" />
          <h2 className="text-lg font-black text-[var(--text-sunofy)]">Unable to Connect</h2>
          <p className="text-xs text-[var(--muted-sunofy)] max-w-sm">
            The music server is currently unreachable or failed to load tracks. Please check your internet connection.
          </p>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => {
                if (onMusicSourceChange) onMusicSourceChange('local');
              }}
              className="px-4 py-2 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-emerald-500 text-xs font-bold text-[var(--text-sunofy)] rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" /> Use Offline Storage
            </button>
            <button
              onClick={() => {
                setLoading(true);
                setSelectedTag(selectedTag + ' '); // force re-trigger
              }}
              className="px-4 py-2 bg-[var(--accent-sunofy)] text-black text-xs font-black rounded-xl transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Featured Release Hero Card */}
      {featuredTrack && !apiError && (
        <div className="relative rounded-3xl overflow-hidden border border-[var(--border-sunofy)] shadow-2xl bg-[var(--card-sunofy)] group transition-all duration-500">
          <div className="absolute inset-0 z-0 opacity-30 group-hover:scale-105 transition-transform duration-700">
            <img src={featuredTrack.image} alt="" className="w-full h-full object-cover blur-lg" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-sunofy)] via-[var(--bg-sunofy)]/70 to-transparent" />
          </div>

          <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-sunofy)] shrink-0">
              <img src={featuredTrack.image} alt={featuredTrack.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[var(--accent-sunofy)] text-black text-[9px] font-black uppercase tracking-wider shadow">
                Featured
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-sunofy)] flex items-center justify-center sm:justify-start gap-1">
                <Flame className="w-3 h-3" /> Trending Release
              </span>
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-sunofy)] truncate mt-1">
                {featuredTrack.title}
              </h1>
              <p className="text-xs font-semibold text-[var(--muted-sunofy)] truncate mt-0.5">
                {featuredTrack.artist}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-4">
                <button
                  onClick={() => {
                    onPlayTrack(featuredTrack);
                    if (onSetQueue && trendingTracks.length > 1) {
                      onSetQueue(trendingTracks.filter(t => t.id !== featuredTrack.id));
                    }
                  }}
                  className="p-2 rounded-xl bg-[var(--accent-sunofy)] text-black flex items-center justify-center hover:scale-105 transition shadow-lg cursor-pointer"
                  title="Play Now"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>

                {onAddToQueue && (
                  <button
                    onClick={() => onAddToQueue(featuredTrack)}
                    className="p-2 rounded-xl bg-[var(--bg-sunofy)]/80 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
                    title="Add to Queue"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(featuredTrack)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isFavorited(featuredTrack)
                        ? 'bg-red-500/20 text-red-500 border-red-500/30'
                        : 'bg-[var(--bg-sunofy)]/80 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border-[var(--border-sunofy)]'
                    }`}
                    title="Favorite"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited(featuredTrack) ? 'fill-red-500' : ''}`} />
                  </button>
                )}

                {onDownloadTrack && (
                  <button
                    onClick={() => onDownloadTrack(featuredTrack)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isDownloaded(featuredTrack)
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-[var(--bg-sunofy)]/80 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border-[var(--border-sunofy)]'
                    }`}
                    title="Download for Offline"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setPlaylistModalTrack(featuredTrack)}
                  className="p-2 rounded-xl bg-[var(--bg-sunofy)]/80 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Discovery Engine Panel */}
      {!apiError && (
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
        


        {/* Local Import Folder Tracks Section inside Discovery Engine */}
        {musicSource === 'local' && (
          <div className="p-4 rounded-2xl bg-[var(--bg-sunofy)] border border-dashed border-[var(--accent-sunofy)]/40 flex flex-col items-center text-center space-y-3 animate-fade">
            <div className="p-3 rounded-full bg-[var(--accent-sunofy)]/10 text-[var(--accent-sunofy)] border border-[var(--accent-sunofy)]/20">
              <FolderOpen className="w-6 h-6 animate-bounce-subtle text-[var(--accent-sunofy)]" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-xs font-black text-[var(--text-sunofy)]">Load Folder / Device Audio</h4>
              <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">Import offline audio tracks directly into Sunofy local queue</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById('discover-folder-input');
                  if (el) el.click();
                }}
                className="px-4 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-black hover:scale-105 shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Import Songs
              </button>
              {localFolderTracks && localFolderTracks.length > 0 && (
                <button
                  onClick={() => onClearLocalFolderTracks && onClearLocalFolderTracks()}
                  className="px-3 py-2 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-red-500 hover:border-red-500/30 text-xs font-bold transition cursor-pointer"
                >
                  Unload All ({localFolderTracks.length})
                </button>
              )}
              <input
                id="discover-folder-input"
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && onImportLocalFiles) {
                    onImportLocalFiles(e.target.files);
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Sub-Navigation Pill Tabs inside Discovery Engine */}
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl">
          <button
            onClick={() => setDiscoveryTab('songs')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
              discoveryTab === 'songs'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-lg scale-[1.02]'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            <Music className="w-4 h-4" /> Songs
          </button>

          <button
            onClick={() => setDiscoveryTab('playlists')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
              discoveryTab === 'playlists'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-lg scale-[1.02]'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            <FolderOpen className="w-4 h-4" /> Playlists
          </button>

          <button
            onClick={() => setDiscoveryTab('albums')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
              discoveryTab === 'albums'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-lg scale-[1.02]'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            <Disc className="w-4 h-4" /> Albums
          </button>
        </div>

        {/* SUB TAB 1: SONGS VIEW */}
        {discoveryTab === 'songs' && (
          <div className="space-y-4 animate-fade">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--card-sunofy)]/50 border border-[var(--border-sunofy)] animate-pulse">
                    <div className="w-12 h-12 bg-[var(--border-sunofy)] rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[var(--border-sunofy)] rounded-lg w-1/3" />
                      <div className="h-2.5 bg-[var(--border-sunofy)] rounded-lg w-1/4" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                {trendingTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      onPlayTrack(track);
                      if (onSetQueue && trendingTracks.length > 0) {
                        onSetQueue(trendingTracks.filter((t) => t.id !== track.id));
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-sunofy)]/80 hover:bg-[var(--hover-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)]/40 transition group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--border-sunofy)] shadow-md aspect-square">
                        <img
                          src={track.image}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300 aspect-square rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                          {track.title}
                        </h4>
                        <p className="text-[11px] font-medium text-[var(--muted-sunofy)] truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Pro Action Buttons Toolbar */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                      {onAddToQueue && (
                        <button
                          onClick={() => onAddToQueue(track)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                          title="Add to Queue"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>
                      )}

                      {onToggleFavorite && (
                        <button
                          onClick={() => onToggleFavorite(track)}
                          className={`p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] transition cursor-pointer ${
                            isFavorited(track) ? 'text-[var(--accent-sunofy)]' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                          }`}
                          title="Favorite"
                        >
                          <Heart className={`w-4 h-4 ${isFavorited(track) ? 'fill-[var(--accent-sunofy)]' : ''}`} />
                        </button>
                      )}

                      {onDownloadTrack && (
                        <button
                          onClick={() => onDownloadTrack(track)}
                          className={`p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] transition cursor-pointer ${
                            isDownloaded(track) ? 'text-emerald-400' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                          }`}
                          title="Download for Offline"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setPlaylistModalTrack(track)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                        title="Add to Playlist"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {trendingTracks.length === 0 && (
                  <div className="p-8 text-center text-[var(--muted-sunofy)] text-sm font-medium">
                    No songs found for this selection.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUB TAB 2: PLAYLISTS VIEW */}
        {discoveryTab === 'playlists' && (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar animate-fade">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--card-sunofy)]/50 border border-[var(--border-sunofy)] animate-pulse">
                    <div className="w-13 h-13 bg-[var(--border-sunofy)] rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[var(--border-sunofy)] rounded-lg w-1/3" />
                      <div className="h-2.5 bg-[var(--border-sunofy)] rounded-lg w-1/4" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              dynamicPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-sunofy)]/80 hover:bg-[var(--hover-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)]/40 transition group cursor-pointer shadow-sm"
                  onClick={() => handlePlayCollection(pl.query)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {imageErrors[pl.id] ? (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[var(--accent-sunofy)]/20 to-[var(--accent-sunofy)]/40 flex items-center justify-center text-xs font-black text-[var(--accent-sunofy)] uppercase shrink-0">
                        {pl.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                    ) : (
                      <img
                        src={pl.image}
                        alt={pl.name}
                        onError={() => handleImageError(pl.id)}
                        className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-[var(--border-sunofy)] shadow-md group-hover:scale-105 transition duration-300 aspect-square"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-[var(--accent-sunofy)] flex items-center gap-1 mt-0.5">
                        <FolderOpen className="w-3 h-3" /> {pl.trackCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayCollection(pl.query)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-extrabold text-xs hover:scale-105 shadow-md transition cursor-pointer"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Play
                    </button>

                    {onToggleFavoritePlaylist && (
                      <button
                        onClick={() => onToggleFavoritePlaylist({ id: pl.id, name: pl.name, songs: [], image: pl.image })}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isPlaylistFavorited(pl.name)
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                            : 'bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                        }`}
                        title="Favorite Playlist"
                      >
                        <Heart className={`w-4 h-4 ${isPlaylistFavorited(pl.name) ? 'fill-red-500' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => onImportCollectionAsPlaylist && onImportCollectionAsPlaylist(pl.name, pl.query, pl.image)}
                      className="p-2 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)]/50 transition cursor-pointer"
                      title="Save to My Playlists"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUB TAB 3: ALBUMS VIEW */}
        {discoveryTab === 'albums' && (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar animate-fade">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--card-sunofy)]/50 border border-[var(--border-sunofy)] animate-pulse">
                    <div className="w-13 h-13 bg-[var(--border-sunofy)] rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[var(--border-sunofy)] rounded-lg w-1/3" />
                      <div className="h-2.5 bg-[var(--border-sunofy)] rounded-lg w-1/4" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                      <div className="w-8 h-8 bg-[var(--border-sunofy)] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              dynamicAlbums.map((album) => (
                <div
                  key={album.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-sunofy)]/80 hover:bg-[var(--hover-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)]/40 transition group cursor-pointer shadow-sm"
                  onClick={() => handlePlayCollection(album.query)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {imageErrors[album.id] ? (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[var(--accent-sunofy)]/20 to-[var(--accent-sunofy)]/40 flex items-center justify-center text-xs font-black text-[var(--accent-sunofy)] uppercase shrink-0">
                        {album.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                    ) : (
                      <img
                        src={album.image}
                        alt={album.name}
                        onError={() => handleImageError(album.id)}
                        className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-[var(--border-sunofy)] shadow-md group-hover:scale-105 transition duration-300 aspect-square"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                        {album.name}
                      </h4>
                      <p className="text-[11px] font-medium text-[var(--muted-sunofy)] truncate">
                        {album.artist}
                      </p>
                      <span className="text-[10px] font-bold text-[var(--accent-sunofy)] mt-0.5 block">
                        {album.trackCount || '12 tracks'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayCollection(album.query)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-extrabold text-xs hover:scale-105 shadow-md transition cursor-pointer"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Play
                    </button>

                    {onToggleFavoriteAlbum && (
                      <button
                        onClick={() => onToggleFavoriteAlbum({ id: album.id, title: album.name, artist: album.artist, image: album.image, trackCount: album.trackCount })}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isAlbumFavorited(album.name)
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                            : 'bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                        }`}
                        title="Favorite Album"
                      >
                        <Heart className={`w-4 h-4 ${isAlbumFavorited(album.name) ? 'fill-red-500' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => onImportCollectionAsPlaylist && onImportCollectionAsPlaylist(album.name, album.query, album.image)}
                      className="p-2 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)]/50 transition cursor-pointer"
                      title="Save Album to My Playlists"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
      )}

      {/* Playlist Picker Modal */}
      {(playlistModalTrack || playlistModalAlbum) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 my-auto">
          <div className="bg-[var(--card-sunofy)] w-full max-w-sm rounded-3xl border border-[var(--border-sunofy)] p-6 animate-fade shadow-2xl my-auto text-[var(--text-sunofy)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Add to Playlist</h3>
              <button 
                onClick={() => { setPlaylistModalTrack(null); setPlaylistModalAlbum(null); }}
                className="p-2 rounded-full bg-[var(--bg-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6 p-3.5 rounded-2xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] shadow-sm">
              {playlistModalTrack ? (
                <>
                  <img src={playlistModalTrack.image} alt={playlistModalTrack.title} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{playlistModalTrack.title}</div>
                    <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate">{playlistModalTrack.artist}</div>
                  </div>
                </>
              ) : playlistModalAlbum ? (
                <>
                  {playlistModalAlbum.image ? (
                     <img src={playlistModalAlbum.image} alt={playlistModalAlbum.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] flex items-center justify-center shrink-0">
                      <FolderOpen className="w-6 h-6 text-[var(--muted-sunofy)]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{playlistModalAlbum.name}</div>
                    <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate">Album / Collection</div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2 mb-6">
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={async () => {
                    if (playlistModalTrack && onAddSongToPlaylist) {
                      onAddSongToPlaylist(pl.id, playlistModalTrack);
                    } else if (playlistModalAlbum && onAddSongToPlaylist) {
                      try {
                        const tracks = await musicApi.searchSongs(playlistModalAlbum.query);
                        tracks.forEach(t => onAddSongToPlaylist(pl.id, t));
                      } catch (e) {}
                    }
                    setPlaylistModalTrack(null);
                    setPlaylistModalAlbum(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--hover-sunofy)] text-left transition cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-sunofy)] flex items-center justify-center border border-[var(--border-sunofy)] group-hover:border-[var(--accent-sunofy)]">
                    <Music className="w-5 h-5 text-[var(--accent-sunofy)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{pl.name}</div>
                    <div className="text-xs font-medium text-[var(--muted-sunofy)]">{pl.songs.length} songs</div>
                  </div>
                </button>
              ))}
              {playlists.length === 0 && (
                <div className="text-center py-6 text-[var(--muted-sunofy)] text-xs font-medium">No playlists created yet.</div>
              )}
            </div>

            {showCreateInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New Playlist Name"
                  className="flex-1 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)] shadow-inner"
                />
                <button
                  onClick={handleCreateAndAdd}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-extrabold text-sm hover:scale-105 shadow-md transition"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateInput(true)}
                className="w-full py-3 rounded-xl border border-[var(--border-sunofy)] border-dashed text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] hover:border-[var(--accent-sunofy)] text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Create New Playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
