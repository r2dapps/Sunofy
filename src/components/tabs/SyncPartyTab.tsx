import React, { useState } from 'react';
import { VideoTab } from './VideoTab';
import {
  Radio,
  PlusCircle,
  Copy,
  Share2,
  LogOut,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ListMusic,
  Search,
  MessageSquare,
  UserX,
  Plus,
  Trash2,
  Users,
  Send,
  Music,
  Heart,
  Music2,
  QrCode,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  X,
  Crown,
  Minimize2,
  Maximize2,
  Video,
  Film,
  Download,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { SyncPartyState, Track, Playlist, Favorites } from '../../types';
import { syncParty } from '../../services/syncPartySocket';
import { musicApi } from '../../services/api';

const playAudioFeedbackTone = (type: 'on' | 'off') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'on') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
};

const triggerFloatingEmojiConfetti = (emoji: string) => {
  if (navigator.vibrate) navigator.vibrate(30);
  const container = document.body;
  const el = document.createElement('div');
  el.innerText = emoji;

  const randomX = Math.floor(Math.random() * 70) + 15;
  const randomRotate = (Math.random() - 0.5) * 60;
  const randomScale = 1.4 + Math.random() * 0.8;
  const driftX = (Math.random() - 0.5) * 120;

  el.className = 'fixed bottom-[32vh] text-6xl sm:text-7xl pointer-events-none select-none drop-shadow-[0_0_30px_rgba(255,215,0,0.95)]';
  el.style.left = `${randomX}%`;
  el.style.zIndex = '999999';
  el.style.transform = `translate3d(0px, 0px, 0px) scale(0.3) rotate(0deg)`;
  el.style.opacity = '1';
  el.style.transition = 'transform 1.4s cubic-bezier(0.15, 0.85, 0.35, 1.2), opacity 1.4s ease-out';

  container.appendChild(el);
  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.transform = `translate3d(${driftX}px, -450px, 0px) scale(${randomScale}) rotate(${randomRotate}deg)`;
    el.style.opacity = '0';
  });

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1450);
};

const LiveAudioWave: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  return (
    <div className="flex items-end gap-[3px] h-4 w-6 select-none shrink-0" title={isPlaying ? "Playing live" : "Paused"}>
      {[
        { id: 1, duration: '0.8s', delay: '0.0s' },
        { id: 2, duration: '1.2s', delay: '0.2s' },
        { id: 3, duration: '0.9s', delay: '0.4s' },
        { id: 4, duration: '1.1s', delay: '0.1s' },
      ].map((bar) => (
        <div
          key={bar.id}
          className="w-[3px] bg-[var(--accent-sunofy)] rounded-full animate-pulse"
          style={{
            height: isPlaying ? '100%' : '4px',
            animation: isPlaying ? `sunofyWave ${bar.duration} ease-in-out infinite alternate` : 'none',
            animationDelay: isPlaying ? bar.delay : 'none',
            minHeight: '4px',
            transition: 'height 0.3s ease-in-out',
          }}
        />
      ))}
      <style>{`
        @keyframes sunofyWave {
          0% { height: 4px; }
          100% { height: 16px; }
        }
        @keyframes floatUpFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translateY(-90px) scale(1.4) rotate(12deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-220px) scale(2.0) rotate(-12deg);
          }
        }
      `}</style>
    </div>
  );
};

interface SyncPartyTabProps {
  syncState: SyncPartyState;
  playlists?: Playlist[];
  favorites?: Favorites;
  onShowToast: (msg: string) => void;
  onPlayTrack: (track: Track) => void;
  musicSource?: 'jiosaavn' | 'youtube' | 'local';
  downloads?: Track[];
}

export const SyncPartyTab: React.FC<SyncPartyTabProps> = ({
  syncState,
  playlists = [],
  favorites,
  onShowToast,
  onPlayTrack,
  musicSource = 'jiosaavn',
  downloads = [],
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [musicVolume, setMusicVolume] = useState(100);
  const [micVolume, setMicVolume] = useState(100);
  const [activeSpeaker, setActiveSpeaker] = useState<{ name: string; timestamp: number } | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const voiceAudioCtxRef = React.useRef<AudioContext | null>(null);
  const recorderIntervalRef = React.useRef<any>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const startMicLevelAnalyser = (stream: MediaStream) => {
    try {
      const audioCtx = getVoiceAudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!micStreamRef.current) {
          setMicLevel(0);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(pct);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Audio analyzer error:', e);
    }
  };

  const stopMicLevelAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setMicLevel(0);
  };

  const getVoiceAudioContext = () => {
    if (!voiceAudioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      voiceAudioCtxRef.current = new AudioCtx();
    }
    if (voiceAudioCtxRef.current.state === 'suspended') {
      voiceAudioCtxRef.current.resume().catch(() => {});
    }
    return voiceAudioCtxRef.current;
  };

  const playVoiceChunkBuffer = async (base64Audio: string, volPct: number) => {
    try {
      const ctx = getVoiceAudioContext();
      const res = await fetch(base64Audio);
      const arrayBuffer = await res.arrayBuffer();
      ctx.decodeAudioData(
        arrayBuffer,
        (decodedData) => {
          const source = ctx.createBufferSource();
          const gainNode = ctx.createGain();
          gainNode.gain.value = Math.max(0, Math.min(1, volPct / 100));
          source.buffer = decodedData;
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(0);
        },
        () => {
          const fallbackAudio = new Audio(base64Audio);
          fallbackAudio.volume = Math.max(0, Math.min(1, volPct / 100));
          fallbackAudio.play().catch(() => {});
        }
      );
    } catch (e) {
      const fallbackAudio = new Audio(base64Audio);
      fallbackAudio.volume = Math.max(0, Math.min(1, volPct / 100));
      fallbackAudio.play().catch(() => {});
    }
  };

  // Subscribe to incoming remote WebRTC voice stream chunks
  React.useEffect(() => {
    if (!syncState.inRoom) return;

    const cleanup = syncParty.listenVoiceStream((chunk) => {
      if (chunk.audio) {
        playVoiceChunkBuffer(chunk.audio, micVolume);
        setActiveSpeaker({ name: chunk.senderName, timestamp: Date.now() });
      }
    });

    return () => {
      cleanup();
    };
  }, [syncState.inRoom, syncState.roomCode, micVolume]);

  // Auto-hide active speaker toast after 3s
  React.useEffect(() => {
    if (activeSpeaker) {
      const timer = setTimeout(() => {
        if (Date.now() - activeSpeaker.timestamp >= 2500) {
          setActiveSpeaker(null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeSpeaker]);

  const toggleMic = async () => {
    if (!isMicActive) {
      if (!syncState.isHost && syncState.allowMemberMics === false) {
        onShowToast('🔒 Microphone permissions are currently locked by the Host.');
        return;
      }
      try {
        // Unlock AudioContext on user interaction
        getVoiceAudioContext();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = stream;

        // Start continuous WebRTC live voice stream
        await syncParty.startContinuousVoiceStream(stream);
        startMicLevelAnalyser(stream);

        setIsMicActive(true);
        playAudioFeedbackTone('on');
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        onShowToast('🎙️ Live Voice Microphone ON - Transmitting Continuous WebRTC Voice');
      } catch (err) {
        onShowToast('Microphone access denied or unavailable');
      }
    } else {
      stopMicLevelAnalyser();
      syncParty.stopContinuousVoiceStream();
      if (recorderIntervalRef.current) {
        clearInterval(recorderIntervalRef.current);
        recorderIntervalRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setIsMicActive(false);
      playAudioFeedbackTone('off');
      if (navigator.vibrate) navigator.vibrate([60]);
      onShowToast('🎙️ Microphone OFF - Muted & Voice Stream Closed');
    }
  };

  React.useEffect(() => {
    return () => {
      stopMicLevelAnalyser();
      syncParty.stopContinuousVoiceStream();
      if (recorderIntervalRef.current) {
        clearInterval(recorderIntervalRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
  }, []);

  // Automatically mute mic and update visual UI to OFF if Host locks member mic permissions
  React.useEffect(() => {
    if (!syncState.isHost && syncState.allowMemberMics === false && isMicActive) {
      stopMicLevelAnalyser();
      syncParty.stopContinuousVoiceStream();
      if (recorderIntervalRef.current) {
        clearInterval(recorderIntervalRef.current);
        recorderIntervalRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setIsMicActive(false);
      playAudioFeedbackTone('off');
      onShowToast('🔒 Microphone permissions locked by Host - Muted & Voice Stream Closed');
    }
  }, [syncState.isHost, syncState.allowMemberMics, isMicActive]);

  // Listen to real-time floating emoji reaction events (confetti particles without chat message clutter)
  React.useEffect(() => {
    if (!syncState.inRoom) return;
    const cleanup = syncParty.listenEmojiReactions((emoji) => {
      spawnFloatingEmoji(emoji);
    });
    return () => cleanup();
  }, [syncState.inRoom, syncState.roomCode]);

  // Active sub-tab inside the consolidated Sync Party console
  const [activeTab, setActiveTab] = useState<'queue' | 'search_music' | 'library' | 'video_search' | 'chat' | 'members' | 'voice'>('queue');
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoSearchResults, setVideoSearchResults] = useState<any[]>([]);

  // Floating Emoji Particles state over Live Stage
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; left: number }[]>([]);

  const spawnFloatingEmoji = (emoji: string) => {
    triggerFloatingEmojiConfetti(emoji);
    const id = Math.random().toString(36).substring(2, 9);
    const left = Math.floor(15 + Math.random() * 70);
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2200);
  };

  const extractYoutubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCreateRoom = () => {
    syncParty.createRoom();
    onShowToast('Party room created! Share your code with friends.');
  };

  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) return;
    syncParty.joinRoom(joinCodeInput.trim());
    onShowToast(`Joining room #${joinCodeInput.trim()}...`);
    setJoinCodeInput('');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(syncState.roomCode);
    onShowToast(`Room code #${syncState.roomCode} copied!`);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?party=${syncState.roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Sunofy Sync Party',
        text: `Listen synchronously with me on Sunofy! Room #${syncState.roomCode}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareUrl);
      onShowToast(`Party room link copied to clipboard!`);
    }
  };

  const handleSyncSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      let res: Track[] = [];
      if (musicSource === 'youtube') {
        res = await musicApi.searchYoutubeCobalt(val);
      } else if (musicSource === 'local') {
        res = (downloads || []).filter(t => 
          t.title.toLowerCase().includes(val.toLowerCase()) || 
          t.artist.toLowerCase().includes(val.toLowerCase())
        );
      } else {
        res = await musicApi.searchSongs(val);
      }
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncVideoSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVideoSearchQuery(val);
    if (!val.trim()) {
      setVideoSearchResults([]);
      return;
    }
    try {
      const res = await musicApi.searchYoutubeCobalt(val);
      const videoItems = res.map((item) => ({
        ...item,
        mediaType: 'video' as const,
        isVideo: true,
      }));
      setVideoSearchResults(videoItems);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      syncParty.sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleImportPlaylistToParty = (pl: Playlist) => {
    pl.songs.forEach((song) => {
      syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
    });
    onShowToast(`Imported ${pl.songs.length} songs from "${pl.name}" into Sync Party!`);
  };

  // Lobby View (Not in a room)
  if (!syncState.inRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 p-4 animate-fade">
        <div className="w-20 h-20 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] flex items-center justify-center shadow-xl shadow-[var(--accent-sunofy)]/10">
          <Radio className="w-10 h-10 text-[var(--accent-sunofy)] animate-pulse" />
        </div>
        <div className="text-center space-y-1.5 max-w-xs">
          <h2 className="text-xl font-black text-[var(--text-sunofy)] tracking-tight">Sync Party World</h2>
          <p className="text-xs text-[var(--muted-sunofy)] leading-relaxed">
            A dedicated live room to listen synchronously with friends.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 pt-2">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-sunofy)] text-black font-bold text-xs shadow-lg shadow-[var(--accent-sunofy)]/20 flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Party Room</span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="w-full border-t border-[var(--border-sunofy)]" />
            <span className="bg-[var(--bg-sunofy)] px-3 text-[9px] text-[var(--muted-sunofy)] uppercase font-bold absolute left-1/2 transform -translate-x-1/2">
              OR JOIN
            </span>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Room Code (SUNO-8492)"
              className="flex-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl px-4 py-3 text-xs text-[var(--text-sunofy)] uppercase focus:outline-none focus:border-[var(--accent-sunofy)]"
            />
            <button
              onClick={handleJoinRoom}
              className="px-5 py-3 rounded-2xl bg-[var(--border-sunofy)] text-[var(--text-sunofy)] font-bold text-xs hover:bg-[var(--card-sunofy)] hover:border-[var(--accent-sunofy)] border border-transparent transition cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Isolated Sync Party Room View
  const curTrack = syncState.currentTrack || (syncState.queue.length > 0 ? syncState.queue[0] : null);

  return (
    <div className="space-y-3 animate-fade pb-6 text-[var(--text-sunofy)] select-none relative">
      {/* Live Voice Active Speaker Floating Indicator */}
      {activeSpeaker && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce-subtle backdrop-blur-md border border-emerald-300">
          <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>🎙️ {activeSpeaker.name} is speaking live...</span>
        </div>
      )}

      {/* Top Room Banner Bar with Member Avatars HUD & Actions */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3 flex items-center justify-between shadow-xl sticky top-0 z-20 backdrop-blur-md bg-opacity-95 flex-wrap gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/30 flex items-center justify-center text-[var(--accent-sunofy)] shrink-0 shadow-inner">
            <Radio className="w-4.5 h-4.5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-sunofy)]">
              <span className="truncate">Sync Room</span>
              {syncState.isHost ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono font-bold uppercase flex items-center gap-1 shrink-0">
                  <span>HOST</span>
                  <Crown className="w-3 h-3 text-amber-400 rotate-12" />
                </span>
              ) : (
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/40 font-mono font-bold uppercase shrink-0">
                  LISTENER
                </span>
              )}
            </div>
            <button
              onClick={handleCopyCode}
              className="text-[10px] font-mono text-[var(--accent-sunofy)] bg-black/40 px-2 py-0.5 rounded border border-[var(--border-sunofy)] flex items-center space-x-1 hover:border-[var(--accent-sunofy)] transition w-fit mt-0.5 cursor-pointer"
            >
              <span>#{syncState.roomCode}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center Live Members Overlapping Avatars HUD */}
        <div className="hidden sm:flex items-center -space-x-2 overflow-hidden px-2 py-1 bg-black/30 rounded-full border border-[var(--border-sunofy)]/40">
          {syncState.members.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className={`w-7 h-7 rounded-full bg-[var(--bg-sunofy)] border-2 flex items-center justify-center text-xs select-none shadow-sm relative ${
                m.isMicSpeaking
                  ? 'border-emerald-400 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'border-[var(--card-sunofy)] text-[var(--text-sunofy)]'
              }`}
              title={`${m.name} ${m.isHost ? '(Host)' : ''} ${m.isMicSpeaking ? '- Speaking Live' : ''}`}
            >
              <span>{m.avatarIcon || (m.isHost ? '👑' : '🎧')}</span>
              {m.isMicSpeaking && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-black" />
              )}
            </div>
          ))}
          {syncState.members.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-[var(--card-sunofy)] border-2 border-[var(--border-sunofy)] flex items-center justify-center text-[9px] font-bold text-[var(--accent-sunofy)]">
              +{syncState.members.length - 5}
            </div>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => setShowQrModal(true)}
            className="w-8.5 h-8.5 rounded-xl bg-[var(--border-sunofy)] flex items-center justify-center text-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer"
            title="Show Room QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareLink}
            className="w-8.5 h-8.5 rounded-xl bg-[var(--border-sunofy)] flex items-center justify-center text-[var(--text-sunofy)] hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer"
            title="Share Room"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              syncParty.leaveRoom();
              onShowToast('Exited party room. Back to solo mode.');
            }}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/20 transition cursor-pointer flex items-center space-x-1.5"
            title="Exit to Solo Mode"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Grander Vanilla Live Audio Stage Box (Optimized for Mobile Height & Desktop) */}
      <div className="bg-gradient-to-b from-purple-950/90 via-[#0a0d18] to-[var(--card-sunofy)] border border-purple-500/40 rounded-3xl p-3.5 sm:p-6 space-y-2.5 sm:space-y-4 shadow-2xl relative overflow-hidden min-h-[260px] sm:min-h-[420px] flex flex-col justify-between text-center">
        {/* Blended Background Ambient Art & Pulsing Particles Glow */}
        {curTrack?.image && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img src={curTrack.image} alt="Background Blur" className="w-full h-full object-cover filter blur-3xl scale-150" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-sunofy)] via-[#0a0d18]/70 to-purple-950/90" />
          </div>
        )}

        {/* Ambient Pulsing Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Live Stage Floating Emoji Particles Overlay */}
        {floatingEmojis.map((fe) => (
          <div
            key={fe.id}
            style={{ left: `${fe.left}%` }}
            className="absolute bottom-16 z-30 text-4xl sm:text-6xl pointer-events-none select-none animate-[ping_1.8s_ease-out_infinite] drop-shadow-[0_0_25px_rgba(255,215,0,0.95)]"
          >
            {fe.emoji}
          </div>
        ))}

        {/* Stage Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 sm:pb-3 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white">LIVE WATCH PARTY STAGE</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LiveAudioWave isPlaying={syncState.isPlaying} />
            <span className="text-[8px] sm:text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-mono font-bold uppercase tracking-wide shadow-sm">
              {syncState.isPlaying ? 'LISTENING LIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        {curTrack ? (
          <div className="relative z-10 space-y-2 sm:space-y-5 flex-1 flex flex-col justify-between py-1 sm:py-2">
            {/* Center Vanilla Rotating Vinyl Deck or Video Watch Stage */}
            {(() => {
              const isVideoTrack = curTrack.mediaType === 'video' || (curTrack as any).isVideo || curTrack.url?.includes('youtube.com') || curTrack.url?.includes('youtu.be') || curTrack.downloadUrl?.includes('youtube.com');
              const ytId = extractYoutubeId(curTrack.downloadUrl || curTrack.url);

              if (isVideoTrack) {
                const startSec = Math.floor(syncState.currentTime || 0);
                return (
                  <div className={`relative w-full max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-black my-auto ${
                    !syncState.isHost ? 'pointer-events-none select-none' : ''
                  }`}>
                    {ytId ? (
                      <iframe
                        key={ytId + '_' + startSec}
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${syncState.isPlaying ? 1 : 0}&start=${startSec}&enablejsapi=1&origin=${window.location.origin}`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={curTrack.downloadUrl || curTrack.url}
                        className="w-full h-full object-contain"
                        controls={syncState.isHost}
                        autoPlay={syncState.isPlaying}
                      />
                    )}
                  </div>
                );
              }

              return (
                <div className="flex flex-col items-center justify-center my-auto space-y-2 sm:space-y-4 relative">
                  {/* Vanilla Rotating Vinyl Deck Container */}
                  <div className="relative w-28 sm:w-56 h-28 sm:h-56 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-emerald-400 to-pink-500 shadow-[0_0_45px_rgba(168,85,247,0.35)] flex items-center justify-center my-1 sm:my-2">
                    <img
                      src={curTrack.image || './favicon.ico'}
                      alt={curTrack.title}
                      className={`w-full h-full rounded-full object-cover border-2 sm:border-4 border-[#070913] shadow-inner transition-transform duration-700 ${
                        syncState.isPlaying ? 'animate-[spin_6s_linear_infinite]' : 'grayscale-[30%]'
                      }`}
                    />
                    {/* Central Spindle Hole */}
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[#070913] border-2 border-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 shadow-xl" />
                  </div>

                  {/* Track Info Banner */}
                  <div className="text-center max-w-sm space-y-0.5 sm:space-y-1">
                    <span className="text-[8px] sm:text-[9px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block border border-purple-500/30">
                      Now Playing
                    </span>
                    <h3 className="text-xs sm:text-lg font-black truncate text-white">{curTrack.title}</h3>
                    <p className="text-[10px] sm:text-xs text-purple-300 truncate font-medium">{curTrack.artist}</p>
                  </div>

                  {/* Live Party Floating Emoji Reactions Bar */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 flex-wrap">
                    {['❤️', '🔥', '🎵', '👏', '🎉', '🚀'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          syncParty.sendEmojiReaction(emoji);
                        }}
                        className="w-7.5 h-7.5 sm:w-9.5 sm:h-9.5 rounded-full bg-black/40 hover:bg-purple-600/40 border border-purple-500/30 text-sm sm:text-lg flex items-center justify-center hover:scale-125 transition-transform cursor-pointer active:scale-95 shadow-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Host Controls & Progress Bar Section */}
            <div className="space-y-3 pt-2">
              {/* Host-Only Playback Controls (Hidden for Listeners) */}
              {syncState.isHost && (
                <div className="flex items-center justify-center space-x-3 bg-black/60 px-4 py-2 rounded-2xl border border-purple-500/30 shadow-inner w-fit mx-auto">
                  <button
                    onClick={() => syncParty.prevTrack()}
                    className="p-2 text-purple-300 hover:text-white transition cursor-pointer hover:scale-110"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={() => syncParty.togglePlayPause()}
                    className="w-10 h-10 rounded-xl bg-[var(--accent-sunofy)] text-black flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
                    title={syncState.isPlaying ? 'Pause' : 'Play'}
                  >
                    {syncState.isPlaying ? (
                      <Pause className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => syncParty.nextTrackInQueue()}
                    className="p-2 text-purple-300 hover:text-white transition cursor-pointer hover:scale-110"
                    title="Next Track"
                  >
                    <SkipForward className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {/* Timeline Progress Bar (Host gets Knob & Seek; Listener gets Read-Only Line) */}
              {(() => {
                const pct = syncState.duration > 0 ? (syncState.currentTime / syncState.duration) * 100 : 0;
                return (
                  <div className="flex items-center space-x-2 text-[10px] text-purple-300 font-mono">
                    <span>{formatTime(syncState.currentTime)}</span>
                    <div
                      className={`flex-1 h-2 bg-black/60 border border-purple-500/30 rounded-full overflow-hidden relative ${
                        syncState.isHost ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onClick={(e) => {
                        if (!syncState.isHost) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        syncParty.seek(pos * syncState.duration);
                      }}
                    >
                      <div
                        className="bg-[var(--accent-sunofy)] h-full transition-all rounded-full shadow-sm"
                        style={{ width: `${pct}%` }}
                      />
                      {/* Host White Draggable Knob */}
                      {syncState.isHost && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border border-neutral-300 pointer-events-none transition-all"
                          style={{ left: `calc(${pct}% - 7px)` }}
                        />
                      )}
                    </div>
                    <span>{formatTime(syncState.duration)}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 relative z-10 my-auto">
            <div className="w-20 h-20 rounded-full border-2 border-purple-500/40 bg-black/70 flex items-center justify-center mx-auto shadow-inner">
              <Music className="w-8 h-8 text-purple-400 animate-bounce" />
            </div>
            <p className="text-sm font-bold text-white">No track currently playing in party room.</p>
            <p className="text-xs text-purple-300 max-w-xs mx-auto">Search or add tracks below to broadcast to all party members!</p>
          </div>
        )}
      </div>

      {/* Bottom Sub-Tabs Console (6 Consolidated Sub-Tabs with Tooltips & Minimizable Card) */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl overflow-hidden shadow-xl flex flex-col transition-all duration-300">
        {/* Icon-Only Tab Header Bar with Fixed Minimize Toggle */}
        <div className="bg-[var(--bg-sunofy)] border-b border-[var(--border-sunofy)] p-1.5 flex items-center justify-between gap-1.5">
          {/* Scrollable sub-tabs container */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5 pr-1">
            {/* 1. Queue */}
            <button
              onClick={() => setActiveTab('queue')}
              title={`Party Queue (${syncState.queue.length})`}
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                activeTab === 'queue'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'queue' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'}`}>
                {syncState.queue.length}
              </span>
            </button>

            {/* 2. Search Music */}
            <button
              onClick={() => setActiveTab('search_music')}
              title="Search Songs Online"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'search_music'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 3. My Library */}
            <button
              onClick={() => setActiveTab('library')}
              title="My Library (Favorites, Playlists & Offline)"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'library'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Music2 className="w-4 h-4" />
            </button>

            {/* 4. Search Videos */}
            <button
              onClick={() => setActiveTab('video_search')}
              title="Search & Queue Watch Party Videos"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'video_search'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Film className="w-4 h-4" />
            </button>

            {/* 5. Chat */}
            <button
              onClick={() => setActiveTab('chat')}
              title={`Room Chat (${syncState.chat.length})`}
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'chat' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'}`}>
                {syncState.chat.length}
              </span>
            </button>

            {/* 6. Members */}
            <button
              onClick={() => setActiveTab('members')}
              title={`Active Members (${syncState.members.length})`}
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                activeTab === 'members'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'members' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'}`}>
                {syncState.members.length}
              </span>
            </button>

            {/* 7. Voice Chat & Mic Console */}
            {(() => {
              const activeMicCount = syncState.members.filter((m) => m.isMicActive).length;
              return (
                <button
                  onClick={() => setActiveTab('voice')}
                  title={`Live Voice Chat (${activeMicCount} Mics Active)`}
                  className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                    activeTab === 'voice'
                      ? 'bg-emerald-500 text-black shadow-md font-bold'
                      : activeMicCount > 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
                  }`}
                >
                  {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'voice' ? 'bg-black/20 text-black' : activeMicCount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'}`}>
                    {activeMicCount > 0 ? `🎙️ ${activeMicCount}` : 'Off'}
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Fixed Minimize / Maximize Toggle */}
          <div className="pl-1 border-l border-[var(--border-sunofy)]/60 shrink-0 flex items-center">
            <button
              onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
              title={isConsoleMinimized ? "Expand Console" : "Minimize Console"}
              className="p-2 rounded-xl text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)] transition cursor-pointer shrink-0"
            >
              {isConsoleMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Body View (Hidden when console is minimized) */}
        {!isConsoleMinimized && (
          <div className="p-3 sm:p-4 space-y-3 max-h-[300px] sm:max-h-[460px] overflow-y-auto">
            {/* SUB-TAB 1: Party Queue */}
            {activeTab === 'queue' && (
              <div className="space-y-2 animate-fade">
                {/* Host Song Request Approval Banner */}
                {syncState.isHost && syncState.requests && syncState.requests.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Pending Member Requests ({syncState.requests.length})</span>
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-mono bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                        Host Approval
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                      {syncState.requests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <img src={req.track.image} alt={req.track.title} className="w-7 h-7 rounded object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-[var(--text-sunofy)]">{req.track.title}</p>
                              <p className="text-[9px] text-[var(--muted-sunofy)] truncate">Requested by <span className="text-[var(--accent-sunofy)] font-semibold">{req.requesterName}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            <button
                              onClick={() => {
                                syncParty.acceptSongRequest(req.id, req.track, req.requesterName);
                                onShowToast(`Accepted "${req.track.title}" into queue!`);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:scale-105 transition cursor-pointer flex items-center space-x-1"
                              title="Accept Song to Queue"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                syncParty.declineSongRequest(req.id);
                                onShowToast(`Declined request`);
                              }}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs hover:scale-105 transition cursor-pointer"
                              title="Decline Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queue List */}
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                  <span>Party Queue ({syncState.queue.length})</span>
                  <span>{syncState.isHost ? 'Click track to play' : 'Sync Playing'}</span>
                </div>

                {syncState.queue.length === 0 ? (
                  <div className="text-center py-8 space-y-2 border border-dashed border-[var(--border-sunofy)] rounded-xl bg-[var(--bg-sunofy)]/50">
                    <p className="text-xs font-semibold text-[var(--text-sunofy)]">Queue is empty</p>
                    <p className="text-[10px] text-[var(--muted-sunofy)]">Search or import tracks from tabs above!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {syncState.queue.map((song, idx) => {
                      const isCurrentlyPlaying = curTrack
                        ? (song.id === curTrack.id || (song.title === curTrack.title && song.artist === curTrack.artist))
                        : false;

                      return (
                        <div
                          key={song.id + '_' + idx}
                          onClick={() => {
                            if (syncState.isHost) {
                              syncParty.playQueueTrack(idx);
                              onShowToast(`Now playing "${song.title}"`);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                            isCurrentlyPlaying
                              ? 'bg-[var(--accent-sunofy)]/10 border-[var(--accent-sunofy)]/40 shadow-sm'
                              : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] hover:border-[var(--hover-sunofy)]'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <img src={song.image} alt={song.title} className="w-8 h-8 rounded-lg object-cover" />
                              {isCurrentlyPlaying && (
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                  <span className={`w-2 h-2 rounded-full ${syncState.isPlaying ? 'bg-[var(--accent-sunofy)] animate-ping' : 'bg-amber-400'}`} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <h5 className="text-xs font-semibold truncate text-[var(--text-sunofy)]">{song.title}</h5>
                                {isCurrentlyPlaying && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                                    syncState.isPlaying ? 'bg-[var(--accent-sunofy)] text-black' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                  }`}>
                                    {syncState.isPlaying ? 'PLAYING' : 'PAUSED'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--muted-sunofy)] truncate">{song.artist}</p>
                            </div>
                          </div>

                          {!isCurrentlyPlaying && syncState.isHost && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                syncParty.removeTrackFromQueue(idx);
                                onShowToast(`Removed "${song.title}" from queue`);
                              }}
                              className="p-1.5 text-[var(--muted-sunofy)] hover:text-red-400 transition cursor-pointer shrink-0 ml-1"
                              title="Remove Track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: Search Songs Online */}
            {activeTab === 'search_music' && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-3 py-2 space-x-2 focus-within:border-[var(--accent-sunofy)] transition">
                  <Search className="w-4 h-4 text-[var(--muted-sunofy)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSyncSearch}
                    placeholder="Search songs on JioSaavn..."
                    className="w-full bg-transparent border-none text-xs text-[var(--text-sunofy)] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-xs text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {searchResults.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] transition"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <img src={s.image} alt={s.title} className="w-8 h-8 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-semibold truncate text-[var(--text-sunofy)]">{s.title}</h5>
                            <p className="text-[10px] text-[var(--muted-sunofy)] truncate">{s.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            syncParty.addTrackToQueue(s, syncState.isHost ? 'Host' : 'Member');
                            onShowToast(syncState.isHost ? `Added "${s.title}" to Party Queue!` : `Sent request for "${s.title}" to Host!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{syncState.isHost ? 'Add' : 'Request'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-[var(--border-sunofy)] rounded-xl bg-[var(--bg-sunofy)]/50">
                    <p className="text-xs text-[var(--muted-sunofy)]">Type a song or artist name to search and queue live tracks.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: My Library (Favorites, Playlists & Offline Downloads Fix) */}
            {activeTab === 'library' && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                  <span>Import From My Saved Library</span>
                  <span>1-Click Sync</span>
                </div>

                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {/* Section 1: Offline Downloads */}
                  {downloads && downloads.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block px-1">
                        Offline Downloaded Songs ({downloads.length})
                      </span>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]">
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">All Offline Downloaded Songs</p>
                            <p className="text-[10px] text-[var(--muted-sunofy)]">{downloads.length} Local Tracks</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            downloads.forEach((song) => {
                              syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
                            });
                            onShowToast(syncState.isHost ? `Imported ${downloads.length} offline songs to Party!` : `Requested offline songs for Host approval!`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{syncState.isHost ? 'Import All' : 'Request All'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Favorites */}
                  {favorites?.songs && favorites.songs.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block px-1">
                        Liked Favorites ({favorites.songs.length})
                      </span>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]">
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                            <Heart className="w-4 h-4 fill-pink-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">All Liked Favorite Songs</p>
                            <p className="text-[10px] text-[var(--muted-sunofy)]">{favorites.songs.length} Tracks</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            favorites.songs.forEach((song) => {
                              syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
                            });
                            onShowToast(syncState.isHost ? `Imported ${favorites.songs.length} songs to Party!` : `Requested songs for Host approval!`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{syncState.isHost ? 'Import All' : 'Request All'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Saved Playlists */}
                  {playlists && playlists.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--accent-sunofy)] uppercase tracking-wider block px-1">
                        Saved Playlists ({playlists.length})
                      </span>
                      {playlists.map((pl) => (
                        <div
                          key={pl.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] flex items-center justify-center shrink-0">
                              <Music2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">{pl.name}</p>
                              <p className="text-[10px] text-[var(--muted-sunofy)]">{pl.songs.length} Tracks</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleImportPlaylistToParty(pl)}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{syncState.isHost ? 'Import' : 'Request'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!downloads || downloads.length === 0) && (!favorites?.songs || favorites.songs.length === 0) && (!playlists || playlists.length === 0) && (
                    <div className="p-6 text-center border border-dashed border-[var(--border-sunofy)] rounded-xl bg-[var(--bg-sunofy)]/50">
                      <p className="text-xs text-[var(--muted-sunofy)]">No favorites, saved playlists, or offline downloads found in your library.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: Cinema Video Player & Watch Party Videos */}
            {activeTab === 'video_search' && (
              <div className="animate-fade rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl bg-[var(--card-sunofy)] p-2">
                <VideoTab
                  onShowToast={onShowToast}
                  isEmbeddedInSyncParty={true}
                  onVideoSelect={(vid) => {
                    const newTrack: Track = {
                      id: 'vid_' + Date.now(),
                      title: vid.title || 'Watch Party Video',
                      artist: (vid.type ? vid.type.toUpperCase() : 'PARTY') + ' Video',
                      album: 'Watch Party',
                      duration: 0,
                      downloadUrl: vid.url,
                      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=350&fit=crop',
                      mediaType: 'video'
                    };
                    syncParty.addTrackToQueue(newTrack, syncState.isHost ? 'Host' : 'Member');
                    onShowToast(syncState.isHost ? `Broadcasting "${vid.title}" live to Party!` : `Requested "${vid.title}" for Host approval!`);
                  }}
                />
              </div>
            )}

          {/* TAB 3: Room Chat */}
          {activeTab === 'chat' && (
            <div className="space-y-2 animate-fade flex flex-col h-[250px]">
              {/* Message List */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {syncState.chat.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--muted-sunofy)]">No messages yet. Say hi to the room!</div>
                ) : (
                  syncState.chat.map((c) => {
                    const isMyMessage = (c as any).senderId === syncParty.myId || c.sender === 'You';
                    return (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded-2xl text-xs flex flex-col ${
                          c.isSystem
                            ? 'text-[10px] text-[var(--muted-sunofy)] text-center py-1 font-medium bg-black/10 rounded-lg my-1'
                            : isMyMessage
                            ? 'bg-[var(--accent-sunofy)] text-black ml-auto max-w-[80%] rounded-br-xs shadow-md'
                            : 'bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] mr-auto max-w-[80%] rounded-bl-xs shadow-sm'
                        }`}
                      >
                        {!c.isSystem && (
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[10px] font-bold flex items-center gap-1.5 ${isMyMessage ? 'text-black/80' : 'text-[var(--accent-sunofy)]'}`}>
                              <span className="text-xs select-none">{c.avatarIcon || (c.sender === 'Host' || c.sender.includes('Host') ? '👑' : '🎧')}</span>
                              <span>{isMyMessage ? `${c.sender} (You)` : c.sender}</span>
                              {(c.sender === 'Host' || c.sender.includes('Host')) && (
                                <Crown className="w-3 h-3 text-amber-400 rotate-12 inline" />
                              )}
                            </span>
                            <span className={`text-[8px] font-mono ${isMyMessage ? 'text-black/60' : 'text-[var(--muted-sunofy)]'}`}>
                              {c.time}
                            </span>
                          </div>
                        )}
                        <p className="font-semibold leading-relaxed">{c.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Emoji Reaction Bar */}
              <div className="flex items-center gap-1.5 px-1 pt-1.5 border-t border-[var(--border-sunofy)]/50">
                <span className="text-[9px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider mr-1">React:</span>
                {['🔥', '❤️', '👏', '😂', '🎉', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      syncParty.sendEmojiReaction(emoji);
                    }}
                    className="text-sm p-1 hover:scale-125 hover:bg-[var(--border-sunofy)] rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Bar */}
              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Chat with party members..."
                  className="flex-1 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-3 py-2 text-xs text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
                />
                <button
                  onClick={handleSendChat}
                  className="p-2 bg-[var(--accent-sunofy)] text-black rounded-xl hover:scale-105 transition cursor-pointer flex items-center justify-center"
                  title="Send Chat"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Room Members */}
          {activeTab === 'members' && (
            <div className="space-y-2 animate-fade">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                <span>Active Listeners ({syncState.members.length})</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span>🎙️ {syncState.members.filter((m) => m.isMicActive).length} Mic Active</span>
                </span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {syncState.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-sunofy)]/20 to-purple-500/20 border border-[var(--border-sunofy)] flex items-center justify-center text-sm shadow-sm">
                          {m.avatarIcon || (m.isHost ? '👑' : '🎧')}
                        </div>
                        {m.isMicActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-sunofy)] flex items-center justify-center shadow">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-[var(--text-sunofy)] truncate block">{m.name}</span>
                          {m.isHost && <Crown className="w-3 h-3 text-amber-400 rotate-12 inline" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[var(--muted-sunofy)]">{m.isHost ? 'Host' : 'Listener'}</span>
                          {m.isMicActive ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-500/40 flex items-center gap-1">
                              <Mic className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Mic ON</span>
                            </span>
                          ) : (
                            <span className="text-[9px] bg-neutral-500/10 text-[var(--muted-sunofy)] px-1.5 py-0.2 rounded font-mono font-medium border border-[var(--border-sunofy)] flex items-center gap-1">
                              <MicOff className="w-2.5 h-2.5 text-neutral-400" />
                              <span>Muted</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                        🟢 {m.pingMs || 15}ms
                      </span>
                      {syncState.isHost && !m.isHost && (
                        <button
                          onClick={() => {
                            syncParty.kickMember(m.id);
                            onShowToast(`Removed ${m.name} from room`);
                          }}
                          className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer flex items-center space-x-1 text-[10px] font-bold"
                          title="Remove Member"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Live Voice Chat & Microphone Mixer Console */}
          {activeTab === 'voice' && (
            <div className="space-y-3 animate-fade">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                <span>Dedicated Voice Chat & Microphone Mixer</span>
                <span className={isMicActive ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {isMicActive ? '● Live Transmitting' : '○ Mic Muted'}
                </span>
              </div>

              <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-4 space-y-4">
                {/* Host Mic Permission Lock Control Card */}
                {syncState.isHost && (
                  <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                        <Crown className="w-4 h-4 rotate-12" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-[var(--text-sunofy)]">Member Mic Permissions</h5>
                        <p className="text-[10px] text-[var(--muted-sunofy)]">
                          {syncState.allowMemberMics !== false ? 'Members can unmute & speak live' : 'Members are locked & muted'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextState = syncState.allowMemberMics === false;
                        syncParty.toggleAllowMemberMics(nextState);
                        onShowToast(nextState ? '🎙️ Member microphones enabled' : '🔒 Member microphones locked');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ml-1 ${
                        syncState.allowMemberMics !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {syncState.allowMemberMics !== false ? 'Unlocked (ON)' : 'Locked (OFF)'}
                    </button>
                  </div>
                )}

                {/* Master Mic Toggle Button */}
                <button
                  onClick={toggleMic}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg ${
                    isMicActive
                      ? 'bg-emerald-500 text-black shadow-emerald-500/30 animate-pulse'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  <span>{isMicActive ? 'MICROPHONE LIVE (TAP TO MUTE)' : 'UNMUTE MICROPHONE (TRANSMIT VOICE)'}</span>
                </button>

                {/* Live Microphone Voice Level Visualizer Meter */}
                {isMicActive && (
                  <div className="space-y-1.5 pt-1 animate-fade">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Voice Audio Input Level</span>
                      </span>
                      <span className="font-mono">{micLevel}%</span>
                    </div>
                    <div className="flex items-center gap-1 h-6 bg-black/60 p-1.5 rounded-xl border border-emerald-500/30 overflow-hidden shadow-inner">
                      {[...Array(24)].map((_, i) => {
                        const threshold = (i + 1) * 4;
                        const isActive = micLevel >= threshold;
                        const barColor = threshold > 80 ? 'bg-red-500' : threshold > 60 ? 'bg-amber-400' : 'bg-emerald-400';
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-full rounded-xs transition-all duration-75 ${
                              isActive ? `${barColor} shadow-[0_0_6px_rgba(52,211,153,0.8)]` : 'bg-emerald-950/30'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2-Column Mixer Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-sunofy)]">
                      <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4 text-[var(--accent-sunofy)]" /> Room Music Volume</span>
                      <span className="text-[var(--accent-sunofy)] font-mono font-bold">{musicVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                      className="w-full accent-[var(--accent-sunofy)] h-1.5 bg-[var(--border-sunofy)] rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      {[100, 50, 0].map((v) => (
                        <button
                          key={v}
                          onClick={() => setMusicVolume(v)}
                          className={`flex-1 py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                            musicVolume === v
                              ? 'bg-[var(--accent-sunofy)] text-black'
                              : 'bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                          }`}
                        >
                          {v === 0 ? 'Mute' : `${v}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-sunofy)]">
                      <span className="flex items-center gap-1.5"><Mic className="w-4 h-4 text-emerald-400" /> Voice Stream Volume</span>
                      <span className="text-emerald-400 font-mono font-bold">{micVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={micVolume}
                      onChange={(e) => setMicVolume(Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-[var(--border-sunofy)] rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      {[100, 50, 0].map((v) => (
                        <button
                          key={v}
                          onClick={() => setMicVolume(v)}
                          className={`flex-1 py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                            micVolume === v
                              ? 'bg-emerald-500 text-black'
                              : 'bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                          }`}
                        >
                          {v === 0 ? 'Mute' : `${v}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* QR Code Scan Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl w-full max-w-xs p-6 relative shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] p-1 rounded-full hover:bg-[var(--border-sunofy)] transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[var(--text-sunofy)]">Join Sync Party</h3>
              <p className="text-[10px] text-[var(--muted-sunofy)]">Scan to listen synchronously with me!</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-inner mx-auto border border-neutral-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1db954&bgcolor=ffffff&data=${encodeURIComponent(
                  window.location.origin + '/?party=' + syncState.roomCode
                )}`}
                alt="Room QR Code"
                className="w-44 h-44 mx-auto object-contain block"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-black/30 py-2.5 px-3 rounded-xl border border-[var(--border-sunofy)] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--muted-sunofy)] uppercase font-bold">Room Code</span>
              <span className="text-xs font-mono font-bold text-[var(--accent-sunofy)] tracking-widest">
                {syncState.roomCode}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + '/?party=' + syncState.roomCode);
                onShowToast('Party Link copied to clipboard!');
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black text-xs font-bold shadow hover:scale-102 transition"
            >
              Copy Party Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
