import React, { useState } from 'react';
import { Heart, Play, Trash2, Search, ArrowRight, FolderOpen, Disc, Music, ListPlus } from 'lucide-react';
import { Track, Playlist, Favorites } from '../../types';

interface FavoritesTabProps {
  favorites: Favorites;
  onPlayTrack: (track: Track) => void;
  onRemoveFavorite: (track: Track) => void;
  onRemoveFavoriteAlbum?: (albumId: string) => void;
  onRemoveFavoritePlaylist?: (playlistId: string) => void;
  onPlayCollection?: (query: string) => void;
  onOpenSearch?: () => void;
  onSetQueue?: (queue: Track[]) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  favorites,
  onPlayTrack,
  onRemoveFavorite,
  onRemoveFavoriteAlbum,
  onRemoveFavoritePlaylist,
  onPlayCollection,
  onOpenSearch,
  onSetQueue,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'songs' | 'playlists' | 'albums'>('songs');
  const [filterQuery, setFilterQuery] = useState('');

  const songs = (favorites.songs || []).filter(Boolean).filter((s) => s.id && s.title && s.artist);
  const playlists = (favorites.playlists || []).filter(Boolean).filter((p) => p.id && p.name);
  const albums = (favorites.albums || []).filter(Boolean).filter((a) => a.id && a.title);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(a => 
    a.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
    a.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[var(--text-sunofy)] tracking-tight">Your Favorites</h2>
        <p className="text-sm font-medium text-[var(--muted-sunofy)]">
          {songs.length} Songs • {playlists.length} Playlists • {albums.length} Albums
        </p>
      </div>

      {/* Segmented Sub Tabs inside Favorites */}
      <div className="grid grid-cols-3 p-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl shadow-sm">
        <button
          onClick={() => { setActiveSubTab('songs'); setFilterQuery(''); }}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
            activeSubTab === 'songs'
              ? 'bg-[var(--accent-sunofy)] text-black shadow-sm'
              : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          Songs ({songs.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('playlists'); setFilterQuery(''); }}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
            activeSubTab === 'playlists'
              ? 'bg-[var(--accent-sunofy)] text-black shadow-sm'
              : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          Playlists ({playlists.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('albums'); setFilterQuery(''); }}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
            activeSubTab === 'albums'
              ? 'bg-[var(--accent-sunofy)] text-black shadow-sm'
              : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          Albums ({albums.length})
        </button>
      </div>

      {/* Filter Input */}
      {((activeSubTab === 'songs' && songs.length > 0) ||
        (activeSubTab === 'playlists' && playlists.length > 0) ||
        (activeSubTab === 'albums' && albums.length > 0)) && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-sunofy)]" />
          <input
            type="text"
            placeholder={`Find in favorite ${activeSubTab}...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl text-sm font-medium text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)] transition shadow-sm"
          />
        </div>
      )}

      {/* SUB TAB 1: FAVORITE SONGS */}
      {activeSubTab === 'songs' && (
        <>
          {songs.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--border-sunofy)]">
                <Heart className="w-8 h-8 text-red-500 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-sunofy)] mb-2">No Favorite Songs Yet</h3>
              <p className="text-sm text-[var(--muted-sunofy)] mb-6 font-medium leading-relaxed max-w-xs mx-auto">
                Tap the heart on any track to add it to your collection.
              </p>
              <button
                onClick={onOpenSearch}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold shadow-md hover:scale-105 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                Find Music <Search className="w-4 h-4" />
              </button>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-sunofy)] text-sm">
              No matches for "{filterQuery}"
            </div>
          ) : (
            <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
              {filteredSongs.map((song, idx) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                    idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                  }`}
                  onClick={() => {
                    onPlayTrack(song);
                    if (onSetQueue) {
                      onSetQueue(filteredSongs.slice(idx + 1));
                    }
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">{song.title}</div>
                      <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate mt-0.5">{song.artist}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(song);
                    }}
                    className="p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUB TAB 2: FAVORITE PLAYLISTS */}
      {activeSubTab === 'playlists' && (
        <>
          {playlists.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--border-sunofy)]">
                <FolderOpen className="w-7 h-7 text-[var(--accent-sunofy)] opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-sunofy)] mb-2">No Favorite Playlists Yet</h3>
              <p className="text-sm text-[var(--muted-sunofy)] mb-6 font-medium leading-relaxed max-w-xs mx-auto">
                Search or browse playlists, and hit the heart button to save them here.
              </p>
              <button
                onClick={onOpenSearch}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold shadow-md hover:scale-105 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                Discover Playlists <Search className="w-4 h-4" />
              </button>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-sunofy)] text-sm">
              No matches for "{filterQuery}"
            </div>
          ) : (
            <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
              {filteredPlaylists.map((pl, idx) => (
                <div
                  key={pl.id}
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                    idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                  }`}
                  onClick={() => onPlayCollection && onPlayCollection(pl.name)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={pl.image || './icon-192.png'} alt={pl.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                        {pl.name}
                      </div>
                      <p className="text-xs font-medium text-[var(--accent-sunofy)] flex items-center gap-1 mt-0.5">
                        <FolderOpen className="w-3 h-3" /> Playlist Collection
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveFavoritePlaylist) onRemoveFavoritePlaylist(pl.id);
                    }}
                    className="p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove playlist from favorites"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUB TAB 3: FAVORITE ALBUMS */}
      {activeSubTab === 'albums' && (
        <>
          {albums.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--border-sunofy)]">
                <Disc className="w-7 h-7 text-[var(--accent-sunofy)] opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-sunofy)] mb-2">No Favorite Albums Yet</h3>
              <p className="text-sm text-[var(--muted-sunofy)] mb-6 font-medium leading-relaxed max-w-xs mx-auto">
                Heart search results under Albums to bookmark collections here.
              </p>
              <button
                onClick={onOpenSearch}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold shadow-md hover:scale-105 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                Discover Albums <Search className="w-4 h-4" />
              </button>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-sunofy)] text-sm">
              No matches for "{filterQuery}"
            </div>
          ) : (
            <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
              {filteredAlbums.map((album, idx) => (
                <div
                  key={album.id}
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                    idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                  }`}
                  onClick={() => onPlayCollection && onPlayCollection(album.title)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={album.image || './icon-192.png'} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                        {album.title}
                      </div>
                      <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate mt-0.5 flex items-center gap-1.5">
                        <span>{album.artist}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-sunofy)]" />
                        <span className="text-[10px] text-[var(--accent-sunofy)] font-bold">{album.trackCount || '12 tracks'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveFavoriteAlbum) onRemoveFavoriteAlbum(album.id);
                    }}
                    className="p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove album from favorites"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
