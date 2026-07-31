import React, { useState } from 'react';
import { Plus, Disc, Trash2, Edit2, ArrowLeft, Play, Search, Music, X, FolderOpen, Download, CheckCircle2 } from 'lucide-react';
import { Playlist, Track } from '../../types';
import { musicApi } from '../../services/api';

interface PlaylistsTabProps {
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onSetQueue?: (queue: Track[]) => void;
  onCreatePlaylist: (name: string) => void;
  onRenamePlaylist: (id: string, newName: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddSongToPlaylist: (playlistId: string, song: Track) => void;
  onRemoveSongFromPlaylist: (playlistId: string, songId: string) => void;
  onDownloadTrack?: (track: Track) => void;
}

export const PlaylistsTab: React.FC<PlaylistsTabProps> = ({
  playlists,
  onPlayTrack,
  onSetQueue,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
  onDownloadTrack,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [playlistNameInput, setPlaylistNameInput] = useState('');
  const [addSongQuery, setAddSongQuery] = useState('');
  const [searchSongsResult, setSearchSongsResult] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const safePlaylists = (playlists || []).filter(Boolean).filter((p) => p.id && p.name);
  const selectedPlaylistRaw = safePlaylists.find((p) => p.id === selectedPlaylistId);
  const selectedPlaylist = selectedPlaylistRaw ? {
    ...selectedPlaylistRaw,
    songs: (selectedPlaylistRaw.songs || []).filter(Boolean).filter((s) => s.id && s.title)
  } : null;

  const handleCreateSubmit = () => {
    if (playlistNameInput.trim()) {
      onCreatePlaylist(playlistNameInput.trim());
      setPlaylistNameInput('');
      setShowCreateModal(false);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (playlistNameInput.trim()) {
      onRenamePlaylist(id, playlistNameInput.trim());
      setPlaylistNameInput('');
      setShowRenameModal(null);
    }
  };

  const handleSongSearchInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddSongQuery(val);
    if (!val.trim()) {
      setSearchSongsResult([]);
      return;
    }
    setSearching(true);
    try {
      const res = await musicApi.searchSongs(val);
      setSearchSongsResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // Detailed Playlist View
  if (selectedPlaylist) {
    return (
      <div className="space-y-6 animate-fade pb-12">
        <button
          onClick={() => setSelectedPlaylistId(null)}
          className="flex items-center space-x-2 text-sm font-semibold text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Playlists</span>
        </button>

        <div className="bg-[var(--card-sunofy)] p-6 rounded-3xl border border-[var(--border-sunofy)] text-center relative shadow-xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--accent-sunofy)]/20 to-transparent opacity-50"></div>
          
          <div className="relative z-10">
            <div className="w-28 h-28 mx-auto bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mb-5 border-2 border-[var(--border-sunofy)] shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {selectedPlaylist.songs.length > 0 ? (
                <img src={selectedPlaylist.songs[0].image} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Disc className="w-12 h-12 text-[var(--accent-sunofy)] opacity-80" />
              )}
            </div>
            <h2 className="text-2xl font-black text-[var(--text-sunofy)]">{selectedPlaylist.name}</h2>
            <p className="text-sm font-medium text-[var(--muted-sunofy)] mt-1 tracking-wide">
              {selectedPlaylist.songs?.length || 0} songs • {selectedPlaylist.duration || '0 mins'}
            </p>

            <div className="flex items-center justify-center gap-4 mt-6">
              {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && (
                <button
                  onClick={() => {
                    onPlayTrack(selectedPlaylist.songs[0]);
                    if (onSetQueue) {
                      onSetQueue(selectedPlaylist.songs.slice(1));
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-[var(--accent-sunofy)] text-black flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer"
                  title="Play All Tracks"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>
              )}
              {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && onDownloadTrack && (
                <button
                  onClick={async () => {
                    if (!selectedPlaylist.songs || isDownloadingAll) return;
                    setIsDownloadingAll(true);
                    for (const song of selectedPlaylist.songs) {
                      try {
                        await onDownloadTrack(song);
                      } catch (e) {}
                    }
                    setTimeout(() => setIsDownloadingAll(false), 1200);
                  }}
                  disabled={isDownloadingAll}
                  className="w-10 h-10 rounded-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--accent-sunofy)] flex items-center justify-center shadow-sm hover:border-[var(--accent-sunofy)] transition-all cursor-pointer"
                  title="Download all songs in this playlist for offline playback"
                >
                  {isDownloadingAll ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-sunofy)] animate-pulse" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                onClick={() => setShowAddSongModal(true)}
                className="w-10 h-10 rounded-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] flex items-center justify-center shadow-sm hover:border-[var(--accent-sunofy)] transition-all cursor-pointer"
                title="Add Songs to Playlist"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
              </button>
              
              <button
                onClick={() => {
                  setPlaylistNameInput(selectedPlaylist.name);
                  setShowRenameModal(selectedPlaylist.id);
                }}
                className="w-10 h-10 rounded-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)] flex items-center justify-center transition cursor-pointer shadow-sm"
                title="Rename Playlist"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onDeletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }}
                className="w-10 h-10 rounded-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-red-400 hover:border-red-400 flex items-center justify-center transition cursor-pointer shadow-sm"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--text-sunofy)] mb-2 flex items-center gap-2">
            <Music className="w-5 h-5 text-[var(--accent-sunofy)]" /> Tracks
          </h3>
          
          {!selectedPlaylist.songs || selectedPlaylist.songs.length === 0 ? (
            <div className="text-center py-12 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <Disc className="w-12 h-12 text-[var(--border-sunofy)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted-sunofy)] font-medium">This playlist is empty.</p>
              <p className="text-xs text-[var(--muted-sunofy)]/70 mt-1">Click the "Add Songs" button to start building your mix.</p>
            </div>
          ) : (
            <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
              {selectedPlaylist.songs.map((song, idx) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                    idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                  }`}
                  onClick={() => {
                    onPlayTrack(song);
                    if (onSetQueue && selectedPlaylist.songs) {
                      onSetQueue(selectedPlaylist.songs.slice(idx + 1));
                    }
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--muted-sunofy)] w-4 text-center">{idx + 1}</div>
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">{song.title}</div>
                      <div className="text-xs text-[var(--muted-sunofy)] truncate mt-0.5">{song.artist}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSongFromPlaylist(selectedPlaylist.id, song.id);
                    }}
                    className="p-2 rounded-full text-[var(--muted-sunofy)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Song Modal inside Playlist View */}
        {showAddSongModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 my-auto">
            <div className="bg-[var(--card-sunofy)] w-full max-w-md rounded-3xl border border-[var(--border-sunofy)] p-6 shadow-2xl max-h-[85vh] flex flex-col my-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--text-sunofy)]">Search & Add Songs</h3>
                <button
                  onClick={() => {
                    setShowAddSongModal(false);
                    setAddSongQuery('');
                    setSearchSongsResult([]);
                  }}
                  className="p-2 rounded-full bg-[var(--bg-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-sunofy)]" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={addSongQuery}
                  onChange={handleSongSearchInModal}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl text-sm text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
                />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                {searching ? (
                  <p className="text-center text-xs text-[var(--muted-sunofy)] mt-6">Searching tracks...</p>
                ) : searchSongsResult.length > 0 ? (
                  searchSongsResult.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl hover:bg-[var(--hover-sunofy)] transition group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img src={t.image} alt={t.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--text-sunofy)] truncate">{t.title}</p>
                          <p className="text-xs text-[var(--muted-sunofy)] truncate">{t.artist}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onAddSongToPlaylist(selectedPlaylist.id, t);
                          setAddSongQuery('');
                          setSearchSongsResult([]);
                          setShowAddSongModal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--accent-sunofy)] text-black text-xs font-bold shrink-0 hover:scale-105 transition"
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : (
                  addSongQuery && <p className="text-center text-xs text-[var(--muted-sunofy)] mt-6">No results found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Playlists Grid View
  return (
    <div className="space-y-6 animate-fade pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-sunofy)] tracking-tight">Your Playlists</h2>
          <p className="text-sm font-medium text-[var(--muted-sunofy)] mt-0.5">{safePlaylists.length} Mixes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 bg-[var(--accent-sunofy)] rounded-full flex items-center justify-center text-black shadow-md hover:scale-110 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {safePlaylists.length === 0 ? (
        <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
          <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-sunofy)]">
            <FolderOpen className="w-8 h-8 text-[var(--accent-sunofy)] opacity-70" />
          </div>
          <p className="text-base font-bold text-[var(--text-sunofy)]">No Playlists Yet</p>
          <p className="text-xs text-[var(--muted-sunofy)] font-medium mt-1 mb-6">Create a new playlist to organize your favorite tracks.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-[var(--accent-sunofy)] text-black rounded-xl font-bold text-sm shadow-md hover:scale-105 transition"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {safePlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-4 rounded-3xl cursor-pointer hover:border-[var(--accent-sunofy)]/50 group transition duration-300 shadow-sm"
            >
              <div className="aspect-square bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden shadow-sm group-hover:shadow-md transition">
                {pl.songs && pl.songs.length > 0 ? (
                   <img src={pl.songs[0].image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                  <Music className="w-10 h-10 text-[var(--border-sunofy)]" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-300"></div>
              </div>
              <h3 className="font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">{pl.name}</h3>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-sunofy)] mt-1">
                {pl.songs?.length || 0} TRACKS
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create / Rename Modal */}
      {(showCreateModal || showRenameModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 my-auto">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-fade my-auto">
            <h3 className="text-xl font-black text-[var(--text-sunofy)] mb-4">
              {showCreateModal ? 'New Playlist' : 'Rename Playlist'}
            </h3>
            <input
              type="text"
              value={playlistNameInput}
              onChange={(e) => setPlaylistNameInput(e.target.value)}
              placeholder="E.g. Study Lo-Fi"
              autoFocus
              className="w-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-4 py-3 text-sm text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)] shadow-inner mb-5 font-semibold"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowRenameModal(null);
                  setPlaylistNameInput('');
                }}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-sm font-bold text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showCreateModal) handleCreateSubmit();
                  else if (showRenameModal) handleRenameSubmit(showRenameModal);
                }}
                className="flex-1 py-3 rounded-xl bg-[var(--accent-sunofy)] text-black text-sm font-black hover:scale-105 shadow-md transition"
              >
                {showCreateModal ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
