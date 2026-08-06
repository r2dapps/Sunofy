import React, { useState, useEffect, useRef } from 'react';

/** Extract YouTube video ID from a URL */
function extractYtId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  SlidersHorizontal,
  Clock,
  Car,
  Download,
  CheckCircle2,
  Volume2,
  Volume1,
  VolumeX,
  FileText,
  Trash2,
  Activity,
  PlusCircle,
} from 'lucide-react';
import { Track } from '../types';

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFavorite: boolean;
  isDownloaded: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  queue: Track[];
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  onTogglePlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (time: number) => void;
  onToggleFavorite: () => void;
  onDownloadTrack: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenCarMode: () => void;
  onClearQueue?: () => void;
  onRemoveQueueItem?: (index: number) => void;
  onPlayQueueItem?: (index: number) => void;
  onSaveQueueAsPlaylist?: () => void;
  musicSource?: 'jiosaavn' | 'cobalt' | 'youtube' | 'local';
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isFavorite,
  isDownloaded,
  isShuffle,
  repeatMode,
  queue,
  volume = 1,
  onVolumeChange,
  onTogglePlayPause,
  onNextTrack,
  onPrevTrack,
  onSeek,
  onToggleFavorite,
  onDownloadTrack,
  onToggleShuffle,
  onToggleRepeat,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenCarMode,
  onClearQueue,
  onRemoveQueueItem,
  onPlayQueueItem,
  onSaveQueueAsPlaylist,
  musicSource = 'jiosaavn',
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    if (currentTrack && !currentTrack.lyrics && activeTab === 'lyrics') {
      setActiveTab('player');
    }
  }, [currentTrack, activeTab]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    onSeek(pos * duration);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080912] text-[var(--text-sunofy)] flex flex-col justify-between overflow-hidden animate-fade transition-all w-screen h-screen">
      {/* Dynamic Ambient Blur Canvas Background Takeover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src={currentTrack.image}
          alt=""
          className={`w-full h-full object-cover scale-150 blur-3xl transition-opacity duration-1000 ${
            isPlaying ? 'opacity-45' : 'opacity-25'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080912]/40 via-[#080912]/80 to-[#080912]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full max-w-xl mx-auto w-full p-6 sm:p-8 justify-between">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between shrink-0 mb-4">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center px-1 min-w-0 flex-1 mx-2">
            <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[var(--muted-sunofy)] font-bold truncate">PLAYING ALBUM</p>
            <h3 className="text-[11px] sm:text-xs font-bold text-[var(--text-sunofy)] truncate max-w-[110px] sm:max-w-[220px] mx-auto">
              {currentTrack.album || 'Sunofy Audio Stream'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCarMode}
              className="p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
              title="Car Mode"
            >
              <Car className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenEqualizer}
              className="p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
              title="Equalizer"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Apple Music Style Nav Tabs */}
        <div className="flex bg-[var(--card-sunofy)]/80 backdrop-blur-xl border border-[var(--border-sunofy)] rounded-2xl p-1 mb-4 shrink-0 shadow-lg">
          <button
            onClick={() => setActiveTab('player')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
              activeTab === 'player'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            Player
          </button>
          {currentTrack.lyrics && (
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-md'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              Lyrics
            </button>
          )}
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        {/* Tab Content Body */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col justify-around items-center my-2 min-h-0">
            {/* Full Screen Canvas with Clean Rotating Vinyl Disc */}
            <div className="relative my-auto flex flex-col items-center justify-center py-6">
              {/* Outer Glow Halo Ring */}
              <div
                className={`absolute w-72 sm:w-80 h-72 sm:h-80 rounded-full blur-3xl transition-all duration-1000 ${
                  isPlaying ? 'bg-[var(--accent-sunofy)]/35 scale-110 opacity-100 animate-pulse' : 'bg-transparent opacity-0 scale-90'
                }`}
              />

              {/* Default: Spinning Vinyl Disc */}
              <div
                className={`relative z-10 w-60 sm:w-72 h-60 sm:h-72 rounded-full border-4 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden transition-all duration-700 bg-black/90 ${
                  isPlaying ? 'animate-[spin_6s_linear_infinite] shadow-emerald-500/20' : 'scale-95 opacity-90'
                }`}
                style={{
                  backgroundImage: 'radial-gradient(circle, #262626 15%, #171717 16%, #000 65%, #262626 66%, #171717 100%)'
                }}
              >
                {/* Vinyl Grooves Effect */}
                <div className="absolute inset-3 rounded-full border border-neutral-700/30" />
                <div className="absolute inset-8 rounded-full border border-neutral-700/20" />
                <div className="absolute inset-14 rounded-full border border-neutral-700/20" />

                {/* Disc Center Label */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-neutral-600 bg-emerald-500/90 flex items-center justify-center overflow-hidden shadow-inner shrink-0 z-10">
                  <img
                    src={currentTrack.image || './favicon.ico'}
                    alt="Disc Center"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', './favicon.ico');
                    }}
                  />
                </div>

                {/* Center Spindle Hole */}
                <div className="absolute w-4 h-4 rounded-full bg-neutral-900 border border-neutral-400 shadow-inner z-20" />
              </div>
            </div>

            {/* Title & Artist & Quick Actions */}
            <div className="w-full flex items-center justify-between mt-4 px-1 shrink-0 relative">
              <div className="min-w-0 flex-1 pr-4">
                <h1 className="text-xl sm:text-2xl font-black truncate tracking-tight text-[var(--text-sunofy)]">
                  {currentTrack.title}
                </h1>
                <p className="text-sm font-semibold text-[var(--muted-sunofy)] truncate mt-1">
                  {currentTrack.artist}
                </p>
              </div>
              <div className="flex items-center space-x-1 shrink-0 relative">
                {/* Volume Button with Pop-up Slider */}
                <div className="relative">
                  <button
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    className={`p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md border transition cursor-pointer ${
                      showVolumeSlider
                        ? 'text-[var(--accent-sunofy)] border-[var(--accent-sunofy)]'
                        : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border-[var(--border-sunofy)]'
                    }`}
                    title="Adjust Volume"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-[var(--accent-sunofy)]" />
                    )}
                  </button>

                  {/* Pop-up Volume Slider Box */}
                  {showVolumeSlider && (
                    <div className="absolute right-0 bottom-12 z-30 bg-[var(--card-sunofy)] backdrop-blur-xl border border-[var(--border-sunofy)] p-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade w-48">
                      <button
                        onClick={() => onVolumeChange?.(volume === 0 ? 0.8 : 0)}
                        className="text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] cursor-pointer"
                      >
                        {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume1 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                        className="w-full accent-[var(--accent-sunofy)] cursor-pointer h-1.5 rounded-lg bg-[var(--border-sunofy)]"
                      />
                      <span className="text-[10px] font-mono font-bold text-[var(--accent-sunofy)] w-7 text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onDownloadTrack}
                  className="p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] border border-[var(--border-sunofy)] transition cursor-pointer"
                  title={isDownloaded ? 'Downloaded Offline' : 'Download for Offline'}
                >
                  {isDownloaded ? <CheckCircle2 className="w-5 h-5 text-[var(--accent-sunofy)]" /> : <Download className="w-5 h-5" />}
                </button>
                <button
                  onClick={onToggleFavorite}
                  className={`p-2.5 rounded-full bg-[var(--card-sunofy)]/80 backdrop-blur-md border transition cursor-pointer ${
                    isFavorite ? 'text-red-500 border-red-500/30' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] border-[var(--border-sunofy)]'
                  }`}
                  title="Favorite"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Pointer-Tracking Smooth Timeline Progress Scrubber */}
            <div className="w-full space-y-2 mt-4 shrink-0">
              <div
                className="w-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] h-3 rounded-full cursor-pointer relative shadow-inner group touch-none select-none p-0.5 flex items-center"
                onPointerDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const updateScrub = (clientX: number) => {
                    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    onSeek(pos * duration);
                  };
                  updateScrub(e.clientX);

                  const handleMove = (moveEv: PointerEvent) => {
                    updateScrub(moveEv.clientX);
                  };
                  const handleUp = () => {
                    window.removeEventListener('pointermove', handleMove);
                    window.removeEventListener('pointerup', handleUp);
                  };
                  window.addEventListener('pointermove', handleMove);
                  window.addEventListener('pointerup', handleUp);
                }}
              >
                <div
                  className="bg-[var(--accent-sunofy)] h-full rounded-full relative transition-all duration-75 shadow-[0_0_8px_rgba(29,185,84,0.6)]"
                  style={{ width: `${progressPct}%` }}
                >
                  {/* Glowing Slider Circular Knob/Thumb */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-[var(--accent-sunofy)] shadow-lg scale-110 group-hover:scale-130 transition-transform" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono font-bold text-[var(--muted-sunofy)]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Interactive Player Controls */}
            <div className="w-full flex items-center justify-between px-2 my-4 shrink-0">
              <button
                onClick={onToggleShuffle}
                className={`p-3 rounded-full transition cursor-pointer ${
                  isShuffle ? 'text-[var(--accent-sunofy)] bg-[var(--accent-sunofy)]/15' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-3 text-[var(--text-sunofy)] hover:scale-110 transition cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-7 h-7" />
              </button>

              <button
                onClick={onTogglePlayPause}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl shadow-[var(--accent-sunofy)]/30 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />}
              </button>

              <button
                onClick={onNextTrack}
                className="p-3 text-[var(--text-sunofy)] hover:scale-110 transition cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-7 h-7" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-3 rounded-full transition cursor-pointer flex items-center gap-1 ${
                  repeatMode !== 'off' ? 'text-[var(--accent-sunofy)] bg-[var(--accent-sunofy)]/15 font-extrabold' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] font-bold'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === 'one' && <span className="text-[9px] font-black uppercase px-1 bg-[var(--accent-sunofy)] text-black rounded select-none">1</span>}
                {repeatMode === 'all' && <span className="text-[9px] font-black uppercase px-1 bg-[var(--accent-sunofy)] text-black rounded select-none">All</span>}
              </button>
            </div>
          </div>
        )}

        {/* Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4 overflow-y-auto">
            <FileText className="w-10 h-10 text-[var(--accent-sunofy)]" />
            <h3 className="font-black text-xl text-[var(--text-sunofy)]">{currentTrack.title}</h3>
            <p className="text-xs font-semibold text-[var(--muted-sunofy)]">{currentTrack.artist}</p>
            <div className="bg-[var(--card-sunofy)]/80 backdrop-blur-xl border border-[var(--border-sunofy)] p-6 rounded-3xl max-h-[50vh] overflow-y-auto text-sm sm:text-base font-semibold text-[var(--text-sunofy)] leading-relaxed whitespace-pre-line text-center shadow-inner">
              {currentTrack.lyrics ||
                `[Verse 1]
I've been on my own for long enough
Maybe you can show me how to love, maybe
I'm going through withdrawals
You don't even have to do too much
You can turn me on with just a touch, baby

[Chorus]
I said, ooh, I'm blinded by the lights
No, I can't sleep until I feel your touch
I said, ooh, I'm drowning in the night
Oh, when I'm like this, you're the one I trust

[Verse 2]
Running out of time
'Cause I can see the sun light up the sky
So I hit the road in overdrive, baby

[Chorus]
I said, ooh, I'm blinded by the lights
No, I can't sleep until I feel your touch

[Outro]
Sunofy High Fidelity Canvas Audio Stream`}
            </div>
          </div>
        )}

        {/* Queue View */}
        {activeTab === 'queue' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black text-[var(--muted-sunofy)] uppercase tracking-wider">
                Up Next in Queue ({queue.length})
              </h3>
              <div className="flex items-center space-x-1.5">
                {queue.length > 0 && onSaveQueueAsPlaylist && (
                  <button
                    onClick={onSaveQueueAsPlaylist}
                    className="p-2 text-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)]/20 rounded-full border border-[var(--accent-sunofy)]/30 transition cursor-pointer"
                    title="Save Queue as Playlist"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
                {queue.length > 0 && onClearQueue && (
                  <button
                    onClick={onClearQueue}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full border border-red-500/30 transition cursor-pointer"
                    title="Clear Entire Queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--muted-sunofy)] space-y-2">
                <ListMusic className="w-10 h-10 stroke-1" />
                <p className="text-sm font-semibold">Queue is empty</p>
                <p className="text-xs opacity-75">Add tracks from Discover or Playlists to play next</p>
              </div>
            ) : (
              queue.map((track, idx) => {
                const isCurrentlyPlaying = currentTrack
                  ? (track.id === currentTrack.id || (track.title === currentTrack.title && track.artist === currentTrack.artist))
                  : false;

                return (
                  <div
                    key={track.id + '_' + idx}
                    onClick={() => onPlayQueueItem?.(idx)}
                    className={`flex items-center space-x-3 p-3 rounded-2xl border transition group cursor-pointer ${
                      isCurrentlyPlaying
                        ? 'bg-[var(--accent-sunofy)]/15 border-[var(--accent-sunofy)]/50 shadow-md'
                        : 'bg-[var(--card-sunofy)]/80 backdrop-blur-md border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={track.image} alt={track.title} className="w-12 h-12 rounded-xl object-cover" />
                      {isCurrentlyPlaying && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                          <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-[var(--accent-sunofy)] animate-ping' : 'bg-amber-400'}`} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-sm font-bold truncate text-[var(--text-sunofy)]">{track.title}</h4>
                        {isCurrentlyPlaying && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                            isPlaying ? 'bg-[var(--accent-sunofy)] text-black' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isPlaying ? 'PLAYING' : 'PAUSED'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-sunofy)] truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-[var(--muted-sunofy)] font-mono font-bold mr-1">#{idx + 1}</span>
                    {onRemoveQueueItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveQueueItem(idx);
                        }}
                        className="p-2 text-[var(--muted-sunofy)] hover:text-red-400 rounded-full hover:bg-[var(--bg-sunofy)] transition cursor-pointer"
                        title="Remove track from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
