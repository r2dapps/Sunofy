// SUNOFY SYNC PARTY - REAL-TIME LISTEN TOGETHER ENGINE
let _syncChannel = null;

function initSyncPartyEngine() {
    try {
        _syncChannel = new BroadcastChannel('sunofy_sync_party_channel');
        _syncChannel.onmessage = (e) => {
            const data = e.data;
            if (!data || !AppState.syncRoomId) return;

            // Only process messages for active room
            if (data.roomId === AppState.syncRoomId && !AppState.isSyncHost) {
                handleIncomingSyncCommand(data);
            }
        };
    } catch(e) {
        console.warn("[SyncParty] BroadcastChannel not supported, falling back to window storage events.");
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'ok_sync_event' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.roomId === AppState.syncRoomId && !AppState.isSyncHost) {
                    handleIncomingSyncCommand(data);
                }
            } catch(err) {}
        }
    });
}

function broadcastSyncCommand(command, payload = {}) {
    if (!AppState.syncRoomId || !AppState.isSyncHost) return;

    const data = {
        roomId: AppState.syncRoomId,
        command: command,
        payload: payload,
        timestamp: Date.now()
    };

    if (_syncChannel) {
        _syncChannel.postMessage(data);
    }
    localStorage.setItem('ok_sync_event', JSON.stringify(data));
}

function handleIncomingSyncCommand(data) {
    const { command, payload } = data;
    const audioNode = document.getElementById('audio-node');

    if (command === 'PLAY_TRACK') {
        if (payload.track) {
            AppState.queue = [payload.track];
            AppState.queueIndex = 0;
            if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
            if (audioNode) {
                const url = payload.track.downloadUrl?.[payload.track.downloadUrl.length - 1]?.url || payload.track.audioUrl || '';
                audioNode.src = url;
                if (payload.currentTime) audioNode.currentTime = payload.currentTime;
                audioNode.play().catch(() => {});
            }
        }
    } else if (command === 'PAUSE') {
        if (audioNode) audioNode.pause();
    } else if (command === 'RESUME') {
        if (audioNode) audioNode.play().catch(() => {});
    } else if (command === 'SEEK') {
        if (audioNode && payload.currentTime) audioNode.currentTime = payload.currentTime;
    }
}

function createSyncPartyRoom() {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    AppState.syncRoomId = roomId;
    AppState.isSyncHost = true;
    updateSyncPartyUI();
}

function joinSyncPartyRoom(roomId) {
    if (!roomId) return;
    AppState.syncRoomId = roomId.trim();
    AppState.isSyncHost = false;
    updateSyncPartyUI();
}

function leaveSyncPartyRoom() {
    AppState.syncRoomId = null;
    AppState.isSyncHost = false;
    updateSyncPartyUI();
}

function updateSyncPartyUI() {
    const badge = document.getElementById('sync-room-badge');
    const statusText = document.getElementById('sync-status-text');
    const hostBtn = document.getElementById('host-sync-btn');
    const joinBtn = document.getElementById('join-sync-btn');
    const leaveBtn = document.getElementById('leave-sync-btn');

    if (AppState.syncRoomId) {
        if (badge) {
            badge.innerText = `🎧 ROOM: ${AppState.syncRoomId} (${AppState.isSyncHost ? 'HOST' : 'LISTENER'})`;
            badge.classList.remove('hidden');
        }
        if (statusText) {
            statusText.innerText = AppState.isSyncHost 
                ? `Hosting Room ${AppState.syncRoomId}. Share code with friends!`
                : `Connected to Host Room ${AppState.syncRoomId}. Listening together!`;
        }
        if (hostBtn) hostBtn.classList.add('hidden');
        if (joinBtn) joinBtn.classList.add('hidden');
        if (leaveBtn) leaveBtn.classList.remove('hidden');
    } else {
        if (badge) badge.classList.add('hidden');
        if (statusText) statusText.innerText = "Listen to music in sync with friends in real-time.";
        if (hostBtn) hostBtn.classList.remove('hidden');
        if (joinBtn) joinBtn.classList.remove('hidden');
        if (leaveBtn) leaveBtn.classList.add('hidden');
    }
}
