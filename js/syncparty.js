// SUNOFY VIBESYNC™ - MULTI-DEVICE WEBRTC LISTEN TOGETHER & MEMBER MANAGEMENT ENGINE
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
    const dockTrigger = document.getElementById('sync-party-bottom-bar');

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

    if (dockTrigger) {
        dockTrigger.onclick = (e) => {
            if (e.target.closest('#sync-dock-leave-btn') || e.target.closest('#sync-dock-force-sync-btn')) return;
            openSyncRoomManageConsole();
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
        openSyncRoomManageConsole();
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
                isPlaying: audioNode ? !audioNode.paused : false,
                hostProfile: {
                    name: AppState.profile?.name || 'Host',
                    avatar: AppState.profile?.avatar || 'images/icon-512.png'
                }
            });
        });

        conn.on('data', (data) => {
            if (data.type === 'LISTENER_JOIN') {
                conn._userInfo = {
                    peerId: conn.peer,
                    name: data.name || "Listener",
                    handle: data.handle || "@listener",
                    avatar: data.avatar || "images/icon-512.png"
                };
                updateJoinedListenersCountUI();
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`${conn._userInfo.name} joined room #${AppState.syncRoomId}`, 'success');
                }
            }
        });

        conn.on('close', () => {
            const userName = conn._userInfo?.name || "A listener";
            _peerConnections = _peerConnections.filter(c => c !== conn);
            updateJoinedListenersCountUI();
            if (typeof showToastNotification === 'function') {
                showToastNotification(`${userName} left room #${AppState.syncRoomId}`, 'info');
            }
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
                name: AppState.profile?.name || 'Music Curator',
                handle: AppState.profile?.handle || '@sunofy_user',
                avatar: AppState.profile?.avatar || 'images/icon-512.png'
            });

            if (typeof showToastNotification === 'function') {
                showToastNotification(`Joined Room #${roomId}! Synced with Host.`, 'success');
            }
        });

        _activeHostConnection.on('data', (data) => {
            if (data.type === 'KICK') {
                leaveSyncPartyRoom();
                if (typeof showToastNotification === 'function') showToastNotification("You were removed from the room by the Host.", 'error');
            } else {
                handleIncomingHostStateCommand(data);
            }
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

function kickListenerFromRoom(peerId) {
    if (!AppState.isSyncHost) return;
    const conn = _peerConnections.find(c => c.peer === peerId);
    if (conn) {
        conn.send({ type: 'KICK' });
        setTimeout(() => conn.close(), 200);
        _peerConnections = _peerConnections.filter(c => c.peer !== peerId);
        updateJoinedListenersCountUI();
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Removed user from room.`, 'info');
        }
    }
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

function openSyncRoomManageConsole() {
    if (!AppState.syncRoomId) return;
    const modal = document.getElementById('sync-room-manage-modal');
    const codeEl = document.getElementById('sync-modal-room-code');
    const roleEl = document.getElementById('sync-modal-role-badge');

    if (codeEl) codeEl.innerText = AppState.syncRoomId;
    if (roleEl) roleEl.innerText = AppState.isSyncHost ? 'HOST' : 'LISTENER';
    
    updateJoinedListenersCountUI();
    if (modal) modal.classList.remove('hidden');
}

function updateJoinedListenersCountUI() {
    const infoEl = document.getElementById('sync-dock-listeners-info');
    const countEl = document.getElementById('sync-modal-member-count');
    const membersListContainer = document.getElementById('sync-modal-members-list');

    const activeConnections = _peerConnections.filter(c => c.open);
    const activeCount = activeConnections.length;
    
    if (countEl) countEl.innerText = activeCount.toString();

    // 1. Update Bottom Dock Text
    if (infoEl) {
        if (activeCount > 0) {
            const names = activeConnections.map(c => c._userInfo?.name || 'Listener').join(', ');
            infoEl.innerText = `👥 ${activeCount} Listener${activeCount > 1 ? 's' : ''} (${names})`;
        } else {
            infoEl.innerText = AppState.isSyncHost 
                ? `👥 0 Listeners connected (Waiting for friends to join...)`
                : `🎧 Connected to Host session`;
        }
    }

    // 2. Update Room Management Console Members Grid
    if (membersListContainer) {
        membersListContainer.innerHTML = '';
        
        // Always include Host entry
        const hostRow = document.createElement('div');
        hostRow.className = "flex items-center justify-between p-2 bg-purple-950/40 border border-purple-500/30 rounded-xl";
        hostRow.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0">
                <img src="${AppState.profile?.avatar || 'images/icon-512.png'}" class="w-8 h-8 rounded-full object-cover border border-purple-400/50">
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-main truncate">${AppState.profile?.name || 'Room Host'} (You)</h4>
                    <p class="text-[10px] text-purple-300 font-mono">${AppState.profile?.handle || '@host'}</p>
                </div>
            </div>
            <span class="text-[9px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-bold uppercase">HOST</span>
        `;
        membersListContainer.appendChild(hostRow);

        if (activeConnections.length === 0 && AppState.isSyncHost) {
            const emptyNotice = document.createElement('p');
            emptyNotice.className = "text-[11px] text-muted text-center py-4 italic";
            emptyNotice.innerText = "No listeners joined yet. Share Room Code #" + AppState.syncRoomId;
            membersListContainer.appendChild(emptyNotice);
        } else {
            activeConnections.forEach(conn => {
                const info = conn._userInfo || { name: "Listener", handle: "@user", avatar: "images/icon-512.png" };
                const row = document.createElement('div');
                row.className = "flex items-center justify-between p-2 bg-app-body border border-app rounded-xl group hover:border-accent transition-colors";
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

                if (AppState.isSyncHost) {
                    const kickBtn = row.querySelector('.action-kick-user');
                    if (kickBtn) {
                        kickBtn.onclick = () => kickListenerFromRoom(conn.peer);
                    }
                }

                membersListContainer.appendChild(row);
            });
        }
    }
}

function copySyncRoomCodeToClipboard() {
    if (AppState.syncRoomId) {
        navigator.clipboard.writeText(AppState.syncRoomId);
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Room Code #${AppState.syncRoomId} copied!`, 'success');
        }
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
