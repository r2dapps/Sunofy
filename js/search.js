// SEARCH ENGINE MODULE WITH RICH MUSIC FILTERS (LANGUAGES, ARTISTS, DIRECTORS & GENRES)

let _searchDebounceTimer = null;

function getActiveLanguageFilterQuery() {
    let selected = [];
    document.querySelectorAll('.lang-opt:checked').forEach(el => selected.push(el.value));
    return selected.length > 0 ? selected.join(',') : 'telugu,hindi,tamil,english';
}

let _currentSearchType = 'songs'; // 'songs', 'playlists', 'albums'

function setSearchTypeMode(mode) {
    _currentSearchType = mode;
    document.querySelectorAll('.search-type-pill').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.className = "search-type-pill bg-accent text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm";
        } else {
            btn.className = "search-type-pill bg-app-card text-muted hover:text-main border border-app px-3 py-1 rounded-full text-xs font-semibold transition-all";
        }
    });

    const searchInput = document.getElementById('global-search-input');
    const query = searchInput ? searchInput.value.trim() : 'Telugu Melodies';
    if (query) triggerLiveQuerySearch(query, 0);
}

async function triggerLiveQuerySearch(query, debounceMs = 0) {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
    if (debounceMs > 0) {
        return new Promise(resolve => {
            _searchDebounceTimer = setTimeout(() => resolve(triggerLiveQuerySearch(query, 0)), debounceMs);
        });
    }

    const spinner = document.getElementById('loading-spinner');
    const targetOutput = document.getElementById('search-output-list');
    if (spinner) spinner.classList.remove('hidden');

    AppState.recentSearches = AppState.recentSearches.filter(h => h !== query);
    AppState.recentSearches.unshift(query);
    if (AppState.recentSearches.length > 15) AppState.recentSearches.pop();
    saveStateToLocalStorage('ok_hist', AppState.recentSearches);
    renderHistoryTagsFeed();

    try {
        if (_currentSearchType === 'playlists') {
            await executePlaylistSearch(query);
        } else if (_currentSearchType === 'albums') {
            await executeAlbumSearch(query);
        } else {
            const activeLangs = getActiveLanguageFilterQuery();
            const payload = await apiFetch('search/songs', { query, language: activeLangs });
            if (payload.success && payload.data?.results?.length > 0) {
                renderSearchOutputsFeed(payload.data.results);
            } else {
                if (targetOutput) targetOutput.innerHTML = `<p class="text-xs text-muted text-center py-12">No songs found matching "${query}".</p>`;
            }
        }
    } catch (e) {
        console.error('[Search] Error during search:', e);
        if (targetOutput) targetOutput.innerHTML = `<p class="text-xs text-red-400 text-center py-12"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Could not fetch results. Please try again.</p>`;
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
        tag.className = "bg-app-card hover:bg-app-card-hover border border-app text-muted hover:text-main px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 text-[11px]";
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
    const art = track.image?.[track.image.length - 1]?.url || track.artUrl || 'images/icon-512.png';
    const isFav = AppState.favorites.some(f => f.id === track.id);
    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-2 bg-app-card hover:bg-app-card/80 border border-app rounded-xl transition-all group";
    
    row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer trigger-playback-zone">
            <img src="${art}" class="w-10 h-10 rounded-lg bg-gray-800 object-cover border border-gray-700/50">
            <div class="min-w-0 flex-1">
                <h4 class="text-xs font-semibold text-main group-hover:text-accent truncate transition-colors">${track.name}</h4>
                <p class="text-[10px] text-muted truncate mt-0.5">${track.album?.name || track.albumName || 'Single Track'}</p>
            </div>
        </div>
        ${actionsContext ? `
        <div class="flex items-center gap-1 pl-2">
            <button class="w-7 h-7 text-xs text-muted hover:text-purple-400 flex items-center justify-center action-add-queue" title="Add to Queue"><i class="fa-solid fa-list-check"></i></button>
            <button class="w-7 h-7 text-xs flex items-center justify-center transition-colors action-fav ${isFav ? 'text-red-500' : 'text-muted hover:text-main'}" title="Favorite"><i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
            <button class="w-7 h-7 text-xs text-muted hover:text-main flex items-center justify-center action-modal-pl" title="Add to Playlist Vault"><i class="fa-solid fa-folder-plus"></i></button>
        </div>` : ''}
    `;

    row.querySelector('.trigger-playback-zone').addEventListener('click', () => {
        AppState.queue = [track];
        if (typeof initializeTrackTargetPlayback === 'function') {
            initializeTrackTargetPlayback(0);
        }
    });

    if (actionsContext) {
        row.querySelector('.action-add-queue').addEventListener('click', (e) => {
            e.stopPropagation();
            AppState.queue.push(track);
            if (typeof showToastNotification === 'function') {
                showToastNotification(`Added "${track.name}" to queue`, 'queue');
            }
        });
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
        btn.className = "category-pill shrink-0 bg-app-card hover:bg-accent/15 hover:text-accent border border-app hover:border-accent/40 text-muted px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer";
        btn.innerText = cat.name;
        btn.onclick = () => {
            const input = document.getElementById('global-search-input');
            if (input) input.value = cat.query;
            triggerLiveQuerySearch(cat.query);
        };
        container.appendChild(btn);
    });
}

function setupMusicFilterModalHandlers() {
    const openBtn = document.getElementById('open-filters-btn');
    const modal = document.getElementById('music-filters-modal');
    const closeBtn = document.getElementById('close-filters-btn');
    const applyBtn = document.getElementById('apply-filters-btn');

    if (openBtn && modal) {
        openBtn.onclick = () => modal.classList.replace('hidden', 'flex');
    }
    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.replace('flex', 'hidden');
    }

    if (applyBtn) {
        applyBtn.onclick = () => {
            updateActiveFilterCountBadge();
            const input = document.getElementById('global-search-input');
            const q = input && input.value ? input.value : 'Telugu Melodies';
            triggerLiveQuerySearch(q);
            if (modal) modal.classList.replace('flex', 'hidden');
        };
    }

    document.querySelectorAll('.lang-opt').forEach(chk => {
        chk.addEventListener('change', () => updateActiveFilterCountBadge());
    });

    document.querySelectorAll('.filter-quick-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const query = pill.getAttribute('data-query');
            if (query) {
                const input = document.getElementById('global-search-input');
                if (input) input.value = query;
                triggerLiveQuerySearch(query);
                if (modal) modal.classList.replace('flex', 'hidden');
            }
        });
    });
}

function updateActiveFilterCountBadge() {
    const checked = document.querySelectorAll('.lang-opt:checked').length;
    const badge = document.getElementById('filter-active-count');
    if (badge) {
        badge.innerText = checked;
    }
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

    setupMusicFilterModalHandlers();
}

async function executePlaylistSearch(query) {
    const targetOutput = document.getElementById('search-output-list');
    if (!targetOutput) return;
    targetOutput.innerHTML = `<p class="text-xs text-muted text-center py-12"><i class="fa-solid fa-circle-notch animate-spin mr-1 text-accent"></i> Searching public playlists...</p>`;

    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data?.results?.length > 0) {
            renderPlaylistsSearchResults(json.data.results);
        } else {
            targetOutput.innerHTML = `<p class="text-xs text-muted text-center py-12">No playlists found matching "${query}".</p>`;
        }
    } catch (e) {
        targetOutput.innerHTML = `<p class="text-xs text-red-400 text-center py-12">Failed to load playlists.</p>`;
    }
}

async function executeAlbumSearch(query) {
    const targetOutput = document.getElementById('search-output-list');
    if (!targetOutput) return;
    targetOutput.innerHTML = `<p class="text-xs text-muted text-center py-12"><i class="fa-solid fa-circle-notch animate-spin mr-1 text-accent"></i> Searching music albums...</p>`;

    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data?.results?.length > 0) {
            renderAlbumsSearchResults(json.data.results);
        } else {
            targetOutput.innerHTML = `<p class="text-xs text-muted text-center py-12">No albums found matching "${query}".</p>`;
        }
    } catch (e) {
        targetOutput.innerHTML = `<p class="text-xs text-red-400 text-center py-12">Failed to load albums.</p>`;
    }
}

function renderPlaylistsSearchResults(playlists) {
    const container = document.getElementById('search-output-list');
    if (!container) return;
    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>`;
    const grid = container.querySelector('div');

    playlists.forEach(pl => {
        const imgUrl = pl.image?.[pl.image.length - 1]?.url || pl.image || 'images/icon-512.png';
        const card = document.createElement('div');
        card.className = "bg-app-card border border-app rounded-xl p-3 flex gap-3 items-center hover:border-accent transition-colors group cursor-pointer shadow-sm";
        card.innerHTML = `
            <img src="${imgUrl}" class="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0">
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-main group-hover:text-accent truncate">${pl.name}</h4>
                <p class="text-[10px] text-muted truncate mt-0.5"><i class="fa-solid fa-list-ul mr-1 text-accent"></i> ${pl.songCount || '20+'} tracks</p>
                <div class="flex items-center gap-1.5 mt-2">
                    <button class="bg-accent hover:bg-accent-hover text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-all action-play-full-pl">
                        <i class="fa-solid fa-play mr-1"></i> Play Playlist
                    </button>
                    <button class="bg-app-body border border-app hover:border-accent text-main text-[10px] font-bold px-2 py-1 rounded-md transition-all action-import-pl" title="Import to My Vault">
                        <i class="fa-solid fa-bookmark text-accent"></i>
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.action-play-full-pl').onclick = (e) => {
            e.stopPropagation();
            loadAndPlayPlaylistById(pl.id, pl.name);
        };
        card.querySelector('.action-import-pl').onclick = (e) => {
            e.stopPropagation();
            importExternalPlaylistToVault(pl.id, pl.name);
        };

        grid.appendChild(card);
    });
}

function renderAlbumsSearchResults(albums) {
    const container = document.getElementById('search-output-list');
    if (!container) return;
    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>`;
    const grid = container.querySelector('div');

    albums.forEach(alb => {
        const imgUrl = alb.image?.[alb.image.length - 1]?.url || alb.image || 'images/icon-512.png';
        const card = document.createElement('div');
        card.className = "bg-app-card border border-app rounded-xl p-3 flex gap-3 items-center hover:border-accent transition-colors group cursor-pointer shadow-sm";
        card.innerHTML = `
            <img src="${imgUrl}" class="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0">
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-main group-hover:text-accent truncate">${alb.name}</h4>
                <p class="text-[10px] text-muted truncate mt-0.5"><i class="fa-solid fa-compact-disc mr-1 text-accent"></i> ${alb.year || 'Album'}</p>
                <button class="mt-2 bg-accent hover:bg-accent-hover text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-all action-play-alb">
                    <i class="fa-solid fa-play mr-1"></i> Play Album
                </button>
            </div>
        `;

        card.querySelector('.action-play-alb').onclick = (e) => {
            e.stopPropagation();
            loadAndPlayAlbumById(alb.id, alb.name);
        };

        grid.appendChild(card);
    });
}

async function loadAndPlayPlaylistById(playlistId, name = "Playlist") {
    try {
        const res = await fetch(`https://saavn.sumit.co/api/playlists?id=${playlistId}`);
        const json = await res.json();
        if (json.success && json.data?.songs?.length > 0) {
            AppState.queue = json.data.songs;
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(0);
            }
            if (typeof showToastNotification === 'function') {
                showToastNotification(`Loaded ${json.data.songs.length} songs from playlist "${name}"`, 'queue');
            }
        } else {
            if (typeof showToastNotification === 'function') {
                showToastNotification(`Could not load tracks for playlist "${name}".`, 'error');
            }
        }
    } catch (e) {
        console.error("Playlist load error:", e);
    }
}

async function loadAndPlayAlbumById(albumId, name = "Album") {
    try {
        const res = await fetch(`https://saavn.sumit.co/api/albums?id=${albumId}`);
        const json = await res.json();
        if (json.success && json.data?.songs?.length > 0) {
            AppState.queue = json.data.songs;
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(0);
            }
            if (typeof showToastNotification === 'function') {
                showToastNotification(`Loaded ${json.data.songs.length} songs from album "${name}"`, 'queue');
            }
        }
    } catch (e) {
        console.error("Album load error:", e);
    }
}

async function importExternalPlaylistToVault(playlistId, name = "Playlist") {
    try {
        const res = await fetch(`https://saavn.sumit.co/api/playlists?id=${playlistId}`);
        const json = await res.json();
        if (json.success && json.data?.songs?.length > 0) {
            AppState.playlists.push({
                id: 'pl_' + Date.now(),
                name: name,
                tracks: json.data.songs
            });
            saveStateToLocalStorage('ok_lists', AppState.playlists);
            if (typeof renderPlaylistsVaultGrid === 'function') renderPlaylistsVaultGrid();
            if (typeof showToastNotification === 'function') {
                showToastNotification(`Imported playlist "${name}" (${json.data.songs.length} tracks)`, 'success');
            }
        }
    } catch (e) {
        if (typeof showToastNotification === 'function') showToastNotification("Import failed.", 'error');
    }
}
