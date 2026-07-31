export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number; // in seconds
  downloadUrl?: string;
  lyrics?: string;
  hasOfflineAudio?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Track[];
  duration?: string;
  createdAt?: string;
  image?: string;
}

export interface Favorites {
  songs: Track[];
  albums: { id: string; title: string; artist: string; image: string }[];
  artists: { id: string; name: string; followers: string; image: string }[];
  playlists: Playlist[];
}

export interface DownloadTrack extends Track {
  downloadedAt: number;
  sizeBytes?: number;
  offlineBlobUrl?: string;
}

export interface SyncMember {
  id: string;
  name: string;
  avatar?: string;
  avatarIcon?: string;
  customAvatarUrl?: string;
  isHost: boolean;
  pingMs?: number;
}

export interface SyncChatMessage {
  id: string;
  senderId?: string;
  sender: string;
  avatarIcon?: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface SyncPartyRequest {
  id: string;
  track: Track;
  requesterName: string;
  timestamp: number;
}

export interface SyncPartyState {
  inRoom: boolean;
  roomCode: string;
  isHost: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  members: SyncMember[];
  chat: SyncChatMessage[];
  requests?: SyncPartyRequest[];
}

export interface EqualizerBand {
  freq: number; // e.g. 60, 230, 910, 4000, 14000
  label: string;
  gain: number; // -12 to +12 dB
}

export interface UserProfile {
  username: string;
  email: string;
  subscription: string;
  preferredQuality: '320kbps' | '160kbps' | '96kbps';
  accentColor: string;
  appTheme: 'emerald' | 'cobalt' | 'sunset' | 'amoled' | 'purple' | 'dark' | 'ocean' | 'amber' | 'cyberpunk' | 'crimson' | 'light';
  apiSource: 'jiosaavn' | 'cobalt_yt' | 'custom_mirror';
  appLockEnabled: boolean;
  appLockPin: string;
  avatarIcon?: string;
  customAvatarUrl?: string;
  lastBackupAt?: string;
}
