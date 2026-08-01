import React from 'react';
import { Play, Pause, Heart, ListMusic, Shuffle, Repeat, Download, CheckCircle2 } from 'lucide-react';
import { Track } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: boolean;
  isDownloaded?: boolean;
  isShuffle?: boolean;
  repeatMode?: 'off' | 'one' | 'all';
  onTogglePlayPause: () => void;
  onNextTrack?: () => void;
  onToggleFavorite: () => void;
  onDownloadTrack?: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onOpenFullPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isFavorite,
  isDownloaded = false,
  isShuffle = false,
  repeatMode = 'off',
  onTogglePlayPause,
  onNextTrack,
  onToggleFavorite,
  onDownloadTrack,
  onToggleShuffle,
  onToggleRepeat,
  onOpenFullPlayer,
}) => {
  if (!currentTrack) return null;

  return (
    <div
      onClick={onOpenFullPlayer}
      className="fixed bottom-[72px] md:bottom-5 left-2 right-2 md:left-[calc(50%+8rem)] md:-translate-x-1/2 md:w-[620px] md:max-w-[85%] rounded-2xl bg-[#0e101d]/95 backdrop-blur-xl p-2 md:p-3 flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.8)] cursor-pointer transition transform active:scale-98 z-40 border border-[var(--accent-sunofy)]/30 mb-1"
    >
      {/* Artwork & Track Info */}
      <div className="flex items-center space-x-2.5 md:space-x-4 min-w-0 flex-1">
        <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-emerald-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
          <img
            src={currentTrack.image}
            className={`w-full h-full rounded-full object-cover border-2 border-[#0e101d] spinning-art ${isPlaying ? 'playing' : ''}`}
            alt={currentTrack.title}
          />
          <div className="w-2.5 h-2.5 rounded-full bg-[#0e101d] border border-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-inner" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs md:text-sm font-bold truncate text-white">{currentTrack.title}</h4>
          <p className="text-[10px] md:text-xs font-medium text-gray-400 truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 pl-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onOpenFullPlayer}
          className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
          title="Queue / Player"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {onToggleShuffle && (
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 transition cursor-pointer hidden sm:block ${isShuffle ? 'text-[var(--accent-sunofy)]' : 'text-gray-400 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        )}

        {onToggleRepeat && (
          <button
            onClick={onToggleRepeat}
            className={`p-1.5 transition cursor-pointer hidden sm:block ${repeatMode !== 'off' ? 'text-[var(--accent-sunofy)]' : 'text-gray-400 hover:text-white'}`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onToggleFavorite}
          className={`p-1.5 transition cursor-pointer ${isFavorite ? 'text-[var(--accent-sunofy)]' : 'text-gray-400 hover:text-white'}`}
          title="Toggle Favorite"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[var(--accent-sunofy)]' : ''}`} />
        </button>

        {onDownloadTrack && (
          <button
            onClick={onDownloadTrack}
            className={`p-1.5 transition cursor-pointer ${isDownloaded ? 'text-[var(--accent-sunofy)]' : 'text-gray-400 hover:text-white'}`}
            title="Download"
          >
            {isDownloaded ? <CheckCircle2 className="w-4 h-4 text-[var(--accent-sunofy)]" /> : <Download className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={onTogglePlayPause}
          className="w-9 h-9 rounded-full bg-[var(--accent-sunofy)] text-black flex items-center justify-center hover:scale-105 transition shadow-lg cursor-pointer ml-1"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
