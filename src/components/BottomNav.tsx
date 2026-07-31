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
    <>
      {/* DESKTOP / TABLET SIDEBAR (>= 768px) */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-[#0b0d14] border-r border-[var(--border-sunofy)] p-4 shrink-0 z-30 select-none justify-between">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-[var(--accent-sunofy)] flex items-center justify-center shrink-0 shadow-lg shadow-[var(--accent-sunofy)]/20">
              <Headphones className="w-5 h-5 text-black" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">Sunofy</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => onTabChange(tab.name)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-sunofy)]/15 border border-[var(--accent-sunofy)]/40 text-[var(--accent-sunofy)] shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={isActive ? 'text-[var(--accent-sunofy)]' : 'text-gray-400'}>
                    {tab.icon}
                  </div>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="px-3 py-2 border-t border-[var(--border-sunofy)]/40 text-[10px] text-gray-500 font-medium">
          <p className="font-bold text-gray-400">Sunofy Music v2.0</p>
          <p className="text-[9px] mt-0.5">High-Fidelity Audio Streamer</p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-player flex items-center justify-around px-1 z-30 border-t border-[var(--border-sunofy)] shrink-0 select-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
                isActive ? 'text-[var(--accent-sunofy)] font-bold' : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-[55px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
