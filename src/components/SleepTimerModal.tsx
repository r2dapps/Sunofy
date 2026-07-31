import React, { useState, useEffect } from 'react';
import { X, Clock, Check, Moon, Volume2, Sparkles } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMinutes: number | null; // null means timer off
  onSetTimer: (minutes: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeMinutes,
  onSetTimer,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [fadeoutEnabled, setFadeoutEnabled] = useState(true);

  useEffect(() => {
    if (!activeMinutes) {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(activeMinutes * 60);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMinutes]);

  if (!isOpen) return null;

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const options = [
    { label: 'Off (Disabled)', value: null },
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '45 Minutes', value: 45 },
    { label: '60 Minutes', value: 60 },
    { label: '90 Minutes', value: 90 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade">
      <div className="bg-[#0e1017] border border-[var(--accent-sunofy)]/30 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-sunofy)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-sunofy)]/15 border border-[var(--accent-sunofy)]/30 text-[var(--accent-sunofy)]">
              <Moon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">Sleep Timer</h3>
              <p className="text-[10px] text-[var(--muted-sunofy)]">Gently stops music after duration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--card-sunofy)] text-[var(--muted-sunofy)] hover:text-white border border-[var(--border-sunofy)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Countdown Badge */}
        {activeMinutes && remainingSeconds !== null && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--accent-sunofy)]/20 via-purple-500/10 to-indigo-500/20 border border-[var(--accent-sunofy)]/40 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[var(--accent-sunofy)] animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-xs font-bold text-gray-200">Timer Countdown</span>
            </div>
            <span className="text-sm font-black tracking-widest text-[var(--accent-sunofy)] font-mono bg-black/40 px-3 py-1 rounded-xl border border-[var(--accent-sunofy)]/30">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
          {options.map((opt) => {
            const isSelected = activeMinutes === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  onSetTimer(opt.value);
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(25);
                  }
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent-sunofy)]/15 border-[var(--accent-sunofy)] text-[var(--accent-sunofy)] font-bold shadow-md'
                    : 'bg-[var(--bg-sunofy)]/80 border-[var(--border-sunofy)] text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[var(--accent-sunofy)]" />}
              </button>
            );
          })}
        </div>

        {/* Smooth Fadeout Toggle Option */}
        <div className="pt-2 border-t border-[var(--border-sunofy)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-gray-300">Smooth Audio Fadeout</span>
          </div>
          <button
            onClick={() => setFadeoutEnabled(!fadeoutEnabled)}
            className={`w-10 h-6 rounded-full p-1 transition cursor-pointer ${
              fadeoutEnabled ? 'bg-[var(--accent-sunofy)]' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition transform ${
                fadeoutEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
