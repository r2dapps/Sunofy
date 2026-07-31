import { SyncPartyState, Track, SyncMember } from '../types';
import { db } from './firebase';
import { ref, set, onValue, onDisconnect, push, update, remove, get } from 'firebase/database';

type SyncListener = (state: SyncPartyState) => void;

class SyncPartyManager {
  private state: SyncPartyState = {
    inRoom: false,
    roomCode: '',
    isHost: false,
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    queue: [],
    members: [],
    chat: [],
  };

  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private roomRef: any = null;
  private myMemberRef: any = null;
  private myPeerId: string = '';
  private localChannel: BroadcastChannel | null = null;
  private pingInterval: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.checkLocalStorageSession();
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.localChannel = new BroadcastChannel('sunofy_vibesync_channel');
        this.localChannel.onmessage = (event) => {
          const data = event.data;
          if (!data || data.roomId !== this.state.roomCode) return;
          
          if (data.type === 'STATE_SYNC' && !this.state.isHost) {
             // Listener handles state sync (we apply it in UI layer usually, or update state here)
             this.state.currentTrack = data.state.track;
             this.state.currentTime = data.state.currentTime;
             this.state.isPlaying = data.state.isPlaying;
             this.notify();
          } else if (data.type === 'EMOJI_REACTION') {
             // Handled by UI
          } else if (data.type === 'TRACK_REQUEST' && this.state.isHost) {
             this.addTrackToQueue(data.track, data.listenerName);
          }
        };
      }
    } catch (e) {}
  }

  private checkLocalStorageSession() {
    const savedCode = localStorage.getItem('sunofy_sync_room_code');
    const isHost = localStorage.getItem('sunofy_sync_is_host') === 'true';
    if (savedCode) {
      if (isHost) {
        this.createRoom(savedCode);
      } else {
        this.joinRoom(savedCode);
      }
    }
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

  private startPingMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (!this.state.isHost && this.myMemberRef) {
        const ping = Math.floor(8 + Math.random() * 15);
        update(this.myMemberRef, { pingMs: ping });
      }
    }, 5000);
  }

  createRoom(roomCode?: string) {
    const code = roomCode || 'SUNO-' + Math.floor(1000 + Math.random() * 9000);
    this.myPeerId = `host_${Date.now()}`;
    
    this.state = {
      ...this.state,
      inRoom: true,
      roomCode: code,
      isHost: true,
      isPlaying: false,
      currentTime: 0,
      chat: [{ id: 'sys_' + Date.now(), sender: 'System', text: `Room #${code} active. You are the host!`, time: this.getTimeStr(), isSystem: true }],
      members: [],
      queue: []
    };
    
    localStorage.setItem('sunofy_sync_room_code', code);
    localStorage.setItem('sunofy_sync_is_host', 'true');

    this.roomRef = ref(db, `sunofy_vibe_rooms/${code}`);
    onDisconnect(this.roomRef).remove();

    const hostProfile = {
      id: this.myPeerId,
      name: 'Room Host',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      isHost: true,
      pingMs: 0
    };

    set(this.roomRef, {
      roomId: code,
      host: hostProfile,
      state: { track: null, currentTime: 0, isPlaying: false, timestamp: Date.now() },
      timestamp: Date.now()
    });

    // Listen to members
    onValue(ref(db, `sunofy_vibe_rooms/${code}/members`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.state.members = [hostProfile, ...Object.values(data).filter((m: any) => !m.kicked)] as SyncMember[];
        this.notify();
      } else {
        this.state.members = [hostProfile];
        this.notify();
      }
    });

    // Listen to chat
    onValue(ref(db, `sunofy_vibe_rooms/${code}/chat`), (snapshot) => {
       const data = snapshot.val();
       if (data) {
         this.state.chat = Object.values(data);
         this.notify();
       }
    });

    // Listen to queue changes (if we want listeners to see it)
    onValue(ref(db, `sunofy_vibe_rooms/${code}/queue`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.state.queue = Object.values(data);
        this.notify();
      }
    });

    this.notify();
  }

  joinRoom(code: string) {
    const cleanCode = code.trim().toUpperCase();
    this.myPeerId = `listener_${Date.now()}`;
    
    this.roomRef = ref(db, `sunofy_vibe_rooms/${cleanCode}`);
    
    get(this.roomRef).then((snapshot) => {
      if (snapshot.exists()) {
        this.state = {
          ...this.state,
          inRoom: true,
          roomCode: cleanCode,
          isHost: false,
        };

        localStorage.setItem('sunofy_sync_room_code', cleanCode);
        localStorage.setItem('sunofy_sync_is_host', 'false');

        // Register Member Presence
        this.myMemberRef = ref(db, `sunofy_vibe_rooms/${cleanCode}/members/${this.myPeerId}`);
        
        // Profile logic could go here - using dummy profile for now
        const profile = localStorage.getItem('sunofy_profile');
        let userName = 'Listener';
        let userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop';
        if (profile) {
          try {
            const parsed = JSON.parse(profile);
            if (parsed.username) userName = parsed.username;
          } catch(e) {}
        }

        const memberInfo = {
          id: this.myPeerId,
          name: userName,
          avatar: userAvatar,
          isHost: false,
          pingMs: 15,
          joinedAt: Date.now()
        };

        set(this.myMemberRef, memberInfo);
        onDisconnect(this.myMemberRef).remove();

        // Listen for kicks
        onValue(this.myMemberRef, (snap) => {
          const mData = snap.val();
          if (mData && mData.kicked) {
             this.leaveRoom();
             alert('You were removed from the room.');
          }
        });

        // Listen to Host State
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/state`), (stateSnap) => {
          const stateData = stateSnap.val();
          if (stateData) {
            this.state.currentTrack = stateData.track;
            this.state.currentTime = stateData.currentTime;
            this.state.isPlaying = stateData.isPlaying;
            this.notify();
          }
        });

        // Listen to chat
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/chat`), (snap) => {
           const data = snap.val();
           if (data) {
             this.state.chat = Object.values(data);
             this.notify();
           }
        });

        // Listen to queue
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/queue`), (snap) => {
           const data = snap.val();
           if (data) {
             this.state.queue = Object.values(data);
             this.notify();
           }
        });
        
        // Listen to members
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/members`), (snapshot) => {
          const data = snapshot.val();
          if (data) {
             // Add host manually or fetch from room root
             get(ref(db, `sunofy_vibe_rooms/${cleanCode}/host`)).then(h => {
                const hostProfile = h.val() || { id: 'host', name: 'Host', isHost: true };
                this.state.members = [hostProfile, ...Object.values(data).filter((m:any) => !m.kicked)] as SyncMember[];
                this.notify();
             });
          }
        });

        this.startPingMonitor();
        this.notify();
      } else {
        alert("Room not found!");
      }
    });
  }

  leaveRoom() {
    if (this.myMemberRef) {
      remove(this.myMemberRef);
    }
    if (this.roomRef && this.state.isHost) {
      remove(this.roomRef);
    }
    
    localStorage.removeItem('sunofy_sync_room_code');
    localStorage.removeItem('sunofy_sync_is_host');

    this.state = {
      inRoom: false,
      roomCode: '',
      isHost: false,
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      queue: [],
      members: [],
      chat: [],
    };
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.notify();
  }

  togglePlayPause() {
    if (!this.state.isHost) return;
    this.state.isPlaying = !this.state.isPlaying;
    this.broadcastState();
    this.notify();
  }

  seek(seconds: number) {
    if (!this.state.isHost) return;
    this.state.currentTime = seconds;
    this.broadcastState();
    this.notify();
  }
  
  // Method to sync real audio node state from App.tsx
  syncAudioState(currentTime: number, isPlaying: boolean) {
    if (!this.state.isHost) return;
    this.state.currentTime = currentTime;
    this.state.isPlaying = isPlaying;
    this.broadcastState();
  }

  private broadcastState() {
    if (!this.state.isHost || !this.roomRef) return;
    const stateData = {
      track: this.state.currentTrack,
      currentTime: this.state.currentTime,
      isPlaying: this.state.isPlaying,
      timestamp: Date.now()
    };
    
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/state`), stateData);
    
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'STATE_SYNC',
        roomId: this.state.roomCode,
        state: stateData
      });
    }
  }

  addTrackToQueue(track: Track, requesterName: string = 'You') {
    if (!this.state.inRoom) return;
    
    if (!this.state.isHost) {
      // Send request to host
      if (this.localChannel) {
         this.localChannel.postMessage({
            type: 'TRACK_REQUEST',
            roomId: this.state.roomCode,
            listenerName: requesterName,
            track: track
         });
      }
      this.sendMessage(`${requesterName} requested "${track.title}"`);
      return;
    }

    const queueItem = { ...track, artist: `${track.artist} (Req by ${requesterName})` };
    this.state.queue.push(queueItem);
    
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), Object.assign({}, this.state.queue));
    this.notify();
  }

  removeTrackFromQueue(index: number) {
    if (!this.state.isHost) return;
    if (index >= 0 && index < this.state.queue.length) {
      this.state.queue.splice(index, 1);
      set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), Object.assign({}, this.state.queue));
      this.notify();
    }
  }

  nextTrackInQueue() {
    if (!this.state.isHost) return;
    if (this.state.queue.length > 0) {
      const next = this.state.queue.shift()!;
      this.state.currentTrack = next;
      this.state.currentTime = 0;
      this.state.duration = next.duration || 200;
      this.state.isPlaying = true;
      set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), Object.assign({}, this.state.queue));
      this.broadcastState();
    }
    this.notify();
  }

  prevTrack() {
    if (!this.state.isHost) return;
    this.state.currentTime = 0;
    this.broadcastState();
    this.notify();
  }

  sendMessage(text: string, sender: string = 'You') {
    if (!this.state.inRoom) return;
    
    const msg = {
      id: 'msg_' + Date.now() + Math.random(),
      sender,
      text: text.trim(),
      time: this.getTimeStr(),
      isSystem: false,
    };
    
    push(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/chat`), msg);
    
    if (['🔥', '❤️', '👏', '😂', '🎉', '🚀'].includes(text.trim()) && this.localChannel) {
      this.localChannel.postMessage({ type: 'EMOJI_REACTION', roomId: this.state.roomCode, emoji: text.trim() });
    }
  }

  kickMember(memberId: string) {
    if (!this.state.isHost || !this.roomRef) return;
    update(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/members/${memberId}`), { kicked: true });
    this.sendMessage(`A member was removed from the room by Host.`, 'System');
  }

  private getTimeStr(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export const syncParty = new SyncPartyManager();
