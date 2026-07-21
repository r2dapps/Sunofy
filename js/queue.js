// QUEUE MANAGEMENT & PLAYBACK NAVIGATION MODULE (SINGLE SOURCE OF TRUTH)

function setupQueueDrawerHandlers() {
    const openBtns = [document.getElementById('dock-queue-btn'), document.getElementById('fs-queue-open-btn')];
    const queueModal = document.getElementById('queue-modal');
    const closeBtns = [document.getElementById('close-queue-btn'), document.getElementById('dismiss-queue-btn')];

    openBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = (e) => {
            e.stopPropagation();
            renderQueueDrawerList();
            if (queueModal) queueModal.classList.replace('hidden', 'flex');
        };
    });

    closeBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = () => {
            if (queueModal) queueModal.classList.replace('flex', 'hidden');
        };
    });

    const clearQueueBtn = document.getElementById('clear-queue-btn');
    if (clearQueueBtn) {
        clearQueueBtn.onclick = () => {
            AppState.queue = [];
            AppState.queueIndex = -1;
            const audioNode = document.getElementById('audio-node');
            if (audioNode) audioNode.pause();
            if (typeof updateMiniPlayerIdleState === 'function') updateMiniPlayerIdleState();
            renderQueueDrawerList();
        };
    }
}

function renderQueueDrawerList() {
    const container = document.getElementById('queue-tracks-list');
    const countText = document.getElementById('queue-count-text');
    if (countText) countText.innerText = `${AppState.queue.length} tracks queued`;
    if (!container) return;
    container.innerHTML = '';

    if (AppState.queue.length === 0) {
        container.innerHTML = `<p class="text-xs text-muted text-center py-6">No tracks queued.</p>`;
        return;
    }

    AppState.queue.forEach((t, i) => {
        const isCurrent = i === AppState.queueIndex;
        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-2 rounded-xl text-xs ${isCurrent ? 'bg-accent/15 border border-accent/40 text-accent font-bold' : 'bg-app-body border border-app text-main'}`;
        row.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1 cursor-pointer trigger-queue-item">
                <span class="mono text-[10px] text-muted w-4 shrink-0">${i + 1}</span>
                <div class="min-w-0 flex-1 truncate">
                    <div class="truncate">${t.name}</div>
                    <div class="text-[9px] text-muted truncate">${t.album?.name || t.albumName || ''}</div>
                </div>
            </div>
            <button class="w-6 h-6 text-muted hover:text-red-400 action-remove-queue"><i class="fa-solid fa-xmark"></i></button>
        `;

        row.querySelector('.trigger-queue-item').onclick = () => {
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(i);
            }
            const modal = document.getElementById('queue-modal');
            if (modal) modal.classList.replace('flex', 'hidden');
        };

        row.querySelector('.action-remove-queue').onclick = (e) => {
            e.stopPropagation();
            AppState.queue.splice(i, 1);
            if (AppState.queueIndex > i) AppState.queueIndex--;
            renderQueueDrawerList();
        };

        container.appendChild(row);
    });
}

function playNextTrack() {
    if (AppState.queue.length === 0) return;
    
    if (AppState.shuffle && AppState.queue.length > 1) {
        let nextRand = Math.floor(Math.random() * AppState.queue.length);
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(nextRand);
        }
        return;
    }

    if (AppState.queueIndex + 1 < AppState.queue.length) {
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(AppState.queueIndex + 1);
        }
    } else {
        if (AppState.repeatMode === 2) { // List Repeat (Loop Queue)
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(0);
            }
        } else {
            const audioNode = document.getElementById('audio-node');
            if (audioNode) audioNode.pause();
            const pBtn = document.getElementById('ctrl-play-pause');
            const fsPBtn = document.getElementById('fs-play-pause-btn');
            if (pBtn) pBtn.innerHTML = `<i class="fa-solid fa-play pl-0.5 text-xs"></i>`;
            if (fsPBtn) fsPBtn.innerHTML = `<i class="fa-solid fa-play pl-1"></i>`;
            if (typeof toggleRotationAnimation === 'function') toggleRotationAnimation(false);
        }
    }
}

function playPrevTrack() {
    if (AppState.queue.length === 0) return;
    if (AppState.queueIndex - 1 >= 0) {
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(AppState.queueIndex - 1);
        }
    } else {
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(AppState.queue.length - 1);
        }
    }
}

function toggleLoopMode() {
    AppState.repeatMode = (AppState.repeatMode + 1) % 3;
    const loopBtn = document.getElementById('dock-loop-action');
    const fsLoopBtn = document.getElementById('fs-loop-btn');
    const fsRepeatStateText = document.getElementById('fs-repeat-state-text');
    const audioNode = document.getElementById('audio-node');

    if (AppState.repeatMode === 0) { // Off
        if (loopBtn) {
            loopBtn.className = "text-muted hover:text-main p-1.5 text-xs transition-colors";
            loopBtn.title = "Repeat: Off";
        }
        if (fsLoopBtn) {
            fsLoopBtn.className = "text-muted hover:text-main text-base p-2 transition-colors";
            fsLoopBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i>`;
        }
        if (fsRepeatStateText) fsRepeatStateText.innerText = "Repeat: Off";
        if (audioNode) audioNode.loop = false;
    } else if (AppState.repeatMode === 1) { // Single Repeat (Loop Track)
        if (loopBtn) {
            loopBtn.className = "text-accent drop-shadow-[0_0_6px_var(--accent-glow)] p-1.5 text-xs transition-colors font-bold";
            loopBtn.title = "Repeat: Single Track";
        }
        if (fsLoopBtn) {
            fsLoopBtn.className = "text-accent drop-shadow-[0_0_6px_var(--accent-glow)] text-base p-2 transition-colors font-bold";
            fsLoopBtn.innerHTML = `<i class="fa-solid fa-repeat"></i> <span class="text-[9px] font-black uppercase ml-1">Track</span>`;
        }
        if (fsRepeatStateText) fsRepeatStateText.innerText = "Repeat: Single Track";
    } else if (AppState.repeatMode === 2) { // List Repeat (Loop Queue)
        if (loopBtn) {
            loopBtn.className = "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)] p-1.5 text-xs transition-colors font-bold";
            loopBtn.title = "Repeat: List Queue";
        }
        if (fsLoopBtn) {
            fsLoopBtn.className = "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)] text-base p-2 transition-colors font-bold";
            fsLoopBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> <span class="text-[9px] font-black uppercase ml-1">Queue</span>`;
        }
        if (fsRepeatStateText) fsRepeatStateText.innerText = "Repeat: List Queue";
        if (audioNode) audioNode.loop = false;
    }
}

function toggleShuffleMode() {
    AppState.shuffle = !AppState.shuffle;
    const shuffleBtn = document.getElementById('dock-shuffle-action');
    const fsShuffleBtn = document.getElementById('fs-shuffle-btn');

    if (AppState.shuffle) {
        if (shuffleBtn) shuffleBtn.className = "text-accent drop-shadow-[0_0_6px_var(--accent-glow)] p-1.5 text-xs transition-colors";
        if (fsShuffleBtn) fsShuffleBtn.className = "text-accent drop-shadow-[0_0_6px_var(--accent-glow)] text-base p-2 transition-colors";
    } else {
        if (shuffleBtn) shuffleBtn.className = "text-muted hover:text-main p-1.5 text-xs transition-colors";
        if (fsShuffleBtn) fsShuffleBtn.className = "text-muted hover:text-main text-base p-2 transition-colors";
    }
}
