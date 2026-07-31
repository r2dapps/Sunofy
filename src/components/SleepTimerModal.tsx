import React from 'react';
import { X, Clock, Check } from 'lucide-react';

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
  if (!isOpen) return null;

  const options = [
    { label: 'Off', value: null },
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '45 Minutes', value: 45 },
    { label: '60 Minutes', value: 60 },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[var(--accent-sunofy)]" />
            <h3 className="text-base font-bold text-[var(--text-sunofy)]">Sleep Timer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--muted-sunofy)]">
          Music will automatically stop playing after the selected timer duration expires.
        </p>

        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = activeMinutes === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  onSetTimer(opt.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent-sunofy)]/10 border-[var(--accent-sunofy)] text-[var(--accent-sunofy)]'
                    : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] text-[var(--text-sunofy)] hover:border-[#a7a7a7]'
                }`}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[var(--accent-sunofy)]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
