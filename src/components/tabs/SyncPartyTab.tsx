import React, { useState } from 'react';
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
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SyncPartyState, Track, Playlist, Favorites } from '../../types';
import { syncParty } from '../../services/syncPartySocket';
import { musicApi } from '../../services/api';

const spawnFloatingEmoji = (emoji: string) => {
  const container = document.body;
  const el = document.createElement('div');
  el.innerText = emoji;
  el.className = 'fixed bottom-24 z-[9999] text-4xl pointer-events-none select-none transition-all duration-1000 ease-out animate-fade';
  
  // Random horizontal position
  const randomX = Math.floor(Math.random() * 60) + 20;
  el.style.left = `${randomX}%`;
  el.style.transform = `translateY(0px) scale(0.8)`;
  el.style.opacity = '1';

  container.appendChild(el);

  // Force reflow
  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.transform = `translateY(-260px) scale(1.6)`;
    el.style.opacity = '0';
  });

  setTimeout(() => {
    el.remove();
  }, 1100);
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

  // Ref to track last chat count for triggering floating emoji sync reactions
  const lastMessageCountRef = React.useRef(syncState.chat.length);

  React.useEffect(() => {
    if (syncState.chat.length > lastMessageCountRef.current) {
      const newMessages = syncState.chat.slice(lastMessageCountRef.current);
      newMessages.forEach((msg) => {
        if (!msg.isSystem && ['🔥', '❤️', '👏', '😂', '🎉', '🚀'].includes(msg.text)) {
          spawnFloatingEmoji(msg.text);
        }
      });
    }
    lastMessageCountRef.current = syncState.chat.length;
  }, [syncState.chat]);

  // Active sub-tab inside the unified Sync Party card
  const [activeTab, setActiveTab] = useState<'queue' | 'add_music' | 'chat' | 'members'>('queue');
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCreateRoom = () => {
    syncParty.createRoom();
    onShowToast('Sync Party room created!');
  };

  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) {
      onShowToast('Please enter a room code');
      return;
    }
    syncParty.joinRoom(joinCodeInput.trim());
    onShowToast(`Joined room ${joinCodeInput.trim().toUpperCase()}`);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(syncState.roomCode);
    onShowToast(`Room code #${syncState.roomCode} copied!`);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sunofy Sync Party',
        text: `Listen synchronously with me on Sunofy! Room #${syncState.roomCode}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyCode();
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
  const curTrack = syncState.currentTrack;

  return (
    <div className="space-y-3 animate-fade pb-6 text-[var(--text-sunofy)] select-none">
      {/* Top Room Banner Bar with Exit to Solo Mode button */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3 flex items-center justify-between shadow-xl sticky top-0 z-20 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/30 flex items-center justify-center text-[var(--accent-sunofy)]">
            <Radio className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-sunofy)]">
              <span className="truncate">Sync Room</span>
              <span className="text-[9px] bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] px-1.5 py-0.5 rounded-full border border-[var(--accent-sunofy)]/40 font-mono font-bold uppercase">
                {syncState.isHost ? 'HOST' : 'LISTENER'}
              </span>
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

        {/* Action Icons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="w-8 h-8 rounded-xl bg-[var(--border-sunofy)] flex items-center justify-center text-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer"
            title="Show Room QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareLink}
            className="w-8 h-8 rounded-xl bg-[var(--border-sunofy)] flex items-center justify-center text-[var(--text-sunofy)] hover:bg-[var(--accent-sunofy)] hover:text-black transition cursor-pointer"
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
            <span>Exit Room</span>
          </button>
        </div>
      </div>

      {/* Non-collapsible Live Audio Stage */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--border-sunofy)] pb-2">
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-[var(--accent-sunofy)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-sunofy)]">Live Audio Stage</span>
          </div>
          <div className="flex items-center gap-2">
            <LiveAudioWave isPlaying={syncState.isPlaying} />
            <span className="text-[9px] bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] px-2 py-0.5 rounded-full font-mono font-bold uppercase border border-[var(--accent-sunofy)]/30">
              {syncState.isPlaying ? 'SYNC PLAYING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {curTrack ? (
          <>
            <div className="flex items-center space-x-3">
              <img
                src={curTrack.image}
                alt={curTrack.title}
                className={`w-12 h-12 rounded-xl object-cover border border-[var(--border-sunofy)] spinning-art ${
                  syncState.isPlaying ? 'playing shadow-[0_0_15px_var(--accent-sunofy)]' : ''
                }`}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold truncate text-[var(--text-sunofy)]">{curTrack.title}</h4>
                <p className="text-[10px] text-[var(--muted-sunofy)] truncate">{curTrack.artist}</p>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => syncParty.prevTrack()}
                  className="p-1.5 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                  title="Previous"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => syncParty.togglePlayPause()}
                  className="w-9 h-9 rounded-full bg-[var(--accent-sunofy)] text-black flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
                  title={syncState.isPlaying ? 'Pause' : 'Play'}
                >
                  {syncState.isPlaying ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => syncParty.nextTrackInQueue()}
                  className="p-1.5 text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
                  title="Next"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 text-[10px] text-[var(--muted-sunofy)]">
              <span>{formatTime(syncState.currentTime)}</span>
              <div
                className="flex-1 h-1.5 bg-[var(--border-sunofy)] rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  syncParty.seek(pos * syncState.duration);
                }}
              >
                <div
                  className="bg-[var(--accent-sunofy)] h-full transition-all"
                  style={{
                    width: `${syncState.duration > 0 ? (syncState.currentTime / syncState.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span>{formatTime(syncState.duration)}</span>
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Music className="w-8 h-8 text-[var(--border-sunofy)] mx-auto animate-bounce" />
            <p className="text-xs text-[var(--muted-sunofy)]">No track currently playing in party room.</p>
          </div>
        )}
      </div>

      {/* Unified Single Card with Sub-Tabs for Queue, Add Music, Chat, and Members */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Tab Header Bar */}
        <div className="bg-[var(--bg-sunofy)] border-b border-[var(--border-sunofy)] p-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'queue' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'
              }`}
            >
              {syncState.queue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('add_music')}
            className={`flex-1 min-w-[85px] py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'add_music'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Music</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 min-w-[65px] py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'chat' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'
              }`}
            >
              {syncState.chat.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 min-w-[80px] py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[var(--accent-sunofy)] text-black shadow-md'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--border-sunofy)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'members' ? 'bg-black/20 text-black' : 'bg-[var(--border-sunofy)] text-[var(--muted-sunofy)]'
              }`}
            >
              {syncState.members.length}
            </span>
          </button>
        </div>

        {/* Tab Body View */}
        <div className="p-3.5 space-y-3 min-h-[240px]">
          {/* TAB 1: Party Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-2 animate-fade">
              <div className="flex items-center justify-between text-xs text-[var(--muted-sunofy)] px-1 pb-1">
                <button
                  onClick={() => setIsQueueCollapsed(!isQueueCollapsed)}
                  className="flex items-center space-x-1.5 font-semibold uppercase tracking-wider text-[10px] text-[var(--text-sunofy)] hover:text-[var(--accent-sunofy)] cursor-pointer"
                >
                  {isQueueCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" /> : <ChevronUp className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" />}
                  <span>Party Playlist ({syncState.queue.length})</span>
                  <span className="text-[9px] text-[var(--muted-sunofy)] font-normal lowercase">({isQueueCollapsed ? 'collapsed' : 'expanded'})</span>
                </button>

                {syncState.queue.length > 0 && (
                  <button
                    onClick={() => setActiveTab('add_music')}
                    className="text-[10px] text-[var(--accent-sunofy)] hover:underline cursor-pointer font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Songs</span>
                  </button>
                )}
              </div>

              {!isQueueCollapsed && (
                <>
                  {syncState.queue.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <ListMusic className="w-8 h-8 text-[var(--border-sunofy)] mx-auto" />
                      <p className="text-xs text-[var(--muted-sunofy)]">Party queue is currently empty.</p>
                      <button
                        onClick={() => setActiveTab('add_music')}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--accent-sunofy)] text-black text-xs font-bold shadow hover:scale-105 transition cursor-pointer"
                      >
                        + Add Songs to Queue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                      {syncState.queue.map((song, idx) => (
                        <div
                          key={song.id + '_' + idx}
                          className={`flex items-center justify-between p-2 rounded-xl border transition ${
                            idx === 0
                              ? 'bg-[var(--accent-sunofy)]/10 border-[var(--accent-sunofy)]/40 shadow-sm'
                              : 'bg-[var(--bg-sunofy)] border-[var(--border-sunofy)] hover:border-[var(--hover-sunofy)]'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="relative">
                              <img src={song.image} alt={song.title} className="w-8 h-8 rounded-lg object-cover" />
                              {idx === 0 && (
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                  <span className="w-2 h-2 rounded-full bg-[var(--accent-sunofy)] animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <h5 className="text-xs font-semibold truncate text-[var(--text-sunofy)]">{song.title}</h5>
                                {idx === 0 && (
                                  <span className="text-[9px] bg-[var(--accent-sunofy)] text-black font-bold px-1.5 py-0.2 rounded-full uppercase">
                                    PLAYING
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--muted-sunofy)] truncate">{song.artist}</p>
                            </div>
                          </div>

                          {idx !== 0 && (
                            <button
                              onClick={() => {
                                syncParty.removeTrackFromQueue(idx);
                                onShowToast(`Removed "${song.title}" from queue`);
                              }}
                              className="p-1.5 text-[var(--muted-sunofy)] hover:text-red-400 transition cursor-pointer"
                              title="Remove Track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: Add Music (Search & Import) */}
          {activeTab === 'add_music' && (
            <div className="space-y-3 animate-fade">
              {/* Search Box */}
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

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto border-b border-[var(--border-sunofy)] pb-2">
                  <p className="text-[10px] font-bold text-[var(--accent-sunofy)] uppercase tracking-wider px-1">
                    Search Results
                  </p>
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
                          onShowToast(`Added "${s.title}" to Party Queue!`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Import from Playlists or Favorites */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider px-1 block">
                  Import From My Library
                </span>

                {playlists.length === 0 && (!favorites?.songs || favorites.songs.length === 0) ? (
                  <p className="text-xs text-[var(--muted-sunofy)] py-2 text-center">
                    No saved playlists or favorites available to import.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {/* Favorites Quick Import */}
                    {favorites?.songs && favorites.songs.length > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                            <Heart className="w-3.5 h-3.5 fill-pink-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">Liked Favorite Songs</p>
                            <p className="text-[10px] text-[var(--muted-sunofy)]">{favorites.songs.length} Tracks</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            favorites.songs.forEach((song) => {
                              syncParty.addTrackToQueue(song, syncState.isHost ? 'Host' : 'Member');
                            });
                            onShowToast(`Imported ${favorites.songs.length} favorite songs into Party!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Import All</span>
                        </button>
                      </div>
                    )}

                    {/* Saved Playlists Import */}
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)]"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] flex items-center justify-center">
                            <Music2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-sunofy)] truncate">{pl.name}</p>
                            <p className="text-[10px] text-[var(--muted-sunofy)]">{pl.songs.length} Tracks</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportPlaylistToParty(pl)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent-sunofy)] text-black font-bold text-[10px] flex items-center space-x-1 hover:scale-105 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Import</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Room Chat */}
          {activeTab === 'chat' && (
            <div className="space-y-2 animate-fade flex flex-col h-[240px]">
              {/* Message List */}
              <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                {syncState.chat.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--muted-sunofy)]">No messages yet. Say hi to the room!</div>
                ) : (
                  syncState.chat.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2 rounded-xl text-xs ${
                        c.isSystem
                          ? 'text-[10px] text-[var(--muted-sunofy)] text-center py-0.5 font-medium'
                          : c.sender === 'You'
                          ? 'bg-[var(--accent-sunofy)]/20 border border-[var(--accent-sunofy)]/30 text-[var(--text-sunofy)] ml-auto max-w-[85%]'
                          : 'bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--text-sunofy)] max-w-[85%]'
                      }`}
                    >
                      {!c.isSystem && c.sender !== 'You' && (
                        <p className="text-[9px] text-[var(--accent-sunofy)] font-bold mb-0.5">{c.sender}</p>
                      )}
                      <p>{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Emoji Reaction Bar */}
              <div className="flex items-center gap-1.5 px-1 pt-1.5 border-t border-[var(--border-sunofy)]/50">
                <span className="text-[9px] font-bold text-[var(--muted-sunofy)] uppercase tracking-wider mr-1">React:</span>
                {['🔥', '❤️', '👏', '😂', '🎉', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      syncParty.sendMessage(emoji);
                      spawnFloatingEmoji(emoji);
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
                <span className="text-emerald-400">Live Sync</span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {syncState.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover border border-[var(--border-sunofy)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--text-sunofy)] truncate block">{m.name}</span>
                        <span className="text-[9px] text-[var(--muted-sunofy)]">{m.id === 'u1' ? 'Host' : 'Listener'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                        🟢 {m.pingMs || 15}ms
                      </span>
                      {syncState.isHost && m.id !== 'u1' && (
                        <button
                          onClick={() => syncParty.kickMember(m.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Kick Listener"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
