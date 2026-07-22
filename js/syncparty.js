// SUNOFY VIBESYNC™ - MULTI-DEVICE WEBRTC LISTEN TOGETHER ENGINE
let _peerInstance = null;
let _peerConnections = []; // Host's active connected peers
let _activeHostConnection = null; // Listener's connection to host

function initSyncPartyEngine() {
    setupSyncPartyControls();
}

function setupSyncPartyControls() {
    const hostBtn = document.getElementById('host-sync-btn');
    const joinBtn = document.getElementById('join-sync-btn');
    const modal = document.getElementById('join-sync-modal');
    const closeBtn = document.getElementById('close-join-sync-modal-btn');
    const form = document.getElementById('join-sync-room-form');

    if (hostBtn) hostBtn.onclick = () => createSyncPartyRoom();
    
    if (joinBtn && modal) {
        joinBtn.onclick = () => {
            modal.classList.remove('hidden');
            const input = document.getElementById('sync-room-input-code');
            if (input) {
                input.value = "";
                input.focus();
            }
        };
    }

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
}

function createSyncPartyRoom() {
    if (typeof Peer === 'undefined') {
        if (typeof showToastNotification === 'function') showToastNotification("Loading WebRTC engine...", 'error');
        return;
    }

    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    const peerId = `sunofy_vibe_${roomId}`;

    if (_peerInstance) _peerInstance.destroy();
    _peerInstance = new Peer(peerId);
    _peerConnections = [];

    _peerInstance.on('open', (id) => {
        AppState.syncRoomId = roomId;
        AppState.isSyncHost = true;
        updateSyncPartyDockUI();
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Room #${roomId} created! Share this code with friends.`, 'success');
        }
    });

    _peerInstance.on('connection', (conn) => {
        _peerConnections.push(conn);
        
        conn.on('open', () => {
            updateJoinedListenersCountUI();
            // Send initial sync state to new listener
            const audioNode = document.getElementById('audio-node');
            conn.send({
                type: 'STATE_SYNC',
                track: AppState.currentTrack,
                currentTime: audioNode ? audioNode.currentTime : 0,
                isPlaying: audioNode ? !audioNode.paused : false
            });
        });

        conn.on('data', (data) => {
            if (data.type === 'LISTENER_JOIN') {
                conn._userHandle = data.handle || "Listener";
                updateJoinedListenersCountUI();
            }
        });

        conn.on('close', () => {
            _peerConnections = _peerConnections.filter(c => c !== conn);
            updateJoinedListenersCountUI();
        });
    });

    _peerInstance.on('error', (err) => {
        console.warn("[SyncParty] Host peer error:", err);
        if (typeof showToastNotification === 'function') showToastNotification("Could not host room. Try again.", 'error');
    });
}

function joinSyncPartyRoom(roomId) {
    if (typeof Peer === 'undefined') {
        if (typeof showToastNotification === 'function') showToastNotification("Loading WebRTC engine...", 'error');
        return;
    }

    const targetPeerId = `sunofy_vibe_${roomId}`;
    if (_peerInstance) _peerInstance.destroy();
    _peerInstance = new Peer();

    _peerInstance.on('open', () => {
        _activeHostConnection = _peerInstance.connect(targetPeerId);

        _activeHostConnection.on('open', () => {
            AppState.syncRoomId = roomId;
            AppState.isSyncHost = false;
            updateSyncPartyDockUI();
            
            _activeHostConnection.send({
                type: 'LISTENER_JOIN',
                handle: AppState.profile?.handle || '@Listener'
            });

            if (typeof showToastNotification === 'function') {
                showToastNotification(`Joined Room #${roomId}! Synced with Host.`, 'success');
            }
        });

        _activeHostConnection.on('data', (data) => {
            handleIncomingHostStateCommand(data);
        });

        _activeHostConnection.on('close', () => {
            leaveSyncPartyRoom();
            if (typeof showToastNotification === 'function') showToastNotification("Host ended the session.", 'info');
        });
    });

    _peerInstance.on('error', (err) => {
        console.warn("[SyncParty] Listener peer error:", err);
        if (typeof showToastNotification === 'function') showToastNotification(`Room #${roomId} not found or inactive.`, 'error');
    });
}

function broadcastHostSyncState(command, extra = {}) {
    if (!AppState.syncRoomId || !AppState.isSyncHost) return;
    
    const audioNode = document.getElementById('audio-node');
    const payload = {
        type: 'STATE_SYNC',
        command: command,
        track: AppState.currentTrack,
        currentTime: audioNode ? audioNode.currentTime : 0,
        isPlaying: audioNode ? !audioNode.paused : false,
        ...extra
    };

    _peerConnections.forEach(conn => {
        if (conn && conn.open) {
            conn.send(payload);
        }
    });

    if (command === 'MANUAL_SYNC' && typeof showToastNotification === 'function') {
        showToastNotification(`Broadcasted track playback to ${_peerConnections.length} listeners!`, 'success');
    }
}

function handleIncomingHostStateCommand(data) {
    if (!data || AppState.isSyncHost) return;

    const audioNode = document.getElementById('audio-node');
    if (data.track) {
        // Switch track if different
        if (!AppState.currentTrack || AppState.currentTrack.id !== data.track.id) {
            AppState.currentTrack = data.track;
            AppState.queue = [data.track];
            AppState.queueIndex = 0;
            if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
            
            const url = data.track.downloadUrl?.[data.track.downloadUrl.length - 1]?.url || data.track.audioUrl || '';
            if (audioNode && url) {
                audioNode.src = url;
            }
        }

        // Sync playback time & play/pause state
        if (audioNode) {
            if (Math.abs(audioNode.currentTime - (data.currentTime || 0)) > 2) {
                audioNode.currentTime = data.currentTime || 0;
            }
            if (data.isPlaying) {
                if (audioNode.paused) audioNode.play().catch(() => {});
            } else {
                if (!audioNode.paused) audioNode.pause();
            }
        }
    }
}

function updateJoinedListenersCountUI() {
    const infoEl = document.getElementById('sync-dock-listeners-info');
    if (!infoEl) return;

    const activeCount = _peerConnections.filter(c => c.open).length;
    const names = _peerConnections.filter(c => c.open && c._userHandle).map(c => c._userHandle).join(', ');
    
    if (activeCount > 0) {
        infoEl.innerText = `👥 ${activeCount} Listener${activeCount > 1 ? 's' : ''} Connected (${names || 'Active'})`;
    } else {
        infoEl.innerText = `👥 0 Listeners connected (Waiting for friends to join...)`;
    }
}

function leaveSyncPartyRoom() {
    if (_peerInstance) _peerInstance.destroy();
    _peerInstance = null;
    _peerConnections = [];
    _activeHostConnection = null;

    AppState.syncRoomId = null;
    AppState.isSyncHost = false;
    updateSyncPartyDockUI();
    if (typeof showToastNotification === 'function') showToastNotification("Left Sync Room.", 'info');
}

function updateSyncPartyDockUI() {
    const dockBar = document.getElementById('sync-party-bottom-bar');
    const roomCodeEl = document.getElementById('sync-dock-room-code');
    const roleBadgeEl = document.getElementById('sync-dock-role-badge');
    const syncBtn = document.getElementById('sync-dock-force-sync-btn');
    const badge = document.getElementById('sync-room-badge');

    if (AppState.syncRoomId) {
        if (dockBar) {
            dockBar.classList.remove('hidden', 'translate-y-full', 'opacity-0');
            dockBar.classList.add('translate-y-0', 'opacity-100');
        }
        if (roomCodeEl) roomCodeEl.innerText = AppState.syncRoomId;
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
    } else {
        if (dockBar) {
            dockBar.classList.replace('translate-y-0', 'translate-y-full');
            dockBar.classList.replace('opacity-100', 'opacity-0');
            setTimeout(() => dockBar.classList.add('hidden'), 300);
        }
        if (badge) badge.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', initSyncPartyEngine);
