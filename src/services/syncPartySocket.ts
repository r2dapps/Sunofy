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
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.leaveRoom();
        sessionStorage.removeItem('sunofy_party_code');
        sessionStorage.removeItem('sunofy_is_host');
        localStorage.removeItem('sunofy_party_code');
        localStorage.removeItem('sunofy_is_host');
      });
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.localChannel = new BroadcastChannel('sunofy_vibesync_channel');
        this.localChannel.onmessage = (event) => {
          const data = event.data;
          if (!data || data.roomId !== this.state.roomCode) return;
          
          if (data.type === 'STATE_SYNC' && !this.state.isHost) {
             this.state.currentTrack = data.state.currentTrack;
             this.state.currentTime = data.state.currentTime;
             this.state.isPlaying = data.state.isPlaying;
             this.notify();
          }
        };
      }
    } catch (e) {}
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

    const profileStr = typeof localStorage !== 'undefined' ? localStorage.getItem('sunofy_user_profile') : null;
    let hostName = 'Host';
    let hostAvatar = '👑';
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        if (parsed.username) hostName = parsed.username;
        if (parsed.avatarIcon) hostAvatar = parsed.avatarIcon;
      } catch(e) {}
    }

    const hostProfile = {
      id: this.myPeerId,
      name: hostName,
      avatarIcon: hostAvatar,
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

    // Listen to queue changes
    onValue(ref(db, `sunofy_vibe_rooms/${code}/queue`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.state.queue = Object.values(data);
        this.notify();
      }
    });

    // Listen to requests
    onValue(ref(db, `sunofy_vibe_rooms/${code}/requests`), (snapshot) => {
       const data = snapshot.val();
       if (data) {
         this.state.requests = Object.values(data);
         this.notify();
       } else {
         this.state.requests = [];
         this.notify();
       }
    });

    this.notify();
  }

  joinRoom(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    this.myPeerId = `member_${Date.now()}`;
    
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
        
        const profileStr = typeof localStorage !== 'undefined' ? localStorage.getItem('sunofy_user_profile') : null;
        let userName = 'Listener';
        let userAvatar = '🎧';
        if (profileStr) {
          try {
            const parsed = JSON.parse(profileStr);
            if (parsed.username) userName = parsed.username;
            if (parsed.avatarIcon) userAvatar = parsed.avatarIcon;
          } catch(e) {}
        }

        const memberInfo = {
          id: this.myPeerId,
          name: userName,
          avatarIcon: userAvatar,
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
            this.state.duration = stateData.duration || (stateData.track ? stateData.track.duration : 0);
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

        // Listen to room closure
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/closed`), (snap) => {
          if (snap.val() === true) {
            this.leaveRoom();
            alert("The Host has ended the party room.");
          }
        });

        // Listen to member kick status
        if (this.myMemberRef) {
          onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/members/${this.myPeerId}/kicked`), (snap) => {
            if (snap.val() === true) {
              this.leaveRoom();
              alert("You were removed from the room by the Host.");
            }
          });
        }

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
      update(this.roomRef, { closed: true, roomActive: false });
    }
    
    localStorage.removeItem('sunofy_sync_room_code');
    localStorage.removeItem('sunofy_sync_is_host');
    sessionStorage.removeItem('sunofy_sync_room_code');

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

  get myId(): string {
    return this.myPeerId;
  }
  
  private lastBroadcastTime = 0;

  syncAudioState(currentTime: number, isPlaying: boolean, force = false, duration?: number) {
    if (!this.state.isHost) return;
    this.state.currentTime = currentTime;
    this.state.isPlaying = isPlaying;
    if (duration && duration > 0) this.state.duration = duration;

    const now = Date.now();
    if (force || now - this.lastBroadcastTime > 2000) {
      this.lastBroadcastTime = now;
      this.broadcastState();
    }
  }

  private broadcastState() {
    if (!this.state.inRoom || !this.state.isHost) return;
    const stateData = {
      track: this.state.currentTrack,
      isPlaying: this.state.isPlaying,
      currentTime: this.state.currentTime,
      duration: this.state.duration || (this.state.currentTrack?.duration || 0),
      timestamp: Date.now()
    };
    
    // Clean any undefined properties for Firebase Realtime Database compatibility
    const cleanState = JSON.parse(JSON.stringify(stateData));
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/state`), cleanState);

    // Also broadcast over local BroadcastChannel if active
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'STATE_SYNC',
        roomId: this.state.roomCode,
        state: cleanState
      });
    }
  }

  addTrackToQueue(track: Track, requesterName: string = 'You') {
    if (!this.state.inRoom) return;

    // Check for duplicate queuing (by id or title) to prevent duplicate track spamming
    const isAlreadyInQueue = this.state.queue.some(t => t.id === track.id || t.title === track.title);
    if (isAlreadyInQueue) {
      return;
    }
    
    if (!this.state.isHost) {
      // Non-host sends song request to host for approval
      const reqRef = push(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/requests`));
      const cleanTrack = JSON.parse(JSON.stringify(track));
      set(reqRef, {
        id: reqRef.key,
        track: cleanTrack,
        requesterName: requesterName || `Member #${this.myPeerId.slice(-4)}`,
        timestamp: Date.now()
      });
      this.sendMessage(`Requested "${track.title}" (Waiting for Host approval)`);
      return;
    }

    const queueItem = { ...track, artist: `${track.artist} (Req by ${requesterName})` };
    this.state.queue.push(queueItem);

    // If no track is currently playing, start playing this track immediately!
    if (!this.state.currentTrack) {
      this.state.currentTrack = queueItem;
      this.state.currentTime = 0;
      this.state.duration = queueItem.duration || 200;
      this.state.isPlaying = true;
      this.broadcastState();
    }
    
    const cleanQueue = JSON.parse(JSON.stringify(this.state.queue));
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), cleanQueue);
    this.notify();
  }

  acceptSongRequest(requestId: string, track: Track, requesterName: string) {
    if (!this.state.isHost) return;
    this.addTrackToQueue(track, requesterName);
    remove(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/requests/${requestId}`));
  }

  declineSongRequest(requestId: string) {
    if (!this.state.isHost) return;
    remove(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/requests/${requestId}`));
  }

  removeTrackFromQueue(index: number) {
    if (!this.state.isHost || index < 0 || index >= this.state.queue.length) return;
    
    this.state.queue.splice(index, 1);
    
    if (index === 0) {
      if (this.state.queue.length > 0) {
        this.state.currentTrack = this.state.queue[0];
        this.state.currentTime = 0;
      } else {
        this.state.currentTrack = null;
        this.state.isPlaying = false;
      }
      this.broadcastState();
    }
    
    const cleanQueue = JSON.parse(JSON.stringify(this.state.queue));
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), cleanQueue);
    this.notify();
  }

  playQueueTrack(index: number) {
    if (!this.state.isHost || index < 0 || index >= this.state.queue.length) return;
    
    const selected = this.state.queue[index];
    this.state.queue.splice(index, 1);
    this.state.queue.unshift(selected);
    this.state.currentTrack = selected;
    this.state.currentTime = 0;
    this.state.isPlaying = true;
    
    this.broadcastState();
    const cleanQueue = JSON.parse(JSON.stringify(this.state.queue));
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), cleanQueue);
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
    this.state.currentTime = Math.max(0, Math.min(seconds, this.state.duration || 9999));
    this.broadcastState();
    this.notify();
  }

  nextTrackInQueue() {
    if (!this.state.isHost) return;
    if (this.state.queue.length > 1) {
      this.state.queue.shift();
      this.state.currentTrack = this.state.queue[0];
      this.state.currentTime = 0;
      this.broadcastState();
    } else {
      this.state.queue = [];
      this.state.currentTrack = null;
      this.state.isPlaying = false;
      this.broadcastState();
    }
    const cleanQueue = JSON.parse(JSON.stringify(this.state.queue));
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/queue`), cleanQueue);
    this.notify();
  }

  prevTrack() {
    if (!this.state.isHost) return;
    this.state.currentTime = 0;
    this.broadcastState();
    this.notify();
  }

  sendMessage(text: string, customSender?: string) {
    if (!this.state.inRoom) return;
    
    const profileStr = typeof localStorage !== 'undefined' ? localStorage.getItem('sunofy_user_profile') : null;
    let senderName = customSender || (this.state.isHost ? 'Host' : `Member #${this.myPeerId.slice(-4)}`);
    let senderAvatarIcon = this.state.isHost ? '👑' : '🎧';
    
    if (profileStr && !customSender) {
      try {
        const parsed = JSON.parse(profileStr);
        if (parsed.username) senderName = parsed.username;
        if (parsed.avatarIcon) senderAvatarIcon = parsed.avatarIcon;
      } catch(e) {}
    }
    
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: this.myPeerId,
      sender: senderName,
      avatarIcon: senderAvatarIcon,
      text: text.trim(),
      time: this.getTimeStr(),
      isSystem: customSender === 'System',
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
