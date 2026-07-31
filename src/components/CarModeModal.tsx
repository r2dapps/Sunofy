import React from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Car, Mic } from 'lucide-react';
import { Track } from '../types';

interface CarModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const CarModeModal: React.FC<CarModeModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlayPause,
  onNextTrack,
  onPrevTrack,
}) => {
  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-sunofy)] z-50 flex flex-col justify-between p-6 animate-fade max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-sunofy)] pb-4">
        <div className="flex items-center space-x-2 text-[var(--accent-sunofy)]">
          <Car className="w-6 h-6" />
          <span className="font-bold text-sm uppercase tracking-widest">Car Play Mode</span>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl text-[var(--text-sunofy)] font-bold text-xs flex items-center space-x-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Middle Track Display */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-4">
        <div className="w-48 h-48 rounded-3xl overflow-hidden border-2 border-[var(--accent-sunofy)] shadow-2xl">
          <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-sunofy)] truncate max-w-xs">{currentTrack.title}</h2>
          <p className="text-base text-[var(--accent-sunofy)] font-medium truncate max-w-xs mt-1">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Giant Driver Buttons */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <button
          onClick={onPrevTrack}
          className="h-24 rounded-3xl bg-[var(--card-sunofy)] border-2 border-[var(--border-sunofy)] flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <SkipBack className="w-10 h-10 text-[var(--text-sunofy)]" />
        </button>

        <button
          onClick={onTogglePlayPause}
          className="h-24 rounded-3xl bg-[var(--accent-sunofy)] text-black flex items-center justify-center active:scale-95 transition cursor-pointer shadow-xl shadow-[#1db954]/30"
        >
          {isPlaying ? <Pause className="w-12 h-12 fill-black" /> : <Play className="w-12 h-12 fill-black ml-1" />}
        </button>

        <button
          onClick={onNextTrack}
          className="h-24 rounded-3xl bg-[var(--card-sunofy)] border-2 border-[var(--border-sunofy)] flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <SkipForward className="w-10 h-10 text-[var(--text-sunofy)]" />
        </button>
      </div>
    </div>
  );
};
