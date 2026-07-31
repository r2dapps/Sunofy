import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Car, Mic, Volume2, VolumeX, SlidersHorizontal, ShieldCheck } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState(false);
  const [eqPreset, setEqPreset] = useState<'Bass Boost' | 'Vocal' | 'Flat'>('Bass Boost');

  if (!isOpen || !currentTrack) return null;

  const handleTouch = (action: () => void) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    action();
  };

  const cycleEq = () => {
    handleTouch(() => {
      if (eqPreset === 'Bass Boost') setEqPreset('Vocal');
      else if (eqPreset === 'Vocal') setEqPreset('Flat');
      else setEqPreset('Bass Boost');
    });
  };

  return (
    <div className="fixed inset-0 bg-[#08090e] z-50 flex flex-col justify-between p-5 animate-fade max-w-md mx-auto border-x border-[var(--border-sunofy)] select-none">
      {/* Driver Cockpit Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/40 flex items-center justify-center text-[var(--accent-sunofy)]">
            <Car className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[var(--accent-sunofy)]">
              <span>Car Play Mode</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold">High-contrast driver touch interface</p>
          </div>
        </div>

        <button
          onClick={() => handleTouch(onClose)}
          className="px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>EXIT</span>
        </button>
      </div>

      {/* Driver Display Card */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-5">
        <div className="relative w-56 h-56 rounded-3xl overflow-hidden border-2 border-[var(--accent-sunofy)] shadow-[0_0_40px_rgba(29,185,84,0.3)]">
          <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-[var(--accent-sunofy)] flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            <span>{eqPreset}</span>
          </div>
        </div>

        <div className="space-y-1 max-w-xs">
          <h2 className="text-2xl font-black text-white truncate tracking-wide">{currentTrack.title}</h2>
          <p className="text-base font-bold text-[var(--accent-sunofy)] truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Driver Quick Controls Row */}
      <div className="grid grid-cols-2 gap-3 pb-3">
        <button
          onClick={cycleEq}
          className="py-3 px-4 rounded-2xl bg-[#141724] border border-white/10 text-gray-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[var(--accent-sunofy)]" />
          <span>EQ: {eqPreset}</span>
        </button>

        <button
          onClick={() => handleTouch(() => setIsMuted(!isMuted))}
          className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border-red-500/40'
              : 'bg-[#141724] border-white/10 text-gray-200'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Giant Driver Buttons */}
      <div className="grid grid-cols-3 gap-4 pt-1">
        <button
          onClick={() => handleTouch(onPrevTrack)}
          className="h-24 rounded-3xl bg-[#141724] border-2 border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer hover:border-[var(--accent-sunofy)]/50"
        >
          <SkipBack className="w-10 h-10 text-white" />
        </button>

        <button
          onClick={() => handleTouch(onTogglePlayPause)}
          className="h-24 rounded-3xl bg-[var(--accent-sunofy)] text-black flex items-center justify-center active:scale-95 transition cursor-pointer shadow-[0_0_30px_rgba(29,185,84,0.5)] border-2 border-emerald-400"
        >
          {isPlaying ? <Pause className="w-12 h-12 fill-black" /> : <Play className="w-12 h-12 fill-black ml-1" />}
        </button>

        <button
          onClick={() => handleTouch(onNextTrack)}
          className="h-24 rounded-3xl bg-[#141724] border-2 border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer hover:border-[var(--accent-sunofy)]/50"
        >
          <SkipForward className="w-10 h-10 text-white" />
        </button>
      </div>
    </div>
  );
};
