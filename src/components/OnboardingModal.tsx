import React, { useState } from 'react';
import { User, Palette, KeyRound, Disc, Music, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [username, setUsername] = useState('Music Lover');
  const [selectedTheme, setSelectedTheme] = useState<'emerald' | 'dark' | 'amoled' | 'ocean' | 'purple' | 'amber' | 'cyberpunk' | 'crimson' | 'light'>('emerald');
  const [pin, setPin] = useState('0000');

  if (!isOpen) return null;

  const themes = [
    { key: 'emerald', label: 'Emerald', bg: '#121216', color: '#1db954' },
    { key: 'dark', label: 'Dark', bg: '#0d1222', color: '#22c55e' },
    { key: 'amoled', label: 'AMOLED', bg: '#000000', color: '#4ade80' },
    { key: 'ocean', label: 'Ocean', bg: '#0c4a6e', color: '#3b82f6' },
    { key: 'purple', label: 'Purple', bg: '#3b0764', color: '#a855f7' },
    { key: 'amber', label: 'Amber', bg: '#78350f', color: '#fbbf24' },
    { key: 'cyberpunk', label: 'Cyber', bg: '#2e1065', color: '#f472b6' },
    { key: 'crimson', label: 'Crimson', bg: '#881337', color: '#fb7185' },
    { key: 'light', label: 'Light', bg: '#f1f5f9', color: '#2563eb' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      username: username.trim() || 'Music Lover',
      appTheme: selectedTheme,
      accentColor: themes.find(t => t.key === selectedTheme)?.color || '#1db954',
      appLockPin: pin.length === 4 ? pin : '0000',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade text-[var(--text-sunofy)] select-none">
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/40 text-[var(--accent-sunofy)] flex items-center justify-center mx-auto shadow-inner">
            <Disc className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-[var(--text-sunofy)]">Welcome to Sunofy</h2>
          <p className="text-xs font-semibold text-[var(--muted-sunofy)]">Set up your profile to personalize your music experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-sunofy)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> Your Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
              required
            />
          </div>

          {/* Theme Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-sunofy)] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> Choose Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTheme(t.key as any)}
                  className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    selectedTheme === t.key
                      ? 'border-[var(--accent-sunofy)] ring-2 ring-[var(--accent-sunofy)]/30 scale-105'
                      : 'border-[var(--border-sunofy)] opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: t.bg }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="truncate" style={{ color: t.key === 'light' ? '#0f172a' : '#ffffff' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4-Digit Security PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-sunofy)] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> Set 4-Digit Passcode (Default 0000)
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="0000"
              className="w-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-[var(--accent-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] font-black text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer mt-2"
          >
            <Check className="w-5 h-5" />
            <span>Get Started with Sunofy</span>
          </button>
        </form>
      </div>
    </div>
  );
};
