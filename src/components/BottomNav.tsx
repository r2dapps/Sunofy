import React from 'react';
import { Headphones, ListMusic, Heart, DownloadCloud, Radio, User, Film } from 'lucide-react';

export type TabName = 'Discover' | 'Playlists' | 'Favorites' | 'Offline' | 'Videos' | 'Sync Party' | 'Profile';

interface BottomNavProps {
  currentTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs: { name: TabName; label: string; icon: React.ReactNode }[] = [
    { name: 'Discover', label: 'Discover', icon: <Headphones className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Playlists', label: 'Playlists', icon: <ListMusic className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Favorites', label: 'Favs', icon: <Heart className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Videos', label: 'Videos', icon: <Film className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Offline', label: 'Offline', icon: <DownloadCloud className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Sync Party', label: 'Party', icon: <Radio className="w-5 h-5 md:w-5 md:h-5" /> },
    { name: 'Profile', label: 'Profile', icon: <User className="w-5 h-5 md:w-5 md:h-5" /> },
  ];

  return (
    <nav className="absolute md:relative bottom-0 left-0 right-0 h-16 md:h-full md:w-64 glass-player md:bg-[var(--card-sunofy)] flex md:flex-col items-center md:items-start justify-around md:justify-start px-1 md:px-4 md:py-6 z-30 border-t md:border-t-0 md:border-r border-[var(--border-sunofy)] shrink-0">
      
      {/* Brand logo for desktop / tablet sidebar */}
      <div className="hidden md:flex items-center gap-3 mb-8 px-2 w-full">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-sunofy)] flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5 text-black" />
        </div>
        <span className="font-bold text-xl tracking-tight text-[var(--text-sunofy)]">Sunofy</span>
      </div>

      <div className="flex md:flex-col w-full h-full md:h-auto md:space-y-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              className={`flex flex-col md:flex-row items-center md:justify-start flex-1 md:flex-none md:w-full py-1 md:py-3 md:px-4 md:rounded-xl transition cursor-pointer ${
                isActive ? 'text-[var(--accent-sunofy)] md:bg-[var(--accent-sunofy)]/10 md:text-[var(--accent-sunofy)] font-bold' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] md:hover:bg-[var(--border-sunofy)]/50'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0 md:ml-3 truncate max-w-[55px] md:max-w-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
