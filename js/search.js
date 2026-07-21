// SEARCH ENGINE MODULE

function getActiveLanguageFilterQuery() {
    let selected = [];
    document.querySelectorAll('.lang-opt:checked').forEach(el => selected.push(el.value));
    return selected.length > 0 ? selected.join(',') : 'telugu';
}

async function triggerLiveQuerySearch(query) {
    const spinner = document.getElementById('loading-spinner');
    const targetOutput = document.getElementById('search-output-list');
    if (spinner) spinner.classList.remove('hidden');

    AppState.recentSearches = AppState.recentSearches.filter(h => h !== query);
    AppState.recentSearches.unshift(query);
    if (AppState.recentSearches.length > 15) AppState.recentSearches.pop();
    saveStateToLocalStorage('ok_hist', AppState.recentSearches);
    renderHistoryTagsFeed();

    try {
        const activeLangs = getActiveLanguageFilterQuery();
        const queryEndpoint = `${AppState.apiEndpoint}?query=${encodeURIComponent(query)}&language=${activeLangs}`;
        const response = await fetch(queryEndpoint);
        const payload = await response.json();

        if (payload.success && payload.data?.results?.length > 0) {
            renderSearchOutputsFeed(payload.data.results);
        } else {
            if (targetOutput) targetOutput.innerHTML = `<p class="text-xs text-gray-500 text-center py-12">No stream references matched input.</p>`;
        }
    } catch (e) {
        if (targetOutput) targetOutput.innerHTML = `<p class="text-xs text-red-400 text-center py-12"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Data interface streaming failure.</p>`;
    } finally {
        if (spinner) spinner.classList.add('hidden');
    }
}

function renderHistoryTagsFeed() {
    const container = document.getElementById('history-tags');
    const clearBtn = document.getElementById('clear-history-btn');
    if (!container) return;
    container.innerHTML = '';
    
    if (AppState.recentSearches.length === 0) {
        if (clearBtn) clearBtn.classList.add('hidden');
        return;
    } else {
        if (clearBtn) clearBtn.classList.remove('hidden');
    }

    AppState.recentSearches.forEach((h, idx) => {
        const tag = document.createElement('span');
        tag.className = "bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 text-[11px]";
        tag.innerHTML = `<span class="truncate max-w-[80px]">${h}</span> <button class="hover:text-red-400 action-del-search"><i class="fa-solid fa-xmark text-[9px]"></i></button>`;
        
        tag.querySelector('.truncate').onclick = () => {
            const input = document.getElementById('global-search-input');
            if (input) input.value = h;
            triggerLiveQuerySearch(h);
        };
        tag.querySelector('.action-del-search').onclick = (e) => {
            e.stopPropagation();
            AppState.recentSearches.splice(idx, 1);
            saveStateToLocalStorage('ok_hist', AppState.recentSearches);
            renderHistoryTagsFeed();
        };
        container.appendChild(tag);
    });
}

function createStandardTrackRowItem(track, actionsContext = true) {
    const art = track.image?.[track.image.length - 1]?.url || track.artUrl || '';
    const isFav = AppState.favorites.some(f => f.id === track.id);
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-2 bg-gray-900/30 hover:bg-gray-900/90 border border-gray-800/40 rounded-xl transition-all group";
    
    row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer trigger-playback-zone">
            <img src="${art}" class="w-10 h-10 rounded-lg bg-gray-800 object-cover border border-gray-700/50">
            <div class="min-w-0 flex-1">
                <h4 class="text-xs font-semibold text-gray-200 group-hover:text-green-400 truncate transition-colors">${track.name}</h4>
                <p class="text-[10px] text-gray-500 truncate mt-0.5">${track.album?.name || track.albumName || 'Single Track'}</p>
            </div>
        </div>
        ${actionsContext ? `
        <div class="flex items-center gap-1 pl-2">
            <button class="w-7 h-7 text-xs flex items-center justify-center transition-colors action-fav ${isFav ? 'text-red-500' : 'text-gray-500 hover:text-white'}"><i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
            <button class="w-7 h-7 text-xs text-gray-500 hover:text-white flex items-center justify-center action-modal-pl"><i class="fa-solid fa-folder-plus"></i></button>
        </div>` : ''}
    `;

    row.querySelector('.trigger-playback-zone').addEventListener('click', () => {
        AppState.queue = [track];
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(0);
        }
    });

    if (actionsContext) {
        row.querySelector('.action-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteTrackState(track);
            if (typeof renderFavoritesStackView === 'function') renderFavoritesStackView();
        });
        row.querySelector('.action-modal-pl').addEventListener('click', (e) => {
            e.stopPropagation();
            launchPlaylistVaultAppendModal(track);
        });
    }
    return row;
}

function renderSearchOutputsFeed(songs) {
    const container = document.getElementById('search-output-list');
    if (!container) return;
    container.innerHTML = '';
    songs.forEach((song, idx) => {
        const row = createStandardTrackRowItem(song);
        row.querySelector('.trigger-playback-zone').onclick = () => {
            AppState.queue = [...songs];
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(idx);
            }
        };
        container.appendChild(row);
    });
}

function renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;
    container.innerHTML = '';
    AppState.customCategories.forEach((cat) => {
        const btn = document.createElement('button');
        btn.className = "category-pill shrink-0 bg-gray-900/60 hover:bg-green-500/10 hover:text-green-400 border border-gray-800 hover:border-green-500/30 text-gray-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer";
        btn.innerText = cat.name;
        btn.onclick = () => {
            const input = document.getElementById('global-search-input');
            if (input) input.value = cat.query;
            triggerLiveQuerySearch(cat.query);
        };
        container.appendChild(btn);
    });
}

function setupFormHandlers() {
    const searchForm = document.getElementById('global-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('global-search-input');
            const q = input ? input.value.trim() : '';
            if (q) triggerLiveQuerySearch(q);
        });
    }

    const plForm = document.getElementById('playlist-create-form');
    if (plForm) {
        plForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('new-playlist-title');
            const title = titleInput ? titleInput.value.trim() : '';
            if (title) {
                AppState.playlists.push({ id: 'pl_' + Date.now(), name: title, tracks: [] });
                saveStateToLocalStorage('ok_lists', AppState.playlists);
                if (titleInput) titleInput.value = "";
                if (typeof renderPlaylistsVaultGrid === 'function') renderPlaylistsVaultGrid();
                if (typeof updateProfileStats === 'function') updateProfileStats();
            }
        });
    }

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('playlist-modal');
            if (modal) modal.classList.replace('flex', 'hidden');
        });
    }

    const clearHistBtn = document.getElementById('clear-history-btn');
    if (clearHistBtn) {
        clearHistBtn.addEventListener('click', () => {
            AppState.recentSearches = [];
            saveStateToLocalStorage('ok_hist', AppState.recentSearches);
            renderHistoryTagsFeed();
        });
    }
}
