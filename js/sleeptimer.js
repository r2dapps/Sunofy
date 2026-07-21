// BEDTIME SLEEP TIMER MODULE
let sleepTimerInterval = null;
let sleepTimerRemainingSeconds = 0;

function startBedtimeSleepTimer(minutes) {
    clearBedtimeSleepTimer();
    if (minutes <= 0) {
        updateSleepTimerDisplayUI(0);
        return;
    }

    sleepTimerRemainingSeconds = minutes * 60;
    updateSleepTimerDisplayUI(sleepTimerRemainingSeconds);

    sleepTimerInterval = setInterval(() => {
        sleepTimerRemainingSeconds--;
        updateSleepTimerDisplayUI(sleepTimerRemainingSeconds);

        if (sleepTimerRemainingSeconds <= 0) {
            clearBedtimeSleepTimer();
            fadeAndStopAudioPlayback();
        }
    }, 1000);
}

function clearBedtimeSleepTimer() {
    if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
    }
    sleepTimerRemainingSeconds = 0;
    updateSleepTimerDisplayUI(0);
}

function fadeAndStopAudioPlayback() {
    const audioNode = document.getElementById('audio-node');
    if (!audioNode) return;

    let fadeVolume = audioNode.volume;
    const fadeInterval = setInterval(() => {
        if (fadeVolume > 0.05) {
            fadeVolume -= 0.05;
            audioNode.volume = fadeVolume;
        } else {
            clearInterval(fadeInterval);
            audioNode.pause();
            audioNode.volume = AppState.volume || 0.7;
            if (typeof toggleAudioPlayPause === 'function') {
                const pBtn = document.getElementById('ctrl-play-pause');
                if (pBtn) pBtn.innerHTML = `<i class="fa-solid fa-play pl-0.5 text-xs"></i>`;
            }
            alert("🌙 Sunofy Sleep Timer: Audio playback paused. Sweet dreams!");
        }
    }, 200);
}

function updateSleepTimerDisplayUI(seconds) {
    const badge = document.getElementById('sleep-timer-badge');
    const modalText = document.getElementById('sleep-timer-status-text');

    if (seconds > 0) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (badge) {
            badge.innerText = `🌙 ${formatted}`;
            badge.classList.remove('hidden');
        }
        if (modalText) modalText.innerText = `Timer active: ${formatted} remaining`;
    } else {
        if (badge) badge.classList.add('hidden');
        if (modalText) modalText.innerText = `Timer off`;
    }
}

function setupSleepTimerHandlers() {
    const openBtns = [document.getElementById('open-sleep-timer-btn'), document.getElementById('fs-sleep-btn')];
    const modal = document.getElementById('sleep-timer-modal');
    const closeBtn = document.getElementById('close-sleep-timer-btn');

    openBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = (e) => {
            e.stopPropagation();
            if (modal) modal.classList.replace('hidden', 'flex');
        };
    });

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.replace('flex', 'hidden');
    }

    document.querySelectorAll('.sleep-opt-btn').forEach(btn => {
        btn.onclick = () => {
            const mins = parseInt(btn.getAttribute('data-mins'));
            startBedtimeSleepTimer(mins);
            document.querySelectorAll('.sleep-opt-btn').forEach(b => {
                b.className = "sleep-opt-btn text-xs py-2 px-3 rounded-xl border border-app bg-app-body text-main hover:border-accent font-semibold transition-all cursor-pointer";
            });
            btn.className = "sleep-opt-btn text-xs py-2 px-3 rounded-xl border border-accent/40 bg-accent/15 text-accent font-bold transition-all cursor-pointer";
            if (modal) modal.classList.replace('flex', 'hidden');
        };
    });

    const cancelBtn = document.getElementById('cancel-sleep-timer-btn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            clearBedtimeSleepTimer();
            if (modal) modal.classList.replace('flex', 'hidden');
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupSleepTimerHandlers();
});
