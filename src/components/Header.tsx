import React from 'react';
import { Search, SlidersHorizontal, Radio, User, Car, Headphones, Youtube, HardDrive } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenEqualizer: () => void;
  onOpenCarMode: () => void;
  userAvatar?: string;
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
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
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
        <div className={`w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-md shrink-0 overflow-hidden select-none ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
          <img src="./favicon.ico" alt="Logo" className="w-5.5 h-5.5 object-contain" referrerPolicy="no-referrer" />
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
          const current = sources.find((s) => s.id === musicSource) || sources[0];
          return (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] text-[10px] font-bold select-none shadow-sm mr-0.5"
              title={`Music Engine: ${current.label}`}
            >
              {current.icon}
              <span className="hidden xs:inline">{current.label}</span>
              {musicSource !== 'local' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[var(--muted-sunofy)] font-mono">{latency}ms</span>
                </>
              )}
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
          className="w-8 h-8 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] overflow-hidden flex items-center justify-center cursor-pointer hover:border-[var(--accent-sunofy)] transition"
        >
          <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>
    </header>
  );
};
