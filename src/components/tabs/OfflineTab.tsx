import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Play, Trash2, FolderOpen, HardDrive, WifiOff, Music, FileAudio, Info, ListPlus, CheckSquare, Square, Plus, X, ListMusic, Pencil, ChevronRight } from 'lucide-react';
import { DownloadTrack, Track } from '../../types';
import { offlineStore, OfflinePlaylist } from '../../services/offlineStore';

interface OfflineTabProps {
  downloads: DownloadTrack[];
  localFolderTracks: Track[];
  localSourceMode: 'downloads' | 'folder';
  onSetLocalSourceMode: (mode: 'downloads' | 'folder') => void;
  onPlayTrack: (track: Track) => void;
  onSetQueue?: (tracks: Track[]) => void;
  onRemoveDownload: (id: string) => void;
  onImportLocalFiles: (files: FileList) => void;
  onRemoveLocalFolderTrack: (id: string) => void;
  onClearLocalFolderTracks: () => void;
  onOpenSearch?: () => void;
}

export const OfflineTab: React.FC<OfflineTabProps> = ({
  downloads,
  localFolderTracks,
  localSourceMode,
  onSetLocalSourceMode,
  onPlayTrack,
  onSetQueue,
  onRemoveDownload,
  onImportLocalFiles,
  onRemoveLocalFolderTrack,
  onClearLocalFolderTracks,
  onOpenSearch
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sub-tab within Downloads mode
  const [downloadSubTab, setDownloadSubTab] = useState<'tracks' | 'playlists'>('tracks');

  // Offline playlists state
  const [offlinePlaylists, setOfflinePlaylists] = useState<OfflinePlaylist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null);
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState('');

  const loadPlaylists = useCallback(async () => {
    const pls = await offlineStore.getAllOfflinePlaylists();
    setOfflinePlaylists(pls);
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await offlineStore.createOfflinePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
    loadPlaylists();
  };

  const handleDeletePlaylist = async (id: string) => {
    await offlineStore.deleteOfflinePlaylist(id);
    if (viewingPlaylistId === id) setViewingPlaylistId(null);
    loadPlaylists();
  };

  const handleAddTrackToPlaylist = async (playlistId: string, trackId: string) => {
    await offlineStore.addTrackToOfflinePlaylist(playlistId, trackId);
    setAddToPlaylistTrackId(null);
    loadPlaylists();
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    await offlineStore.removeTrackFromOfflinePlaylist(playlistId, trackId);
    loadPlaylists();
  };

  const handleRenamePlaylist = async (id: string) => {
    if (!editingPlaylistName.trim()) return;
    await offlineStore.updateOfflinePlaylist(id, { name: editingPlaylistName.trim() });
    setEditingPlaylistId(null);
    loadPlaylists();
  };

  const handlePlayPlaylist = (pl: OfflinePlaylist) => {
    const tracks = pl.trackIds.map(id => downloads.find(d => d.id === id)).filter(Boolean) as Track[];
    if (tracks.length > 0) {
      onSetQueue?.(tracks);
      onPlayTrack(tracks[0]);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => onRemoveDownload(id));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const totalSize = downloads.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const sizeMb = (totalSize / (1024 * 1024)).toFixed(1);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) onImportLocalFiles(e.dataTransfer.files);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onImportLocalFiles(e.target.files);
  };

  // Get the viewed playlist object
  const viewingPlaylist = viewingPlaylistId ? offlinePlaylists.find(p => p.id === viewingPlaylistId) : null;
  const viewingTracks = viewingPlaylist
    ? viewingPlaylist.trackIds.map(id => downloads.find(d => d.id === id)).filter(Boolean) as DownloadTrack[]
    : [];

  return (
    <div className="space-y-6 animate-fade pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-sunofy)] tracking-tight">Local Music Manager</h2>
          <p className="text-sm font-medium text-[var(--muted-sunofy)] mt-0.5">
            {localSourceMode === 'downloads'
              ? `${downloads.length} Cached Tracks • ${offlinePlaylists.length} Playlists`
              : `${localFolderTracks.length} Device Tracks Loaded`}
          </p>
        </div>
        {localSourceMode === 'downloads' && downloads.length > 0 && (
          <div className="flex items-center gap-2 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold text-[var(--accent-sunofy)] self-start sm:self-auto">
            <HardDrive className="w-3.5 h-3.5" />
            {sizeMb} MB Cached
          </div>
        )}
      </div>

      {/* Main Tab Switch */}
      <div className="grid grid-cols-2 p-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl shadow-sm">
        <button
          onClick={() => onSetLocalSourceMode('downloads')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            localSourceMode === 'downloads' ? 'bg-[var(--accent-sunofy)] text-black shadow-sm' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <Download className="w-4 h-4" />
          Offline Cache ({downloads.length})
        </button>
        <button
          onClick={() => onSetLocalSourceMode('folder')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            localSourceMode === 'folder' ? 'bg-[var(--accent-sunofy)] text-black shadow-sm' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Device Folders ({localFolderTracks.length})
        </button>
      </div>

      {/* ─── DOWNLOADS MODE ─────────────────────────────────────────── */}
      {localSourceMode === 'downloads' && (
        <>
          {/* Sub-tab: Tracks / Playlists */}
          <div className="flex gap-1 p-1 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl">
            <button
              onClick={() => setDownloadSubTab('tracks')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                downloadSubTab === 'tracks' ? 'bg-[var(--card-sunofy)] text-[var(--text-sunofy)] shadow' : 'text-[var(--muted-sunofy)]'
              }`}
            >
              <Music className="w-3.5 h-3.5" /> All Tracks ({downloads.length})
            </button>
            <button
              onClick={() => { setDownloadSubTab('playlists'); setViewingPlaylistId(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                downloadSubTab === 'playlists' ? 'bg-[var(--card-sunofy)] text-[var(--text-sunofy)] shadow' : 'text-[var(--muted-sunofy)]'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" /> Playlists ({offlinePlaylists.length})
            </button>
          </div>

          {/* ── TRACKS SUB-TAB ── */}
          {downloadSubTab === 'tracks' && (
            downloads.length === 0 ? (
              <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
                <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--border-sunofy)]">
                  <WifiOff className="w-8 h-8 text-[var(--accent-sunofy)] opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-sunofy)] mb-2">No Offline Music</h3>
                <p className="text-sm text-[var(--muted-sunofy)] font-medium mb-6 leading-relaxed max-w-xs mx-auto">
                  Download songs from search or discover to listen without internet.
                </p>
                <button
                  onClick={onOpenSearch}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold shadow-md hover:scale-105 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  Find Music
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-[var(--muted-sunofy)] uppercase tracking-wider">
                    Cached Songs ({downloads.length})
                  </span>
                  {isSelectMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedIds(selectedIds.size === downloads.length ? new Set() : new Set(downloads.map(d => d.id)))}
                        className="text-[var(--muted-sunofy)] hover:text-white transition cursor-pointer p-1 rounded-md"
                      >
                        {selectedIds.size === downloads.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setIsSelectMode(false)} className="text-xs font-bold text-[var(--muted-sunofy)] hover:text-white cursor-pointer px-2">Cancel</button>
                      {selectedIds.size > 0 && (
                        <button onClick={handleBulkDelete} className="text-xs font-bold bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition cursor-pointer flex items-center gap-1 shadow">
                          <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsSelectMode(true); setSelectedIds(new Set()); }}
                      className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Select
                    </button>
                  )}
                </div>
                <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
                  {downloads.map((song, idx) => (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''} ${isSelectMode && selectedIds.has(song.id) ? 'bg-red-500/10' : ''}`}
                      onClick={() => { if (isSelectMode) toggleSelection(song.id); else onPlayTrack(song); }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        {isSelectMode && (
                          <div className="text-[var(--muted-sunofy)] flex-shrink-0">
                            {selectedIds.has(song.id) ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                          <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                          {!isSelectMode && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1 bg-[var(--bg-sunofy)]/80 p-0.5 rounded-full border border-[var(--border-sunofy)] backdrop-blur-sm shadow-sm">
                            <Download className="w-2.5 h-2.5 text-[var(--accent-sunofy)]" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">{song.title}</div>
                          <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate mt-0.5">{song.artist}</div>
                        </div>
                      </div>
                      {!isSelectMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddToPlaylistTrackId(song.id); }}
                            className="p-2 rounded-full text-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)]/10 transition cursor-pointer"
                            title="Add to Playlist"
                          >
                            <ListPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemoveDownload(song.id); }}
                            className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Remove Download"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ── PLAYLISTS SUB-TAB ── */}
          {downloadSubTab === 'playlists' && (
            <div className="space-y-4">
              {/* Playlist detail view */}
              {viewingPlaylist ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewingPlaylistId(null)} className="p-1.5 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-[var(--text-sunofy)]">{viewingPlaylist.name}</h3>
                      <p className="text-[10px] text-[var(--muted-sunofy)]">{viewingTracks.length} tracks</p>
                    </div>
                    {viewingTracks.length > 0 && (
                      <button
                        onClick={() => handlePlayPlaylist(viewingPlaylist)}
                        className="px-4 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" fill="currentColor" /> Play All
                      </button>
                    )}
                  </div>
                  {viewingTracks.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[var(--border-sunofy)] rounded-3xl text-[var(--muted-sunofy)] text-xs">
                      No tracks yet. Go to All Tracks and tap the ＋ icon to add songs.
                    </div>
                  ) : (
                    <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden">
                      {viewingTracks.map((song, idx) => (
                        <div
                          key={song.id}
                          className={`flex items-center gap-3 p-3 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''}`}
                          onClick={() => onPlayTrack(song)}
                        >
                          <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)]">{song.title}</div>
                            <div className="text-xs text-[var(--muted-sunofy)] truncate">{song.artist}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveTrackFromPlaylist(viewingPlaylist.id, song.id); }}
                            className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Create Playlist */}
                  {showCreatePlaylist ? (
                    <div className="flex gap-2 p-3 bg-[var(--card-sunofy)] border border-[var(--accent-sunofy)]/30 rounded-2xl">
                      <input
                        autoFocus
                        type="text"
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setShowCreatePlaylist(false); }}
                        placeholder="Playlist name..."
                        className="flex-1 bg-transparent text-sm text-[var(--text-sunofy)] placeholder-[var(--muted-sunofy)] outline-none"
                      />
                      <button onClick={handleCreatePlaylist} className="px-3 py-1.5 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-bold cursor-pointer">Create</button>
                      <button onClick={() => setShowCreatePlaylist(false)} className="p-1.5 rounded-xl text-[var(--muted-sunofy)] hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreatePlaylist(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:border-[var(--accent-sunofy)]/50 hover:text-[var(--accent-sunofy)] transition text-sm font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> New Offline Playlist
                    </button>
                  )}

                  {/* Playlist List */}
                  {offlinePlaylists.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[var(--border-sunofy)] rounded-3xl text-[var(--muted-sunofy)] text-xs font-medium">
                      No playlists yet. Create one to organize your offline music!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {offlinePlaylists.map(pl => {
                        const trackCount = pl.trackIds.filter(id => downloads.some(d => d.id === id)).length;
                        const coverImg = pl.trackIds[0] ? downloads.find(d => d.id === pl.trackIds[0])?.image : null;
                        return (
                          <div
                            key={pl.id}
                            className="flex items-center gap-3 p-3 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl hover:border-[var(--accent-sunofy)]/40 transition group"
                          >
                            <div
                              className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-sunofy)]/20 to-purple-500/20 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                              onClick={() => setViewingPlaylistId(pl.id)}
                            >
                              {coverImg ? <img src={coverImg} alt={pl.name} className="w-full h-full object-cover" /> : <ListMusic className="w-5 h-5 text-[var(--accent-sunofy)]" />}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingPlaylistId(pl.id)}>
                              {editingPlaylistId === pl.id ? (
                                <input
                                  autoFocus
                                  className="bg-transparent text-sm font-bold text-[var(--text-sunofy)] outline-none border-b border-[var(--accent-sunofy)] w-full"
                                  value={editingPlaylistName}
                                  onChange={e => setEditingPlaylistName(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenamePlaylist(pl.id); if (e.key === 'Escape') setEditingPlaylistId(null); }}
                                  onBlur={() => handleRenamePlaylist(pl.id)}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <div className="text-sm font-bold text-[var(--text-sunofy)] truncate">{pl.name}</div>
                              )}
                              <div className="text-xs text-[var(--muted-sunofy)]">{trackCount} tracks</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              {trackCount > 0 && (
                                <button onClick={() => handlePlayPlaylist(pl)} className="p-1.5 rounded-full text-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)]/10 cursor-pointer">
                                  <Play className="w-4 h-4" fill="currentColor" />
                                </button>
                              )}
                              <button onClick={() => { setEditingPlaylistId(pl.id); setEditingPlaylistName(pl.name); }} className="p-1.5 rounded-full text-[var(--muted-sunofy)] hover:text-white cursor-pointer">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePlaylist(pl.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--muted-sunofy)] opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => setViewingPlaylistId(pl.id)} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── FOLDER MODE ─────────────────────────────────────────────── */}
      {localSourceMode === 'folder' && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`text-center py-10 px-6 border-2 border-dashed rounded-3xl transition-all duration-300 bg-[var(--card-sunofy)] ${isDragging ? 'border-[var(--accent-sunofy)] bg-[var(--accent-sunofy)]/5' : 'border-[var(--border-sunofy)]'}`}
          >
            <div className="w-14 h-14 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-sunofy)] shadow-sm">
              <FolderOpen className="w-6 h-6 text-[var(--accent-sunofy)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-sunofy)]">Import Device Songs</h3>
            <p className="text-xs text-[var(--muted-sunofy)] font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              Select folder or multiple audio files. Processed locally and loaded instantly.
            </p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="audio/*" className="hidden" />
            <input type="file" ref={folderInputRef} onChange={handleFileChange} multiple
              // @ts-ignore
              webkitdirectory="" directory="" className="hidden"
            />
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button onClick={() => folderInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold text-xs shadow hover:scale-105 transition flex items-center gap-1.5 cursor-pointer">
                <FolderOpen className="w-3.5 h-3.5" /> Select Music Folder
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] font-bold text-xs shadow hover:scale-105 transition flex items-center gap-1.5 cursor-pointer">
                <FileAudio className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> Individual Files
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-semibold leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-600 dark:text-amber-400">Sandbox Session Information</p>
              <p className="text-[10px] font-medium opacity-80 mt-0.5">
                Files imported from your hard drive are active for your current session. If you refresh, just select the folder again to restore playback.
              </p>
            </div>
          </div>

          {localFolderTracks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[var(--muted-sunofy)] uppercase tracking-wider">Loaded Songs ({localFolderTracks.length})</span>
                <button onClick={onClearLocalFolderTracks} className="text-xs font-bold text-red-500 hover:underline cursor-pointer">Clear All</button>
              </div>
              <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
                {localFolderTracks.map((song, idx) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''}`}
                    onClick={() => onPlayTrack(song)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-sunofy)]/10 to-[var(--accent-sunofy)]/25 border border-[var(--border-sunofy)] flex items-center justify-center shrink-0">
                        <img src="./icon-192.png" alt={song.title} className="w-5 h-5 opacity-80 group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-xl">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">{song.title}</div>
                        <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate mt-0.5 flex items-center gap-1.5">
                          <span>{song.artist}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-sunofy)]" />
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Ready</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveLocalFolderTrack(song.id); }}
                      className="p-2.5 rounded-full text-[var(--muted-sunofy)] hover:text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <Music className="w-10 h-10 mx-auto text-[var(--muted-sunofy)] mb-3 opacity-30" />
              <p className="text-sm font-bold text-[var(--text-sunofy)]">No imported songs yet</p>
              <p className="text-xs text-[var(--muted-sunofy)] mt-0.5">Pick a local directory or select audio files above.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Add to Playlist Modal ─── */}
      {addToPlaylistTrackId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setAddToPlaylistTrackId(null)}>
          <div className="bg-[#0e1017] border border-[var(--border-sunofy)] rounded-3xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Add to Offline Playlist</h3>
              <button onClick={() => setAddToPlaylistTrackId(null)} className="p-1.5 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {offlinePlaylists.length === 0 ? (
              <p className="text-xs text-[var(--muted-sunofy)] text-center py-4">No playlists yet. Create one first in the Playlists tab.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {offlinePlaylists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddTrackToPlaylist(pl.id, addToPlaylistTrackId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer text-left ${
                      pl.trackIds.includes(addToPlaylistTrackId)
                        ? 'bg-[var(--accent-sunofy)]/15 border-[var(--accent-sunofy)] text-[var(--accent-sunofy)]'
                        : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)]/40'
                    }`}
                  >
                    <ListMusic className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{pl.name}</div>
                      <div className="text-[10px] text-[var(--muted-sunofy)]">{pl.trackIds.length} tracks</div>
                    </div>
                    {pl.trackIds.includes(addToPlaylistTrackId) && <span className="text-[10px] font-bold">Added ✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
