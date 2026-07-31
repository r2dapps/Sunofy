import React, { useState, useEffect, useRef } from 'react';
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
    savedPlayerState?.currentTrack || {
      id: 'tr_featured_1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      image: '/icon-192.png',
      duration: 200,
      downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(savedPlayerState?.currentTime || 0);
  const [duration, setDuration] = useState(savedPlayerState?.currentTrack?.duration || 200);
  const [queue, setQueue] = useState<Track[]>(savedPlayerState?.queue || []);
  const [originalQueue, setOriginalQueue] = useState<Track[]>(savedPlayerState?.queue || []);
  const [history, setHistory] = useState<Track[]>([]);
  const [isShuffle, setIsShuffle] = useState(savedPlayerState?.isShuffle || false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>(savedPlayerState?.repeatMode || 'off');
  const [volume, setVolume] = useState(savedPlayerState?.volume ?? 1);

  // Library & Persistence State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('sunofy_playlists');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'p1',
            name: 'Late Night Vibes',
            songs: [
              {
                id: 'tr_featured_1',
                title: 'Blinding Lights',
                artist: 'The Weeknd',
                album: 'After Hours',
                image: '/icon-192.png',
                duration: 200,
              },
            ],
            duration: '3 mins',
          },
        ];
  });

  const [favorites, setFavorites] = useState<Favorites>(() => {
    const saved = localStorage.getItem('sunofy_favorites');
    return saved
      ? JSON.parse(saved)
      : {
          songs: [
            {
              id: 'tr_featured_1',
              title: 'Blinding Lights',
              artist: 'The Weeknd',
              album: 'After Hours',
              image: '/icon-192.png',
              duration: 200,
            },
          ],
          albums: [
            {
              id: 'al_1',
              title: 'After Hours',
              artist: 'The Weeknd',
              image: '/icon-192.png',
            },
          ],
          artists: [
            {
              id: 'ar_1',
              name: 'The Weeknd',
              followers: '68M Followers',
              image: '/icon-192.png',
            },
          ],
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
          username: 'Alex Morgan',
          email: 'alex.morgan@sunofy.io',
          subscription: 'Sunofy Duo Premium',
          preferredQuality: '320kbps',
          accentColor: '#1db954',
          appTheme: 'emerald',
          apiSource: 'jiosaavn',
          appLockEnabled: true,
          appLockPin: '0000',
        };
  });

  // App Lock Passcode Overlay - Default pops up on every fresh start
  const [isAppLocked, setIsAppLocked] = useState(true);

  // App Initial Boot Loading State
  const [isBootLoading, setIsBootLoading] = useState(true);

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
    return () => clearTimeout(timer);
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
    const sourceMap: Record<string, 'jiosaavn' | 'youtube' | 'local'> = {
      jiosaavn: 'jiosaavn',
      cobalt_yt: 'youtube',
      custom_mirror: 'local',
      local: 'local'
    };
    return sourceMap[userProfile.apiSource] || 'jiosaavn';
  })();

  const setMusicSource = (source: 'jiosaavn' | 'youtube' | 'local') => {
    const profileSourceMap: Record<string, 'jiosaavn' | 'cobalt_yt' | 'custom_mirror'> = {
      jiosaavn: 'jiosaavn',
      youtube: 'cobalt_yt',
      local: 'custom_mirror'
    };
    const mapped = profileSourceMap[source];
    if (mapped && mapped !== userProfile.apiSource) {
      setUserProfile((prev) => ({ ...prev, apiSource: mapped }));
    }
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

  // Load Offline Downloads on startup
  useEffect(() => {
    offlineStore.getAllOfflineTracks().then((tracks) => setDownloads(tracks));
  }, []);

  // Sync Party socket subscription
  useEffect(() => {
    const unsubscribe = syncParty.subscribe((newState) => {
      setSyncState(newState);
      if (newState.inRoom && !newState.isHost) {
         if (newState.currentTrack && (!currentTrack || currentTrack.id !== newState.currentTrack.id)) {
            setCurrentTrack(newState.currentTrack);
            if (audioRef.current) {
               audioRef.current.src = newState.currentTrack.downloadUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
               if (newState.isPlaying) {
                  audioRef.current.currentTime = newState.currentTime;
                  audioRef.current.play().catch(()=>console.log('Autoplay blocked'));
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
            if (Math.abs(audioRef.current.currentTime - newState.currentTime) > 3) {
               audioRef.current.currentTime = newState.currentTime;
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

  // SyncParty Audio Engine: Drives native <audio> element with room sync state
  useEffect(() => {
    if (!syncState.inRoom || !audioRef.current) return;

    const track = syncState.currentTrack || (syncState.queue.length > 0 ? syncState.queue[0] : null);

    if (track) {
      const src = track.downloadUrl || track.url;
      if (src && audioRef.current.src !== src) {
        audioRef.current.src = src;
        if (syncState.currentTime) {
          try {
            audioRef.current.currentTime = syncState.currentTime;
          } catch (e) {}
        }
      }

      if (syncState.isPlaying) {
        audioRef.current.play().catch((err) => console.warn('SyncParty audio play failed:', err));
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [syncState.inRoom, syncState.currentTrack?.id, syncState.isPlaying]);

  // Restore last played track & timestamp on startup
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const offlineCopy = downloads.find((d) => d.id === currentTrack.id);
      const src = offlineCopy?.offlineBlobUrl || currentTrack.downloadUrl;
      if (src && audioRef.current.src !== src) {
        audioRef.current.src = src;
        if (savedPlayerState?.currentTime) {
          try {
            audioRef.current.currentTime = savedPlayerState.currentTime;
          } catch (e) {}
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

  const updateReverbNodes = (preset: string, dNode?: DelayNode | null, dgNode?: GainNode | null) => {
    const delayNode = dNode !== undefined ? dNode : delayRef.current;
    const delayGainNode = dgNode !== undefined ? dgNode : delayGainRef.current;
    
    if (!delayNode || !delayGainNode) return;
    
    // Config: [delayTime, feedbackGain]
    let config = [0.0, 0.0];
    switch (preset) {
      case 'Studio (Warm)':
        config = [0.05, 0.15];
        break;
      case 'Concert Hall':
        config = [0.18, 0.35];
        break;
      case 'Acoustic Arena':
        config = [0.35, 0.45];
        break;
      case 'Cosmic Echo':
        config = [0.60, 0.60];
        break;
      case 'Custom':
        config = [reverbDelay, reverbFeedback];
        break;
      case 'None':
      default:
        config = [0.0, 0.0];
        break;
    }
    
    delayNode.delayTime.setValueAtTime(config[0], 0);
    delayGainNode.gain.setValueAtTime(config[1], 0);
  };

  // Init Web Audio API Equalizer & Audio FX Nodes lazily
  const initEqualizerWebAudio = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      
      // Preamp node
      const preampNode = ctx.createGain();
      preampNode.gain.value = Math.pow(10, preamp / 20);
      preampRef.current = preampNode;

      // Bass Boost node
      const bassBoostNode = ctx.createBiquadFilter();
      bassBoostNode.type = 'lowshelf';
      bassBoostNode.frequency.value = 80;
      bassBoostNode.gain.value = bassBoost;
      bassBoostRef.current = bassBoostNode;

      // 10 EQ Filters
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

      // Stereo Panner node
      let pannerNode: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.value = spatialBalance;
        pannerRef.current = pannerNode;
      }

      // Analyser node
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserRef.current = analyserNode;

      // Echo / Reverb feedback nodes
      const delayNode = ctx.createDelay(1.0);
      const delayGainNode = ctx.createGain();
      delayNode.connect(delayGainNode);
      delayGainNode.connect(delayNode);
      delayRef.current = delayNode;
      delayGainRef.current = delayGainNode;

      // Apply initial reverb preset values
      updateReverbNodes(reverbPreset, delayNode, delayGainNode);

      // Connect source -> preamp -> bassBoost -> filter[0] -> ... -> filter[9]
      source.connect(preampNode);
      preampNode.connect(bassBoostNode);
      bassBoostNode.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }

      const lastFilter = filters[filters.length - 1];

      // Reverb mix node
      const mixGain = ctx.createGain();
      mixGain.gain.value = 1.0;

      // Dry path
      lastFilter.connect(mixGain);

      // Wet path (reverb loop)
      lastFilter.connect(delayNode);
      delayGainNode.connect(mixGain);

      // Connect wet/dry mix to panner / analyser
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

  const handlePlayTrack = async (track: Track) => {
    if (currentTrack && currentTrack.id !== track.id) {
      setHistory((prev) => [...prev.filter((t) => t.id !== track.id), currentTrack]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);

    if (audioRef.current) {
      // Use local offline blob URL if downloaded
      const offlineCopy = downloads.find((d) => d.id === track.id);
      let src = offlineCopy?.offlineBlobUrl || track.downloadUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

      if ((track as any).isCobalt) {
        showToast('Extracting stream via Cobalt API...');
        try {
          const ytUrl = `https://www.youtube.com/watch?v=${track.id}`;
          const cobaltSrc = await musicApi.extractCobaltStream(ytUrl);
          if (cobaltSrc) {
            src = cobaltSrc;
            showToast('Cobalt Stream Active ⚡');
          } else {
            throw new Error('Cobalt failed');
          }
        } catch (e) {
          showToast('Cobalt failed. Falling back to high-quality native stream.');
        }
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
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }).catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeSecs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSecs;
      setCurrentTime(timeSecs);
    }
  };

  const handleNextTrack = () => {
    if (queue.length > 0) {
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      const next = queue[nextIndex];
      setQueue((prev) => prev.filter((_, i) => i !== nextIndex));
      handlePlayTrack(next);
    } else if (repeatMode === 'all' && originalQueue.length > 0) {
      let nextQueue = [...originalQueue];
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * nextQueue.length);
      }
      const next = nextQueue[nextIndex];
      setQueue(nextQueue.filter((_, i) => i !== nextIndex));
      handlePlayTrack(next);
      showToast('Repeating playlist/queue');
    } else {
      showToast('End of queue');
      setIsPlaying(false);
    }
  };

  const handlePrevTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 5) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevList) => prevList.slice(0, -1));
      if (currentTrack) {
        setQueue((prevQueue) => [currentTrack, ...prevQueue]);
      }
      // Temporarily bypass history tracking so playing this doesn't re-append history
      setCurrentTrack(prev);
      setIsPlaying(true);
      if (audioRef.current) {
        const offlineCopy = downloads.find((d) => d.id === prev.id);
        let src = offlineCopy?.offlineBlobUrl || prev.downloadUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
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
        image: '/icon-192.png',
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
      const tracks = await musicApi.searchSongs(query);
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
      const tracks = await musicApi.searchSongs(query);
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
      const tracks = await musicApi.searchSongs(query);
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

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-[var(--border-sunofy)] bg-[var(--bg-sunofy)]">
      <ThemeInjector themeId={userProfile.appTheme} />

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
            Unified Audio Engine v2.6
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
          pin={userProfile.appLockPin || '0000'}
          onUnlockSuccess={() => setIsAppLocked(false)}
        />
      )}

      {/* Hidden Audio Tag */}
      <audio ref={audioRef} preload="auto" />

      {/* Top Header - Hidden when in active Sync Party room or Videos tab */}
      {!isSyncPartyInRoom && currentTab !== 'Videos' && (
        <Header
          title={currentTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenProfile={() => setCurrentTab('Profile')}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenCarMode={() => setIsCarModeOpen(true)}
          musicSource={musicSource}
          onMusicSourceChange={setMusicSource}
          isPlaying={isPlaying}
        />
      )}

      {/* Main Content Viewport */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${isSyncPartyInRoom ? 'p-3' : currentTab === 'Videos' ? 'p-0' : 'pb-36 px-4 pt-4'}`}>
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
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onImportLocalFiles={handleImportLocalFiles}
            onClearLocalFolderTracks={handleClearLocalFolderTracks}
            onPlayTrack={handlePlayTrack}
            musicSource={musicSource}
            onMusicSourceChange={setMusicSource}
          />
        )}
      </main>

      {/* Mini Player - Hidden when in Sync Party tab or Videos tab to give clean full canvas */}
      {currentTab !== 'Sync Party' && currentTab !== 'Videos' && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isFavorite={isCurrentFav}
          isDownloaded={isCurrentDownloaded}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
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

      {/* Bottom Navigation - Hidden when in active Sync Party room or Videos tab */}
      {!isSyncPartyInRoom && currentTab !== 'Videos' && (
        <BottomNav currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab)} />
      )}

      {/* Full Player Modal */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
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
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenCarMode={() => setIsCarModeOpen(true)}
        onClearQueue={() => setQueue([])}
        onRemoveQueueItem={(idx) => setQueue((prev) => prev.filter((_, i) => i !== idx))}
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] px-4 py-2.5 rounded-2xl shadow-xl z-50 flex items-center space-x-2 text-xs font-medium text-[var(--text-sunofy)] animate-fade">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-sunofy)]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
