import { SyncPartyState, Track, SyncMember } from '../types';
import { db } from './firebase';
import { ref, set, onValue, onChildAdded, onDisconnect, push, update, remove, get } from 'firebase/database';

export const WEBRTC_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

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
    allowMemberMics: true,
  };

  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private roomRef: any = null;
  private myMemberRef: any = null;
  private myPeerId: string = '';
  private localChannel: BroadcastChannel | null = null;
  private pingInterval: any = null;

  // Continuous WebRTC Audio Engine
  private peerConnections: Record<string, RTCPeerConnection> = {};
  private localAudioStream: MediaStream | null = null;
  private remoteAudioElements: Record<string, HTMLAudioElement> = {};
  private signalUnsubscribes: (() => void)[] = [];

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

  private notifyToast(msg: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sunofyToast', { detail: msg }));
    }
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

    this.myMemberRef = ref(db, `sunofy_vibe_rooms/${code}/host`);
    onDisconnect(this.myMemberRef).remove();

    set(this.roomRef, {
      roomId: code,
      host: hostProfile,
      allowMemberMics: true,
      state: { track: null, currentTime: 0, isPlaying: false, timestamp: Date.now() },
      timestamp: Date.now()
    });

    // Listen to mic permissions
    onValue(ref(db, `sunofy_vibe_rooms/${code}/allowMemberMics`), (snap) => {
      const allow = snap.val() !== false;
      this.state.allowMemberMics = allow;
      this.notify();
    });

    // Listen to host updates
    onValue(this.myMemberRef, (hostSnap) => {
      const updatedHost = hostSnap.val() || hostProfile;
      const otherMembers = this.state.members.filter(m => !m.isHost);
      this.state.members = [updatedHost, ...otherMembers];
      this.notify();
    });

    // Listen to members
    onValue(ref(db, `sunofy_vibe_rooms/${code}/members`), (snapshot) => {
      const data = snapshot.val();
      const currentHost = this.state.members.find(m => m.isHost) || hostProfile;
      if (data) {
        this.state.members = [currentHost, ...Object.values(data).filter((m: any) => !m.kicked)] as SyncMember[];
        this.notify();
      } else {
        this.state.members = [currentHost];
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

    this.initWebRTCSignaling();
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
             this.notifyToast('🚪 You were removed from the room.');
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

        // Listen to mic permissions
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/allowMemberMics`), (snap) => {
          const allow = snap.val() !== false;
          this.state.allowMemberMics = allow;
          if (!this.state.isHost && !allow && this.localAudioStream) {
            this.stopContinuousVoiceStream();
            this.notifyToast('🔒 Microphone permissions locked by Host');
          }
          this.notify();
        });

        // Listen to room closure
        onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/closed`), (snap) => {
          if (snap.val() === true) {
            this.leaveRoom();
            this.notifyToast('👋 The Host has ended the party room. Back to solo mode.');
          }
        });

        // Listen to member kick status
        if (this.myMemberRef) {
          onValue(ref(db, `sunofy_vibe_rooms/${cleanCode}/members/${this.myPeerId}/kicked`), (snap) => {
            if (snap.val() === true) {
              this.leaveRoom();
              this.notifyToast('🚪 You were removed from the room by the Host.');
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
        this.initWebRTCSignaling();
        this.notify();
      } else {
        this.notifyToast('⚠️ Party Room not found! Please check the room code.');
      }
    });
  }

  leaveRoom() {
    this.stopContinuousVoiceStream();

    if (this.signalUnsubscribes.length > 0) {
      this.signalUnsubscribes.forEach((fn) => fn());
      this.signalUnsubscribes = [];
    }

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
    this.state.currentTrack = selected;
    this.state.currentTime = 0;
    this.state.isPlaying = true;
    
    this.broadcastState();
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
    this.lastBroadcastTime = Date.now();
    this.broadcastState();
    this.notify();
  }

  nextTrackInQueue() {
    if (!this.state.isHost) return;
    if (this.state.queue.length === 0) {
      this.state.currentTrack = null;
      this.state.isPlaying = false;
      this.broadcastState();
      this.notify();
      return;
    }

    const currentIndex = this.state.currentTrack
      ? this.state.queue.findIndex((t) => t.id === this.state.currentTrack?.id || t.title === this.state.currentTrack?.title)
      : -1;

    if (currentIndex >= 0 && currentIndex < this.state.queue.length - 1) {
      this.state.currentTrack = this.state.queue[currentIndex + 1];
      this.state.currentTime = 0;
      this.state.isPlaying = true;
    } else if (currentIndex === -1 && this.state.queue.length > 0) {
      this.state.currentTrack = this.state.queue[0];
      this.state.currentTime = 0;
      this.state.isPlaying = true;
    } else {
      this.state.isPlaying = false;
    }

    this.broadcastState();
    this.notify();
  }

  prevTrack() {
    if (!this.state.isHost) return;
    if (this.state.currentTime > 3) {
      this.state.currentTime = 0;
    } else {
      const currentIndex = this.state.currentTrack
        ? this.state.queue.findIndex((t) => t.id === this.state.currentTrack?.id || t.title === this.state.currentTrack?.title)
        : -1;
      if (currentIndex > 0) {
        this.state.currentTrack = this.state.queue[currentIndex - 1];
        this.state.currentTime = 0;
        this.state.isPlaying = true;
      } else {
        this.state.currentTime = 0;
      }
    }
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

  toggleAllowMemberMics(allow: boolean) {
    if (!this.state.isHost || !this.state.roomCode) return;
    this.state.allowMemberMics = allow;
    set(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/allowMemberMics`), allow);
    this.sendMessage(allow ? '🎙️ Host unlocked microphone permissions for members.' : '🔒 Host locked microphone permissions for members.', 'System');
    this.notify();
  }

  // Initialize WebRTC Signaling Listener over Firebase Realtime DB
  private initWebRTCSignaling() {
    if (!this.state.inRoom || !this.state.roomCode || !this.myPeerId) return;

    const signalRef = ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/signals/${this.myPeerId}`);
    const unsub = onChildAdded(signalRef, async (snapshot) => {
      const data = snapshot.val();
      const key = snapshot.key;
      if (!data || data.from === this.myPeerId) return;

      const fromPeerId = data.from;

      try {
        if (data.type === 'offer') {
          await this.handleWebRTCOffer(fromPeerId, data.sdp);
        } else if (data.type === 'answer') {
          await this.handleWebRTCAnswer(fromPeerId, data.sdp);
        } else if (data.type === 'candidate') {
          await this.handleWebRTCCandidate(fromPeerId, data.candidate);
        } else if (data.type === 'voice_stop') {
          this.closePeerConnection(fromPeerId);
        }
      } catch (err) {
        console.warn('WebRTC signal processing error:', err);
      }

      if (key) {
        remove(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/signals/${this.myPeerId}/${key}`)).catch(() => {});
      }
    });

    this.signalUnsubscribes.push(() => {
      unsub();
      remove(signalRef).catch(() => {});
    });
  }

  private sendSignal(targetPeerId: string, signalData: any) {
    if (!this.state.inRoom || !this.state.roomCode || !this.myPeerId) return;
    const targetRef = push(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/signals/${targetPeerId}`));
    set(targetRef, {
      from: this.myPeerId,
      senderName: this.getUserName(),
      timestamp: Date.now(),
      ...signalData,
    });
  }

  private getOrCreatePeerConnection(targetPeerId: string): RTCPeerConnection {
    if (this.peerConnections[targetPeerId]) {
      return this.peerConnections[targetPeerId];
    }

    const pc = new RTCPeerConnection(WEBRTC_ICE_SERVERS);

    // Attach local stream tracks if mic is active
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(targetPeerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      this.attachRemoteStream(targetPeerId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        this.closePeerConnection(targetPeerId);
      }
    };

    this.peerConnections[targetPeerId] = pc;
    return pc;
  }

  private async handleWebRTCOffer(fromPeerId: string, sdpData: any) {
    if (!sdpData) return;
    const type = sdpData.type || 'offer';
    const sdp = typeof sdpData === 'string' ? sdpData : sdpData.sdp;
    if (!sdp) return;

    const pc = this.getOrCreatePeerConnection(fromPeerId);
    await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.sendSignal(fromPeerId, {
      type: 'answer',
      sdp: {
        type: answer.type || 'answer',
        sdp: answer.sdp,
      },
    });
  }

  private async handleWebRTCAnswer(fromPeerId: string, sdpData: any) {
    if (!sdpData) return;
    const type = sdpData.type || 'answer';
    const sdp = typeof sdpData === 'string' ? sdpData : sdpData.sdp;
    if (!sdp) return;

    const pc = this.peerConnections[fromPeerId];
    if (pc && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
    }
  }

  private async handleWebRTCCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections[fromPeerId];
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    }
  }

  private attachRemoteStream(peerId: string, stream: MediaStream) {
    let audio = this.remoteAudioElements[peerId];
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `sunofy-voice-peer-${peerId}`;
      audio.autoplay = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      this.remoteAudioElements[peerId] = audio;
    }
    audio.srcObject = stream;
    audio.play().catch(() => {});
  }

  private closePeerConnection(peerId: string) {
    if (this.peerConnections[peerId]) {
      try {
        this.peerConnections[peerId].close();
      } catch (e) {}
      delete this.peerConnections[peerId];
    }
    if (this.remoteAudioElements[peerId]) {
      try {
        this.remoteAudioElements[peerId].srcObject = null;
        this.remoteAudioElements[peerId].remove();
      } catch (e) {}
      delete this.remoteAudioElements[peerId];
    }
  }

  // Start continuous live WebRTC voice streaming (invoked when user explicitly toggles Mic ON)
  async startContinuousVoiceStream(micStream: MediaStream) {
    if (!this.state.inRoom) return;

    this.localAudioStream = micStream;
    this.setMicSpeakingStatus(true, true);

    // Connect to all other room members
    const otherMembers = this.state.members.filter((m) => m.id !== this.myPeerId);
    for (const member of otherMembers) {
      try {
        const pc = this.getOrCreatePeerConnection(member.id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal(member.id, {
          type: 'offer',
          sdp: {
            type: offer.type || 'offer',
            sdp: offer.sdp,
          },
        });
      } catch (e) {
        console.warn(`Failed to connect WebRTC voice stream to member ${member.id}:`, e);
      }
    }
  }

  // Stop continuous live WebRTC voice streaming (invoked when user toggles Mic OFF or exits)
  stopContinuousVoiceStream() {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
    }

    this.setMicSpeakingStatus(false, false);

    // Notify peers that voice has stopped
    Object.keys(this.peerConnections).forEach((peerId) => {
      this.sendSignal(peerId, { type: 'voice_stop' });
      this.closePeerConnection(peerId);
    });
  }

  setMicSpeakingStatus(isSpeaking: boolean, isMicActive: boolean = isSpeaking) {
    if (this.myMemberRef) {
      update(this.myMemberRef, { isMicSpeaking: isSpeaking, isMicActive: isMicActive });
    }
  }

  sendVoiceAudioChunk(audioDataBase64: string, isSpeaking: boolean = true) {
    if (!this.state.inRoom || !this.state.roomCode) return;

    const payload = {
      senderId: this.myPeerId,
      senderName: this.getUserName(),
      audio: audioDataBase64,
      isSpeaking,
      timestamp: Date.now(),
    };

    // Broadcast over local channel for same-device tabs
    if (this.localChannel) {
      this.localChannel.postMessage({ type: 'VOICE_STREAM_CHUNK', payload });
    }

    // Broadcast over Firebase Realtime DB
    if (audioDataBase64) {
      const voiceRef = push(ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/voice_stream`), payload);
      // Auto-remove voice chunk after 5 seconds to keep DB ultra-light
      setTimeout(() => {
        remove(voiceRef).catch(() => {});
      }, 5000);
    }
  }

  listenVoiceStream(callback: (chunk: { senderId: string; senderName: string; audio: string; isSpeaking: boolean }) => void) {
    if (!this.state.inRoom || !this.state.roomCode) return () => {};

    // 1. Firebase listener
    const voiceNodeRef = ref(db, `sunofy_vibe_rooms/${this.state.roomCode}/voice_stream`);
    const unsubscribeFb = onChildAdded(voiceNodeRef, (snapshot) => {
      const val = snapshot.val();
      if (val && val.senderId !== this.myPeerId && val.audio && val.timestamp > Date.now() - 6000) {
        callback(val);
      }
    });

    // 2. BroadcastChannel listener for local tabs
    const handleLocalMsg = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'VOICE_STREAM_CHUNK' && data.payload && data.payload.senderId !== this.myPeerId) {
        callback(data.payload);
      }
    };

    if (this.localChannel) {
      this.localChannel.addEventListener('message', handleLocalMsg);
    }

    return () => {
      if (this.localChannel) {
        this.localChannel.removeEventListener('message', handleLocalMsg);
      }
    };
  }

  private getUserName(): string {
    const profileStr = typeof localStorage !== 'undefined' ? localStorage.getItem('sunofy_user_profile') : null;
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        if (parsed.username) return parsed.username;
      } catch (e) {}
    }
    return this.state.isHost ? 'Host' : `Member #${this.myPeerId.slice(-4)}`;
  }

  private getTimeStr(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export const syncParty = new SyncPartyManager();
