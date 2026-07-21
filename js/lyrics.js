// LYRICS ENGINE MODULE

function setupLyricsDrawerHandlers() {
    const fsLyricsBtn = document.getElementById('fs-lyrics-btn');
    const closeLyricsBtn = document.getElementById('close-lyrics-btn');
    const lyricsPanel = document.getElementById('fs-lyrics-panel');

    if (fsLyricsBtn && lyricsPanel) {
        fsLyricsBtn.onclick = () => {
            if (lyricsPanel.classList.contains('hidden')) {
                lyricsPanel.classList.remove('hidden');
                if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                    fetchAndRenderSongLyrics(AppState.queue[AppState.queueIndex]);
                }
            } else {
                lyricsPanel.classList.add('hidden');
            }
        };
    }

    if (closeLyricsBtn && lyricsPanel) {
        closeLyricsBtn.onclick = () => {
            lyricsPanel.classList.add('hidden');
        };
    }
}

async function fetchAndRenderSongLyrics(track) {
    const body = document.getElementById('lyrics-content-body');
    if (!body) return;
    body.innerHTML = `<p class="text-accent animate-pulse py-8"><i class="fa-solid fa-circle-notch animate-spin mr-1"></i> Fetching track lyrics...</p>`;
    
    try {
        const res = await fetch(`https://saavn.sumit.co/api/songs/${track.id}/lyrics`);
        if (!res.ok) {
            body.innerHTML = `
                <div class="py-12 space-y-2 text-center">
                    <p class="text-muted text-xs">🎶 Instrumental or static lyrics unavailable for this track.</p>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${track.name}</p>
                </div>`;
            return;
        }
        const payload = await res.json();
        if (payload.success && payload.data?.lyrics) {
            body.innerHTML = payload.data.lyrics.replace(/\n/g, '<br>');
        } else {
            body.innerHTML = `
                <div class="py-12 space-y-2 text-center">
                    <p class="text-muted text-xs">🎶 Instrumental or static lyrics unavailable for this track.</p>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${track.name}</p>
                </div>`;
        }
    } catch (e) {
        body.innerHTML = `<div class="py-12 text-center text-muted"><p class="text-xs">Lyrics stream unavailable in offline mode.</p></div>`;
    }
}

// Bind handlers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupLyricsDrawerHandlers();
});
