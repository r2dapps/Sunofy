import React from 'react';
import { Headphones, ListMusic, Heart, DownloadCloud, Radio, User, Film } from 'lucide-react';

export type TabName = 'Discover' | 'Playlists' | 'Favorites' | 'Offline' | 'Videos' | 'Sync Party' | 'Profile';

interface BottomNavProps {
  currentTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs: { name: TabName; label: string; icon: React.ReactNode }[] = [
    { name: 'Discover', label: 'Discover', icon: <Headphones className="w-5 h-5" /> },
    { name: 'Playlists', label: 'Playlists', icon: <ListMusic className="w-5 h-5" /> },
    { name: 'Favorites', label: 'Favs', icon: <Heart className="w-5 h-5" /> },
    { name: 'Videos', label: 'Videos', icon: <Film className="w-5 h-5" /> },
    { name: 'Offline', label: 'Offline', icon: <DownloadCloud className="w-5 h-5" /> },
    { name: 'Sync Party', label: 'Party', icon: <Radio className="w-5 h-5" /> },
    { name: 'Profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-16 glass-player flex items-center justify-around px-1 z-30 border-t border-[var(--border-sunofy)]">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              isActive ? 'text-[var(--accent-sunofy)]' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium mt-1 truncate max-w-[55px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
