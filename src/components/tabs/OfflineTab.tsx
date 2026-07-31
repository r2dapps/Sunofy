import React, { useState, useRef } from 'react';
import { Download, Play, Trash2, FolderOpen, HardDrive, WifiOff, Music, FileAudio, Info, ListPlus } from 'lucide-react';
import { DownloadTrack, Track } from '../../types';

interface OfflineTabProps {
  downloads: DownloadTrack[];
  localFolderTracks: Track[];
  localSourceMode: 'downloads' | 'folder';
  onSetLocalSourceMode: (mode: 'downloads' | 'folder') => void;
  onPlayTrack: (track: Track) => void;
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
  onRemoveDownload,
  onImportLocalFiles,
  onRemoveLocalFolderTrack,
  onClearLocalFolderTracks,
  onOpenSearch
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSize = downloads.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const sizeMb = (totalSize / (1024 * 1024)).toFixed(1);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportLocalFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportLocalFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6 animate-fade pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-sunofy)] tracking-tight">Local Music Manager</h2>
          <p className="text-sm font-medium text-[var(--muted-sunofy)] mt-0.5">
            {localSourceMode === 'downloads' 
              ? `${downloads.length} Cached Tracks Available` 
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

      {/* Segmented Control to Switch Mode */}
      <div className="grid grid-cols-2 p-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl shadow-sm">
        <button
          onClick={() => onSetLocalSourceMode('downloads')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            localSourceMode === 'downloads'
              ? 'bg-[var(--accent-sunofy)] text-black shadow-sm'
              : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <Download className="w-4 h-4" />
          Offline Cache ({downloads.length})
        </button>
        <button
          onClick={() => onSetLocalSourceMode('folder')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            localSourceMode === 'folder'
              ? 'bg-[var(--accent-sunofy)] text-black shadow-sm'
              : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Device Folders ({localFolderTracks.length})
        </button>
      </div>

      {/* MODE 1: OFFLINE DOWNLOADS LIST */}
      {localSourceMode === 'downloads' && (
        <>
          {downloads.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-[var(--border-sunofy)] rounded-3xl bg-[var(--card-sunofy)]">
              <div className="w-16 h-16 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--border-sunofy)]">
                <WifiOff className="w-8 h-8 text-[var(--accent-sunofy)] opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-sunofy)] mb-2">No Offline Music</h3>
              <p className="text-sm text-[var(--muted-sunofy)] font-medium mb-6 leading-relaxed max-w-xs mx-auto">
                Download songs from search or discover to listen securely without an internet connection.
              </p>
              <button
                onClick={onOpenSearch}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold shadow-md hover:scale-105 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                Find Music
              </button>
            </div>
          ) : (
            <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
              {downloads.map((song, idx) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                    idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                  }`}
                  onClick={() => onPlayTrack(song)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                      <div className="absolute top-1 right-1 bg-[var(--bg-sunofy)]/80 p-0.5 rounded-full border border-[var(--border-sunofy)] backdrop-blur-sm shadow-sm">
                         <Download className="w-2.5 h-2.5 text-[var(--accent-sunofy)]" />
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
                      onRemoveDownload(song.id);
                    }}
                    className="p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove Download"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODE 2: DEVICE FOLDERS / FILES IMPORTER */}
      {localSourceMode === 'folder' && (
        <div className="space-y-4">
          {/* File Picker Selection Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`text-center py-10 px-6 border-2 border-dashed rounded-3xl transition-all duration-300 bg-[var(--card-sunofy)] ${
              isDragging
                ? 'border-[var(--accent-sunofy)] bg-[var(--accent-sunofy)]/5'
                : 'border-[var(--border-sunofy)]'
            }`}
          >
            <div className="w-14 h-14 bg-[var(--bg-sunofy)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-sunofy)] shadow-sm">
              <FolderOpen className="w-6 h-6 text-[var(--accent-sunofy)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-sunofy)]">Import Device Songs</h3>
            <p className="text-xs text-[var(--muted-sunofy)] font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              Select folder or multiple audio files. They are processed entirely locally and loaded instantly.
            </p>

            {/* Hidden Input Pickers */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="audio/*"
              className="hidden"
            />
            {/* Standard input with directory attribute */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileChange}
              multiple
              // @ts-ignore
              webkitdirectory=""
              directory=""
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[var(--accent-sunofy)] text-black font-bold text-xs shadow hover:scale-105 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Select Music Folder
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] hover:border-[var(--accent-sunofy)]/50 font-bold text-xs shadow hover:scale-105 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileAudio className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> Select Individual Files
              </button>
            </div>
          </div>

          {/* Session Expiry Info Banner */}
          <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] sm:text-xs font-semibold leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-600 dark:text-amber-400">Sandbox Session Information</p>
              <p className="text-[10px] sm:text-[11px] font-medium opacity-80 mt-0.5">
                Due to standard browser security rules, files imported directly from your hard drive are active during your active session. If you refresh or reload, simply select your music folder again to restore direct audio play paths.
              </p>
            </div>
          </div>

          {/* Imported Local Files List */}
          {localFolderTracks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[var(--muted-sunofy)] uppercase tracking-wider">
                  Loaded Songs ({localFolderTracks.length})
                </span>
                <button
                  onClick={onClearLocalFolderTracks}
                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl overflow-hidden shadow-sm">
                {localFolderTracks.map((song, idx) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--hover-sunofy)] transition group cursor-pointer ${
                      idx !== 0 ? 'border-t border-[var(--border-sunofy)]' : ''
                    }`}
                    onClick={() => onPlayTrack(song)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-sunofy)]/10 to-[var(--accent-sunofy)]/25 border border-[var(--border-sunofy)] flex items-center justify-center shrink-0">
                        {/* Use the Sunofy icon fallback branding cleanly! */}
                        <img src="/icon-192.png" alt={song.title} className="w-5 h-5 opacity-80 group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-xl">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                          {song.title}
                        </div>
                        <div className="text-xs font-medium text-[var(--muted-sunofy)] truncate mt-0.5 flex items-center gap-1.5">
                          <span>{song.artist}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-sunofy)]" />
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95">Ready</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveLocalFolderTrack(song.id);
                      }}
                      className="p-2.5 rounded-full text-[var(--muted-sunofy)] hover:text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Unload track"
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
              <p className="text-xs text-[var(--muted-sunofy)] mt-0.5">Pick a local directory or select audio files above to load them immediately.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
