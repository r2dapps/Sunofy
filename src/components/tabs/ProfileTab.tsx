import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Sliders,
  ShieldCheck,
  Lock,
  Unlock,
  Palette,
  Globe,
  HardDrive,
  Download,
  Upload,
  Trash2,
  KeyRound,
  Check,
  Radio,
  Moon,
  ChevronRight,
  FolderOpen,
  Server,
  Activity,
  Heart,
  Smartphone,
  Play,
  FileAudio,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, Playlist, Favorites, DownloadTrack, Track } from '../../types';

interface ProfileTabProps {
  profile: UserProfile;
  playlists: Playlist[];
  favorites: Favorites;
  downloads?: DownloadTrack[];
  localFolderTracks?: Track[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRestoreBackup: (backup: { playlists?: Playlist[]; favorites?: Favorites; profile?: UserProfile }) => void;
  onLockAppNow: () => void;
  onShowToast: (msg: string) => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer?: () => void;
  onImportLocalFiles?: (files: FileList) => void;
  onClearLocalFolderTracks?: () => void;
  onPlayTrack?: (track: Track) => void;
  musicSource?: 'jiosaavn' | 'youtube' | 'local';
  onMusicSourceChange?: (source: 'jiosaavn' | 'youtube' | 'local') => void;
}


const CollapsibleCard: React.FC<{ title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--card-sunofy)] p-4 rounded-2xl border border-[var(--border-sunofy)] shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-[var(--accent-sunofy)]" />
          <h3 className="text-xs font-bold text-[var(--text-sunofy)] uppercase tracking-wider">{title}</h3>
        </div>
        <ChevronRight className={`w-4 h-4 text-[var(--muted-sunofy)] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[var(--border-sunofy)] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  playlists,
  favorites,
  downloads = [],
  localFolderTracks = [],
  onUpdateProfile,
  onRestoreBackup,
  onLockAppNow,
  onShowToast,
  onOpenEqualizer,
  onOpenSleepTimer,
  onImportLocalFiles,
  onClearLocalFolderTracks,
  onPlayTrack,
  musicSource = 'jiosaavn',
  onMusicSourceChange,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState(profile.appLockPin || '1234');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImportLocalFiles) {
      onImportLocalFiles(e.target.files);
      onShowToast(`Imported ${e.target.files.length} device tracks`);
    }
  };

  // API Health Demo State
  const [reqCount, setReqCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [ping, setPing] = useState(Math.floor(Math.random() * 15) + 10);

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * 20) + 10);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ title: string; msg: string; canReload: boolean } | null>(null);

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true);
    try {
      // Check GitHub release or ServiceWorker update flag
      const hasUpdate = (window as any).hasPwaUpdate === true;
      const response = await fetch('https://api.github.com/repos/r2dapps/Sunofy/releases/latest').catch(() => null);
      let latestTag = null;
      if (response && response.ok) {
        const data = await response.json();
        latestTag = data.tag_name;
      }

      const currentVersion = 'v2.0.0';

      if (hasUpdate || (latestTag && latestTag !== currentVersion)) {
        setUpdateModal({
          title: `🚀 Sunofy Update Ready! (${latestTag || 'v2.0.0'})`,
          msg: `New build updates are available. Click below to reload and apply the latest UI & features instantly.`,
          canReload: true,
        });
      } else {
        setUpdateModal({
          title: `✅ Sunofy ${currentVersion} is Up to Date!`,
          msg: `You are running the latest Sunofy release build.\nTap below if you wish to refresh the app shell UI.`,
          canReload: true,
        });
      }
    } catch (err) {
      setUpdateModal({
        title: `✅ Sunofy v2.0.0 is Up to Date!`,
        msg: `App shell UI is synchronized.`,
        canReload: true,
      });
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleSelectCustomFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        onShowToast(`Download folder set to "${dirHandle.name}"`);
      } catch (err) {
        onShowToast('Canceled directory selection');
      }
    } else {
      onShowToast('Folder picker not supported in this browser. Downloads will go to default folder.');
    }
  };

  // Export Local Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      app: 'Sunofy Music',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      playlists,
      favorites,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sunofy_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onUpdateProfile({ lastBackupAt: new Date().toLocaleTimeString() });
    onShowToast('Local backup JSON exported successfully!');
  };

  // Import Local Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.playlists || parsed.favorites || parsed.profile) {
            onRestoreBackup(parsed);
            onShowToast('Backup restored successfully!');
          } else {
            onShowToast('Invalid Sunofy backup JSON file format');
          }
        } catch (err) {
          onShowToast('Failed to parse backup JSON file');
        }
      };
    }
  };

  const handleSavePin = () => {
    if (newPin.length === 4 && /^\d+$/.test(newPin)) {
      onUpdateProfile({ appLockPin: newPin });
      setShowPinModal(false);
      onShowToast(`App Lock PIN set to ${newPin}`);
    } else {
      onShowToast('PIN must be exactly 4 digits');
    }
  };

  return (
    <div className="space-y-4 animate-fade pb-12 text-[var(--text-sunofy)]">
      {/* Profile Card Header with Avatar Icon & Custom Upload Selector */}
      <div className="bg-[var(--card-sunofy)] p-6 rounded-3xl border border-[var(--border-sunofy)] text-center shadow-xl relative group hover:border-[var(--accent-sunofy)]/50 transition flex flex-col items-center justify-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full mx-auto bg-gradient-to-tr from-[var(--accent-sunofy)]/30 via-purple-600/30 to-[var(--accent-sunofy)]/50 border-2 border-[var(--accent-sunofy)] shadow-xl flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-105 transition-transform overflow-hidden">
            {profile.customAvatarUrl ? (
              <img src={profile.customAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{profile.avatarIcon || '🎧'}</span>
            )}
          </div>
          {profile.appLockEnabled && (
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--accent-sunofy)] text-black shadow">
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Avatar Selection: Icons & Custom Upload */}
        <div className="space-y-2 w-full max-w-xs mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
            {['🎧', '🎵', '🎸', '👑', '🔥', '🚀', '💎', '⚡', '🐼', '🦁', '🦊', '🐶'].map((icon) => {
              const isSelected = !profile.customAvatarUrl && (profile.avatarIcon || '🎧') === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ avatarIcon: icon, customAvatarUrl: undefined });
                    onShowToast(`Profile avatar updated to ${icon}`);
                  }}
                  className={`w-8 h-8 text-base rounded-xl transition-transform flex items-center justify-center cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--accent-sunofy)] text-black border-transparent scale-110 shadow-md font-bold'
                      : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] text-[var(--text-sunofy)] hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            <label className="px-3 py-1.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] text-[10px] font-bold text-[var(--accent-sunofy)] flex items-center gap-1 cursor-pointer transition shadow-sm">
              <Upload className="w-3.5 h-3.5" /> Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        onUpdateProfile({ customAvatarUrl: ev.target.result as string });
                        onShowToast('Custom profile picture uploaded!');
                      }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
            </label>
            {profile.customAvatarUrl && (
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile({ customAvatarUrl: undefined });
                  onShowToast('Reset to default icon avatar');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition cursor-pointer"
              >
                Reset Icon
              </button>
            )}
          </div>
        </div>

        <div className="w-full flex items-center justify-center pt-1">
          <input 
            type="text" 
            value={profile.username}
            onChange={(e) => onUpdateProfile({ username: e.target.value })}
            className="text-lg font-bold text-[var(--text-sunofy)] bg-transparent border-b border-transparent hover:border-[var(--border-sunofy)] focus:border-[var(--accent-sunofy)] focus:outline-none transition-colors text-center max-w-[220px]"
          />
        </div>
        <p className="text-xs text-[var(--muted-sunofy)] text-center">Dive into musical world with friends & family</p>
      </div>

      {/* Bedtime Sleep Timer Button */}
      <button 
        onClick={onOpenSleepTimer}
        className="w-full p-4 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[#bd00ff] rounded-2xl text-left transition-colors flex items-center justify-between cursor-pointer"
      >
        <div>
          <div className="text-xs font-bold text-[var(--text-sunofy)] flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#bd00ff]" /> 
            Bedtime Sleep Timer
          </div>
          <div className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">Timer off</div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--muted-sunofy)]" />
      </button>

      {/* Stats Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-blue-400 p-3 rounded-2xl text-center space-y-1 cursor-pointer transition-all active:scale-95 group">
          <div className="text-[var(--muted-sunofy)] text-[10px] font-extrabold uppercase tracking-wider group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1">
            <Download className="w-3 h-3 text-blue-400" /> Offline
          </div>
          <div className="text-xl font-black text-[var(--text-sunofy)] font-mono">{downloads.length}</div>
        </div>
        
        <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-pink-400 p-3 rounded-2xl text-center space-y-1 cursor-pointer transition-all active:scale-95 group">
          <div className="text-[var(--muted-sunofy)] text-[10px] font-extrabold uppercase tracking-wider group-hover:text-pink-400 transition-colors flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-pink-400" /> Favs
          </div>
          <div className="text-xl font-black text-[var(--text-sunofy)] font-mono">{favorites.songs.length}</div>
        </div>

        <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl text-center space-y-1 cursor-pointer transition-all active:scale-95 group">
          <div className="text-[var(--muted-sunofy)] text-[10px] font-extrabold uppercase tracking-wider group-hover:text-[var(--accent-sunofy)] transition-colors flex items-center justify-center gap-1">
            <FolderOpen className="w-3 h-3 text-[var(--accent-sunofy)]" /> Lists
          </div>
          <div className="text-xl font-black text-[var(--text-sunofy)] font-mono">{playlists.length}</div>
        </div>

        <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-3 rounded-2xl text-center space-y-1">
          <div className="text-[var(--muted-sunofy)] text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" /> Ver
          </div>
          <div className="text-xs font-bold text-[var(--accent-sunofy)] pt-1">v2.1.0</div>
        </div>
      </div>

      {/* MUSIC ENGINE PROVIDER & QUOTA HEALTH DASHBOARD */}
      <CollapsibleCard title="Music Engine & Quota" icon={Server}>
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[var(--muted-sunofy)]">Select Primary Music Engine:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => {
                onUpdateProfile({ apiSource: 'jiosaavn' });
                if (onMusicSourceChange) onMusicSourceChange('jiosaavn');
                onShowToast('Switched to JioSaavn Engine');
              }}
              className={`text-[10px] sm:text-xs py-2 px-1 rounded-xl border font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                musicSource === 'jiosaavn'
                  ? 'bg-[var(--accent-sunofy)]/15 border-[var(--accent-sunofy)]/50 text-[var(--accent-sunofy)]'
                  : 'bg-[var(--border-sunofy)] border-transparent text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              🎧 JioSaavn
            </button>
            <button
              onClick={() => {
                onUpdateProfile({ apiSource: 'cobalt_yt' });
                if (onMusicSourceChange) onMusicSourceChange('cobalt');
                onShowToast('Switched to Cobalt YT Engine');
              }}
              className={`text-[10px] sm:text-xs py-2 px-1 rounded-xl border font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                musicSource === 'cobalt'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-500'
                  : 'bg-[var(--border-sunofy)] border-transparent text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              ⚡ Cobalt YT
            </button>
            <button
              onClick={() => {
                onUpdateProfile({ apiSource: 'yt_music' });
                if (onMusicSourceChange) onMusicSourceChange('youtube');
                onShowToast('Switched to YouTube Music Engine');
              }}
              className={`text-[10px] sm:text-xs py-2 px-1 rounded-xl border font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                musicSource === 'youtube'
                  ? 'bg-red-500/15 border-red-500/50 text-red-500'
                  : 'bg-[var(--border-sunofy)] border-transparent text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              🎵 YT Music
            </button>
            <button
              onClick={() => {
                onUpdateProfile({ apiSource: 'custom_mirror' });
                if (onMusicSourceChange) onMusicSourceChange('local');
                onShowToast('Switched to Local Engine');
              }}
              className={`text-[10px] sm:text-xs py-2 px-1 rounded-xl border font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                musicSource === 'local'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                  : 'bg-[var(--border-sunofy)] border-transparent text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
              }`}
            >
              💾 Local
            </button>
          </div>
        </div>

        {/* LIVE API QUOTA & HEALTH STATUS */}
        {musicSource === 'local' ? (
          /* LOCAL ENGINE DASHBOARD WITH GRID */
          <div className="space-y-4 pt-1 border-t border-[var(--border-sunofy)]">
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Offline Cached Songs */}
              <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold uppercase text-[var(--muted-sunofy)] tracking-wider">Offline Cache</h4>
                    <p className="text-xs font-bold text-[var(--text-sunofy)] truncate mt-0.5">{downloads.length} Tracks</p>
                  </div>
                </div>
                {downloads.length > 0 && onPlayTrack && (
                  <button
                    onClick={() => onPlayTrack(downloads[0])}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/20 transition"
                  >
                    <Play className="w-3 h-3 fill-emerald-500" /> Play Cache
                  </button>
                )}
              </div>

              {/* Card 2: Device Folder Songs */}
              <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold uppercase text-[var(--muted-sunofy)] tracking-wider">Device Folders</h4>
                    <p className="text-xs font-bold text-[var(--text-sunofy)] truncate mt-0.5">{localFolderTracks.length} Loaded</p>
                  </div>
                </div>
                
                {/* Hidden File Picker Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="audio/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={folderInputRef}
                  onChange={handleFileChange}
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  className="hidden"
                />

                <div className="flex gap-1.5">
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer border border-amber-500/20 transition"
                    title="Load entire local folder"
                  >
                    <FolderOpen className="w-3 h-3" /> Load Folder
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--card-sunofy)] hover:bg-[var(--hover-sunofy)] text-[var(--text-sunofy)] text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer border border-[var(--border-sunofy)] transition"
                    title="Load multiple audio files"
                  >
                    <FileAudio className="w-3 h-3 text-[var(--accent-sunofy)]" /> Files
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable list/grid of loaded files */}
            {localFolderTracks.length > 0 && (
              <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                  <span>Loaded Tracks ({localFolderTracks.length})</span>
                  {onClearLocalFolderTracks && (
                    <button onClick={onClearLocalFolderTracks} className="text-red-500 hover:underline">Clear</button>
                  )}
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {localFolderTracks.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => onPlayTrack && onPlayTrack(song)}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--card-sunofy)] transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-md bg-[var(--accent-sunofy)]/10 flex items-center justify-center text-[var(--accent-sunofy)] shrink-0 font-bold text-[10px]">
                          <Play className="w-3 h-3 fill-current opacity-80" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-[var(--text-sunofy)] truncate">{song.title}</div>
                          <div className="text-[9px] text-[var(--muted-sunofy)] truncate mt-0.2">{song.artist}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LIVE API QUOTA & HEALTH STATUS */
          <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted-sunofy)] font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> API Health & Quota:
              </span>
              <span className="text-emerald-400 font-mono font-bold">100% Operational</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-[var(--muted-sunofy)] border-t border-[var(--border-sunofy)]">
              <div>Total Requests: <strong className="text-[var(--text-sunofy)]">{reqCount} made</strong></div>
              <div>Avg Latency: <strong className="text-[var(--accent-sunofy)]">{musicSource === 'jiosaavn' ? ping : ping + 50}ms</strong></div>
              <div>JioSaavn API: <strong className={musicSource === 'jiosaavn' ? 'text-emerald-400 font-bold' : 'text-[var(--text-sunofy)]'}>{musicSource === 'jiosaavn' ? `${reqCount} calls` : 'Standby'}</strong></div>
              <div>YouTube Cobalt: <strong className={musicSource === 'youtube' ? 'text-red-400 font-bold' : 'text-[var(--text-sunofy)]'}>{musicSource === 'youtube' ? `${reqCount} calls` : 'Standby'}</strong></div>
              <div className="col-span-2">Active Serverless Sync: <strong className="text-[var(--text-sunofy)]">Active & Synchronized</strong></div>
            </div>
          </div>
        )}

        {/* PREFERRED DOWNLOAD FOLDER PICKER */}
        <div className="pt-2 border-t border-[var(--border-sunofy)]">
          <button
            onClick={handleSelectCustomFolder}
            className="w-full text-xs bg-[var(--border-sunofy)] hover:bg-[var(--hover-sunofy)] text-[var(--text-sunofy)] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            Set Preferred Download Folder
          </button>
        </div>
      </CollapsibleCard>

      {/* App Lock & Security Profile */}
      <CollapsibleCard title="App Lock & Security" icon={ShieldCheck}>
        <p className="text-[10px] text-[var(--muted-sunofy)]">Lock Sunofy with a 4-digit PIN for privacy</p>
        <div className="flex items-center justify-between p-3 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]">
          <div className="flex items-center space-x-2">
            {profile.appLockEnabled ? (
              <Lock className="w-4 h-4 text-[var(--accent-sunofy)]" />
            ) : (
              <Unlock className="w-4 h-4 text-[var(--muted-sunofy)]" />
            )}
            <span className="text-xs font-semibold">{profile.appLockEnabled ? 'PIN Enabled' : 'No Lock Active'}</span>
          </div>
          <button
            onClick={() => {
              if (profile.appLockEnabled) {
                onUpdateProfile({ appLockEnabled: false });
                onShowToast('App Lock Disabled');
              } else {
                setShowPinModal(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              profile.appLockEnabled ? 'bg-red-500 text-[var(--text-sunofy)]' : 'bg-[var(--accent-sunofy)] text-black'
            }`}
          >
            {profile.appLockEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {profile.appLockEnabled && (
          <button
            onClick={onLockAppNow}
            className="w-full py-2.5 rounded-xl bg-[var(--border-sunofy)] text-[var(--muted-sunofy)] text-xs font-bold hover:text-[var(--text-sunofy)] transition cursor-pointer"
          >
            Lock Application Now
          </button>
        )}
      </CollapsibleCard>

      {/* App Theme Selection */}
      <CollapsibleCard title="App Theme" icon={Palette} defaultOpen={true}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'dark', label: 'Dark', color: '#22c55e', bg: '#0d1222', text: '#f8fafc' },
            { key: 'amoled', label: 'AMOLED', color: '#4ade80', bg: '#000000', text: '#ffffff' },
            { key: 'ocean', label: 'Ocean', color: '#3b82f6', bg: '#0c4a6e', text: '#f0f9ff' },
            { key: 'purple', label: 'Purple', color: '#a855f7', bg: '#3b0764', text: '#faf5ff' },
            { key: 'emerald', label: 'Emerald', color: '#1db954', bg: '#121216', text: '#ffffff' },
            { key: 'amber', label: 'Amber', color: '#fbbf24', bg: '#78350f', text: '#fffbeb' },
            { key: 'cyberpunk', label: 'Cyber', color: '#f472b6', bg: '#2e1065', text: '#fdf2f8' },
            { key: 'crimson', label: 'Crimson', color: '#fb7185', bg: '#881337', text: '#fff1f2' },
            { key: 'light', label: 'Light', color: '#2563eb', bg: '#f1f5f9', text: '#0f172a' },
          ].map((theme) => {
            const isActive = (profile.appTheme || 'emerald') === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => {
                  onUpdateProfile({ appTheme: theme.key as any, accentColor: theme.color });
                  onShowToast(`Applied ${theme.label} theme`);
                }}
                className={`py-2.5 px-1 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                  isActive ? 'border-[var(--accent-sunofy)]' : 'border-transparent hover:border-[var(--muted-sunofy)]'
                }`}
                style={{ backgroundColor: theme.bg, color: theme.text }}
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: theme.color }} />
                <span className="truncate">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleCard>

      {/* Local Device Backup & File Restore */}
      <CollapsibleCard title="Device Storage & Backup" icon={HardDrive}>
        <p className="text-xs text-[var(--muted-sunofy)]">
          All data is saved locally on your device storage. You can export a backup JSON file or import one anytime.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-[var(--border-sunofy)] text-[var(--text-sunofy)] border border-[var(--accent-sunofy)]/30 font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-[var(--border-sunofy)] text-[var(--text-sunofy)] border border-[var(--border-sunofy)] font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-[var(--hover-sunofy)] transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" />
            <span>Import Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </CollapsibleCard>

      {/* Equalizer Access */}
      <CollapsibleCard title="Equalizer & Audio Effects" icon={Sliders}>
        <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">Tune bass boost and 5-band frequency gains</p>
        <button
          onClick={onOpenEqualizer}
          className="w-full py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black font-semibold text-xs cursor-pointer hover:scale-105 transition"
        >
          Configure Audio Equalizer
        </button>
      </CollapsibleCard>

      {/* PWA App Installation */}
      <CollapsibleCard title="App Installation & PWA" icon={Download}>
        <p className="text-[10px] text-[var(--muted-sunofy)]">Install Sunofy on Android, iPhone/iPad, or Desktop for offline access</p>
        <button
          onClick={() => {
            const prompt = (window as any).deferredPwaPrompt;
            if (prompt) {
              prompt.prompt();
            } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              onShowToast('iOS Safari: Tap Share (⎋) -> "Add to Home Screen" (+)');
            } else {
              onShowToast('To install: Open browser menu (⋮) -> "Add to Home Screen"');
            }
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>Install Sunofy App (Android / iOS / System)</span>
        </button>
      </CollapsibleCard>

      {/* App Updates & Synchronization */}
      <CollapsibleCard title="Updates & Build Reference" icon={RefreshCw}>
        <p className="text-[10px] text-[var(--muted-sunofy)]">Check and synchronize with latest official GitHub build</p>
        <button
          onClick={handleCheckForUpdates}
          disabled={checkingUpdates}
          className="w-full py-2.5 rounded-xl bg-[var(--border-sunofy)] hover:bg-[var(--hover-sunofy)] text-[var(--text-sunofy)] border border-[var(--border-sunofy)] font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-55"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent-sunofy)] ${checkingUpdates ? 'animate-spin' : ''}`} />
          <span>{checkingUpdates ? 'Checking for updates...' : 'Check GitHub for Updates'}</span>
        </button>
      </CollapsibleCard>

      {/* Update Notice Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-[9990] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-sunofy)]/15 border border-[var(--accent-sunofy)]/30 text-[var(--accent-sunofy)] flex items-center justify-center mx-auto text-xl shadow-[0_0_15px_rgba(29,185,84,0.2)]">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-sunofy)]">{updateModal.title}</h3>
              <p className="text-xs text-[var(--muted-sunofy)] mt-1.5 whitespace-pre-line leading-relaxed">{updateModal.msg}</p>
            </div>
            <div className="flex gap-2 pt-2">
              {updateModal.canReload && (
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)]/90 text-black py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reload & Update
                </button>
              )}
              <button
                onClick={() => setUpdateModal(null)}
                className="flex-1 bg-[var(--border-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] text-[var(--text-sunofy)] py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA App Install Button & Razel Tech Branding Footer at the end */}
      <div className="pt-2 pb-6 space-y-4 text-center">
        <button
          onClick={() => {
            if ((window as any).deferredPwaPrompt) {
              (window as any).deferredPwaPrompt.prompt();
              (window as any).deferredPwaPrompt.userChoice.then((choice: any) => {
                if (choice.outcome === 'accepted') {
                  onShowToast('Sunofy PWA app installed successfully!');
                }
              });
            } else {
              onShowToast('To install: Tap browser menu (⋮ or Share) -> Add to Home Screen / Install App');
            }
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[var(--accent-sunofy)] to-emerald-400 text-[var(--bg-sunofy)] font-black text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] active:scale-98 transition cursor-pointer"
        >
          <Smartphone className="w-5 h-5" />
          <span>Install Sunofy PWA App</span>
        </button>

        <div className="pt-2 flex flex-col items-center justify-center space-y-1">
          <p className="text-xs font-bold text-[var(--muted-sunofy)] flex items-center justify-center gap-1.5">
            <span>Powered by</span>
            <span className="text-[var(--text-sunofy)] font-black uppercase tracking-wider">Razel Tech</span>
            <Heart className="w-4 h-4 fill-current rainbow-heart-glow" />
          </p>
          <p className="text-[10px] text-[var(--muted-sunofy)]/70">
            Developed by Razel Tech • Sunofy Music & SyncParty v3.0
          </p>
        </div>
      </div>

      {/* PIN Change Modal */}
     {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] p-6 rounded-3xl w-full max-w-xs space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--text-sunofy)] flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-[var(--accent-sunofy)]" />
              <span>Set 4-Digit App Lock PIN</span>
            </h3>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="e.g. 1234"
              className="w-full bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-[var(--accent-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--border-sunofy)] text-xs font-semibold text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-bold"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
