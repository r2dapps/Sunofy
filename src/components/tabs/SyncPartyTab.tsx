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
  VolumeX,
  Settings2,
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
  onOpenEqualizer?: () => void;
  onSeek?: (timeSecs: number) => void;
}

function parseDurationSecs(dur?: string | number): number {
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const parts = String(dur).split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

const GIF_CATEGORIES = {
  "Hi": [
    { name: "Hi", url: "https://media.tenor.com/UY_0nvL3aRYAAAAM/oh-hiiii-oh-hi.gif" },
    { name: "Heyy", url: "https://media.tenor.com/pUMecdbDWnwAAAAM/heyy-hey.gif" },
    { name: "Hello", url: "https://media.tenor.com/cYTIBRGNsWYAAAAM/nayanthara-hi.gif" },
    { name: "Hi there", url: "https://media.tenor.com/lkRPi81GE54AAAAM/hi.gif" },
    { name: "Wave", url: "https://media.tenor.com/cKLTZil3GOMAAAAM/hi-hi-there.gif" }
  ],
  "Movie & Popcorn": [
    { name: "Popcorn", url: "https://media.tenor.com/ARgIw-axoFsAAAAM/popcorn-angry-birds.gif" },
    { name: "Eating", url: "https://media.tenor.com/OWiVueFXHYoAAAAM/popcorn-eat.gif" },
    { name: "Watch Movie", url: "https://media.tenor.com/RELsYx8iH4UAAAAM/eating-popcorn-watching-a-movie.gif" },
    { name: "Movie Time", url: "https://media.tenor.com/U8ZEUpq9cY4AAAAM/movie-night-movie-time.gif" },
    { name: "Garfield", url: "https://media.tenor.com/CtLw3UPuc2AAAAAM/the-garfield-movie-popcorn.gif" }
  ],
  "Vibing": [
    { name: "Vibe", url: "https://media.tenor.com/9yNLtDQhh-MAAAAM/i47x.gif" },
    { name: "Enjoying", url: "https://media.tenor.com/9s3ZBYYePBkAAAAM/music-enjoying-music.gif" },
    { name: "Cat Jam", url: "https://media.tenor.com/W2_zxTEyVd8AAAAM/cat-on-bus-jamming-to-music-cat-listening-to-music.gif" },
    { name: "Dance", url: "https://media.tenor.com/S8Pp-w-Pg5IAAAAM/dance-music.gif" },
    { name: "Headphones", url: "https://media.tenor.com/HQGqGRHUG_YAAAAM/hey-arnold-headphones.gif" }
  ],
  "Hit on Head": [
    { name: "Bonk", url: "https://media.tenor.com/udpvUVcjpZAAAAAM/bonk.gif" },
    { name: "FML", url: "https://media.tenor.com/RczE1wnvphMAAAAM/fml-sylvester.gif" },
    { name: "Slap Head", url: "https://media.tenor.com/wHJYArm1FdIAAAAM/slap-head-bird.gif" },
    { name: "Minion Bonk", url: "https://media.tenor.com/K0u17jE1AaEAAAAM/minion-bonk.gif" },
    { name: "Stop", url: "https://media.tenor.com/_dHsFoBZ20IAAAAM/make-it-stop-frustrated.gif" }
  ],
  "Slap": [
    { name: "Cute Slap", url: "https://media.tenor.com/NJmtSRZ1Jd8AAAAM/peach-and-goma-peach-cat.gif" },
    { name: "Haha", url: "https://media.tenor.com/CphtLU7B4uUAAAAM/haha-playing.gif" },
    { name: "Twtjjk", url: "https://media.tenor.com/N624PZowMQUAAAAM/twtjjk.gif" },
    { name: "Peach", url: "https://media.tenor.com/Duta2SKECKAAAAAM/tkthao219-peach.gif" },
    { name: "Tokat", url: "https://media.tenor.com/yCC2nXLRPBgAAAAM/utku-tokat.gif" }
  ],
  "Bike Ride": [
    { name: "Couple Ride", url: "https://media.tenor.com/nppnno30ElQAAAAM/love-couple-riding-bike.gif" },
    { name: "Sanjay", url: "https://media.tenor.com/CxOUzzFYOQYAAAAM/sanjay-chat-tamil-chat.gif" },
    { name: "Night Rider", url: "https://media.tenor.com/oYyzvP_2GqwAAAAM/night-rider-motorcycle.gif" },
    { name: "Riding", url: "https://media.tenor.com/DGMRYbGESegAAAAM/riding-a-motorcycle-maverick.gif" },
    { name: "Kiss Cheek", url: "https://media.tenor.com/4q8Iqrf-m-kAAAAM/kiss-cheek-shelly.gif" }
  ],
  "Car Driving": [
    { name: "Cat Car", url: "https://media.tenor.com/CxLeH_YK1MMAAAAM/peach-cat-car-cat-car.gif" },
    { name: "Dancing", url: "https://media.tenor.com/xwXaQpA6GfEAAAAM/dancing-brandon-woelfel.gif" },
    { name: "Long Drive", url: "https://media.tenor.com/5spMhFDfbUkAAAAM/drive-long-drive.gif" },
    { name: "Hold Hands", url: "https://media.tenor.com/0pfPrSEGaYcAAAAM/couple-hold-hands.gif" },
    { name: "Utu Sayang", url: "https://media.tenor.com/JlPuyYsTBNcAAAAM/utu-sayangutu.gif" }
  ],
  "Telugu Memes": [
    { name: "Cheppu", url: "https://media.tenor.com/F3raahWdeSUAAAAM/telugu-lo-cheppu-satya-jetlee.gif" },
    { name: "Ali Comedy", url: "https://media.tenor.com/OJKVWOuCUpMAAAAM/ali-comedy.gif" },
    { name: "Gopi", url: "https://media.tenor.com/zdOX0tFOmaYAAAAM/gopi-pelli.gif" },
    { name: "Bhibatsam", url: "https://media.tenor.com/uUzQ8-tnRM8AAAAM/bhibatsam-brahmanandam.gif" },
    { name: "Balakrishna", url: "https://media.tenor.com/P2RKA-XwThMAAAAM/balakrishna-telugu-funny.gif" }
  ],
  "Love": [
    { name: "Love You", url: "https://media.tenor.com/h9KsMtW3_GMAAAAM/love-you-ta.gif" },
    { name: "Good Morning", url: "https://media.tenor.com/Um9znIPoP0cAAAAM/good-morning-my-love-good-morning-baby.gif" },
    { name: "Passionate", url: "https://media.tenor.com/Yo4A5vh4oZQAAAAM/passionate-kiss-kiss.gif" },
    { name: "Bed Time", url: "https://media.tenor.com/U3zZFsQ7bekAAAAM/bed-time.gif" },
    { name: "Vyojasmine", url: "https://media.tenor.com/Q3fU2QsPnYEAAAAM/vyojasmine-kitaboy.gif" }
  ],
  "Hug": [
    { name: "Hug", url: "https://media.tenor.com/aN5FmNADcYwAAAAM/hug.gif" },
    { name: "Comfort", url: "https://media.tenor.com/ElYQ-aw8hcgAAAAM/anime-comfort-hug-anime-hug.gif" },
    { name: "Couple Hug", url: "https://media.tenor.com/lIWzIIxdYpIAAAAM/couple-hug-couple.gif" },
    { name: "David Rose", url: "https://media.tenor.com/RTZQy0-E5FkAAAAM/schitts-creek-david-rose.gif" },
    { name: "Zagrljaj", url: "https://media.tenor.com/fidgqQ1HDGwAAAAM/zagrljaj-kuhinja.gif" }
  ],
  "Kiss": [
    { name: "Kiss", url: "https://media.tenor.com/eCNrTq7wOpgAAAAM/kiss.gif" },
    { name: "Couple Kiss", url: "https://media.tenor.com/yo8aSVqTZh0AAAAM/couple-kiss.gif" },
    { name: "Blow Kiss", url: "https://media.tenor.com/4D_04TosVEMAAAAM/bear-blowakiss.gif" },
    { name: "Girls Kissing", url: "https://media.tenor.com/x-oFXlFnmIYAAAAM/girlfriend-kiss-girls-kissing.gif" },
    { name: "Cooper Norris", url: "https://media.tenor.com/CP010NofH9MAAAAM/kiss-cooper-norris.gif" }
  ],
  "Forehead Kiss": [
    { name: "Arjuhi", url: "https://media.tenor.com/BbUdLpzhviIAAAAM/forehead-kiss-arjuhi.gif" },
    { name: "Sidnaaz", url: "https://media.tenor.com/aI9ObQiLoAUAAAAM/sidnaaz-shehnaaz-kaur-gill.gif" },
    { name: "Supergirl", url: "https://media.tenor.com/Gm77PpFxrTQAAAAM/supergirl-the-cw.gif" },
    { name: "Pacey", url: "https://media.tenor.com/XFN_acfalwEAAAAM/dawsonscreek-pacey.gif" },
    { name: "Aadikeshava", url: "https://media.tenor.com/14X0hSajOGwAAAAM/aadikeshava-vaisshnav-tej.gif" }
  ],
  "Neck Kiss": [
    { name: "Arthur", url: "https://media.tenor.com/G73r5KmAKB4AAAAM/arthurneck.gif" },
    { name: "Abraco", url: "https://media.tenor.com/0WpLTYtyShoAAAAM/abra%C3%A7o-hug.gif" },
    { name: "Pati", url: "https://media.tenor.com/TjkjoXgYLy0AAAAM/neck-kiss-pati.gif" },
    { name: "Necking", url: "https://media.tenor.com/UOoZzapbPvAAAAAM/necking-kissing.gif" },
    { name: "Neck Kiss", url: "https://media.tenor.com/jPSPnBoDssoAAAAM/neck-kiss.gif" }
  ],
  "Cheek Kiss": [
    { name: "Cheek", url: "https://media.tenor.com/6w5lRr9zX6QAAAAM/cheek-kiss.gif" },
    { name: "Cosytales", url: "https://media.tenor.com/bDvno_NK_-8AAAAM/cosytales-love.gif" },
    { name: "Besos", url: "https://media.tenor.com/niRNXa22co0AAAAM/besos-amor.gif" },
    { name: "Kiss Cheek", url: "https://media.tenor.com/KBfnXAks5A4AAAAM/kiss-cheek-kiss.gif" },
    { name: "Garrett", url: "https://media.tenor.com/-2UMtic0wGkAAAAM/kiss-on-cheeks-garrett-kennell.gif" }
  ],
  "Bite": [
    { name: "Meredith", url: "https://media.tenor.com/cCfhCEN5liwAAAAM/greys-anatomy-meredith-grey.gif" },
    { name: "Clav", url: "https://media.tenor.com/eMv23M6njMgAAAAM/clav-clavicular.gif" },
    { name: "Flamez", url: "https://media.tenor.com/m7Tv81QFsJIAAAAM/flamez-%26-ivo-anime.gif" },
    { name: "Mocha", url: "https://media.tenor.com/jpcZQ-vfgbkAAAAM/milk-and-mocha.gif" },
    { name: "Bite Couple", url: "https://media.tenor.com/yrCiFt92OZAAAAAM/bite-couple.gif" }
  ],
  "Tease": [
    { name: "Love", url: "https://media.tenor.com/130cBxfFpjwAAAAM/davydoff-love.gif" },
    { name: "Megan", url: "https://media.tenor.com/kf_z5AheabMAAAAM/megan-fox-cute.gif" },
    { name: "Fight", url: "https://media.tenor.com/9zlc7p-qlI8AAAAM/couple-joking-couple-fight.gif" },
    { name: "Couple Kiss", url: "https://media.tenor.com/LXHPuL-X1LMAAAAM/couple-kiss.gif" },
    { name: "Smile Kiss", url: "https://media.tenor.com/rFQ4ZlQtH4AAAAAM/smile-kiss.gif" }
  ],
  "Massage": [
    { name: "Massage", url: "https://media.tenor.com/3xlP-3j2q0wAAAAM/massage-massagem.gif" },
    { name: "Keechu", url: "https://media.tenor.com/Bn0hs1ITrwAAAAAM/keechu-baby.gif" },
    { name: "Couple", url: "https://media.tenor.com/BYCMNhjzQNcAAAAM/couple-massage.gif" },
    { name: "BBB18", url: "https://media.tenor.com/R2y-taIf2BgAAAAM/bbb18-massage.gif" },
    { name: "Leg Pain", url: "https://media.tenor.com/-Wp6b0JI0isAAAAM/leg-pain.gif" }
  ],
  "Whisper": [
    { name: "Whisper", url: "https://media.tenor.com/Z_wKRM0nTioAAAAM/whisper.gif" },
    { name: "Devil", url: "https://media.tenor.com/9pPfqzfnQnMAAAAM/devil-whisper-evil.gif" },
    { name: "Spongebob", url: "https://media.tenor.com/7HZQNIoTwqcAAAAM/spongebob-whisper.gif" },
    { name: "Therapist", url: "https://media.tenor.com/huj1jCMArV4AAAAM/callum-kerr-my-therapist-friend.gif" },
    { name: "Seth Gecko", url: "https://media.tenor.com/41C5xl6xnbQAAAAM/seth-gecko-dj-cotrona.gif" }
  ],
  "Holding Hands": [
    { name: "In Love", url: "https://media.tenor.com/AkX6vbNrJxIAAAAM/in-love.gif" },
    { name: "Puuung", url: "https://media.tenor.com/XDKwhL5QvLAAAAAM/puuung-hold-hands.gif" },
    { name: "Hold Hands", url: "https://media.tenor.com/xpkVSKThUQYAAAAM/hold-hands-holding-hands.gif" },
    { name: "Love", url: "https://media.tenor.com/Ns4gc0NjdagAAAAM/love.gif" },
    { name: "Mai", url: "https://media.tenor.com/Ks-AelpUyTsAAAAM/sakuta-azusagawa-mai-sakurajima.gif" }
  ],
  "Sensual Kiss": [
    { name: "Desire Kiss", url: "https://media.tenor.com/VKXJHuLm0FsAAAAM/desire-kiss.gif" },
    { name: "Romantic Couple", url: "https://media.tenor.com/JrLJ41e5UiIAAAAM/romantic-couple-romantic.gif" },
    { name: "Kiss Romantic", url: "https://media.tenor.com/iseySgx8Z20AAAAM/kiss-romantic.gif" },
    { name: "Davydoff Love", url: "https://media.tenor.com/TDJcCbgS3lYAAAAM/davydoff-love.gif" },
    { name: "Ladla Love", url: "https://media.tenor.com/P9nPwMoG2x4AAAAM/ladla-ladli-love-kissing.gif" }
  ],
  "Sensual Hug": [
    { name: "Sarilmak", url: "https://media.tenor.com/EPzQ0Vxskw8AAAAM/sarilmak.gif" },
    { name: "Good Night", url: "https://media.tenor.com/HwXv_6YDDAIAAAAM/good-night-love-couple-kiss.gif" },
    { name: "Couple Cute", url: "https://media.tenor.com/7R7fAP38z0IAAAAM/couple-cute.gif" },
    { name: "Hugs Kisses", url: "https://media.tenor.com/PyZKzvjzD9YAAAAM/hugs-and-kisses.gif" },
    { name: "Love Tears", url: "https://media.tenor.com/3IkwJaNrbJcAAAAM/love-tears.gif" }
  ],
  "Sensual Cuddle": [
    { name: "Cuddle Love", url: "https://media.tenor.com/PETaPxZJuJUAAAAM/cuddle-love.gif" },
    { name: "Forehead Kiss", url: "https://media.tenor.com/KLS4sVt8zSQAAAAM/forehead-kiss.gif" },
    { name: "Love Husband", url: "https://media.tenor.com/3eVUj2WnOBkAAAAM/love-husband.gif" },
    { name: "Love You", url: "https://media.tenor.com/TAjLQk5o3OQAAAAM/love-you.gif" },
    { name: "Couple Cute", url: "https://media.tenor.com/7R7fAP38z0IAAAAM/couple-cute.gif" }
  ]
};

export const SyncPartyTab: React.FC<SyncPartyTabProps> = ({
  syncState,
  playlists = [],
  favorites,
  onShowToast,
  onPlayTrack,
  musicSource = 'jiosaavn',
  downloads = [],
  onOpenEqualizer,
  onSeek,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [customReaction, setCustomReaction] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [activeGifTag, setActiveGifTag] = useState('Hi');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [musicVolume, setMusicVolume] = useState(100);
  const [micVolume, setMicVolume] = useState(100);
  const [activeSpeaker, setActiveSpeaker] = useState<{ name: string; timestamp: number } | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const curTrack = syncState.currentTrack || (syncState.queue.length > 0 ? syncState.queue[0] : null);
  const isVideoTrack = curTrack ? (curTrack.mediaType === 'video' || (curTrack as any).isVideo || curTrack.url?.includes('youtube.com') || curTrack.url?.includes('youtu.be') || curTrack.downloadUrl?.includes('youtube.com')) : false;
  const voiceAudioCtxRef = React.useRef<AudioContext | null>(null);
  const recorderIntervalRef = React.useRef<any>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const videoContainerRef = React.useRef<HTMLDivElement | null>(null);

  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

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

  // Subscribe to incoming remote WebRTC active speakers
  React.useEffect(() => {
    if (!syncState.inRoom) return;

    const speakingMember = syncState.members.find((m: any) => m.isMicSpeaking && m.id !== syncParty.myId);
    if (speakingMember) {
      setActiveSpeaker({ name: speakingMember.name, timestamp: Date.now() });
    }
  }, [syncState.members, syncState.inRoom]);

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
      spawnFloatingEmoji(emoji, false);
    });
    return () => cleanup();
  }, [syncState.inRoom, syncState.roomCode]);

  // Active sub-tab inside the consolidated Sync Party console
  const [activeTab, setActiveTab] = useState<'queue' | 'search_music' | 'library' | 'video_search' | 'chat' | 'members' | 'voice'>('queue');
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoSearchResults, setVideoSearchResults] = useState<any[]>([]);
  const [expandedLibrarySections, setExpandedLibrarySections] = useState<{ [key: string]: boolean }>({ playlists: false });
  const [expandedPlaylists, setExpandedPlaylists] = useState<{ [key: string]: boolean }>({});
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const lastChatLenRef = React.useRef(syncState.chat.length);
  const chatBottomRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-expand console when an icon is tapped
  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (isConsoleMinimized) {
      setIsConsoleMinimized(false);
    }
    if (tab === 'chat') {
      setHasUnreadChat(false);
    }
  };

  // Track new unread chat messages
  React.useEffect(() => {
    if (syncState.chat.length > lastChatLenRef.current) {
      if (activeTab !== 'chat' || isConsoleMinimized) {
        setHasUnreadChat(true);
      }
    }
    lastChatLenRef.current = syncState.chat.length;
  }, [syncState.chat.length, activeTab, isConsoleMinimized]);

  // Auto-scroll chat to latest message
  React.useEffect(() => {
    if (activeTab === 'chat' && !isConsoleMinimized) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [syncState.chat.length, activeTab, isConsoleMinimized]);

  // Floating Emoji Particles state over Live Stage
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; left: number }[]>([]);

  const spawnFloatingEmoji = (emoji: string, isLocalClick: boolean = false) => {
    triggerFloatingEmojiConfetti(emoji);
    const count = isLocalClick ? Math.floor(Math.random() * 3) + 3 : 1; // 1 for network incoming, 3-5 for local click burst
    const newEmojis = Array.from({ length: count }).map(() => ({
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      left: Math.floor(10 + Math.random() * 80)
    }));
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => !newEmojis.find(ne => ne.id === item.id)));
    }, 4500);
  };

  const extractYoutubeId = (url?: string) => {
    if (!url) return null;
    const streamMatch = url.match(/\/api\/youtube\/stream\?id=([a-zA-Z0-9_-]{11})/);
    if (streamMatch) return streamMatch[1];
    
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
    setChatInput('');
    setJoinCodeInput('');
  };

  // Sync with host's network time & reset on track change
  React.useEffect(() => {
    setLocalTime(syncState.currentTime || 0);
  }, [syncState.currentTrack?.id, (syncState.currentTrack as any)?.queueId, (syncState.currentTrack as any)?.playSessionId]);

  React.useEffect(() => {
    setLocalTime(prev => {
      // If we are out of sync by more than 1.5 seconds, snap to the host's exact time
      if (Math.abs(prev - syncState.currentTime) > 1.5) {
        return syncState.currentTime;
      }
      return prev;
    });
  }, [syncState.currentTime]);

  // Sync musicVolume to global App player and Video Iframe
  React.useEffect(() => {
    const vol = musicVolume / 100;
    window.dispatchEvent(new CustomEvent('sunofy:set_volume', { detail: vol }));
    
    // Attempt to sync youtube iframe if present
    if (videoContainerRef.current) {
      const iframe = videoContainerRef.current.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [musicVolume]
        }), '*');
      }
      const vid = videoContainerRef.current.querySelector('video');
      if (vid) {
        vid.volume = vol;
      }
    }
  }, [musicVolume]);

  // Sync micVolume to remote voice streams
  React.useEffect(() => {
    syncParty.setRemoteVoiceVolume(micVolume / 100);
  }, [micVolume]);

  // Smooth local ticking for the progress bar
  React.useEffect(() => {
    let animationFrameId: number;
    let lastTick = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      setLocalTime(prev => {
        // Only increment if playing
        const activeDur = syncState.duration || curTrack?.duration || 0;
        if (syncState.isPlaying && activeDur > 0) {
          const next = prev + delta;
          return next <= activeDur ? next : activeDur;
        }
        return prev;
      });
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [syncState.isPlaying, syncState.duration, curTrack?.duration]);

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

  const handleGifSearch = async (query: string) => {
    // Disabled due to API key restrictions on public apps
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
  return (
    <div className="animate-fade pb-0 text-[var(--text-sunofy)] select-none relative flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Live Voice Active Speaker Floating Indicator */}
      {activeSpeaker && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce-subtle backdrop-blur-md border border-emerald-300">
          <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>🎙️ {activeSpeaker.name} is speaking live...</span>
        </div>
      )}

      {/* Pinned Top Room Header Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0d18]/95 border-b border-purple-500/20 px-3 py-2 flex items-center justify-between backdrop-blur-md shrink-0 gap-2 shadow-md">
        {/* Left Side: Radio Icon + Room Code + Share */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/30 flex items-center justify-center text-[var(--accent-sunofy)] shadow-inner shrink-0 relative">
            <Radio className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            {syncState.isHost && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5" title="Host">
                <Crown className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
          
          {/* Combined Room Code + Copy + Share Pill */}
          <div className="font-mono text-xs font-bold text-[var(--accent-sunofy)] bg-black/60 px-2.5 py-1 rounded-xl border border-[var(--border-sunofy)] flex items-center space-x-1.5 shrink-0 shadow-inner">
            <span className="tracking-wider text-[11px]">#{syncState.roomCode}</span>
            <div className="w-px h-3 bg-[var(--border-sunofy)] opacity-50" />
            <button
              onClick={handleCopyCode}
              className="p-1 hover:text-white transition cursor-pointer"
              title="Copy Room Code"
            >
              <Copy className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
            </button>
            <button
              onClick={handleShareLink}
              className="p-1 text-purple-300 hover:text-white transition cursor-pointer"
              title="Share Room Link"
            >
              <Share2 className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
            </button>
          </div>

          {/* Equalizer button */}
          <button
            onClick={() => {
              if (onOpenEqualizer) onOpenEqualizer();
              else onShowToast('Equalizer opened');
            }}
            className="w-8 h-8 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="Audio Equalizer"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Live Status + Exit */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="h-8 px-3 bg-purple-500/20 rounded-xl border border-purple-400/30 flex items-center" title={syncState.isPlaying ? 'Listening Live' : 'Paused'}>
            <LiveAudioWave isPlaying={syncState.isPlaying} />
          </div>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="Exit Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Master Live Watch Party Stage Container */}
      <div className={`bg-gradient-to-b from-purple-950/40 via-[#0a0d18] to-[var(--bg-sunofy)] rounded-3xl relative overflow-hidden flex flex-col justify-between text-center transition-all duration-300 ${
        isConsoleMinimized ? 'flex-1 min-h-0 p-3.5 sm:p-6' : 'shrink-0 p-2.5 sm:p-3 space-y-2'
      }`}>
        {/* Blended Background Ambient Art & Pulsing Particles Glow */}
        {curTrack?.image && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img src={curTrack.image} alt="Background Blur" className="w-full h-full object-cover filter blur-3xl scale-150" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-sunofy)] via-[#0a0d18]/70 to-purple-950/80" />
          </div>
        )}

        {/* Ambient Pulsing Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Live Stage Floating Emoji Particles Overlay (Only in Minimized/Full Stage View) */}
        {isConsoleMinimized && floatingEmojis.map((fe) => (
          <div
            key={fe.id}
            style={{ left: `${fe.left}%`, marginLeft: '-1.5rem' }}
            className="absolute bottom-16 z-30 text-4xl sm:text-5xl pointer-events-none select-none animate-float-up drop-shadow-[0_0_25px_rgba(255,215,0,0.95)]"
          >
            {fe.emoji}
          </div>
        ))}

        {curTrack ? (
          <div className="relative z-10 space-y-1.5 sm:space-y-3 flex-1 flex flex-col justify-between py-1">
            {/* Center Vanilla Rotating Vinyl Deck or Video Watch Stage */}
            {(() => {
              const ytId = extractYoutubeId(curTrack.downloadUrl || curTrack.url);

              if (isVideoTrack) {
                const startSec = Math.floor(syncState.currentTime || 0);
                return (
                  <div
                    ref={videoContainerRef}
                    className="relative w-full max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-transparent my-auto group"
                  >
                    {ytId ? (
                      <iframe
                        key={ytId}
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${syncState.isPlaying ? 1 : 0}&start=${startSec}&controls=${syncState.isHost ? 1 : 0}&disablekb=1&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                        className={`w-full h-full border-0 ${!syncState.isHost ? 'pointer-events-none select-none' : ''}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={curTrack.downloadUrl || curTrack.url}
                        className={`w-full h-full object-contain ${!syncState.isHost ? 'pointer-events-none select-none' : ''}`}
                        controls={syncState.isHost}
                        autoPlay={syncState.isPlaying}
                      />
                    )}

                    {/* Transparent protection shield for listeners so they cannot click/scrub YouTube controls */}
                    {!syncState.isHost && (
                      <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto" />
                    )}

                    {/* Individual Fullscreen Overlay Button for any member */}
                    <button
                      onClick={handleToggleFullscreen}
                      className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-purple-600/90 text-white rounded-xl backdrop-blur-md border border-white/20 transition cursor-pointer shadow-2xl z-40 pointer-events-auto"
                      title="Toggle Individual Fullscreen Theatre Mode"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              return isConsoleMinimized ? (
                /* COLLAPSED CONSOLE MODE: Grand Centered Stage with Floating Reactions & Pulsing Vinyl */
                <div className="flex flex-col items-center justify-center my-auto space-y-2 sm:space-y-4 relative text-center">
                  {/* Grand Rotating Vinyl Deck */}
                  <div className="relative w-28 sm:w-52 h-28 sm:h-52 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-emerald-400 to-pink-500 shadow-[0_0_40px_rgba(168,85,247,0.4)] flex items-center justify-center my-1 sm:my-2">
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
                          spawnFloatingEmoji(emoji, true);
                        }}
                        className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-purple-600/40 border border-purple-500/30 text-sm sm:text-base flex items-center justify-center hover:scale-125 transition-transform cursor-pointer active:scale-95 shadow-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* EXPANDED CONSOLE MODE: Compact Horizontal Player Deck */
                <div className="flex items-center justify-center my-auto gap-3 relative px-2 text-left">
                  {/* Compact Rotating Vinyl Disc */}
                  <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 via-emerald-400 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center shrink-0">
                    <img
                      src={curTrack.image || './favicon.ico'}
                      alt={curTrack.title}
                      className={`w-full h-full rounded-full object-cover border border-[#070913] shadow-inner transition-transform duration-700 ${
                        syncState.isPlaying ? 'animate-[spin_6s_linear_infinite]' : 'grayscale-[30%]'
                      }`}
                    />
                    {/* Central Spindle Hole */}
                    <div className="w-2.5 h-2.5 rounded-full bg-[#070913] border border-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 shadow-xl" />
                  </div>

                  {/* Track Info */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-black truncate text-white">{curTrack.title}</h3>
                    <p className="text-[10px] sm:text-xs text-purple-300 truncate font-medium">{curTrack.artist}</p>
                  </div>
                </div>
              );
            })()}

            {/* Host Controls & Progress Bar Section (Shown for both Audio & Video Tracks) */}
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
                const activeDuration = syncState.duration || curTrack?.duration || (isVideoTrack ? 300 : 210);
                const pct = activeDuration > 0 ? (localTime / activeDuration) * 100 : 0;
                return (
                  <div className="flex items-center space-x-2 text-[10px] text-purple-300 font-mono">
                    <span>{formatTime(localTime)}</span>
                    <div
                      className={`flex-1 h-3 bg-black/60 border border-purple-500/30 rounded-full relative p-0.5 flex items-center touch-none select-none ${
                        syncState.isHost ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onPointerDown={(e) => {
                        if (!syncState.isHost) return;
                        e.preventDefault();
                        const target = e.currentTarget;
                        const rect = target.getBoundingClientRect();
                        const updateSeek = (clientX: number) => {
                          const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                          const targetTime = pos * activeDuration;
                          setLocalTime(targetTime);
                          if (onSeek) {
                            onSeek(targetTime);
                          } else {
                            syncParty.seek(targetTime);
                          }
                        };
                        updateSeek(e.clientX);

                        const handleMove = (moveEv: PointerEvent) => {
                          updateSeek(moveEv.clientX);
                        };
                        const handleUp = () => {
                          window.removeEventListener('pointermove', handleMove);
                          window.removeEventListener('pointerup', handleUp);
                        };
                        window.addEventListener('pointermove', handleMove);
                        window.addEventListener('pointerup', handleUp);
                      }}
                    >
                      <div
                        className="bg-[var(--accent-sunofy)] h-full rounded-full shadow-[0_0_8px_rgba(29,185,84,0.6)] relative"
                        style={{ width: `${pct}%` }}
                      >
                        {/* Host White Draggable Knob */}
                        {syncState.isHost && (
                          <div
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[var(--accent-sunofy)] pointer-events-none transition-transform"
                          />
                        )}
                      </div>
                    </div>
                    <span>{formatTime(activeDuration)}</span>
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

      {/* Bottom Sub-Tabs Console (Docked Bottom Nav Bar Card) */}
      <div className={`flex flex-col transition-all duration-300 ${
        isConsoleMinimized ? 'shrink-0 mt-auto' : 'flex-1 min-h-0 bg-gradient-to-b from-[#0a0a14]/95 via-[#0e0e1a]/95 to-[var(--bg-sunofy)] backdrop-blur-2xl rounded-t-3xl border-t border-[var(--border-sunofy)] overflow-hidden relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]'
      }`}>


        {/* Icon-Only Tab Header Bar (Native Bottom Nav Bar Style) */}
        <div className={`bg-[#0a0a0f]/95 border-t border-[var(--border-sunofy)] flex items-center justify-between gap-1.5 backdrop-blur-2xl shadow-lg z-50 transition-all duration-300 ${isConsoleMinimized ? 'rounded-2xl border px-2 py-1 mx-2 mb-2' : 'sticky bottom-0 left-0 right-0 h-[48px]'}`}>
          {/* Scrollable sub-tabs container */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5 pr-1">
            {/* 1. Search Music */}
            <button
              onClick={() => handleSelectTab('search_music')}
              title="Search Songs Online"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'search_music'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 2. My Library */}
            <button
              onClick={() => handleSelectTab('library')}
              title="My Library (Favorites, Playlists & Offline)"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'library'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Music2 className="w-4 h-4" />
            </button>

            {/* 3. Search Videos */}
            <button
              onClick={() => handleSelectTab('video_search')}
              title="Search & Queue Watch Party Videos"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shrink-0 ${
                activeTab === 'video_search'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Film className="w-4 h-4" />
            </button>

            {/* 4. Queue */}
            <button
              onClick={() => handleSelectTab('queue')}
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

            {/* 5. Chat */}
            <button
              onClick={() => handleSelectTab('chat')}
              title={`Room Chat (${syncState.chat.length})`}
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-4 h-4" />
                {hasUnreadChat && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                )}
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'chat' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'}`}>
                {syncState.chat.length}
              </span>
            </button>

            {/* 6. Members */}
            <button
              onClick={() => handleSelectTab('members')}
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

            {/* 7. Room Volume & Audio Settings */}
            <button
              onClick={() => handleSelectTab('voice')}
              title="Room Volume & Audio Settings"
              className={`p-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative shrink-0 ${
                activeTab === 'voice'
                  ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-bold'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Fixed Minimize / Maximize Toggle */}
          <div className="pl-1 border-l border-[var(--border-sunofy)]/60 shrink-0 flex items-center">
            <button
              onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
              title={isConsoleMinimized ? "Expand Console" : "Minimize Console"}
              className="p-2 rounded-xl text-[var(--muted-sunofy)] hover:text-white hover:bg-[var(--border-sunofy)] transition cursor-pointer shrink-0"
            >
              {isConsoleMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Content Body (Hidden when console is minimized) */}
        {!isConsoleMinimized && (
          <div className={`flex-1 p-4 custom-scrollbar ${activeTab === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto space-y-3'}`}>
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
                        ? ((song as any).queueId && (curTrack as any).queueId
                            ? (song as any).queueId === (curTrack as any).queueId
                            : (song.id === curTrack.id || (song.title === curTrack.title && song.artist === curTrack.artist)))
                        : false;

                      return (
                        <div
                          key={(song as any).queueId || (song.id + '_' + idx)}
                          onClick={() => {
                            if (syncState.isHost) {
                              syncParty.playQueueTrack(idx);
                              onShowToast(`Now playing "${song.title}"`);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition ${
                            syncState.isHost ? 'cursor-pointer hover:border-[var(--hover-sunofy)]' : 'cursor-default'
                          } ${
                            isCurrentlyPlaying
                              ? 'bg-[var(--accent-sunofy)]/10 border-[var(--accent-sunofy)]/40 shadow-sm'
                              : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)]'
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
                    placeholder={`Search songs on ${musicSource === 'youtube' ? 'YT Music' : musicSource === 'cobalt' ? 'Cobalt' : 'JioSaavn'}...`}
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
                      <div className="flex flex-col rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] overflow-hidden">
                        <div
                          onClick={() => setExpandedPlaylists(prev => ({ ...prev, offline: !prev.offline }))}
                          className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5 transition"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                              <Download className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">All Offline Downloaded Songs</p>
                              <p className="text-[10px] text-[var(--muted-sunofy)]">{downloads.length} Local Tracks</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloads.forEach((song) => {
                                  syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
                                });
                                onShowToast(syncState.isHost ? `Imported ${downloads.length} offline songs to Party!` : `Requested offline songs for Host approval!`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">{syncState.isHost ? 'Import All' : 'Request All'}</span>
                            </button>
                            {expandedPlaylists['offline'] ? <ChevronUp className="w-4 h-4 text-[var(--muted-sunofy)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-sunofy)]" />}
                          </div>
                        </div>

                        {/* Expanded Offline Tracks */}
                        {expandedPlaylists['offline'] && (
                          <div className="border-t border-[var(--border-sunofy)] divide-y divide-[var(--border-sunofy)]/50 bg-black/20 max-h-48 overflow-y-auto custom-scrollbar">
                            {downloads.map((track, i) => (
                              <div key={`off-${track.id}-${i}`} className="flex items-center justify-between p-2 pl-3 hover:bg-[var(--border-sunofy)]/50 group">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  {track.image ? (
                                    <img src={track.image} alt={track.title} className="w-6 h-6 rounded object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                                      <Music className="w-3 h-3 text-blue-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold text-[var(--text-sunofy)] truncate">{track.title}</p>
                                    <p className="text-[9px] text-[var(--muted-sunofy)] truncate">{track.artist}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    syncParty.addTrackToQueue(track, syncState.isHost ? 'Host' : 'Member');
                                    onShowToast(`Added "${track.title}" to Sync Party`);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition cursor-pointer shrink-0 ml-1"
                                  title="Add to Party Queue"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Favorites */}
                  {favorites?.songs && favorites.songs.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block px-1">
                        Liked Favorites ({favorites.songs.length})
                      </span>
                      <div className="flex flex-col rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] overflow-hidden">
                        <div
                          onClick={() => setExpandedPlaylists(prev => ({ ...prev, favorites: !prev.favorites }))}
                          className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5 transition"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                              <Heart className="w-4 h-4 fill-pink-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">All Liked Favorite Songs</p>
                              <p className="text-[10px] text-[var(--muted-sunofy)]">{favorites.songs.length} Tracks</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                favorites.songs.forEach((song) => {
                                  syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
                                });
                                onShowToast(syncState.isHost ? `Imported ${favorites.songs.length} songs to Party!` : `Requested songs for Host approval!`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">{syncState.isHost ? 'Import All' : 'Request All'}</span>
                            </button>
                            {expandedPlaylists['favorites'] ? <ChevronUp className="w-4 h-4 text-[var(--muted-sunofy)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-sunofy)]" />}
                          </div>
                        </div>

                        {/* Expanded Favorites Tracks */}
                        {expandedPlaylists['favorites'] && (
                          <div className="border-t border-[var(--border-sunofy)] divide-y divide-[var(--border-sunofy)]/50 bg-black/20 max-h-48 overflow-y-auto custom-scrollbar">
                            {favorites.songs.map((track, i) => (
                              <div key={`fav-${track.id}-${i}`} className="flex items-center justify-between p-2 pl-3 hover:bg-[var(--border-sunofy)]/50 group">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  {track.image ? (
                                    <img src={track.image} alt={track.title} className="w-6 h-6 rounded object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-pink-500/20 flex items-center justify-center">
                                      <Music className="w-3 h-3 text-pink-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold text-[var(--text-sunofy)] truncate">{track.title}</p>
                                    <p className="text-[9px] text-[var(--muted-sunofy)] truncate">{track.artist}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    syncParty.addTrackToQueue(track, syncState.isHost ? 'Host' : 'Member');
                                    onShowToast(`Added "${track.title}" to Sync Party`);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] flex items-center justify-center hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer shrink-0 ml-1"
                                  title="Add to Party Queue"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Saved Playlists */}
                  {playlists && playlists.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--accent-sunofy)] uppercase tracking-wider block px-1">
                        Saved Playlists ({playlists.length})
                      </span>
                      {playlists.map((pl) => {
                        const isExpanded = expandedPlaylists[pl.id];
                        return (
                          <div key={pl.id} className="flex flex-col rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] overflow-hidden">
                            <div
                              onClick={() => setExpandedPlaylists(prev => ({ ...prev, [pl.id]: !isExpanded }))}
                              className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5 transition"
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
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImportPlaylistToParty(pl);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer shrink-0 ml-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="hidden sm:inline">{syncState.isHost ? 'Import All' : 'Request All'}</span>
                                </button>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--muted-sunofy)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-sunofy)]" />}
                              </div>
                            </div>
                            
                            {/* Expanded Tracks */}
                            {isExpanded && (
                              <div className="border-t border-[var(--border-sunofy)] divide-y divide-[var(--border-sunofy)]/50 bg-black/20">
                                {pl.songs.map((track, i) => (
                                  <div key={`${track.id}-${i}`} className="flex items-center justify-between p-2 pl-3 hover:bg-[var(--border-sunofy)]/50 group">
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      {track.image ? (
                                        <img src={track.image} alt={track.title} className="w-6 h-6 rounded object-cover" />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                                          <Music className="w-3 h-3 text-purple-400" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold text-[var(--text-sunofy)] truncate">{track.title}</p>
                                        <p className="text-[9px] text-[var(--muted-sunofy)] truncate">{track.subtitle}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        syncParty.addTrackToQueue(track, syncState.isHost ? 'Host' : 'Member');
                                        onShowToast(`Added "${track.title}" to Sync Party`);
                                      }}
                                      className="w-6 h-6 rounded-lg bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] flex items-center justify-center hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer shrink-0 ml-1"
                                      title="Add to Party Queue"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    const durSecs = parseDurationSecs(vid.duration);
                    const newTrack: Track = {
                      id: 'vid_' + Date.now(),
                      title: vid.title || 'Watch Party Video',
                      artist: (vid.type ? vid.type.toUpperCase() : 'PARTY') + ' Video',
                      album: 'Watch Party',
                      duration: durSecs || 300,
                      downloadUrl: vid.url,
                      image: vid.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=350&fit=crop',
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
            <div className="flex flex-col h-full animate-fade min-h-0">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col space-y-2 pb-2">
                <div className="flex-1 min-h-0"></div>
                {syncState.chat.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--muted-sunofy)]">No messages yet. Say hi to the room!</div>
                ) : (
                  syncState.chat.map((c) => {
                    const isMyMessage = (c as any).senderId === syncParty.myId || c.sender === 'You';
                    return (
                      <div
                        key={c.id}
                        className={`py-1.5 px-3 rounded-2xl text-xs flex flex-col ${
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
                        {c.text.startsWith('http') && (c.text.includes('.gif') || c.text.includes('giphy.com') || c.text.includes('tenor.com') || c.text.includes('media.giphy.com')) ? (
                          <img
                            src={c.text}
                            alt="GIF Reaction"
                            className="rounded-xl max-w-[200px] max-h-[140px] object-cover shadow-md my-1 border border-purple-500/40 hover:scale-105 transition shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <p className="font-semibold leading-relaxed">{c.text}</p>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Emoji Reaction Bar with Custom Reaction Support */}
              <div className="flex items-center gap-1.5 px-1 pt-1.5 border-t border-[var(--border-sunofy)]/50 flex-wrap">
                <span className="text-[9px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider mr-1 shrink-0">React:</span>
                {['🔥', '❤️', '👏', '😂', '🎉', '🚀', '💯', '⚡', '👑', '🤩'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      syncParty.sendEmojiReaction(emoji);
                      spawnFloatingEmoji(emoji, true);
                    }}
                    className="text-sm p-1 hover:scale-125 hover:bg-[var(--border-sunofy)] rounded-lg transition active:scale-95 cursor-pointer shrink-0"
                  >
                    {emoji}
                  </button>
                ))}

                {/* Custom Reaction Quick Input */}
                <div className="flex items-center space-x-1 ml-auto shrink-0 mt-0.5 sm:mt-0">
                  <input
                    type="text"
                    value={customReaction}
                    onChange={(e) => setCustomReaction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customReaction.trim()) {
                        syncParty.sendEmojiReaction(customReaction.trim());
                        setCustomReaction('');
                      }
                    }}
                    placeholder="Custom emoji..."
                    className="w-24 sm:w-28 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-lg px-2 py-0.5 text-[10px] text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
                  />
                  <button
                    onClick={() => {
                      if (customReaction.trim()) {
                        syncParty.sendEmojiReaction(customReaction.trim());
                        setCustomReaction('');
                      }
                    }}
                    className="px-2 py-0.5 bg-[var(--accent-sunofy)] text-black font-bold text-[10px] rounded-lg hover:scale-105 transition cursor-pointer"
                    title="Send Custom Reaction"
                  >
                    React
                  </button>
                </div>
              </div>

              {/* GIF Reaction Selector Drawer */}
              {showGifPicker && (
                <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-2 space-y-2 animate-fade shadow-xl">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Select GIF Reaction</span>
                    <button
                      onClick={() => setShowGifPicker(false)}
                      className="text-xs text-[var(--muted-sunofy)] hover:text-white cursor-pointer px-1"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Category Tags */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {Object.keys(GIF_CATEGORIES).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setActiveGifTag(tag)}
                        className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          activeGifTag === tag 
                            ? 'bg-[var(--accent-sunofy)] text-black shadow-md' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  {/* GIFs Grid */}
                  <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {GIF_CATEGORIES[activeGifTag as keyof typeof GIF_CATEGORIES]?.map((gif) => (
                      <button
                        key={gif.url}
                        onClick={() => {
                          syncParty.sendMessage(gif.url);
                          setShowGifPicker(false);
                        }}
                        className="relative rounded-xl overflow-hidden aspect-video border border-purple-500/30 hover:border-[var(--accent-sunofy)] hover:scale-105 transition cursor-pointer group bg-black/20"
                      >
                        <img src={gif.url} alt={gif.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.5 truncate group-hover:bg-purple-600/80">
                          {gif.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Bar */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={`px-2.5 py-2 rounded-xl border font-black text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    showGifPicker
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] text-purple-300 hover:text-white hover:bg-purple-600/20'
                  }`}
                  title="Attach Animated GIF Reaction"
                >
                  <span>🎞️</span>
                  <span>GIF</span>
                </button>
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
                {Array.from(new Map(syncState.members.map(m => [m.id, m])).values()).map((m: any) => (
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

          {/* TAB 7: Room Audio & Media Volume */}
          {activeTab === 'voice' && (
            <div className="space-y-3 animate-fade">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1">
                <span>Room Media Volume & Equalizer</span>
                <span className="text-[var(--accent-sunofy)] font-mono font-bold">
                  {musicVolume}%
                </span>
              </div>

              <div className="bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-4 space-y-4">
                <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-sunofy)]">
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-[var(--accent-sunofy)]" />
                      <span>Room Volume (Music & Video)</span>
                    </span>
                    <span className="text-[var(--accent-sunofy)] font-mono font-bold text-sm">{musicVolume}%</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, var(--accent-sunofy) 0%, var(--accent-sunofy) ${musicVolume}%, var(--border-sunofy) ${musicVolume}%, var(--border-sunofy) 100%)`
                    }}
                    className="w-full h-2 rounded-lg cursor-pointer accent-[var(--accent-sunofy)]"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {[100, 50, 0].map((v) => (
                      <button
                        key={v}
                        onClick={() => setMusicVolume(v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          musicVolume === v
                            ? 'bg-[var(--accent-sunofy)] text-black shadow'
                            : 'bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                        }`}
                      >
                        {v === 0 ? 'Mute' : `${v}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equalizer Quick Access Button */}
                <button
                  onClick={() => {
                    if (onOpenEqualizer) onOpenEqualizer();
                    else onShowToast('Equalizer opened');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600/40 transition cursor-pointer font-bold text-xs flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Configure Audio Equalizer & FX</span>
                </button>
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

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl w-full max-w-xs p-6 relative shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <LogOut className="w-8 h-8 text-red-400 ml-1" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Leave Party?</h3>
              <p className="text-xs text-[var(--muted-sunofy)]">
                Are you sure you want to exit the Sync Party and return to solo mode?
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--border-sunofy)] text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  syncParty.leaveRoom();
                  onShowToast('Exited party room.');
                  setShowLeaveConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-lg hover:bg-red-500 transition cursor-pointer border border-red-400"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
