// SUNOFY VIBESYNC™ - MULTI-DEVICE REALTIME FIREBASE LISTEN TOGETHER & MEMBER MANAGEMENT ENGINE

const SUNOFY_FIREBASE_DB_URL = 'https://walkietalkie-c0f03-default-rtdb.asia-southeast1.firebasedatabase.app';

let _firebaseDb = null;
let _currentRoomRef = null;
let _myMemberRef = null;
let _listenerRoomMembers = [];
let _listenerRoomHost = null;
let _myPeerId = '';
let _isSyncingPlayback = false;

function initSyncPartyEngine() {
    initFirebase();
    setupSyncPartyControls();
}

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp({ databaseURL: SUNOFY_FIREBASE_DB_URL });
        }
        if (typeof firebase !== 'undefined') {
            _firebaseDb = firebase.database();
        }
    } catch (e) {
        console.warn("Sunofy Firebase Init Warning:", e);
    }
}

function getTrackAudioUrl(track) {
    if (!track) return '';
    if (typeof track.downloadUrl === 'string' && track.downloadUrl.length > 5) return track.downloadUrl;
    if (Array.isArray(track.downloadUrl) && track.downloadUrl.length > 0) {
        const last = track.downloadUrl[track.downloadUrl.length - 1];
        if (typeof last === 'string') return last;
        if (last && last.url) return last.url;
        if (last && last.link) return last.link;
    }
    if (track.audioUrl) return track.audioUrl;
    if (track.url) return track.url;
    if (track.media_url) return track.media_url;
    if (track.streamUrl) return track.streamUrl;
    return '';
}

function setupSyncPartyControls() {
    const hostBtns = [document.getElementById('host-sync-btn'), document.getElementById('page-host-sync-btn')];
    const joinBtns = [document.getElementById('join-sync-btn'), document.getElementById('page-join-sync-btn')];
    const modal = document.getElementById('join-sync-modal');
    const closeBtn = document.getElementById('close-join-sync-modal-btn');
    const form = document.getElementById('join-sync-room-form');
    const dockTrigger = document.getElementById('sync-party-bottom-bar');

    hostBtns.forEach(btn => {
        if (btn) btn.onclick = () => createSyncPartyRoom();
    });
    
    joinBtns.forEach(btn => {
        if (btn && modal) {
            btn.onclick = () => {
                modal.classList.remove('hidden');
                const input = document.getElementById('sync-room-input-code');
                if (input) {
                    input.value = "";
                    input.focus();
                }
            };
        }
    });

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.add('hidden');
    }

    if (form && modal) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const input = document.getElementById('sync-room-input-code');
            const code = input ? input.value.trim() : '';
            if (code.length === 4) {
                modal.classList.add('hidden');
                joinSyncPartyRoom(code);
            } else {
                if (typeof showToastNotification === 'function') {
                    showToastNotification("Enter valid 4-digit room code.", 'error');
                }
            }
        };
    }

    if (dockTrigger) {
        dockTrigger.onclick = (e) => {
            if (e.target.closest('#sync-dock-leave-btn') || e.target.closest('#sync-dock-force-sync-btn')) return;
            openSyncRoomManageConsole();
        };
    }
}

// CREATE SYNC PARTY ROOM (HOST)
function createSyncPartyRoom() {
    if (!_firebaseDb) initFirebase();
    if (!_firebaseDb) {
        if (typeof showToastNotification === 'function') showToastNotification("Firebase connection failed.", 'error');
        return;
    }

    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    _myPeerId = `host_${Date.now()}`;
    
    AppState.syncRoomId = roomId;
    AppState.isSyncHost = true;

    _currentRoomRef = _firebaseDb.ref(`sunofy_vibe_rooms/${roomId}`);
    
    // Auto cleanup room on disconnect
    _currentRoomRef.onDisconnect().remove();

    const hostProfile = {
        name: AppState.profile?.name || 'Room Host',
        handle: AppState.profile?.handle || '@host',
        avatar: AppState.profile?.avatar || 'images/icon-512.png',
        peerId: _myPeerId
    };

    _currentRoomRef.set({
        roomId: roomId,
        host: hostProfile,
        state: getHostPlaybackState(),
        timestamp: Date.now()
    });

    // Listen for Joined Members
    const membersRef = _currentRoomRef.child('members');
    membersRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        _listenerRoomMembers = Object.values(data).filter(m => m.peerId !== _myPeerId && !m.kicked);
        updateJoinedListenersCountUI();
    });

    attachHostAudioEvents();

    updateSyncPartyDockUI();
    openSyncRoomManageConsole();
    if (typeof showToastNotification === 'function') {
        showToastNotification(`Room #${roomId} created! Share this code with friends.`, 'success');
    }
}

function getHostPlaybackState() {
    const audioNode = document.getElementById('audio-node');
    const track = (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) 
        ? AppState.queue[AppState.queueIndex] 
        : null;

    return {
        track: track,
        currentTime: audioNode ? audioNode.currentTime : 0,
        isPlaying: audioNode ? !audioNode.paused : false,
        timestamp: Date.now()
    };
}

function attachHostAudioEvents() {
    const audioNode = document.getElementById('audio-node');
    if (!audioNode) return;

    const syncEvents = ['play', 'pause', 'seeked'];
    syncEvents.forEach(evt => {
        audioNode.addEventListener(evt, () => {
            if (AppState.isSyncHost && _currentRoomRef) {
                _currentRoomRef.child('state').set(getHostPlaybackState());
            }
        });
    });
}

function forceBroadcastSyncHostState() {
    if (AppState.isSyncHost && _currentRoomRef) {
        _currentRoomRef.child('state').set(getHostPlaybackState());
        if (typeof showToastNotification === 'function') showToastNotification("Broadcasted live playback sync!", 'success');
    }
}

// JOIN SYNC PARTY ROOM (LISTENER)
function joinSyncPartyRoom(roomId) {
    if (!_firebaseDb) initFirebase();
    if (!_firebaseDb) {
        if (typeof showToastNotification === 'function') showToastNotification("Firebase connection failed.", 'error');
        return;
    }

    const cleanRoomId = roomId.trim().replace('#', '');
    _myPeerId = `member_${Date.now()}`;
    const roomRef = _firebaseDb.ref(`sunofy_vibe_rooms/${cleanRoomId}`);

    roomRef.once('value', (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData || !roomData.host) {
            if (typeof showToastNotification === 'function') showToastNotification(`Room #${cleanRoomId} not found or offline.`, 'error');
            return;
        }

        AppState.syncRoomId = cleanRoomId;
        AppState.isSyncHost = false;
        _currentRoomRef = roomRef;

        _listenerRoomHost = roomData.host;

        // Register Member Presence
        _myMemberRef = roomRef.child(`members/${_myPeerId}`);
        const memberInfo = {
            peerId: _myPeerId,
            name: AppState.profile?.name || 'Listener',
            handle: AppState.profile?.handle || '@listener',
            avatar: AppState.profile?.avatar || 'images/icon-512.png',
            joinedAt: Date.now()
        };

        _myMemberRef.set(memberInfo);
        _myMemberRef.onDisconnect().remove();

        // Listen for Kick or Room Termination
        _myMemberRef.on('value', (memberSnap) => {
            const mData = memberSnap.val();
            if (mData && mData.kicked) {
                leaveSyncPartyRoom();
                if (typeof showToastNotification === 'function') showToastNotification("You were removed from the room by the Host.", 'error');
            }
        });

        // Listen for Live Playback State from Host
        roomRef.child('state').on('value', (stateSnap) => {
            const stateData = stateSnap.val();
            if (stateData) {
                syncPlaybackToListener(stateData);
            }
        });

        // Listen for Members List updates
        roomRef.child('members').on('value', (membersSnap) => {
            const data = membersSnap.val() || {};
            _listenerRoomMembers = Object.values(data).filter(m => !m.kicked);
            updateJoinedListenersCountUI();
        });

        updateSyncPartyDockUI();
        openSyncRoomManageConsole();
        if (typeof showToastNotification === 'function') showToastNotification(`Joined Room #${cleanRoomId}! Music will sync live.`, 'success');
    });
}

// SYNC LISTENER PLAYBACK TO HOST
function syncPlaybackToListener(data) {
    if (AppState.isSyncHost || _isSyncingPlayback) return;
    _isSyncingPlayback = true;

    const audioNode = document.getElementById('audio-node');
    if (!audioNode || !data.track) {
        _isSyncingPlayback = false;
        return;
    }

    const currentTrack = (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex])
        ? AppState.queue[AppState.queueIndex]
        : null;

    // 1. If track changed, load track
    if (!currentTrack || currentTrack.id !== data.track.id || currentTrack.name !== data.track.name) {
        if (typeof initializeTrackTargetPlayback === 'function') {
            if (!AppState.queue) AppState.queue = [];
            const idx = AppState.queue.findIndex(t => t.id === data.track.id || t.name === data.track.name);
            if (idx > -1) {
                initializeTrackTargetPlayback(idx);
            } else {
                AppState.queue.push(data.track);
                initializeTrackTargetPlayback(AppState.queue.length - 1);
            }
        }
    }

    // 2. Sync seek position if drift > 1.5 seconds
    if (Math.abs(audioNode.currentTime - data.currentTime) > 1.5) {
        audioNode.currentTime = data.currentTime;
    }

    // 3. Sync play/pause
    if (data.isPlaying && audioNode.paused) {
        audioNode.play().catch(e => console.log("Autoplay policy:", e));
    } else if (!data.isPlaying && !audioNode.paused) {
        audioNode.pause();
    }

    setTimeout(() => { _isSyncingPlayback = false; }, 300);
}

// KICK LISTENER FROM ROOM (HOST ACTION)
function kickListenerFromRoom(peerId) {
    if (!AppState.isSyncHost || !_currentRoomRef || !peerId) return;
    _currentRoomRef.child(`members/${peerId}`).update({ kicked: true });
    if (typeof showToastNotification === 'function') showToastNotification("Listener removed from room.", 'info');
}

// LEAVE ROOM
function leaveSyncPartyRoom() {
    if (_myMemberRef) {
        _myMemberRef.remove();
        _myMemberRef.off();
    }
    if (_currentRoomRef) {
        if (AppState.isSyncHost) _currentRoomRef.remove();
        _currentRoomRef.off();
    }

    _currentRoomRef = null;
    _myMemberRef = null;
    _listenerRoomMembers = [];
    _listenerRoomHost = null;

    AppState.syncRoomId = null;
    AppState.isSyncHost = false;

    updateSyncPartyDockUI();
    updateJoinedListenersCountUI();
    if (typeof showToastNotification === 'function') showToastNotification("Left Sync Room.", 'info');
}

function openSyncRoomManageConsole() {
    const modal = document.getElementById('sync-room-manage-modal');
    updateJoinedListenersCountUI();
    if (modal) modal.classList.remove('hidden');
}

function updateJoinedListenersCountUI() {
    const infoEl = document.getElementById('sync-dock-listeners-info');
    const countEl = document.getElementById('sync-modal-member-count');
    const membersListContainer = document.getElementById('sync-modal-members-list');
    const pageCountEl = document.getElementById('sync-page-member-count');
    const pageMembersContainer = document.getElementById('sync-page-members-list');
    const statusBadge = document.getElementById('sync-view-status-badge');

    let activeCount = 0;
    let hostInfo = null;
    let memberList = [];

    if (AppState.isSyncHost) {
        memberList = _listenerRoomMembers || [];
        activeCount = memberList.length;
        hostInfo = {
            name: AppState.profile?.name || 'Room Host',
            handle: AppState.profile?.handle || '@host',
            avatar: AppState.profile?.avatar || 'images/icon-512.png',
            isHost: true
        };
    } else {
        memberList = _listenerRoomMembers || [];
        activeCount = memberList.length;
        hostInfo = _listenerRoomHost || { name: 'Room Host', handle: '@host', avatar: 'images/icon-512.png', isHost: true };
    }

    if (countEl) countEl.innerText = activeCount.toString();
    if (pageCountEl) pageCountEl.innerText = activeCount.toString();
    if (statusBadge) {
        statusBadge.innerText = AppState.syncRoomId 
            ? (AppState.isSyncHost ? `Host - Room #${AppState.syncRoomId}` : `Listener - Room #${AppState.syncRoomId}`) 
            : "Offline / Ready";
    }

    if (infoEl) {
        if (activeCount > 0) {
            const names = memberList.map(m => m.name || 'Listener').join(', ');
            infoEl.innerText = `👥 ${activeCount} Listener${activeCount > 1 ? 's' : ''} (${names})`;
        } else {
            infoEl.innerText = AppState.isSyncHost 
                ? `👥 0 Listeners connected (Waiting for friends to join...)`
                : `🎧 Connected to Host session`;
        }
    }

    [membersListContainer, pageMembersContainer].forEach(container => {
        if (!container) return;
        container.innerHTML = '';
        
        const hostRow = document.createElement('div');
        hostRow.className = "flex items-center justify-between p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl";
        hostRow.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0">
                <img src="${hostInfo.avatar}" class="w-8 h-8 rounded-full object-cover border border-purple-400/50">
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-main truncate">${hostInfo.name} ${AppState.isSyncHost ? '(You)' : ''}</h4>
                    <p class="text-[10px] text-purple-300 font-mono">${hostInfo.handle}</p>
                </div>
            </div>
            <span class="text-[9px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-bold uppercase">HOST</span>
        `;
        container.appendChild(hostRow);

        if (memberList.length === 0 && AppState.isSyncHost) {
            const emptyNotice = document.createElement('p');
            emptyNotice.className = "text-[11px] text-muted text-center py-4 italic col-span-full";
            emptyNotice.innerText = "No listeners joined yet. Share Room Code #" + AppState.syncRoomId;
            container.appendChild(emptyNotice);
        } else {
            memberList.forEach(m => {
                const info = m || { name: "Listener", handle: "@user", avatar: "images/icon-512.png" };
                const row = document.createElement('div');
                row.className = "flex items-center justify-between p-2.5 bg-app-body border border-app rounded-xl group hover:border-accent transition-colors";
                row.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0">
                        <img src="${info.avatar}" class="w-8 h-8 rounded-full object-cover border border-app">
                        <div class="min-w-0">
                            <h4 class="text-xs font-bold text-main truncate">${info.name}</h4>
                            <p class="text-[10px] text-muted font-mono">${info.handle}</p>
                        </div>
                    </div>
                    ${AppState.isSyncHost ? `
                    <button class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer action-kick-user" title="Remove User">
                        <i class="fa-solid fa-user-xmark mr-1"></i> Kick
                    </button>` : `<span class="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase">MEMBER</span>`}
                `;

                if (AppState.isSyncHost && info.peerId) {
                    const kickBtn = row.querySelector('.action-kick-user');
                    if (kickBtn) {
                        kickBtn.onclick = () => kickListenerFromRoom(info.peerId);
                    }
                }

                container.appendChild(row);
            });
        }
    });
}

function copySyncRoomCodeToClipboard() {
    if (AppState.syncRoomId) {
        navigator.clipboard.writeText(AppState.syncRoomId);
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Room Code #${AppState.syncRoomId} copied!`, 'success');
        }
    }
}

function shareSyncRoomLink() {
    if (!AppState.syncRoomId) return;
    const shareableUrl = `${window.location.origin}${window.location.pathname}?party=${AppState.syncRoomId}`;
    if (navigator.share) {
        navigator.share({
            title: 'Join Sunofy Party',
            text: `Listen to music live with me on Sunofy! Room Code #${AppState.syncRoomId}`,
            url: shareableUrl
        }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareableUrl);
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Room Link copied to clipboard!`, 'success');
        }
    }
}

function updateSyncPartyDockUI() {
    const dockBar = document.getElementById('sync-party-bottom-bar');
    const roomCodeEl = document.getElementById('sync-dock-room-code');
    const modalRoomCodeEl = document.getElementById('sync-modal-room-code');
    const roleBadgeEl = document.getElementById('sync-dock-role-badge');
    const syncBtn = document.getElementById('sync-dock-force-sync-btn');
    const badge = document.getElementById('sync-room-badge');
    const setupCard = document.getElementById('sync-room-setup-card');

    if (AppState.syncRoomId) {
        if (dockBar) {
            dockBar.classList.remove('hidden', 'translate-y-full', 'opacity-0');
            dockBar.classList.add('translate-y-0', 'opacity-100');
        }
        if (roomCodeEl) roomCodeEl.innerText = AppState.syncRoomId;
        if (modalRoomCodeEl) modalRoomCodeEl.innerText = AppState.syncRoomId;

        if (roleBadgeEl) {
            roleBadgeEl.innerText = AppState.isSyncHost ? 'HOST' : 'LISTENER';
            roleBadgeEl.className = AppState.isSyncHost 
                ? "text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-1.5 py-0.2 rounded font-bold uppercase"
                : "text-[9px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.2 rounded font-bold uppercase";
        }
        if (syncBtn) {
            if (AppState.isSyncHost) syncBtn.classList.remove('hidden');
            else syncBtn.classList.add('hidden');
        }
        if (badge) {
            badge.innerText = `LIVE ROOM #${AppState.syncRoomId}`;
            badge.classList.remove('hidden');
        }
        if (setupCard) setupCard.classList.add('hidden');
    } else {
        if (dockBar) {
            dockBar.classList.replace('translate-y-0', 'translate-y-full');
            dockBar.classList.replace('opacity-100', 'opacity-0');
            setTimeout(() => dockBar.classList.add('hidden'), 300);
        }
        if (badge) badge.classList.add('hidden');
        if (setupCard) setupCard.classList.remove('hidden');
    }
    updateWatchPartyStageTrackUI();
}

function updateWatchPartyStageTrackUI() {
    const stageTitle = document.getElementById('sync-stage-track-title');
    const stageArt = document.getElementById('sync-stage-track-art');
    const stageArtist = document.getElementById('sync-stage-track-artist');

    const currentTrack = (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex])
        ? AppState.queue[AppState.queueIndex]
        : null;

    if (currentTrack) {
        if (stageTitle) stageTitle.innerText = currentTrack.name || 'No Track Selected';
        if (stageArtist) stageArtist.innerText = currentTrack.artist || 'Unknown Artist';
        if (stageArt) stageArt.src = currentTrack.image || currentTrack.art || 'images/icon-512.png';
    }
}

function sendPartyEmojiReaction(emoji) {
    if (!_currentRoomRef) return;
    if (typeof createFloatingEmojiAnimation === 'function') createFloatingEmojiAnimation(emoji);
    _currentRoomRef.child('reactions').push({ emoji, timestamp: Date.now() });
}

function openSyncPartyNavigationTarget() {
    if (typeof switchAppView === 'function') {
        switchAppView('syncparty');
    }
}

// Auto-Join from URL parameter ?party=7704 or ?room=7704
document.addEventListener('DOMContentLoaded', () => {
    initSyncPartyEngine();
    const params = new URLSearchParams(window.location.search);
    const partyCode = params.get('party') || params.get('room');
    if (partyCode) {
        console.log("🔗 Auto-joining Sunofy Party Room:", partyCode);
        setTimeout(() => {
            joinSyncPartyRoom(partyCode);
        }, 500);
    }
});
