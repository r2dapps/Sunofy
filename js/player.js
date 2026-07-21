// PLAYER ENGINE MODULE (AUDIO NODE, MINI PLAYER & FULLSCREEN DECK)

function setupAudioHardwareEngineControls() {
    const audioNode = document.getElementById('audio-node');
    const pBtn = document.getElementById('ctrl-play-pause');
    const nBtn = document.getElementById('ctrl-next');
    const bBtn = document.getElementById('ctrl-prev');
    const seek = document.getElementById('seek-slider');
    const vol = document.getElementById('volume-slider');
    const fsVol = document.getElementById('fs-volume-slider');

    if (pBtn) pBtn.onclick = (e) => { e.stopPropagation(); toggleAudioPlayPause(); };
    if (nBtn) nBtn.onclick = (e) => { e.stopPropagation(); playNextTrack(); };
    if (bBtn) bBtn.onclick = (e) => { e.stopPropagation(); playPrevTrack(); };

    const dockLoop = document.getElementById('dock-loop-action');
    if (dockLoop) dockLoop.onclick = (e) => { e.stopPropagation(); toggleLoopMode(); };
    const dockShuffle = document.getElementById('dock-shuffle-action');
    if (dockShuffle) dockShuffle.onclick = (e) => { e.stopPropagation(); toggleShuffleMode(); };

    if (audioNode) {
        audioNode.addEventListener('timeupdate', () => {
            if (!isNaN(audioNode.duration)) {
                const progress = (audioNode.currentTime / audioNode.duration) * 100;
                if (seek) {
                    seek.value = progress;
                    seek.style.setProperty('--seek-pct', `${progress}%`);
                }
                const topBar = document.getElementById('dock-progress-bar');
                if (topBar) topBar.style.width = `${progress}%`;
                const fsSeek = document.getElementById('fs-seek-slider');
                if (fsSeek) {
                    fsSeek.value = progress;
                    fsSeek.style.setProperty('--seek-pct', `${progress}%`);
                }
                
                const timeNowStr = formatClockSeconds(audioNode.currentTime);
                const timeMaxStr = formatClockSeconds(audioNode.duration);
                
                const lblNow = document.getElementById('lbl-time-now');
                const lblMax = document.getElementById('lbl-time-max');
                const fsLblNow = document.getElementById('fs-lbl-time-now');
                const fsLblMax = document.getElementById('fs-lbl-time-max');

                if (lblNow) lblNow.innerText = timeNowStr;
                if (lblMax) lblMax.innerText = timeMaxStr;
                if (fsLblNow) fsLblNow.innerText = timeNowStr;
                if (fsLblMax) fsLblMax.innerText = timeMaxStr;
            }
        });

        if (seek) {
            seek.addEventListener('input', () => {
                if (!isNaN(audioNode.duration)) {
                    audioNode.currentTime = (seek.value / 100) * audioNode.duration;
                    seek.style.setProperty('--seek-pct', `${seek.value}%`);
                }
            });
        }

        if (vol) {
            vol.style.setProperty('--seek-pct', `${AppState.volume * 100}%`);
            vol.addEventListener('input', (e) => {
                audioNode.volume = e.target.value;
                AppState.volume = e.target.value;
                vol.style.setProperty('--seek-pct', `${e.target.value * 100}%`);
                if (fsVol) {
                    fsVol.value = e.target.value;
                    fsVol.style.setProperty('--seek-pct', `${e.target.value * 100}%`);
                }
                updateSpeakerIcons(e.target.value);
            });
        }

        if (fsVol) {
            fsVol.style.setProperty('--seek-pct', `${AppState.volume * 100}%`);
            fsVol.addEventListener('input', (e) => {
                audioNode.volume = e.target.value;
                AppState.volume = e.target.value;
                fsVol.style.setProperty('--seek-pct', `${e.target.value * 100}%`);
                if (vol) {
                    vol.value = e.target.value;
                    vol.style.setProperty('--seek-pct', `${e.target.value * 100}%`);
                }
                updateSpeakerIcons(e.target.value);
            });
        }

        audioNode.addEventListener('ended', () => {
            if (AppState.repeatMode === 1) { // Single Repeat (Loop Track)
                audioNode.currentTime = 0;
                audioNode.play();
            } else {
                playNextTrack();
            }
        });

        audioNode.addEventListener('play', () => toggleRotationAnimation(true));
        audioNode.addEventListener('pause', () => toggleRotationAnimation(false));
    }

    const favDock = document.getElementById('dock-fav-action');
    if (favDock) {
        favDock.onclick = (e) => {
            e.stopPropagation();
            if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                toggleFavoriteTrackState(AppState.queue[AppState.queueIndex]);
                if (typeof renderFavoritesStackView === 'function') renderFavoritesStackView();
            }
        };
    }

    const dlDock = document.getElementById('dock-dl-action');
    if (dlDock) {
        dlDock.onclick = (e) => {
            e.stopPropagation();
            if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                executeBinaryOfflineDownloadCache(AppState.queue[AppState.queueIndex]);
            }
        };
    }
}

function updateSpeakerIcons(val) {
    const spk = document.getElementById('vol-speaker-icon');
    const fsSpk = document.getElementById('fs-vol-speaker-icon');
    const iconClass = val == 0 ? "fa-solid fa-volume-xmark" : (val < 0.4 ? "fa-solid fa-volume-low" : "fa-solid fa-volume-high");

    if (spk) spk.className = `${iconClass} text-xs text-muted`;
    if (fsSpk) fsSpk.className = `${iconClass} text-sm text-muted`;
}

function updateMiniPlayerIdleState() {
    const dock = document.getElementById('playback-dock');
    if (dock) dock.classList.remove('translate-y-full');
    if (AppState.queueIndex === -1) {
        const title = document.getElementById('dock-title');
        const sub = document.getElementById('dock-subtitle');
        if (title) title.innerText = "No Track Selected";
        if (sub) sub.innerText = "Select a song to start listening";
    }
}

function toggleAudioPlayPause() {
    if (AppState.queueIndex === -1 || AppState.queue.length === 0) return;
    const audioNode = document.getElementById('audio-node');
    const pBtn = document.getElementById('ctrl-play-pause');
    const fsPBtn = document.getElementById('fs-play-pause-btn');
    
    if (audioNode.paused) { 
        audioNode.play(); 
        if (pBtn) pBtn.innerHTML = `<i class="fa-solid fa-pause text-xs"></i>`;
        if (fsPBtn) fsPBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        toggleRotationAnimation(true);
    } else { 
        audioNode.pause(); 
        if (pBtn) pBtn.innerHTML = `<i class="fa-solid fa-play pl-0.5 text-xs"></i>`;
        if (fsPBtn) fsPBtn.innerHTML = `<i class="fa-solid fa-play pl-1"></i>`;
        toggleRotationAnimation(false);
    }
}

function toggleRotationAnimation(shouldSpin) {
    const dockArt = document.getElementById('dock-art');
    const fsArt = document.getElementById('fs-art');
    
    if (shouldSpin) {
        if (dockArt) dockArt.classList.add('vinyl-spin');
        if (fsArt) fsArt.classList.add('vinyl-spin');
    } else {
        if (dockArt) dockArt.classList.remove('vinyl-spin');
        if (fsArt) fsArt.classList.remove('vinyl-spin');
    }
}

function setupFullscreenPlayerControls() {
    const trigger = document.getElementById('dock-expand-trigger');
    const fsModal = document.getElementById('fullscreen-player-modal');
    const closeBtn = document.getElementById('close-fullscreen-player');

    if (trigger) {
        trigger.addEventListener('click', () => {
            if (AppState.queueIndex > -1) {
                if (fsModal) fsModal.classList.remove('translate-y-full');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (fsModal) fsModal.classList.add('translate-y-full');
        });
    }

    const fsPlayPause = document.getElementById('fs-play-pause-btn');
    const fsNext = document.getElementById('fs-next-btn');
    const fsPrev = document.getElementById('fs-prev-btn');
    const fsLoop = document.getElementById('fs-loop-btn');
    const fsShuffle = document.getElementById('fs-shuffle-btn');

    if (fsPlayPause) fsPlayPause.onclick = () => toggleAudioPlayPause();
    if (fsNext) fsNext.onclick = () => playNextTrack();
    if (fsPrev) fsPrev.onclick = () => playPrevTrack();
    if (fsLoop) fsLoop.onclick = () => toggleLoopMode();
    if (fsShuffle) fsShuffle.onclick = () => toggleShuffleMode();
    
    const fsSeek = document.getElementById('fs-seek-slider');
    if (fsSeek) {
        fsSeek.addEventListener('input', (e) => {
            const audioNode = document.getElementById('audio-node');
            if (audioNode && !isNaN(audioNode.duration)) {
                audioNode.currentTime = (e.target.value / 100) * audioNode.duration;
            }
        });
    }

    const fsFav = document.getElementById('fs-fav-btn');
    if (fsFav) {
        fsFav.onclick = () => {
            if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                toggleFavoriteTrackState(AppState.queue[AppState.queueIndex]);
                if (typeof renderFavoritesStackView === 'function') renderFavoritesStackView();
            }
        };
    }

    const fsDl = document.getElementById('fs-dl-btn');
    if (fsDl) {
        fsDl.onclick = () => {
            if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                executeBinaryOfflineDownloadCache(AppState.queue[AppState.queueIndex]);
            }
        };
    }

    const fsShare = document.getElementById('fs-share-btn');
    if (fsShare) {
        fsShare.onclick = async () => {
            if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                const track = AppState.queue[AppState.queueIndex];
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: track.name,
                            text: `Listening to ${track.name} on ${AppState.appName}!`,
                            url: window.location.href
                        });
                    } catch(e) {}
                }
            }
        };
    }
}

async function initializeTrackTargetPlayback(index) {
    if (index < 0 || index >= AppState.queue.length) return;
    AppState.queueIndex = index;
    const track = AppState.queue[AppState.queueIndex];
    AppState.currentTrack = track;

    const artUrl = track.image?.[track.image.length - 1]?.url || track.artUrl || 'images/icon-512.png';
    const albumName = track.album?.name || track.albumName || 'Single Track';
    
    const dTitle = document.getElementById('dock-title');
    const dSub = document.getElementById('dock-subtitle');
    const dArt = document.getElementById('dock-art');

    if (dTitle) dTitle.innerText = track.name;
    if (dSub) dSub.innerText = albumName;
    if (dArt) dArt.src = artUrl;

    // Update Fullscreen player UI
    const fsTitle = document.getElementById('fs-title');
    const fsSub = document.getElementById('fs-subtitle');
    const fsArt = document.getElementById('fs-art');
    const fsAlbum = document.getElementById('fs-album-title');

    if (fsTitle) fsTitle.innerText = track.name;
    if (fsSub) fsSub.innerText = albumName;
    if (fsArt) fsArt.src = artUrl;
    if (fsAlbum) fsAlbum.innerText = albumName;
    
    const dock = document.getElementById('playback-dock');
    if (dock) dock.classList.remove('translate-y-full');

    const pBtn = document.getElementById('ctrl-play-pause');
    const fsPBtn = document.getElementById('fs-play-pause-btn');

    if (pBtn) pBtn.innerHTML = `<i class="fa-solid fa-pause text-xs"></i>`;
    if (fsPBtn) fsPBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;

    const eq = document.getElementById('dock-eq-visualizer');
    if (eq) eq.classList.remove('opacity-50');

    updateFloatingDockInterfaceUI();
    updateNativeMediaSession(track);
    toggleRotationAnimation(true);

    const audioNode = document.getElementById('audio-node');

    if (idb) {
        let tx = idb.transaction("audio_files", "readonly");
        let store = tx.objectStore("audio_files");
        let req = store.get(track.id);
        req.onsuccess = () => {
            if (req.result) {
                const blob = new Blob([req.result.buffer], { type: "audio/mp4" });
                if (audioNode) {
                    audioNode.src = URL.createObjectURL(blob);
                    audioNode.load();
                    audioNode.play();
                }
            } else {
                const directUrl = track.downloadUrl?.[track.downloadUrl.length - 1]?.url || track.audioUrl || '';
                if (audioNode) {
                    audioNode.src = directUrl;
                    audioNode.load();
                    audioNode.play();
                }
            }
        };
    }
}

function updateFloatingDockInterfaceUI() {
    if (AppState.queueIndex === -1 || !AppState.queue[AppState.queueIndex]) return;
    const track = AppState.queue[AppState.queueIndex];
    const isFav = AppState.favorites.some(f => f.id === track.id);
    
    const favIconHtml = `<i class="${isFav ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart"></i>`;
    const dFav = document.getElementById('dock-fav-action');
    if (dFav) dFav.innerHTML = favIconHtml;
    
    const fsFavBtn = document.getElementById('fs-fav-btn');
    if (fsFavBtn) {
        fsFavBtn.innerHTML = `<i class="${isFav ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart"></i> ${isFav ? 'Favorited' : 'Favorite'}`;
    }
    
    if (idb) {
        let tx = idb.transaction("audio_files", "readonly");
        let req = tx.objectStore("audio_files").get(track.id);
        req.onsuccess = () => {
            const isDownloaded = !!req.result;
            const dDl = document.getElementById('dock-dl-action');
            if (dDl) dDl.className = isDownloaded ? "text-blue-400 p-2 text-sm" : "text-muted hover:text-blue-400 transition-colors p-2 text-sm";
            
            const fsDlBtn = document.getElementById('fs-dl-btn');
            if (fsDlBtn) {
                fsDlBtn.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${isDownloaded ? 'Saved' : 'Save Offline'}`;
                fsDlBtn.className = isDownloaded ? "text-blue-400 text-sm p-2" : "text-muted hover:text-blue-400 text-sm transition-colors p-2";
            }
        };
    }
}

function updateNativeMediaSession(track) {
    if ('mediaSession' in navigator) {
        const artUrl = track.image?.[track.image.length - 1]?.url || track.artUrl || 'images/icon-512.png';
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: track.album?.name || track.albumName || 'Sunofy Music',
            album: track.album?.name || track.albumName || 'Sunofy Engine',
            artwork: [
                { src: artUrl, sizes: '512x512', type: 'image/png' }
            ]
        });
        
        navigator.mediaSession.setActionHandler('play', () => toggleAudioPlayPause());
        navigator.mediaSession.setActionHandler('pause', () => toggleAudioPlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
    }
}

function formatClockSeconds(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}
