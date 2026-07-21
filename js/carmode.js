// CAR PLAY / LARGE TOUCH MODE MODULE

function setupCarPlayModeHandlers() {
    const openBtn = document.getElementById('open-car-mode-btn');
    const closeBtn = document.getElementById('close-car-mode-btn');
    const carModal = document.getElementById('car-mode-modal');

    if (openBtn && carModal) {
        openBtn.onclick = () => {
            updateCarModePlayerUI();
            carModal.classList.replace('hidden', 'flex');
        };
    }

    if (closeBtn && carModal) {
        closeBtn.onclick = () => {
            carModal.classList.replace('flex', 'hidden');
        };
    }

    const carPlayPause = document.getElementById('car-play-pause-btn');
    const carNext = document.getElementById('car-next-btn');
    const carPrev = document.getElementById('car-prev-btn');

    if (carPlayPause) {
        carPlayPause.onclick = () => {
            if (typeof toggleAudioPlayPause === 'function') toggleAudioPlayPause();
            updateCarModePlayerUI();
        };
    }

    if (carNext) {
        carNext.onclick = () => {
            if (typeof playNextTrack === 'function') playNextTrack();
            setTimeout(updateCarModePlayerUI, 100);
        };
    }

    if (carPrev) {
        carPrev.onclick = () => {
            if (typeof playPrevTrack === 'function') playPrevTrack();
            setTimeout(updateCarModePlayerUI, 100);
        };
    }
}

function updateCarModePlayerUI() {
    if (AppState.queueIndex === -1 || !AppState.queue[AppState.queueIndex]) return;
    const track = AppState.queue[AppState.queueIndex];

    const carTitle = document.getElementById('car-track-title');
    const carArtist = document.getElementById('car-track-artist');
    const carArt = document.getElementById('car-track-art');
    const carPlayPause = document.getElementById('car-play-pause-btn');

    if (carTitle) carTitle.innerText = track.name;
    if (carArtist) carArtist.innerText = track.album?.name || track.albumName || 'Sunofy Stream';
    if (carArt) carArt.src = track.image?.[track.image.length - 1]?.url || track.artUrl || 'icon-512.png';

    const audioNode = document.getElementById('audio-node');
    if (audioNode && carPlayPause) {
        if (audioNode.paused) {
            carPlayPause.innerHTML = `<i class="fa-solid fa-play text-4xl pl-1"></i>`;
        } else {
            carPlayPause.innerHTML = `<i class="fa-solid fa-pause text-4xl"></i>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupCarPlayModeHandlers();
});
