import { SyncPartyState, Track } from '../types';

type SyncListener = (state: SyncPartyState) => void;

class SyncPartyManager {
  private state: SyncPartyState = {
    inRoom: false,
    roomCode: 'SUNO-8492',
    isHost: false,
    currentTrack: {
      id: 'mock_1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      duration: 200,
      downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    isPlaying: true,
    currentTime: 84,
    duration: 200,
    queue: [
      {
        id: '1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
        duration: 200,
      },
      {
        id: '2',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: 215,
      },
      {
        id: '3',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop',
        duration: 215,
      },
    ],
    members: [
      { id: 'u1', name: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', isHost: true, pingMs: 12 },
      { id: 'u2', name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', isHost: false, pingMs: 18 },
      { id: 'u3', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', isHost: false, pingMs: 24 },
      { id: 'u4', name: 'Rahul', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', isHost: false, pingMs: 15 },
    ],
    chat: [
      { id: 'c1', sender: 'System', text: 'Room created. Share code to invite listeners!', time: '10:00 PM', isSystem: true },
      { id: 'c2', sender: 'Alex', text: 'Loving this track! 🔥', time: '10:01 PM', isSystem: false },
      { id: 'c3', sender: 'Sarah', text: 'Can we queue Levitating next?', time: '10:02 PM', isSystem: false },
    ],
  };

  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;

  constructor() {
    this.startPlaybackTicker();
  }

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  getState(): SyncPartyState {
    return this.state;
  }

  private startPlaybackTicker() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.state.inRoom && this.state.isPlaying) {
        this.state.currentTime += 1;
        if (this.state.currentTime >= this.state.duration) {
          this.nextTrackInQueue();
        } else {
          this.notify();
        }
      }
    }, 1000);
  }

  createRoom(roomCode?: string) {
    const code = roomCode || 'SUNO-' + Math.floor(1000 + Math.random() * 9000);
    this.state = {
      ...this.state,
      inRoom: true,
      roomCode: code,
      isHost: true,
      isPlaying: true,
      currentTime: 0,
      chat: [
        { id: 'sys_' + Date.now(), sender: 'System', text: `Room #${code} active. You are the host!`, time: this.getTimeStr(), isSystem: true },
      ],
    };
    this.notify();
    this.syncWithBackend();
  }

  joinRoom(code: string) {
    const cleanCode = code.trim().toUpperCase();
    this.state = {
      ...this.state,
      inRoom: true,
      roomCode: cleanCode,
      isHost: false,
      isPlaying: true,
      chat: [
        ...this.state.chat,
        { id: 'sys_' + Date.now(), sender: 'System', text: `Joined Room #${cleanCode}`, time: this.getTimeStr(), isSystem: true },
      ],
    };
    this.notify();
    this.fetchRoomFromBackend(cleanCode);
  }

  leaveRoom() {
    this.state.inRoom = false;
    this.state.isPlaying = false;
    this.notify();
  }

  togglePlayPause() {
    this.state.isPlaying = !this.state.isPlaying;
    this.notify();
    this.syncWithBackend();
  }

  seek(seconds: number) {
    this.state.currentTime = Math.max(0, Math.min(seconds, this.state.duration));
    this.notify();
    this.syncWithBackend();
  }

  addTrackToQueue(track: Track, requesterName: string = 'You') {
    const queueItem = { ...track, artist: `${track.artist} (Req by ${requesterName})` };
    this.state.queue.push(queueItem);
    this.state.chat.push({
      id: 'c_' + Date.now(),
      sender: 'System',
      text: `${requesterName} queued "${track.title}"`,
      time: this.getTimeStr(),
      isSystem: true,
    });
    this.notify();
    this.syncWithBackend();
  }

  removeTrackFromQueue(index: number) {
    if (index >= 0 && index < this.state.queue.length) {
      this.state.queue.splice(index, 1);
      this.notify();
      this.syncWithBackend();
    }
  }

  nextTrackInQueue() {
    if (this.state.queue.length > 1) {
      this.state.queue.shift();
      const next = this.state.queue[0];
      this.state.currentTrack = next;
      this.state.currentTime = 0;
      this.state.duration = next.duration || 200;
      this.state.isPlaying = true;
    } else {
      this.state.currentTime = 0;
    }
    this.notify();
    this.syncWithBackend();
  }

  prevTrack() {
    this.state.currentTime = 0;
    this.notify();
  }

  sendMessage(text: string, sender: string = 'You') {
    if (!text.trim()) return;
    this.state.chat.push({
      id: 'msg_' + Date.now(),
      sender,
      text: text.trim(),
      time: this.getTimeStr(),
      isSystem: false,
    });
    this.notify();
    this.syncWithBackend();
  }

  kickMember(memberId: string) {
    if (!this.state.isHost) return;
    const member = this.state.members.find((m) => m.id === memberId);
    if (member) {
      this.state.members = this.state.members.filter((m) => m.id !== memberId);
      this.state.chat.push({
        id: 'sys_' + Date.now(),
        sender: 'System',
        text: `${member.name} was removed from the room by Host.`,
        time: this.getTimeStr(),
        isSystem: true,
      });
      this.notify();
      this.syncWithBackend();
    }
  }

  private getTimeStr(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private async syncWithBackend() {
    try {
      await fetch('/api/sync/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: this.state.roomCode,
          state: this.state,
        }),
      });
    } catch (e) {
      // Offline mode silent handling
    }
  }

  private async fetchRoomFromBackend(roomCode: string) {
    try {
      const res = await fetch(`/api/sync/rooms?code=${encodeURIComponent(roomCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.state) {
          this.state = {
            ...data.state,
            inRoom: true,
            roomCode,
            isHost: this.state.isHost,
          };
          this.notify();
        }
      }
    } catch (e) {
      // Offline mode
    }
  }
}

export const syncParty = new SyncPartyManager();
