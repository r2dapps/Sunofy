// SUNOFY VIBESYNC™ - MULTI-DEVICE WEBRTC LISTEN TOGETHER & MEMBER MANAGEMENT ENGINE
let _peerInstance = null;
let _peerConnections = []; // Host's active connected peers
let _activeHostConnection = null; // Listener's connection to host
let _listenerRoomMembers = []; // Listener's copy of synced room members
let _listenerRoomHost = null; // Listener's copy of host profile

// Cross-Network NAT & Cellular Firewall Traversal STUN/TURN Servers
const PEER_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelay',
                credential: 'openrelay'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelay',
                credential: 'openrelay'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelay',
                credential: 'openrelay'
            }
        ]
    }
};

function initSyncPartyEngine() {
    setupSyncPartyControls();
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

function createSyncPartyRoom() {
    if (typeof Peer === 'undefined') {
        if (typeof showToastNotification === 'function') showToastNotification("Loading WebRTC engine...", 'error');
        return;
    }

    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    const peerId = `sunofy_vibe_${roomId}`;

    if (_peerInstance) _peerInstance.destroy();
    _peerInstance = new Peer(peerId, PEER_CONFIG);
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
            broadcastMembersListToAllListeners();
            // Send initial sync state to new listener
            const audioNode = document.getElementById('audio-node');
            conn.send({
                type: 'STATE_SYNC',
                track: AppState.currentTrack,
                currentTime: audioNode ? audioNode.currentTime : 0,
                isPlaying: audioNode ? !audioNode.paused : false,
                hostProfile: {
                    name: AppState.profile?.name || 'Host',
                    handle: AppState.profile?.handle || '@host',
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
                broadcastMembersListToAllListeners();
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`${conn._userInfo.name} joined room #${AppState.syncRoomId}`, 'success');
                }
            } else if (data.type === 'EMOJI_REACTION') {
                createFloatingEmojiAnimation(data.emoji);
                // Broadcast reaction to other listeners
                _peerConnections.forEach(c => {
                    if (c && c.open && c !== conn) c.send({ type: 'EMOJI_REACTION', emoji: data.emoji });
                });
            }
        });

        conn.on('close', () => {
            const userName = conn._userInfo?.name || "A listener";
            _peerConnections = _peerConnections.filter(c => c !== conn);
            updateJoinedListenersCountUI();
            broadcastMembersListToAllListeners();
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
    _peerInstance = new Peer(PEER_CONFIG);

    _peerInstance.on('open', () => {
        _activeHostConnection = _peerInstance.connect(targetPeerId, { reliable: true });

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
            } else if (data.type === 'MEMBERS_LIST_SYNC') {
                _listenerRoomHost = data.host;
                _listenerRoomMembers = data.members || [];
                updateJoinedListenersCountUI();
            } else if (data.type === 'EMOJI_REACTION') {
                createFloatingEmojiAnimation(data.emoji);
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
        broadcastMembersListToAllListeners();
        if (typeof showToastNotification === 'function') {
            showToastNotification(`Removed user from room.`, 'info');
        }
    }
}

function broadcastMembersListToAllListeners() {
    if (!AppState.isSyncHost) return;
    const activeConns = _peerConnections.filter(c => c.open);
    const hostProfile = {
        name: AppState.profile?.name || 'Room Host',
        handle: AppState.profile?.handle || '@host',
        avatar: AppState.profile?.avatar || 'images/icon-512.png'
    };
    const membersList = activeConns.map(c => c._userInfo || { name: 'Listener', handle: '@user', avatar: 'images/icon-512.png' });

    activeConns.forEach(conn => {
        if (conn && conn.open) {
            conn.send({
                type: 'MEMBERS_LIST_SYNC',
                host: hostProfile,
                members: membersList
            });
        }
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
    updateWatchPartyStageTrackUI();
}

function handleIncomingHostStateCommand(data) {
    if (!data || AppState.isSyncHost) return;

    if (data.hostProfile) {
        _listenerRoomHost = data.hostProfile;
        updateJoinedListenersCountUI();
    }

    const audioNode = document.getElementById('audio-node');
    const unmuteBanner = document.getElementById('sync-unmute-banner');

    if (data.track) {
        const url = getTrackAudioUrl(data.track);

        if (!AppState.currentTrack || AppState.currentTrack.id !== data.track.id) {
            AppState.currentTrack = data.track;
            AppState.queue = [data.track];
            AppState.queueIndex = 0;
            if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
        }

        if (audioNode) {
            if (url && audioNode.src !== url) {
                audioNode.src = url;
            }
            if (Math.abs(audioNode.currentTime - (data.currentTime || 0)) > 1.5) {
                audioNode.currentTime = data.currentTime || 0;
            }
            if (data.isPlaying) {
                audioNode.play().then(() => {
                    if (unmuteBanner) unmuteBanner.classList.add('hidden');
                }).catch((err) => {
                    console.warn("[SyncParty] Autoplay blocked by browser policy:", err);
                    if (unmuteBanner) unmuteBanner.classList.remove('hidden');
                    if (typeof showToastNotification === 'function') {
                        showToastNotification("Tap 'TAP HERE TO UNMUTE' banner to start audio!", 'info');
                    }
                });
            } else {
                if (!audioNode.paused) audioNode.pause();
            }
        }
    }
    updateWatchPartyStageTrackUI();
}

function sendPartyEmojiReaction(emoji) {
    createFloatingEmojiAnimation(emoji);
    if (AppState.syncRoomId) {
        if (AppState.isSyncHost) {
            _peerConnections.forEach(conn => {
                if (conn && conn.open) conn.send({ type: 'EMOJI_REACTION', emoji: emoji });
            });
        } else if (_activeHostConnection && _activeHostConnection.open) {
            _activeHostConnection.send({ type: 'EMOJI_REACTION', emoji: emoji });
        }
    }
}

function createFloatingEmojiAnimation(emoji) {
    const el = document.createElement('div');
    el.innerText = emoji;
    el.className = "fixed bottom-28 text-3xl pointer-events-none z-[990] transition-all duration-1000 transform opacity-100";
    el.style.left = `${Math.floor(30 + Math.random() * 40)}%`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transform = `translateY(-140px) scale(1.6)`;
        el.style.opacity = '0';
    }, 50);
    setTimeout(() => el.remove(), 1000);
}

function updateWatchPartyStageTrackUI() {
    const titleEl = document.getElementById('stage-track-title');
    const artistEl = document.getElementById('stage-track-artist');
    const artEl = document.getElementById('stage-track-art');
    const copyBtn = document.getElementById('copy-stage-code-btn');
    const audioNode = document.getElementById('audio-node');

    if (AppState.currentTrack) {
        if (titleEl) titleEl.innerText = AppState.currentTrack.name || AppState.currentTrack.title || 'Live Track';
        if (artistEl) artistEl.innerText = AppState.currentTrack.primaryArtists || AppState.currentTrack.artist || 'Playing Live';
        const img = AppState.currentTrack.image?.[AppState.currentTrack.image.length - 1]?.url || AppState.currentTrack.art || 'images/icon-512.png';
        if (artEl) {
            artEl.src = img;
            if (audioNode && !audioNode.paused) {
                artEl.classList.add('vinyl-spin');
            } else {
                artEl.classList.remove('vinyl-spin');
            }
        }
    }

    if (copyBtn) {
        if (AppState.syncRoomId) copyBtn.classList.remove('hidden');
        else copyBtn.classList.add('hidden');
    }
}

function forceUnlockSyncAudio() {
    const audioNode = document.getElementById('audio-node');
    const unmuteBanner = document.getElementById('sync-unmute-banner');
    if (audioNode) {
        audioNode.play().then(() => {
            if (unmuteBanner) unmuteBanner.classList.add('hidden');
            if (typeof showToastNotification === 'function') {
                showToastNotification("Live sync audio unmuted and playing!", 'success');
            }
        }).catch((err) => {
            console.error("Audio unlock error:", err);
        });
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
    const pageCountEl = document.getElementById('sync-page-member-count');
    const pageMembersContainer = document.getElementById('sync-page-members-list');
    const statusBadge = document.getElementById('sync-view-status-badge');

    let activeCount = 0;
    let hostInfo = null;
    let memberList = [];

    if (AppState.isSyncHost) {
        const activeConns = _peerConnections.filter(c => c.open);
        activeCount = activeConns.length;
        hostInfo = {
            name: AppState.profile?.name || 'Room Host',
            handle: AppState.profile?.handle || '@host',
            avatar: AppState.profile?.avatar || 'images/icon-512.png',
            isHost: true
        };
        memberList = activeConns.map(c => c._userInfo || { name: 'Listener', handle: '@user', avatar: 'images/icon-512.png' });
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

    // 1. Update Bottom Dock Text
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

    // 2. Update Members Grid (Modal & Page View)
    [membersListContainer, pageMembersContainer].forEach(container => {
        if (!container) return;
        container.innerHTML = '';
        
        // Always include Host entry
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

function leaveSyncPartyRoom() {
    if (_peerInstance) _peerInstance.destroy();
    _peerInstance = null;
    _peerConnections = [];
    _activeHostConnection = null;
    _listenerRoomMembers = [];
    _listenerRoomHost = null;

    AppState.syncRoomId = null;
    AppState.isSyncHost = false;
    updateSyncPartyDockUI();
    updateJoinedListenersCountUI();
    if (typeof showToastNotification === 'function') showToastNotification("Left Sync Room.", 'info');
}

function updateSyncPartyDockUI() {
    const dockBar = document.getElementById('sync-party-bottom-bar');
    const roomCodeEl = document.getElementById('sync-dock-room-code');
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

function openSyncPartyNavigationTarget() {
    if (typeof switchAppView === 'function') {
        switchAppView('syncparty');
    }
}

document.addEventListener('DOMContentLoaded', initSyncPartyEngine);
