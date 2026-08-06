import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import {
  Header,
  BottomNav,
  TabName,
  MiniPlayer,
  FullPlayerModal,
  SearchModal,
  EqualizerModal,
  SleepTimerModal,
  CarModeModal,
  OnboardingModal,
  PwaInstallBanner,
} from './components';
import { AppLockOverlay } from './components/AppLockOverlay';
import { DiscoverTab } from './components/tabs/DiscoverTab';
import { PlaylistsTab } from './components/tabs/PlaylistsTab';
import { FavoritesTab } from './components/tabs/FavoritesTab';
import { OfflineTab } from './components/tabs/OfflineTab';
import { SyncPartyTab } from './components/tabs/SyncPartyTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { VideoTab } from './components/tabs/VideoTab';

import { Track, Playlist, Favorites, DownloadTrack, SyncPartyState, EqualizerBand, UserProfile } from './types';
import { offlineStore } from './services/offlineStore';
import { musicApi } from './services/api';
import { syncParty } from './services/syncPartySocket';

const ThemeInjector: React.FC<{ themeId: string }> = ({ themeId }) => {
  const themes: Record<string, any> = {
    dark: { bg: '#05070f', card: '#0d1222', border: '#1e293b', hover: '#334155', accent: '#22c55e', text: '#f8fafc', muted: '#94a3b8' },
    amoled: { bg: '#000000', card: '#0a0a0a', border: '#171717', hover: '#262626', accent: '#4ade80', text: '#ffffff', muted: '#a3a3a3' },
    ocean: { bg: '#082f49', card: '#0c4a6e', border: '#0369a1', hover: '#0284c7', accent: '#38bdf8', text: '#f0f9ff', muted: '#bae6fd' },
    purple: { bg: '#2e1065', card: '#3b0764', border: '#581c87', hover: '#7e22ce', accent: '#c084fc', text: '#faf5ff', muted: '#d8b4fe' },
    emerald: { bg: '#0a0a0c', card: '#121216', border: '#22222c', hover: '#333342', accent: '#1db954', text: '#ffffff', muted: '#a7a7a7' },
    amber: { bg: '#451a03', card: '#78350f', border: '#92400e', hover: '#b45309', accent: '#fbbf24', text: '#fffbeb', muted: '#fde68a' },
    cyberpunk: { bg: '#18092e', card: '#2e1065', border: '#db2777', hover: '#f472b6', accent: '#f472b6', text: '#fdf2f8', muted: '#fbcfe8' },
    crimson: { bg: '#4c0519', card: '#881337', border: '#be123c', hover: '#e11d48', accent: '#fb7185', text: '#fff1f2', muted: '#fecdd3' },
    light: { bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0', hover: '#f1f5f9', accent: '#3b82f6', text: '#0f172a', muted: '#64748b' }
  };
  
  const t = themes[themeId] || themes.emerald;
  return (
    <style>{`
      :root {
        --bg-sunofy: ${t.bg};
        --card-sunofy: ${t.card};
        --border-sunofy: ${t.border};
        --hover-sunofy: ${t.hover};
        --accent-sunofy: ${t.accent};
        --text-sunofy: ${t.text};
        --muted-sunofy: ${t.muted};
      }
      body {
        background-color: var(--bg-sunofy);
        color: var(--text-sunofy);
      }
    `}</style>
  );
};

/** Extract YouTube video ID from a youtube.com / youtu.be / music.youtube.com URL */
function extractYtId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabName>('Discover');
  const [discoverQuery, setDiscoverQuery] = useState<string | undefined>(undefined);

  // Load Saved Player State from LocalStorage
  const savedPlayerState = (() => {
    try {
      const raw = localStorage.getItem('sunofy_player_state');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  // Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(
    savedPlayerState?.currentTrack || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(savedPlayerState?.currentTime || 0);
  const [duration, setDuration] = useState(savedPlayerState?.currentTrack?.duration || 0);
  const [queue, setQueue] = useState<Track[]>(savedPlayerState?.queue || []);
  const [originalQueue, setOriginalQueue] = useState<Track[]>(savedPlayerState?.queue || []);
  const [history, setHistory] = useState<Track[]>([]);
  const [isShuffle, setIsShuffle] = useState(savedPlayerState?.isShuffle || false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>(savedPlayerState?.repeatMode || 'off');
  const [volume, setVolume] = useState(savedPlayerState?.volume ?? 1);

  // Library & Persistence State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('sunofy_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<Favorites>(() => {
    const saved = localStorage.getItem('sunofy_favorites');
    return saved
      ? JSON.parse(saved)
      : {
          songs: [],
          albums: [],
          artists: [],
          playlists: [],
        };
  });

  const [downloads, setDownloads] = useState<DownloadTrack[]>([]);
  const [localFolderTracks, setLocalFolderTracks] = useState<Track[]>([]);
  const [localSourceMode, setLocalSourceMode] = useState<'downloads' | 'folder'>(() => {
    return (localStorage.getItem('sunofy_local_source_mode') as 'downloads' | 'folder') || 'downloads';
  });
  const [syncState, setSyncState] = useState<SyncPartyState>(syncParty.getState());

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sunofy_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          username: 'Sunofy User',
          email: 'user@sunofy.app',
          subscription: 'Sunofy Duo Premium',
          preferredQuality: '320kbps',
          accentColor: '#1db954',
          appTheme: 'emerald',
          apiSource: 'jiosaavn',
          appLockEnabled: true,
          appLockPin: '0908',
        };
  });

  // App Lock Passcode Overlay - Default pops up on every fresh start
  const [isAppLocked, setIsAppLocked] = useState(true);

  // App Initial Boot Loading State
  const [isBootLoading, setIsBootLoading] = useState(true);

  // Global YouTube Iframe Integration
  const ytIframeRef = useRef<HTMLIFrameElement>(null);

  const globalYtId = currentTrack && (((currentTrack as any).isCobalt) || (currentTrack as any).url?.includes('youtube.com') || currentTrack.downloadUrl?.includes('youtube'))
    ? extractYtId(currentTrack.downloadUrl || (currentTrack as any).url) || currentTrack.id.replace('yt_', '')
    : null;

  useEffect(() => {
    if (!globalYtId || !ytIframeRef.current) return;
    const cmd = isPlaying ? 'playVideo' : 'pauseVideo';
    ytIframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: cmd, args: [] }),
      '*'
    );
  }, [isPlaying, globalYtId]);

  // Sync duration when track changes
  useEffect(() => {
    if (currentTrack && currentTrack.duration) {
      setDuration(currentTrack.duration);
    }
  }, [currentTrack]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime) {
            setCurrentTime(data.info.currentTime);
          }
          if (data.info.duration && data.info.duration > 0 && duration === 0) {
            setDuration(data.info.duration);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    
    // Poll the iframe for time updates every 500ms since we don't have the YT wrapper
    const interval = setInterval(() => {
      if (ytIframeRef.current && isPlaying && globalYtId) {
        // Fallback manual tick in case infoDelivery fails (CORS or JS API changes)
        setCurrentTime((prev) => {
          if (duration && prev >= duration) return duration;
          return prev + 0.5;
        });
        ytIframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening', id: 1 }),
          '*'
        );
      }
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [isPlaying, globalYtId, duration, currentTrack]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBootLoading(false);
      const params = new URLSearchParams(window.location.search);
      const partyCode = params.get('party') || params.get('room');
      if (partyCode) {
        setCurrentTab('Sync Party');
        syncParty.joinRoom(partyCode);
        setTimeout(() => setToastMsg(`Auto-joined Sync Party #${partyCode}`), 500);
      }
    }, 1400);

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
      }
    };
    window.addEventListener('sunofy:switch_tab', handleSwitchTab);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('sunofy:switch_tab', handleSwitchTab);
    };
  }, []);

  // First-Time Startup Onboarding Screen
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('sunofy_onboarded');
  });

  // Equalizer Bands State (Upgraded 10-Band EQ)
  const [eqBands, setEqBands] = useState<EqualizerBand[]>(() => {
    const saved = localStorage.getItem('sunofy_eq_bands_10');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { freq: 32, label: '32Hz', gain: 0 },
      { freq: 64, label: '64Hz', gain: 0 },
      { freq: 125, label: '125Hz', gain: 0 },
      { freq: 250, label: '250Hz', gain: 0 },
      { freq: 500, label: '500Hz', gain: 0 },
      { freq: 1000, label: '1kHz', gain: 0 },
      { freq: 2000, label: '2kHz', gain: 0 },
      { freq: 4000, label: '4kHz', gain: 0 },
      { freq: 8000, label: '8kHz', gain: 0 },
      { freq: 16000, label: '16kHz', gain: 0 },
    ];
  });

  const [preamp, setPreamp] = useState<number>(() => {
    return Number(localStorage.getItem('sunofy_eq_preamp') || '0');
  });
  const [bassBoost, setBassBoost] = useState<number>(() => {
    return Number(localStorage.getItem('sunofy_eq_bassboost') || '0');
  });
  const [spatialBalance, setSpatialBalance] = useState<number>(() => {
    return Number(localStorage.getItem('sunofy_eq_balance') || '0');
  });
  const [reverbPreset, setReverbPreset] = useState<string>(() => {
    return localStorage.getItem('sunofy_eq_reverb') || 'None';
  });
  const [reverbDelay, setReverbDelay] = useState<number>(() => {
    return Number(localStorage.getItem('sunofy_eq_reverb_delay') || '0.3');
  });
  const [reverbFeedback, setReverbFeedback] = useState<number>(() => {
    return Number(localStorage.getItem('sunofy_eq_reverb_feedback') || '0.3');
  });

  // Sleep Timer State
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Modals visibility
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isCarModeOpen, setIsCarModeOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const musicSource = (() => {
    const sourceMap: Record<string, 'jiosaavn' | 'cobalt' | 'youtube' | 'local'> = {
      jiosaavn: 'jiosaavn',
      cobalt_yt: 'cobalt',
      yt_music: 'youtube',
      custom_mirror: 'local',
      local: 'local'
    };
    return sourceMap[userProfile.apiSource] || 'jiosaavn';
  })();

  const setMusicSource = (source: 'jiosaavn' | 'cobalt' | 'youtube' | 'local') => {
    const profileSourceMap: Record<string, 'jiosaavn' | 'cobalt_yt' | 'yt_music' | 'custom_mirror'> = {
      jiosaavn: 'jiosaavn',
      cobalt: 'cobalt_yt',
      youtube: 'yt_music',
      local: 'custom_mirror'
    };
    setUserProfile((prev) => ({
      ...prev,
      apiSource: profileSourceMap[source] || 'jiosaavn'
    }));
  };

  // Audio HTML5 element and Web Audio API Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const preampRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const bassBoostRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sleepTimerTimeoutRef = useRef<any>(null);

  // Sync musicSource with API class currentSource
  useEffect(() => {
    musicApi.currentSource = musicSource;
  }, [musicSource]);

  // Real-time EQ Band updates
  useEffect(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (filtersRef.current.length > 0) {
      eqBands.forEach((band, idx) => {
        if (filtersRef.current[idx]) {
          filtersRef.current[idx].gain.setValueAtTime(band.gain, 0);
        }
      });
    }
  }, [eqBands]);

  // Real-time Preamp updates
  useEffect(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (preampRef.current) {
      preampRef.current.gain.setValueAtTime(Math.pow(10, preamp / 20), 0);
    }
  }, [preamp]);

  // Real-time Bass Boost updates
  useEffect(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (bassBoostRef.current) {
      bassBoostRef.current.gain.setValueAtTime(bassBoost, 0);
    }
  }, [bassBoost]);

  // Real-time Spatial Panner updates
  useEffect(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (pannerRef.current) {
      pannerRef.current.pan.setValueAtTime(spatialBalance, 0);
    }
  }, [spatialBalance]);

  const updateReverbNodes = (preset: string, dNode?: DelayNode | null, dgNode?: GainNode | null) => {
    const delayNode = dNode !== undefined ? dNode : delayRef.current;
    const delayGainNode = dgNode !== undefined ? dgNode : delayGainRef.current;
    
    if (!delayNode || !delayGainNode) return;
    
    let config = [0.0, 0.0];
    switch (preset) {
      case 'Studio (Warm)': config = [0.05, 0.15]; break;
      case 'Concert Hall': config = [0.18, 0.35]; break;
      case 'Acoustic Arena': config = [0.35, 0.45]; break;
      case 'Cosmic Echo': config = [0.60, 0.60]; break;
      case 'Custom': config = [reverbDelay, reverbFeedback]; break;
      case 'None': default: config = [0.0, 0.0]; break;
    }
    delayNode.delayTime.setValueAtTime(config[0], 0);
    delayGainNode.gain.setValueAtTime(config[1], 0);
  };

  // Real-time Reverb updates
  useEffect(() => {
    updateReverbNodes(reverbPreset);
  }, [reverbPreset, reverbDelay, reverbFeedback]);

  // Init Web Audio API Equalizer & Audio FX Nodes lazily
  const initEqualizerWebAudio = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      
      const preampNode = ctx.createGain();
      preampNode.gain.value = Math.pow(10, preamp / 20);
      preampRef.current = preampNode;

      const bassBoostNode = ctx.createBiquadFilter();
      bassBoostNode.type = 'lowshelf';
      bassBoostNode.frequency.value = 80;
      bassBoostNode.gain.value = bassBoost;
      bassBoostRef.current = bassBoostNode;

      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const filters = frequencies.map((freq) => {
        const filter = ctx.createBiquadFilter();
        filter.type = freq <= 64 ? 'lowshelf' : freq >= 8000 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        const initialBand = eqBands.find((b) => b.freq === freq);
        filter.gain.value = initialBand ? initialBand.gain : 0;
        return filter;
      });
      filtersRef.current = filters;

      let pannerNode: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.value = spatialBalance;
        pannerRef.current = pannerNode;
      }

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserRef.current = analyserNode;

      const delayNode = ctx.createDelay(1.0);
      const delayGainNode = ctx.createGain();
      delayNode.connect(delayGainNode);
      delayGainNode.connect(delayNode);
      delayRef.current = delayNode;
      delayGainRef.current = delayGainNode;

      updateReverbNodes(reverbPreset, delayNode, delayGainNode);

      source.connect(preampNode);
      preampNode.connect(bassBoostNode);
      bassBoostNode.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }

      const lastFilter = filters[filters.length - 1];
      const mixGain = ctx.createGain();
      mixGain.gain.value = 1.0;

      lastFilter.connect(mixGain);
      lastFilter.connect(delayNode);
      delayGainNode.connect(mixGain);

      if (pannerNode) {
        mixGain.connect(pannerNode);
        pannerNode.connect(analyserNode);
      } else {
        mixGain.connect(analyserNode);
      }

      analyserNode.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API EQ initialization deferred or CORS restricted:', e);
    }
  };

  // Load Offline Downloads on startup & Listen for PWA Updates / App Toast Events
  useEffect(() => {
    offlineStore.getAllOfflineTracks().then((tracks) => setDownloads(tracks));

    const handlePwaUpdate = () => {
      showToast('✨ New Sunofy update ready! Tap Profile -> Check Updates to reload');
    };

    const handleSunofyToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };

    window.addEventListener('pwaUpdateAvailable', handlePwaUpdate);
    window.addEventListener('sunofyToast', handleSunofyToast);
    return () => {
      window.removeEventListener('pwaUpdateAvailable', handlePwaUpdate);
      window.removeEventListener('sunofyToast', handleSunofyToast);
    };
  }, []);

  // Sync Party socket subscription
  useEffect(() => {
    const unsubscribe = syncParty.subscribe((newState) => {
      setSyncState(newState);
      if (newState.inRoom && !newState.isHost) {
         if (newState.currentTrack && (!currentTrack || currentTrack.id !== newState.currentTrack.id)) {
            setCurrentTrack(newState.currentTrack);
            const track = newState.currentTrack;
            const trackUrl = (track as any).url || track.downloadUrl || '';
            const isVideoTrack = track.mediaType === 'video' || (track as any).isVideo || trackUrl.includes('youtube.com') || trackUrl.includes('youtu.be');
            
            if (audioRef.current) {
               if (isVideoTrack) {
                  audioRef.current.pause();
               } else {
                  audioRef.current.src = track.downloadUrl || trackUrl || 'https://aac.saavncdn.com/274/b7a2d39893d56f6c94481bc265e38600_160.mp3';
                  if (newState.isPlaying) {
                     audioRef.current.currentTime = newState.currentTime;
                     audioRef.current.play().catch(()=>console.log('Autoplay blocked'));
                  }
               }
            }
         }
         if (audioRef.current) {
            if (newState.isPlaying && audioRef.current.paused) {
               audioRef.current.currentTime = newState.currentTime;
               audioRef.current.play().catch(()=>console.log('Autoplay blocked'));
               setIsPlaying(true);
            } else if (!newState.isPlaying && !audioRef.current.paused) {
               audioRef.current.pause();
               setIsPlaying(false);
            }
         }
      }
    });
    return () => unsubscribe();
  }, [currentTrack]);

  // Conflict Control 1: Pause audio when switching to Videos tab
  useEffect(() => {
    if (currentTab === 'Videos' && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [currentTab]);

  // Stop & clear audio on SyncParty exit to prevent ghost background audio or double tracks
  useEffect(() => {
    if (!syncState.inRoom && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [syncState.inRoom]);

  // Auto-Join from URL parameter ?party=1234 or ?room=1234
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partyCode = params.get('party') || params.get('room');
    if (partyCode && !syncState.inRoom) {
      setTimeout(() => {
        syncParty.joinRoom(partyCode);
        setCurrentTab('SyncParty');
      }, 300);
    }
  }, []);

  // SyncParty WebRTC-Style Drift-Correction Audio Engine
  useEffect(() => {
    if (!syncState.inRoom || !audioRef.current) return;

    const audio = audioRef.current;
    const track = syncState.currentTrack || (syncState.queue.length > 0 ? syncState.queue[0] : null);

    if (track) {
      // Bypass video tracks & YouTube links from native <audio> element to prevent NotSupportedError
      const isVideoTrack = track.mediaType === 'video' || (track as any).isVideo || track.url?.includes('youtube.com') || track.url?.includes('youtu.be') || track.downloadUrl?.includes('youtube.com');
      if (isVideoTrack) {
        if (!audio.paused) audio.pause();
        setIsPlaying(syncState.isPlaying);
        return;
      }

      const src = track.downloadUrl || track.url;
      const isNewTrack = src && audio.src !== src;

      if (isNewTrack) {
        audio.src = src;
        audio.playbackRate = 1.0;
        if (syncState.currentTime) {
          try {
            audio.currentTime = syncState.currentTime;
          } catch (e) {}
        }
      }

      if (syncState.isPlaying) {
        if (audio.paused) {
          audio.play().then(() => {
            initEqualizerWebAudio();
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume();
            }
          }).catch((err) => console.warn('SyncParty audio play failed:', err));
        }
        setIsPlaying(true);

        // Seek / Drift correction for Host and Listeners
        // We removed the aggressive "time-jumping" reloop logic that caused stuttering.
        // Listeners will only hard-seek if they are massively out of sync (e.g. Host manually scrubbed the timeline > 5 seconds)
        if (!isNewTrack && syncState.currentTime >= 0) {
          const drift = Math.abs(audio.currentTime - syncState.currentTime);
          if (drift > 5) {
            try {
              audio.currentTime = syncState.currentTime;
            } catch (e) {}
          }
        }
      } else {
        if (!audio.paused) audio.pause();
        audio.playbackRate = 1.0;
        setIsPlaying(false);
      }
    } else {
      if (!audio.paused) audio.pause();
      audio.playbackRate = 1.0;
      setIsPlaying(false);
    }
  }, [syncState.inRoom, syncState.currentTrack?.id, syncState.isPlaying, syncState.currentTime]);

  // Host Audio Timeupdate
  useEffect(() => {
    if (!syncState.inRoom || !syncState.isHost || !audioRef.current) return;
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [syncState.inRoom, syncState.isHost]);

  // Mic Audio Ducking
  useEffect(() => {
    if (audioRef.current && syncState.inRoom) {
      const isAnyoneSpeaking = syncState.members.some(m => m.isMicSpeaking || (m as any).isMicActive);
      audioRef.current.volume = isAnyoneSpeaking ? 0.15 : volume;
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [syncState.members, syncState.inRoom, volume]);

  // Restore last played track & timestamp on startup
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const offlineCopy = downloads.find((d) => d.id === currentTrack.id);
      const src = offlineCopy?.offlineBlobUrl || currentTrack.downloadUrl;
      const isYoutubeTrack = (currentTrack as any)?.isCobalt || (currentTrack as any)?.url?.includes('youtube.com') || currentTrack?.downloadUrl?.includes('youtube.com');
      if (src && audioRef.current.src !== src) {
        if (isYoutubeTrack && !offlineCopy && musicSource !== 'cobalt') {
           // Skip native audio loading to let iframe handle it without throwing CORS
           // When musicSource is 'cobalt', we want to load the extracted stream into the native audio tag
        } else {
          audioRef.current.src = src;
          if (savedPlayerState?.currentTime) {
            try {
              audioRef.current.currentTime = savedPlayerState.currentTime;
            } catch (e) {}
          }
        }
      }
    }
  }, [currentTrack, downloads]);

  // Save state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('sunofy_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('sunofy_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sunofy_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Persist Player State (music canvas stays at last stop)
  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem(
        'sunofy_player_state',
        JSON.stringify({
          currentTrack,
          currentTime,
          queue,
          isShuffle,
          repeatMode,
          volume,
        })
      );
    }
  }, [currentTrack, currentTime, queue, isShuffle, repeatMode, volume]);

  // Audio Player Event Listeners & Media Session Registration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setDuration(audio.duration);
    };

    const handleEnded = () => {
      const state = syncParty.getState();
      if (state.inRoom && state.isHost) {
        syncParty.nextTrackInQueue();
        return;
      }
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (queue.length > 0 || (repeatMode === 'all' && originalQueue.length > 0)) {
        handleNextTrack();
      } else {
        setIsPlaying(false);
      }
    };

    const handlePlay = () => {
      const state = syncParty.getState();
      if (state.inRoom) {
        if (state.isHost) syncParty.syncAudioState(audio.currentTime, true);
        else if (!state.isPlaying) audio.pause(); // strict sync
      }
    };
    
    const handlePause = () => {
      const state = syncParty.getState();
      if (state.inRoom) {
        if (state.isHost) syncParty.syncAudioState(audio.currentTime, false);
        else if (state.isPlaying) audio.play().catch(()=>{}); // strict sync
      }
    };

    const handleSeeked = () => {
      const state = syncParty.getState();
      if (state.inRoom) {
        if (state.isHost) syncParty.syncAudioState(audio.currentTime, !audio.paused);
        else if (Math.abs(audio.currentTime - state.currentTime) > 3) audio.currentTime = state.currentTime;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [repeatMode, queue, originalQueue, isShuffle]);

  // Media Session API for background audio & lockscreen controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Sunofy Music',
        artwork: [
          { src: currentTrack.image, sizes: '96x96', type: 'image/png' },
          { src: currentTrack.image, sizes: '128x128', type: 'image/png' },
          { src: currentTrack.image, sizes: '192x192', type: 'image/png' },
          { src: currentTrack.image, sizes: '512x512', type: 'image/png' },
        ],
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => handleTogglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => handleTogglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) handleSeek(details.seekTime);
        });
      } catch (e) {}
    }
  }, [currentTrack, isPlaying]);

  // PC Keyboard Hotkey Shortcuts Listener (Space/Enter to toggle play/pause, Arrow keys, N/P/M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyK') {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) handleSeek(audioRef.current.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) handleSeek(Math.max(0, audioRef.current.currentTime - 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume((v) => Math.min(1, Math.round((v + 0.05) * 100) / 100));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume((v) => Math.max(0, Math.round((v - 0.05) * 100) / 100));
      } else if (e.code === 'KeyN') {
        handleNextTrack();
      } else if (e.code === 'KeyP') {
        handlePrevTrack();
      } else if (e.code === 'KeyM') {
        setVolume((v) => (v > 0 ? 0 : 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, volume]);

  // Sleep Timer Handler
  useEffect(() => {
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    if (sleepTimerMinutes !== null) {
      showToast(`Sleep timer set for ${sleepTimerMinutes} minutes`);
      sleepTimerTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          showToast('Sleep timer expired. Playback paused.');
          setSleepTimerMinutes(null);
        }
      }, sleepTimerMinutes * 60 * 1000);
    }
  }, [sleepTimerMinutes]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePlayTrack = async (track: Track) => {
    if (currentTrack && currentTrack.id !== track.id) {
      setHistory((prev) => [...prev.filter((t) => t.id !== track.id), currentTrack]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);

    // Initialize Web Audio EQ lazily on user playback interaction
    initEqualizerWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    if (audioRef.current) {
      // Use local offline blob URL if downloaded
      const offlineCopy = downloads.find((d) => d.id === track.id);
      let src = offlineCopy?.offlineBlobUrl || track.downloadUrl || 'https://aac.saavncdn.com/274/b7a2d39893d56f6c94481bc265e38600_160.mp3';

      const isYoutubeTrack = ((track as any).isCobalt) || (track as any).url?.includes('youtube.com') || track.downloadUrl?.includes('youtube');
      const needsCobaltExtraction = isYoutubeTrack && musicSource === 'cobalt';
      
      if (needsCobaltExtraction && !offlineCopy) {
        showToast('Extracting audio stream...');
        try {
          const ytUrl = (track.downloadUrl && track.downloadUrl.startsWith('http') && !track.downloadUrl.includes('saavncdn'))
            ? track.downloadUrl
            : `https://www.youtube.com/watch?v=${track.id.replace('yt_', '')}`;
          const cobaltSrc = await musicApi.extractCobaltStream(ytUrl);
          if (cobaltSrc) {
            src = cobaltSrc;
            showToast('Cobalt Stream Active ⚡');
          } else {
            throw new Error('Cobalt failed');
          }
        } catch (e) {
          showToast('Stream extraction failed. Check Cobalt API.');
          return;
        }
      } else if (isYoutubeTrack && !offlineCopy) {
         // If it's a YT track but we're in JioSaavn mode, bypass native <audio> completely
         // The MiniPlayer's hidden iframe will handle the playback instead
         audioRef.current.pause();
         return;
      }

      audioRef.current.src = src;
      audioRef.current.play().then(() => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }).catch((err) => console.log('Autoplay handled:', err));
    }
  };

  const handleTogglePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      if (globalYtId) {
        ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      } else {
        audioRef.current?.pause();
      }
      setIsPlaying(false);
    } else {
      if (globalYtId) {
        ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      } else {
        audioRef.current?.play().then(() => {
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
        }).catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeSecs: number) => {
    if (globalYtId && ytIframeRef.current) {
      ytIframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [timeSecs, true] }), '*');
      setCurrentTime(timeSecs);
    } else if (audioRef.current) {
      audioRef.current.currentTime = timeSecs;
      setCurrentTime(timeSecs);
    }
    const state = syncParty.getState();
    if (state.inRoom && state.isHost) {
      syncParty.seek(timeSecs);
    }
  };

  const handleNextTrack = () => {
    if (queue.length > 0) {
      if (isShuffle) {
        const nextIndex = Math.floor(Math.random() * queue.length);
        handlePlayTrack(queue[nextIndex]);
        return;
      }

      const currentIndex = currentTrack
        ? queue.findIndex((t) => t.id === currentTrack.id || (t.title === currentTrack.title && t.artist === currentTrack.artist))
        : -1;

      if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        handlePlayTrack(queue[currentIndex + 1]);
      } else if (currentIndex === -1) {
        handlePlayTrack(queue[0]);
      } else if (repeatMode === 'all') {
        handlePlayTrack(queue[0]);
        showToast('Repeating queue');
      } else {
        showToast('End of queue');
        setIsPlaying(false);
      }
    } else {
      showToast('End of queue');
      setIsPlaying(false);
    }
  };

  const handlePlayQueueItem = (index: number) => {
    const selectedTrack = queue[index];
    if (!selectedTrack) return;
    handlePlayTrack(selectedTrack);
  };

  const handleSaveQueueAsPlaylist = () => {
    if (queue.length === 0) {
      showToast('Queue is empty!');
      return;
    }
    const name = `Queue Playlist ${playlists.length + 1}`;
    const newPl: Playlist = {
      id: 'pl_' + Date.now(),
      name,
      songs: [...queue],
      duration: `${Math.round(queue.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)} mins`,
      createdAt: new Date().toLocaleDateString(),
      image: queue[0]?.image,
    };
    setPlaylists((prev) => [...prev, newPl]);
    showToast(`Saved ${queue.length} queue tracks as playlist "${name}"!`);
  };

  const handlePrevTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 5) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length > 0) {
      const currentIndex = currentTrack
        ? queue.findIndex((t) => t.id === currentTrack.id || (t.title === currentTrack.title && t.artist === currentTrack.artist))
        : -1;

      if (currentIndex > 0) {
        handlePlayTrack(queue[currentIndex - 1]);
        return;
      }
    }

    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevList) => prevList.slice(0, -1));
      // Temporarily bypass history tracking so playing this doesn't re-append history
      setCurrentTrack(prev);
      setIsPlaying(true);
      if (audioRef.current) {
        const offlineCopy = downloads.find((d) => d.id === prev.id);
        let src = offlineCopy?.offlineBlobUrl || prev.downloadUrl || 'https://aac.saavncdn.com/274/b7a2d39893d56f6c94481bc265e38600_160.mp3';
        audioRef.current.src = src;
        audioRef.current.play().then(() => {
          initEqualizerWebAudio();
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
        }).catch(() => {});
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleToggleFavoriteCurrent = () => {
    if (!currentTrack) return;
    const exists = favorites.songs.some((s) => s.id === currentTrack.id);
    if (exists) {
      setFavorites((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s.id !== currentTrack.id),
      }));
      showToast('Removed from favorites');
    } else {
      setFavorites((prev) => ({
        ...prev,
        songs: [...prev.songs, currentTrack],
      }));
      showToast('Added to favorites');
    }
  };

  const handleToggleFavoriteTrack = (track: Track) => {
    const exists = favorites.songs.some((s) => s.id === track.id);
    if (exists) {
      setFavorites((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s.id !== track.id),
      }));
      showToast(`Removed "${track.title}" from favorites`);
    } else {
      setFavorites((prev) => ({
        ...prev,
        songs: [...prev.songs, track],
      }));
      showToast(`Added "${track.title}" to favorites`);
    }
  };

  const handleDownloadTrack = async (track: Track) => {
    if (!track) return;
    showToast(`Downloading "${track.title}" for offline mode...`);
    try {
      const downloaded = await offlineStore.saveTrackForOffline(track);
      setDownloads((prev) => [...prev.filter((d) => d.id !== downloaded.id), downloaded]);
      showToast(`"${track.title}" saved offline!`);
    } catch (err) {
      showToast('Offline download failed. Please check connection.');
    }
  };

  const handleDownloadCurrentTrack = async () => {
    if (currentTrack) await handleDownloadTrack(currentTrack);
  };

  const handleImportLocalFiles = (files: FileList) => {
    if (!files || files.length === 0) return;
    const list: Track[] = Array.from(files).map((file, idx) => {
      const name = file.name;
      const title = name.substring(0, name.lastIndexOf('.')) || name;
      let artist = 'Local File';
      let cleanTitle = title;
      if (title.includes('-')) {
        const parts = title.split('-');
        artist = parts[0].trim();
        cleanTitle = parts.slice(1).join('-').trim();
      }
      
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `local_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        title: cleanTitle,
        artist,
        album: 'Device Audio Folder',
        image: './icon-192.png',
        duration: 180,
        downloadUrl: objectUrl,
        hasOfflineAudio: true,
      };
    });
    
    setLocalFolderTracks((prev) => [...list, ...prev]);
    showToast(`Loaded ${list.length} local folder songs successfully!`);
  };

  const handleRemoveLocalFolderTrack = (id: string) => {
    setLocalFolderTracks((prev) => prev.filter((t) => t.id !== id));
    showToast('Unloaded local file from player');
  };

  const handleClearLocalFolderTracks = () => {
    setLocalFolderTracks([]);
    showToast('Unloaded all device files');
  };

  const handleToggleFavoritePlaylist = (playlist: Playlist) => {
    const exists = favorites.playlists?.some((p) => p.name === playlist.name);
    if (exists) {
      setFavorites((prev) => ({
        ...prev,
        playlists: (prev.playlists || []).filter((p) => p.name !== playlist.name),
      }));
      showToast(`Removed "${playlist.name}" from favorites`);
    } else {
      setFavorites((prev) => ({
        ...prev,
        playlists: [...(prev.playlists || []), playlist],
      }));
      showToast(`Added "${playlist.name}" to favorites`);
    }
  };

  const handleToggleFavoriteAlbum = (album: { id: string; title: string; artist: string; image: string; trackCount?: string }) => {
    const exists = favorites.albums?.some((a) => a.title === album.title);
    if (exists) {
      setFavorites((prev) => ({
        ...prev,
        albums: (prev.albums || []).filter((a) => a.title !== album.title),
      }));
      showToast(`Removed "${album.title}" from favorites`);
    } else {
      setFavorites((prev) => ({
        ...prev,
        albums: [...(prev.albums || []), album],
      }));
      showToast(`Added "${album.title}" to favorites`);
    }
  };

  const handleDownloadCollection = async (query: string, name: string) => {
    showToast(`Fetching tracks for "${name}" to cache offline...`);
    try {
      let tracks: Track[] = [];
      if (musicSource === 'youtube' || musicSource === 'cobalt') {
        tracks = await musicApi.searchYoutubeCobalt(query);
      } else {
        tracks = await musicApi.searchSongs(query);
      }
      
      if (tracks.length === 0) {
        showToast(`No tracks found in "${name}" to download`);
        return;
      }
      showToast(`Downloading ${tracks.length} tracks from "${name}"...`);
      for (const track of tracks) {
        await offlineStore.saveTrackForOffline(track);
      }
      const updated = await offlineStore.getAllOfflineTracks();
      setDownloads(updated);
      showToast(`Successfully downloaded "${name}" (${tracks.length} tracks)`);
    } catch (e) {
      showToast(`Failed to download "${name}"`);
    }
  };

  const handleAddCollectionToQueue = async (query: string, name: string) => {
    showToast(`Fetching tracks for "${name}" to queue...`);
    try {
      let tracks: Track[] = [];
      if (musicSource === 'youtube' || musicSource === 'cobalt') {
        tracks = await musicApi.searchYoutubeCobalt(query);
      } else {
        tracks = await musicApi.searchSongs(query);
      }

      if (tracks.length === 0) {
        showToast(`No tracks found in "${name}"`);
        return;
      }
      setQueue((prev) => {
        const combined = [...prev, ...tracks];
        return combined.filter((track, index, self) =>
          self.findIndex((t) => t.id === track.id) === index
        );
      });
      showToast(`Added ${tracks.length} tracks from "${name}" to queue`);
    } catch (e) {
      showToast(`Failed to add "${name}" to queue`);
    }
  };

  const handleRemoveFavoriteAlbum = (albumId: string) => {
    setFavorites((prev) => ({
      ...prev,
      albums: (prev.albums || []).filter((a) => a.id !== albumId),
    }));
    showToast('Removed album from favorites');
  };

  const handleRemoveFavoritePlaylist = (playlistId: string) => {
    setFavorites((prev) => ({
      ...prev,
      playlists: (prev.playlists || []).filter((p) => p.id !== playlistId),
    }));
    showToast('Removed playlist from favorites');
  };

  const handleRemoveDownload = async (id: string) => {
    await offlineStore.removeOfflineTrack(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
    showToast('Removed from offline storage');
  };

  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: 'pl_' + Date.now(),
      name,
      songs: [],
      duration: '0 mins',
      createdAt: new Date().toLocaleDateString(),
    };
    setPlaylists((prev) => [...prev, newPl]);
    showToast(`Playlist "${name}" created`);
  };

  const handlePlayCollection = async (query: string) => {
    showToast(`Loading collection tracks to play...`);
    try {
      const tracks = await musicApi.searchSongs(query);
      if (tracks.length > 0) {
        handlePlayTrack(tracks[0]);
        if (tracks.length > 1) {
          setQueue(tracks.slice(1));
          setOriginalQueue(tracks.slice(1));
        }
      } else {
        showToast(`Could not find any tracks for "${query}"`);
      }
    } catch (e) {
      showToast(`Failed to play collection`);
    }
  };

  const handleImportCollectionAsPlaylist = async (name: string, query: string, image?: string) => {
    showToast(`Saving collection "${name}"...`);
    try {
      let tracks: Track[] = [];
      if (query.includes('youtube.com/playlist?list=')) {
        let listId = '';
        try {
          const urlObj = new URL(query);
          listId = urlObj.searchParams.get('list') || '';
        } catch(e) {
          listId = query.split('list=')[1]?.split('&')[0] || '';
        }
        if (!listId) {
          listId = query.replace('https://music.youtube.com/playlist?list=', '').split('&')[0];
        }
        if (listId) {
          tracks = await musicApi.getYoutubePlaylist(listId);
        }
      } else {
        tracks = await musicApi.searchSongs(query);
      }
      
      if (tracks.length === 0) {
        showToast(`Could not find any tracks in "${name}"`);
        return;
      }
      const newPl: Playlist = {
        id: 'pl_' + Date.now(),
        name,
        songs: tracks,
        duration: `${Math.round(tracks.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)} mins`,
        createdAt: new Date().toLocaleDateString(),
        image: image || tracks[0]?.image,
      };
      setPlaylists((prev) => [...prev, newPl]);
      showToast(`Playlist "${name}" saved to My Playlists!`);
    } catch (err) {
      showToast('Failed to save playlist');
    }
  };

  const handleRenamePlaylist = (id: string, newName: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
    showToast('Playlist renamed');
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted');
  };

  const handleAddSongToPlaylist = (playlistId: string, song: Track) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (p.songs.some((s) => s.id === song.id)) {
            showToast('Song already in playlist');
            return p;
          }
          showToast(`Added to "${p.name}"`);
          return { ...p, songs: [...p.songs, song] };
        }
        return p;
      })
    );
  };

  const handleRemoveSongFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p
      )
    );
    showToast('Song removed from playlist');
  };

  const handleRemoveFavorite = (typeOrTrack: 'songs' | 'albums' | 'artists' | 'playlists' | Track, id?: string) => {
    if (typeof typeOrTrack === 'object' && typeOrTrack !== null) {
      const trackId = typeOrTrack.id;
      setFavorites((prev) => ({
        ...prev,
        songs: (prev.songs || []).filter((item) => item && item.id !== trackId),
      }));
    } else {
      const type = typeOrTrack as 'songs' | 'albums' | 'artists' | 'playlists';
      setFavorites((prev) => ({
        ...prev,
        [type]: (prev[type] as any[] || []).filter((item) => item && item.id !== id),
      }));
    }
    showToast('Removed from favorites');
  };

  const handleEqBandChange = (index: number, gain: number) => {
    setEqBands((prev) => {
      const updated = prev.map((b, i) => (i === index ? { ...b, gain } : b));
      localStorage.setItem('sunofy_eq_bands_10', JSON.stringify(updated));
      return updated;
    });
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = gain;
    }
  };

  const handleEqReset = () => {
    const flatBands = eqBands.map((b) => ({ ...b, gain: 0 }));
    setEqBands(flatBands);
    localStorage.setItem('sunofy_eq_bands_10', JSON.stringify(flatBands));
    filtersRef.current.forEach((f) => (f.gain.value = 0));
    showToast('Equalizer reset to flat');
  };

  const handleApplyEqPreset = (presetName: string) => {
    let gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    switch (presetName) {
      case 'Bass Boost':
        gains = [9, 8, 6, 4, 1, 0, 0, 0, -1, -2];
        break;
      case 'Treble Boost':
        gains = [-2, -2, -1, 0, 1, 3, 5, 7, 8, 9];
        break;
      case 'Vocal':
        gains = [-3, -2, 1, 4, 6, 6, 5, 3, 1, -1];
        break;
      case 'Electronic':
        gains = [6, 5, 1, 0, -1, 2, 4, 3, 5, 7];
        break;
      case 'Pop':
        gains = [-1, 2, 4, 5, 4, 2, 1, 2, 3, 4];
        break;
      case 'Rock':
        gains = [5, 4, 3, 1, -1, -1, 2, 4, 6, 7];
        break;
      case 'Jazz':
        gains = [4, 3, 2, 4, -2, -2, 1, 3, 4, 4];
        break;
      case 'Classical':
        gains = [5, 4, 3, 2, -1, -1, 0, 2, 4, 5];
        break;
      case 'Hip Hop':
        gains = [6, 7, 5, 2, -1, 1, 3, 1, 3, 4];
        break;
      case 'Dance':
        gains = [6, 6, 4, 1, 0, 2, 4, 4, 5, 2];
        break;
      case 'Acoustic':
        gains = [3, 2, 1, 3, 2, 2, 4, 3, 2, 1];
        break;
      default:
        gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    const updated = eqBands.map((b, i) => ({ ...b, gain: gains[i] ?? 0 }));
    setEqBands(updated);
    localStorage.setItem('sunofy_eq_bands_10', JSON.stringify(updated));
    filtersRef.current.forEach((f, i) => {
      if (f) f.gain.value = gains[i] ?? 0;
    });
    showToast(`Applied ${presetName} EQ preset`);
  };

  const handleApplyCustomGains = (gains: number[]) => {
    const updated = eqBands.map((b, i) => ({ ...b, gain: gains[i] ?? 0 }));
    setEqBands(updated);
    localStorage.setItem('sunofy_eq_bands_10', JSON.stringify(updated));
    filtersRef.current.forEach((f, i) => {
      if (f) f.gain.value = gains[i] ?? 0;
    });
  };

  const handlePreampChange = (value: number) => {
    setPreamp(value);
    localStorage.setItem('sunofy_eq_preamp', String(value));
    if (preampRef.current) {
      preampRef.current.gain.setValueAtTime(Math.pow(10, value / 20), 0);
    }
  };

  const handleBassBoostChange = (value: number) => {
    setBassBoost(value);
    localStorage.setItem('sunofy_eq_bassboost', String(value));
    if (bassBoostRef.current) {
      bassBoostRef.current.gain.setValueAtTime(value, 0);
    }
  };

  const handleSpatialBalanceChange = (value: number) => {
    setSpatialBalance(value);
    localStorage.setItem('sunofy_eq_balance', String(value));
    if (pannerRef.current) {
      pannerRef.current.pan.setValueAtTime(value, 0);
    }
  };

  const handleReverbPresetChange = (preset: string) => {
    setReverbPreset(preset);
    localStorage.setItem('sunofy_eq_reverb', preset);
    updateReverbNodes(preset);
    showToast(`Ambient Space: ${preset}`);
  };

  const handleReverbDelayChange = (value: number) => {
    setReverbDelay(value);
    localStorage.setItem('sunofy_eq_reverb_delay', String(value));
    if (reverbPreset === 'Custom' && delayRef.current) {
      delayRef.current.delayTime.setValueAtTime(value, 0);
    }
  };

  const handleReverbFeedbackChange = (value: number) => {
    setReverbFeedback(value);
    localStorage.setItem('sunofy_eq_reverb_feedback', String(value));
    if (reverbPreset === 'Custom' && delayGainRef.current) {
      delayGainRef.current.gain.setValueAtTime(value, 0);
    }
  };

  const handleRestoreBackup = (backup: { playlists?: Playlist[]; favorites?: Favorites; profile?: UserProfile }) => {
    if (backup.playlists) setPlaylists(backup.playlists);
    if (backup.favorites) setFavorites(backup.favorites);
    if (backup.profile) setUserProfile((prev) => ({ ...prev, ...backup.profile }));
    showToast('Library & Settings restored from file!');
  };

  const handleOnboardingComplete = (updatedProfile: Partial<UserProfile>) => {
    localStorage.setItem('sunofy_onboarded', 'true');
    setUserProfile((prev) => {
      const next = { ...prev, ...updatedProfile };
      localStorage.setItem('sunofy_user_profile', JSON.stringify(next));
      return next;
    });
    setIsOnboardingOpen(false);
    showToast(`Welcome to Sunofy, ${updatedProfile.username || 'Music Fan'}!`);
  };

  const isCurrentFav = currentTrack ? favorites.songs.some((s) => s.id === currentTrack.id) : false;
  const isCurrentDownloaded = currentTrack ? downloads.some((d) => d.id === currentTrack.id) : false;
  const isSyncPartyInRoom = currentTab === 'Sync Party' && syncState.inRoom;

  const handleOpenEqualizer = () => {
    initEqualizerWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    setIsEqualizerOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative overflow-hidden shadow-2xl bg-[var(--bg-sunofy)] font-sans text-[var(--text-sunofy)]">
      <ThemeInjector themeId={userProfile.appTheme} />
      <PwaInstallBanner onShowToast={showToast} />

      {/* Retro Disc Spinning App Loader */}
      {isBootLoading && (
        <div className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center text-white">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Spinning Retro Disc / Vinyl */}
            <div className="absolute inset-0 rounded-full bg-neutral-950 border-4 border-neutral-900 shadow-2xl flex items-center justify-center animate-[rotateVinyl_3s_linear_infinite]">
              {/* Vinyl Groves */}
              <div className="w-40 h-40 rounded-full border border-neutral-800 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-neutral-750 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-neutral-700/40 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-neutral-600/20 flex items-center justify-center">
                      {/* Vinyl Label */}
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
                        <img src="./favicon.ico" alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Text underneath */}
          <h2 className="mt-6 text-[11px] font-black tracking-widest text-emerald-400 uppercase animate-pulse">
            Booting Sunofy...
          </h2>
          <p className="text-[9px] text-neutral-500 mt-1.5 uppercase tracking-widest font-black">
            Unified Audio Engine v2.0
          </p>
        </div>
      )}

      {/* First-Time Startup Onboarding Screen */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />

      {/* App Lock Screen Overlay */}
      {isAppLocked && (
        <AppLockOverlay
          pin={userProfile.appLockPin || '0908'}
          onUnlockSuccess={() => setIsAppLocked(false)}
        />
      )}

      {/* Hidden Audio Tag */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Navigation (Sidebar on Desktop/Tablet, Bottom Bar on Mobile) - Hidden in Full Screen Modes */}
      {!isFullPlayerOpen && currentTab !== 'Videos' && !(currentTab === 'Sync Party' && syncState.inRoom) && (
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full max-w-full bg-gradient-to-br from-[#0c0d18] via-[#141226] to-[#0a0d1a]">
        {/* Top Header - Hidden in Full Screen Modes */}
        {!isFullPlayerOpen && currentTab !== 'Videos' && !(currentTab === 'Sync Party' && syncState.inRoom) && (
          <Header
            title={currentTab}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setCurrentTab('Profile')}
            onOpenEqualizer={handleOpenEqualizer}
            onOpenCarMode={() => setIsCarModeOpen(true)}
            userAvatarIcon={userProfile.avatarIcon || '🎧'}
            customAvatarUrl={userProfile.customAvatarUrl}
            musicSource={musicSource}
            onMusicSourceChange={setMusicSource}
            isPlaying={isPlaying}
          />
        )}

      {/* Main Content Viewport */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${(currentTab === 'Sync Party' && syncState.inRoom) || currentTab === 'Videos' ? 'p-0 m-0' : 'pb-36 px-4 pt-4'}`}>
        {currentTab === 'Discover' && (
          <DiscoverTab
            isAppLocked={isAppLocked}
            onPlayTrack={handlePlayTrack}
            onSetQueue={(q) => {
              const uniqueQ = q.filter((track, index, self) =>
                self.findIndex((t) => t.id === track.id) === index
              );
              setQueue(uniqueQ);
              setOriginalQueue(uniqueQ);
            }}
            discoverQuery={discoverQuery}
            onClearDiscoverQuery={() => setDiscoverQuery(undefined)}
            onImportCollectionAsPlaylist={handleImportCollectionAsPlaylist}
            onOpenSearch={() => setIsSearchOpen(true)}
            onAddToQueue={(track) => {
              setQueue((prev) => {
                if (prev.some(t => t.id === track.id)) {
                  showToast(`"${track.title}" is already in the Queue`);
                  return prev;
                }
                showToast(`Added "${track.title}" to Queue`);
                return [...prev, track];
              });
            }}
            onToggleFavoritePlaylist={handleToggleFavoritePlaylist}
            onToggleFavoriteAlbum={handleToggleFavoriteAlbum}
            localFolderTracks={localFolderTracks}
            onToggleFavorite={(track) => {
              const exists = favorites.songs.some((s) => s.id === track.id);
              if (exists) {
                setFavorites((prev) => ({
                  ...prev,
                  songs: prev.songs.filter((s) => s.id !== track.id),
                }));
                showToast(`Removed "${track.title}" from Favorites`);
              } else {
                setFavorites((prev) => ({
                  ...prev,
                  songs: [...prev.songs, track],
                }));
                showToast(`Added "${track.title}" to Favorites`);
              }
            }}
            onDownloadTrack={async (track) => {
              showToast(`Downloading "${track.title}"...`);
              try {
                const downloaded = await offlineStore.saveTrackForOffline(track);
                setDownloads((prev) => [...prev.filter((d) => d.id !== downloaded.id), downloaded]);
                showToast(`"${track.title}" saved offline!`);
              } catch (err) {
                showToast('Offline download failed.');
              }
            }}
            playlists={playlists}
            favorites={favorites}
            downloads={downloads}
            onAddSongToPlaylist={handleAddSongToPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            musicSource={musicSource}
            onMusicSourceChange={setMusicSource}
            onImportLocalFiles={handleImportLocalFiles}
            onClearLocalFolderTracks={handleClearLocalFolderTracks}
          />
        )}
        {currentTab === 'Playlists' && (
          <PlaylistsTab
            playlists={playlists}
            onPlayTrack={handlePlayTrack}
            onSetQueue={(q) => {
              const uniqueQ = q.filter((track, index, self) =>
                self.findIndex((t) => t.id === track.id) === index
              );
              setQueue(uniqueQ);
              setOriginalQueue(uniqueQ);
            }}
            onCreatePlaylist={handleCreatePlaylist}
            onRenamePlaylist={handleRenamePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onAddSongToPlaylist={handleAddSongToPlaylist}
            onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
            onDownloadTrack={(track) => handleDownloadTrack(track)}
          />
        )}
        {currentTab === 'Favorites' && (
          <FavoritesTab
            favorites={favorites}
            onPlayTrack={handlePlayTrack}
            onRemoveFavorite={handleRemoveFavorite}
            onRemoveFavoriteAlbum={handleRemoveFavoriteAlbum}
            onRemoveFavoritePlaylist={handleRemoveFavoritePlaylist}
            onPlayCollection={handlePlayCollection}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSetQueue={(q) => {
              const uniqueQ = q.filter((track, index, self) =>
                self.findIndex((t) => t.id === track.id) === index
              );
              setQueue(uniqueQ);
              setOriginalQueue(uniqueQ);
            }}
          />
        )}
        {currentTab === 'Offline' && (
          <OfflineTab
            downloads={downloads}
            localFolderTracks={localFolderTracks}
            localSourceMode={localSourceMode}
            onSetLocalSourceMode={(mode) => {
              setLocalSourceMode(mode);
              localStorage.setItem('sunofy_local_source_mode', mode);
            }}
            onPlayTrack={handlePlayTrack}
            onRemoveDownload={handleRemoveDownload}
            onImportLocalFiles={handleImportLocalFiles}
            onRemoveLocalFolderTrack={handleRemoveLocalFolderTrack}
            onClearLocalFolderTracks={handleClearLocalFolderTracks}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}
        {currentTab === 'Videos' && (
          <VideoTab
            onShowToast={showToast}
            isAudioPlaying={isPlaying}
            onVideoPlay={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              setIsPlaying(false);
            }}
            onMinimize={() => setCurrentTab('Discover')}
          />
        )}
        {currentTab === 'Sync Party' && (
          <SyncPartyTab
            syncState={syncState}
            playlists={playlists}
            favorites={favorites}
            onShowToast={showToast}
            onPlayTrack={handlePlayTrack}
            musicSource={musicSource}
            downloads={downloads}
          />
        )}
        {currentTab === 'Profile' && (
          <ProfileTab
            profile={userProfile}
            playlists={playlists}
            favorites={favorites}
            downloads={downloads}
            localFolderTracks={localFolderTracks}
            onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
            onRestoreBackup={handleRestoreBackup}
            onLockAppNow={() => setIsAppLocked(true)}
            onShowToast={showToast}
            onOpenEqualizer={handleOpenEqualizer}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onImportLocalFiles={handleImportLocalFiles}
            onClearLocalFolderTracks={handleClearLocalFolderTracks}
            onPlayTrack={handlePlayTrack}
            musicSource={musicSource}
            onMusicSourceChange={setMusicSource}
          />
        )}
      </main>

      {/* Mini Player - Hidden when locked, in active Sync Party room, Videos tab, or Full Player Modal */}
      {!isAppLocked && !(currentTab === 'Sync Party' && syncState.inRoom) && currentTab !== 'Videos' && !isFullPlayerOpen && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isFavorite={isCurrentFav}
          isDownloaded={isCurrentDownloaded}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          musicSource={musicSource}
          onTogglePlayPause={handleTogglePlayPause}
          onNextTrack={handleNextTrack}
          onToggleFavorite={handleToggleFavoriteCurrent}
          onDownloadTrack={handleDownloadCurrentTrack}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onToggleRepeat={() =>
            setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'))
          }
          onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        />
      )}

      {/* Full Player Modal - never shown when app is locked */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen && !isAppLocked}
        onClose={() => setIsFullPlayerOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isFavorite={isCurrentFav}
        isDownloaded={isCurrentDownloaded}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        queue={queue}
        volume={volume}
        onVolumeChange={(v) => {
          setVolume(v);
          if (audioRef.current) audioRef.current.volume = v;
        }}
        onTogglePlayPause={handleTogglePlayPause}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onSeek={handleSeek}
        onToggleFavorite={handleToggleFavoriteCurrent}
        onDownloadTrack={handleDownloadCurrentTrack}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onToggleRepeat={() =>
          setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'))
        }
        onOpenEqualizer={handleOpenEqualizer}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenCarMode={() => setIsCarModeOpen(true)}
        onClearQueue={() => setQueue([])}
        onRemoveQueueItem={(idx) => setQueue((prev) => prev.filter((_, i) => i !== idx))}
        onPlayQueueItem={handlePlayQueueItem}
        onSaveQueueAsPlaylist={handleSaveQueueAsPlaylist}
        musicSource={musicSource}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onPlayTrack={handlePlayTrack}
        onSetQueue={(q) => {
          const uniqueQ = q.filter((track, index, self) =>
            self.findIndex((t) => t.id === track.id) === index
          );
          setQueue(uniqueQ);
          setOriginalQueue(uniqueQ);
        }}
        onDiscoverCollection={(q) => {
          setDiscoverQuery(q);
          setCurrentTab('Discover');
        }}
        onImportCollectionAsPlaylist={handleImportCollectionAsPlaylist}
        playlists={playlists}
        onAddSongToPlaylist={handleAddSongToPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
        onAddToPlaylist={(track) => {
          if (playlists.length > 0) {
            handleAddSongToPlaylist(playlists[0].id, track);
          } else {
            handleCreatePlaylist('My First Playlist');
          }
        }}
        onAddToQueue={(track) => {
          setQueue((prev) => {
            if (prev.some(t => t.id === track.id)) {
              showToast(`"${track.title}" is already in the Queue`);
              return prev;
            }
            showToast(`Added "${track.title}" to Queue`);
            return [...prev, track];
          });
        }}
        onToggleFavorite={handleToggleFavoriteTrack}
        onToggleFavoritePlaylist={handleToggleFavoritePlaylist}
        onToggleFavoriteAlbum={handleToggleFavoriteAlbum}
        onDownloadCollection={handleDownloadCollection}
        onAddCollectionToQueue={handleAddCollectionToQueue}
        onDownloadTrack={handleDownloadTrack}
        downloads={downloads}
        localFolderTracks={localFolderTracks}
        favorites={favorites}
        musicSource={musicSource}
      />

      {/* Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        bands={eqBands}
        onBandChange={handleEqBandChange}
        onReset={handleEqReset}
        onApplyPreset={handleApplyEqPreset}
        preamp={preamp}
        onPreampChange={handlePreampChange}
        bassBoost={bassBoost}
        onBassBoostChange={handleBassBoostChange}
        spatialBalance={spatialBalance}
        onSpatialBalanceChange={handleSpatialBalanceChange}
        reverbPreset={reverbPreset}
        onReverbPresetChange={handleReverbPresetChange}
        analyser={analyserRef.current}
        onApplyCustomGains={handleApplyCustomGains}
        reverbDelay={reverbDelay}
        onReverbDelayChange={handleReverbDelayChange}
        reverbFeedback={reverbFeedback}
        onReverbFeedbackChange={handleReverbFeedbackChange}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        activeMinutes={sleepTimerMinutes}
        onSetTimer={(min) => setSleepTimerMinutes(min)}
      />

      {/* Car Mode Modal */}
      <CarModeModal
        isOpen={isCarModeOpen}
        onClose={() => setIsCarModeOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlayPause={handleTogglePlayPause}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
      />

      </div>

      {/* Premium Glassmorphism Toast Notification Pill */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[99999] pointer-events-none max-w-[90%] w-auto animate-fade">
          <div className="bg-[#0f111a]/95 text-white border border-[var(--accent-sunofy)]/40 px-4 py-2 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex items-center space-x-2.5 text-xs font-bold border-t-emerald-400/50">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/50 text-[var(--accent-sunofy)] flex items-center justify-center shrink-0">
              <Heart className="w-3 h-3 text-[var(--accent-sunofy)] fill-[var(--accent-sunofy)] animate-pulse" />
            </div>
            <span className="truncate max-w-[280px] sm:max-w-md tracking-wide text-gray-100">{toastMsg}</span>
          </div>
        </div>
      )}
      {/* Global YouTube Iframe for Background/Seamless Playback */}
      {globalYtId && (
        <iframe
          ref={ytIframeRef}
          src={`https://www.youtube.com/embed/${globalYtId}?autoplay=${isPlaying ? 1 : 0}&controls=0&disablekb=1&modestbranding=1&playsinline=1&enablejsapi=1&mute=0&loop=1&playlist=${globalYtId}`}
          className="fixed bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none z-[-1]"
          allow="autoplay; encrypted-media"
          title="YouTube Background Player"
        />
      )}
    </div>
  );
}
