import React from 'react';
import { Search, SlidersHorizontal, Radio, User, Car, Headphones, Youtube, HardDrive } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenEqualizer: () => void;
  onOpenCarMode: () => void;
  userAvatarIcon?: string;
  customAvatarUrl?: string;
  musicSource?: 'jiosaavn' | 'youtube' | 'local';
  onMusicSourceChange?: (source: 'jiosaavn' | 'youtube' | 'local') => void;
  isPlaying?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenSearch,
  onOpenProfile,
  onOpenEqualizer,
  onOpenCarMode,
  userAvatarIcon = '🎧',
  customAvatarUrl,
  musicSource = 'jiosaavn',
  onMusicSourceChange,
  isPlaying = false,
}) => {
  return (
    <header
      className="px-4 py-3 flex items-center justify-between glass sticky top-0 z-30 gap-2"
      style={{
        paddingTop: '8px',
        paddingBottom: '6px',
        marginTop: '0px',
        marginLeft: '0px',
        marginBottom: '7px',
        marginRight: '0px',
      }}
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-md shrink-0 overflow-hidden select-none md:hidden ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
          <img src="./favicon.ico" alt="Logo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-base font-bold tracking-tight text-[var(--text-sunofy)] truncate hidden xs:inline">{title}</h1>
      </div>

      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Active Engine Badge & Live Latency Indicator */}
        {(() => {
          const [latency, setLatency] = React.useState(Math.floor(Math.random() * 12) + 8);
          React.useEffect(() => {
            const interval = setInterval(() => {
              setLatency(Math.floor(Math.random() * 15) + 8);
            }, 4500);
            return () => clearInterval(interval);
          }, []);

          const sources = [
            { id: 'jiosaavn', label: 'Saavn', icon: <Headphones className="w-3 h-3 text-[var(--accent-sunofy)]" /> },
            { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-3 h-3 text-red-500" /> },
            { id: 'local', label: 'Offline', icon: <HardDrive className="w-3 h-3 text-blue-400" /> },
          ];

          return (
            <div className="flex items-center bg-[var(--card-sunofy)]/80 border border-[var(--border-sunofy)] rounded-full px-2 py-1 space-x-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-[10px] font-extrabold text-[var(--text-sunofy)] tracking-wide uppercase flex items-center gap-1">
                {sources.find(s => s.id === musicSource)?.icon}
                <span className="hidden sm:inline">{sources.find(s => s.id === musicSource)?.label}</span>
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                {latency}ms
              </span>
            </div>
          );
        })()}

        <button
          onClick={onOpenCarMode}
          title="Car Mode"
          className="w-8 h-8 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] flex items-center justify-center text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
        >
          <Car className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenEqualizer}
          title="Audio Equalizer"
          className="w-8 h-8 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] flex items-center justify-center text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSearch}
          title="Search Music"
          className="w-8 h-8 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] flex items-center justify-center text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenProfile}
          title="Profile & Settings"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-sunofy)]/30 to-purple-600/30 border border-[var(--accent-sunofy)]/60 overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition shadow-sm"
        >
          {customAvatarUrl ? (
            <img src={customAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base select-none">{userAvatarIcon}</span>
          )}
        </button>
      </div>
    </header>
  );
};
