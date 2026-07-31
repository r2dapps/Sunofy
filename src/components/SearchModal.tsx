import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Play, Plus, Music, FolderPlus, Check, FolderOpen, Disc, ListPlus, Bookmark, Headphones, Heart, Download } from 'lucide-react';
import { musicApi } from '../services/api';
import { Track, Playlist, Favorites, DownloadTrack } from '../types';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onSetQueue?: (queue: Track[]) => void;
  playlists?: Playlist[];
  onAddSongToPlaylist?: (playlistId: string, song: Track) => void;
  onCreatePlaylist?: (name: string) => void;
  onAddToPlaylist?: (track: Track) => void;
  onImportCollectionAsPlaylist?: (name: string, query: string, image: string) => void;
  onDiscoverCollection?: (query: string) => void;
  
  // Extra controls for full actions
  onAddToQueue?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  onToggleFavoritePlaylist?: (playlist: Playlist) => void;
  onToggleFavoriteAlbum?: (album: { id: string; title: string; artist: string; image: string; trackCount?: string }) => void;
  onDownloadCollection?: (query: string, name: string) => void;
  onAddCollectionToQueue?: (query: string, name: string) => void;
  onDownloadTrack?: (track: Track) => void;
  downloads?: DownloadTrack[];
  localFolderTracks?: Track[];
  favorites?: Favorites;
  musicSource?: 'jiosaavn' | 'youtube' | 'local';
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onSetQueue,
  playlists = [],
  onAddSongToPlaylist,
  onCreatePlaylist,
  onAddToPlaylist,
  onImportCollectionAsPlaylist,
  onDiscoverCollection,
  onAddToQueue,
  onToggleFavorite,
  onToggleFavoritePlaylist,
  onToggleFavoriteAlbum,
  onDownloadCollection,
  onAddCollectionToQueue,
  onDownloadTrack,
  downloads = [],
  localFolderTracks = [],
  favorites,
  musicSource = 'jiosaavn',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTab, setSearchTab] = useState<'songs' | 'playlists' | 'albums'>('songs');
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Record<string, boolean>>({});
  const [isFocused, setIsFocused] = useState(false);
  const [saveCollectionModal, setSaveCollectionModal] = useState<{ name: string; query: string; image: string } | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isFavorited = (track: Track) => favorites?.songs.some((s) => s.id === track.id);
  const isDownloaded = (track: Track) => downloads?.some((s) => s.id === track.id);
  const isPlaylistFavorited = (name: string) => favorites?.playlists?.some((p) => p.name === name) || false;
  const isAlbumFavorited = (title: string) => favorites?.albums?.some((a) => a.title === title) || false;

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions.slice(0, 5));
          }
        }
      } catch (err) {
        // silent fallback
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const triggerSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setLoading(true);
    setSuggestions([]);
    try {
      if (musicSource === 'local') {
        const lower = searchTerm.toLowerCase();
        const allLocal = [...downloads, ...localFolderTracks];
        const filtered = allLocal.filter((t) => 
          (t.title && t.title.toLowerCase().includes(lower)) || 
          (t.artist && t.artist.toLowerCase().includes(lower)) ||
          (t.album && t.album.toLowerCase().includes(lower))
        );
        setResults(filtered);
      } else {
        const tracks = await musicApi.searchSongs(searchTerm);
        setResults(tracks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (!val.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    triggerSearch(val);
  };

  const quickTags = ['Telugu Hits 2026', 'Anirudh Beats', 'Sid Sriram Melodies', 'Arijit Singh', 'Thaman Mass'];

  const handleSaveSearchAsPlaylist = () => {
    if (results.length === 0) return;
    setSaveCollectionModal({
      name: `${query.trim() || 'Search'} Collection`,
      query: query.trim(),
      image: results[0]?.image || '/favicon.ico'
    });
    setNewPlaylistName(`${query.trim() || 'Search'} Collection`);
  };

  // Mock generated playlist / album collections derived from query
  const searchPlaylists = results.length > 0 ? [
    {
      id: 'spl_1',
      name: `${query || 'Top'} Melodies Mix`,
      trackCount: `${results.length} tracks`,
      image: results[0]?.image || '/icon-192.png',
    },
    {
      id: 'spl_2',
      name: `${query || 'Best'} Essential Anthems`,
      trackCount: `${Math.min(15, results.length * 2)} tracks`,
      image: results[1]?.image || results[0]?.image || '/icon-192.png',
    }
  ] : [];

  const searchAlbums = results.length > 0 ? [
    {
      id: 'salb_1',
      name: `${results[0]?.title || query} Official Album`,
      artist: results[0]?.artist || 'Various Artists',
      trackCount: '12 tracks',
      image: results[0]?.image || '/icon-192.png',
    },
    {
      id: 'salb_2',
      name: `${query || 'Hits'} Remastered Edition`,
      artist: results[1]?.artist || results[0]?.artist || 'Soundtrack Studio',
      trackCount: '18 tracks',
      image: results[1]?.image || results[0]?.image || '/icon-192.png',
    }
  ] : [];

  const handlePlayCollection = (tracks: Track[]) => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0]);
      if (onSetQueue && tracks.length > 1) {
        onSetQueue(tracks.slice(1));
      }
      onClose();
    }
  };

  const handlePlayCollectionQuery = async (colQuery: string) => {
    setLoading(true);
    try {
      const tracks = await musicApi.searchSongs(colQuery);
      if (tracks.length > 0) {
        onPlayTrack(tracks[0]);
        if (onSetQueue && tracks.length > 1) {
          onSetQueue(tracks.slice(1));
        }
        onClose();
      }
    } catch (e) {
      console.error('Failed to play collection', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-sunofy)] z-50 flex flex-col max-w-md mx-auto animate-fade shadow-2xl">
      {/* Header Search Bar */}
      <div className="p-4 glass flex items-center space-x-3 border-b border-[var(--border-sunofy)] relative">
        <button
          onClick={onClose}
          className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-[var(--muted-sunofy)]" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            placeholder="Search songs, albums, artists on JioSaavn..."
            className="w-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)] transition placeholder-[#a7a7a7]"
            autoFocus
          />
        </div>
      </div>

      {/* Suggestions Popup - absolutely positioned to prevent content shift */}
      {isFocused && (suggestions.length > 0 || query.trim() === '') && (
        <div className="absolute left-0 right-0 top-[61px] bg-[var(--card-sunofy)] border-b border-[var(--border-sunofy)] px-4 py-2.5 space-y-1 animate-fade z-50 shadow-xl">
          <div className="text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-[var(--accent-sunofy)]" /> 
              {query.trim() === '' ? 'Trending Searches' : 'Suggestions'}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsFocused(false);
              }}
              className="text-[10px] text-[var(--accent-sunofy)] hover:underline cursor-pointer px-2 py-0.5 rounded bg-[var(--bg-sunofy)]"
            >
              Close
            </button>
          </div>
          {query.trim() === '' ? (
            ['Sid Sriram', 'Anirudh Beats', 'Tollywood 2026', 'Telugu Moonlight Melodies', 'Devi Sri Prasad Mass Hits'].map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  triggerSearch(sug);
                  setIsFocused(false);
                }}
                className="w-full text-left py-1.5 px-2 text-xs text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)] rounded-lg transition font-medium flex items-center justify-between cursor-pointer"
              >
                <span>{sug}</span>
                <Search className="w-3 h-3 text-[var(--muted-sunofy)] opacity-50" />
              </button>
            ))
          ) : (
            suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  triggerSearch(sug);
                  setIsFocused(false);
                }}
                className="w-full text-left py-1.5 px-2 text-xs text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)] rounded-lg transition font-medium flex items-center justify-between cursor-pointer"
              >
                <span>{sug}</span>
                <Search className="w-3 h-3 text-[var(--muted-sunofy)]" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Category Tabs: Songs, Playlists, Albums */}
      <div className="flex items-center gap-2 p-2 px-4 bg-[var(--bg-sunofy)] border-b border-[var(--border-sunofy)]">
        <button
          onClick={() => setSearchTab('songs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            searchTab === 'songs'
              ? 'bg-[var(--accent-sunofy)] text-black shadow'
              : 'bg-[var(--card-sunofy)] text-[var(--muted-sunofy)] border border-[var(--border-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <Music className="w-3.5 h-3.5" /> Songs
        </button>

        <button
          onClick={() => setSearchTab('playlists')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            searchTab === 'playlists'
              ? 'bg-[var(--accent-sunofy)] text-black shadow'
              : 'bg-[var(--card-sunofy)] text-[var(--muted-sunofy)] border border-[var(--border-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" /> Playlists
        </button>

        <button
          onClick={() => setSearchTab('albums')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            searchTab === 'albums'
              ? 'bg-[var(--accent-sunofy)] text-black shadow'
              : 'bg-[var(--card-sunofy)] text-[var(--muted-sunofy)] border border-[var(--border-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <Disc className="w-3.5 h-3.5" /> Albums
        </button>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Quick Tags when empty */}
        {query.trim() === '' && (
          <div className="mb-4">
            <div className="text-xs font-bold text-[var(--muted-sunofy)] mb-2 uppercase tracking-wider">Quick Search</div>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => triggerSearch(tag)}
                  className="px-3 py-1.5 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-xs font-semibold text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)] hover:text-[var(--accent-sunofy)] transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-[var(--muted-sunofy)] uppercase tracking-wider">
              Search Results ({results.length})
            </span>
            {searchTab === 'songs' && (
              <button
                onClick={handleSaveSearchAsPlaylist}
                className="text-xs font-bold bg-[var(--accent-sunofy)] text-black px-3.5 py-1.5 rounded-full hover:scale-105 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Save all search results as a new Playlist"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Save Playlist
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-3 bg-[var(--card-sunofy)] rounded-2xl border border-[var(--border-sunofy)] skeleton"
              >
                <div className="w-10 h-10 bg-[var(--border-sunofy)] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[var(--border-sunofy)] rounded w-3/4" />
                  <div className="h-2 bg-[var(--border-sunofy)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query.trim() !== '' && results.length === 0 && (
          <div className="text-center text-[var(--muted-sunofy)] py-16">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No tracks found for "{query}"</p>
            <p className="text-xs mt-1">Try another keyword or artist name.</p>
          </div>
        )}

        {!loading && query.trim() === '' && (
          <div className="text-center text-[var(--muted-sunofy)] py-16">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-[var(--accent-sunofy)]" />
            <p className="text-sm font-semibold text-[var(--text-sunofy)]">Search Sunofy Music</p>
            <p className="text-xs mt-1">Search millions of songs, playlists, and albums live from JioSaavn</p>
          </div>
        )}

        {/* SONGS VIEW */}
        {!loading && searchTab === 'songs' &&
          results.map((track, trackIdx) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 bg-[var(--card-sunofy)] rounded-2xl border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] transition"
            >
              <div
                className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  onPlayTrack(track);
                  if (onSetQueue && results.length > 0) {
                    onSetQueue(results.slice(trackIdx + 1));
                  }
                  onClose();
                }}
              >
                <img src={track.image} alt={track.title} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--border-sunofy)]" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold truncate text-[var(--text-sunofy)]">{track.title}</h4>
                  <p className="text-[10px] text-[var(--muted-sunofy)] truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => {
                    if (playlists.length > 0) {
                      setSelectedTrackForPlaylist(track);
                    } else if (onAddToPlaylist) {
                      onAddToPlaylist(track);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                  title="Add to My Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    onPlayTrack(track);
                    if (onSetQueue && results.length > 0) {
                      onSetQueue(results.slice(trackIdx + 1));
                    }
                    onClose();
                  }}
                  className="w-7 h-7 rounded-full bg-[var(--accent-sunofy)] text-black flex items-center justify-center hover:scale-105 transition cursor-pointer shadow ml-1 shrink-0"
                  title="Play Track"
                >
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                </button>
              </div>
            </div>
          ))}

        {/* PLAYLISTS VIEW */}
        {!loading && searchTab === 'playlists' && (
          <div className="space-y-3">
            {searchPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => handlePlayCollectionQuery(pl.name)}
                className="flex items-center justify-between p-3 bg-[var(--card-sunofy)] rounded-2xl border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <img src={pl.image} alt={pl.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--border-sunofy)]" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate text-[var(--text-sunofy)] group-hover:text-[var(--accent-sunofy)]">
                      {pl.name}
                    </h4>
                    <p className="text-[10px] text-[var(--accent-sunofy)] font-semibold flex items-center gap-1 mt-0.5">
                      <FolderOpen className="w-3 h-3" /> {pl.trackCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePlayCollectionQuery(pl.name)}
                    className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--accent-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                    title="Play Playlist"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  {onAddCollectionToQueue && (
                    <button
                      onClick={() => onAddCollectionToQueue(pl.name, pl.name)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                      title="Add to Queue"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                  )}

                  {onToggleFavoritePlaylist && (
                    <button
                      onClick={() => onToggleFavoritePlaylist({ id: pl.id, name: pl.name, songs: [], image: pl.image })}
                      className={`p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] transition cursor-pointer ${
                        isPlaylistFavorited(pl.name) ? 'text-red-500' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                      }`}
                      title="Favorite Playlist"
                    >
                      <Heart className={`w-4 h-4 ${isPlaylistFavorited(pl.name) ? 'fill-red-500' : ''}`} />
                    </button>
                  )}

                  {onDownloadCollection && (
                    <button
                      onClick={() => onDownloadCollection(pl.name, pl.name)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                      title="Download Offline"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {searchPlaylists.length === 0 && results.length === 0 && (
              <div className="text-center py-10 text-xs text-[var(--muted-sunofy)]">
                Search for an artist or genre to discover playlists.
              </div>
            )}
          </div>
        )}

        {/* ALBUMS VIEW */}
        {!loading && searchTab === 'albums' && (
          <div className="space-y-3">
            {searchAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => handlePlayCollectionQuery(album.name)}
                className="flex items-center justify-between p-3 bg-[var(--card-sunofy)] rounded-2xl border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <img src={album.image} alt={album.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--border-sunofy)]" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate text-[var(--text-sunofy)] group-hover:text-[var(--accent-sunofy)]">
                      {album.name}
                    </h4>
                    <p className="text-[10px] text-[var(--muted-sunofy)] truncate mt-0.5">
                      {album.artist}
                    </p>
                    <p className="text-[10px] text-[var(--accent-sunofy)] font-semibold flex items-center gap-1 mt-0.5">
                      <Disc className="w-3 h-3" /> {album.trackCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePlayCollectionQuery(album.name)}
                    className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--accent-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                    title="Play Album"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  {onAddCollectionToQueue && (
                    <button
                      onClick={() => onAddCollectionToQueue(album.name, album.name)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                      title="Add to Queue"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                  )}

                  {onToggleFavoriteAlbum && (
                    <button
                      onClick={() => onToggleFavoriteAlbum({ id: album.id, title: album.name, artist: album.artist, image: album.image })}
                      className={`p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] transition cursor-pointer ${
                        isAlbumFavorited(album.name) ? 'text-red-500' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                      }`}
                      title="Favorite Album"
                    >
                      <Heart className={`w-4 h-4 ${isAlbumFavorited(album.name) ? 'fill-red-500' : ''}`} />
                    </button>
                  )}

                  {onDownloadCollection && (
                    <button
                      onClick={() => onDownloadCollection(album.name, album.name)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                      title="Download Offline"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {searchAlbums.length === 0 && results.length === 0 && (
              <div className="text-center py-10 text-xs text-[var(--muted-sunofy)]">
                Search for an artist or album title to view albums.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Playlist Selection Dialog inside SearchModal */}
      {selectedTrackForPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 my-auto">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-fade my-auto text-[var(--text-sunofy)]">
            <h3 className="text-sm font-bold text-[var(--text-sunofy)] mb-1 truncate">
              Add "{selectedTrackForPlaylist.title}"
            </h3>
            <p className="text-xs text-[var(--muted-sunofy)] mb-4">Select target playlist:</p>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {playlists.map((pl) => {
                const key = `${pl.id}_${selectedTrackForPlaylist.id}`;
                const isAdded = addedPlaylistIds[key];
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (onAddSongToPlaylist) {
                        onAddSongToPlaylist(pl.id, selectedTrackForPlaylist);
                        setAddedPlaylistIds((prev) => ({ ...prev, [key]: true }));
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] text-xs text-[var(--text-sunofy)] font-medium transition cursor-pointer"
                  >
                    <span className="truncate">{pl.name}</span>
                    {isAdded ? (
                      <Check className="w-4 h-4 text-[var(--accent-sunofy)]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[var(--muted-sunofy)]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onCreatePlaylist) {
                    onCreatePlaylist('New Playlist');
                  }
                  setSelectedTrackForPlaylist(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-bold transition cursor-pointer"
              >
                + New Playlist
              </button>
              <button
                onClick={() => setSelectedTrackForPlaylist(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-xs font-semibold text-[var(--muted-sunofy)] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Collection Modal */}
      {saveCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 my-auto">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-fade my-auto text-[var(--text-sunofy)]">
            <h3 className="text-sm font-extrabold text-[var(--text-sunofy)] mb-2 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[var(--accent-sunofy)]" /> Save Collection
            </h3>
            <p className="text-xs text-[var(--muted-sunofy)] mb-4">
              Choose how you would like to save this collection:
            </p>

            <div className="space-y-3 mb-5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-sunofy)]">
                Option 1: Save as a New Playlist
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="flex-1 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-3 py-2 text-xs text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
                />
                <button
                  onClick={() => {
                    if (onImportCollectionAsPlaylist) {
                      onImportCollectionAsPlaylist(
                        newPlaylistName.trim() || saveCollectionModal.name,
                        saveCollectionModal.query,
                        saveCollectionModal.image
                      );
                    }
                    setSaveCollectionModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-black transition cursor-pointer shrink-0"
                >
                  Create
                </button>
              </div>
            </div>

            {playlists.length > 0 && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-sunofy)] block">
                  Option 2: Add all tracks to an existing playlist
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={async () => {
                        try {
                          const tracks = await musicApi.searchSongs(saveCollectionModal.query);
                          if (tracks && tracks.length > 0 && onAddSongToPlaylist) {
                            tracks.forEach((t) => onAddSongToPlaylist(pl.id, t));
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        setSaveCollectionModal(null);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] text-xs text-[var(--text-sunofy)] font-bold transition cursor-pointer"
                    >
                      <span className="truncate">{pl.name}</span>
                      <Plus className="w-3.5 h-3.5 text-[var(--muted-sunofy)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-2 border-t border-[var(--border-sunofy)]">
              <button
                onClick={() => setSaveCollectionModal(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-xs font-semibold text-[var(--muted-sunofy)] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
