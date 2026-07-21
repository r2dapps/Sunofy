// PROFILE ENGINE & STORAGE MANAGER MODULE

function setupProfileDataBindings() {
    const sideAvatar = document.getElementById('profile-avatar-side');
    const mainAvatar = document.getElementById('profile-avatar-main');
    if (sideAvatar) sideAvatar.src = AppState.profile.avatar;
    if (mainAvatar) mainAvatar.src = AppState.profile.avatar;

    document.querySelectorAll('.profile-name-display').forEach(el => el.innerText = AppState.profile.name);
    document.querySelectorAll('.profile-handle-display').forEach(el => el.innerText = AppState.profile.handle);

    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) nameInput.value = AppState.profile.name;
    const bioText = document.getElementById('profile-bio-text');
    if (bioText) bioText.innerText = AppState.profile.bio;

    const avatarInputMain = document.getElementById('avatar-input-main');
    if (avatarInputMain) {
        avatarInputMain.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    AppState.profile.avatar = evt.target.result;
                    saveStateToLocalStorage('ok_profile', AppState.profile);
                    if (sideAvatar) sideAvatar.src = evt.target.result;
                    if (mainAvatar) mainAvatar.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (nameInput) {
        nameInput.addEventListener('change', (e) => {
            const newName = e.target.value.trim() || "Music Curator";
            AppState.profile.name = newName;
            saveStateToLocalStorage('ok_profile', AppState.profile);
            document.querySelectorAll('.profile-name-display').forEach(el => el.innerText = newName);
        });
    }

    const saveCatBtn = document.getElementById('save-cat-btn');
    if (saveCatBtn) {
        saveCatBtn.addEventListener('click', () => {
            const nameInputEl = document.getElementById('new-cat-name');
            const queryInputEl = document.getElementById('new-cat-query');
            const name = nameInputEl ? nameInputEl.value.trim() : '';
            const query = queryInputEl ? queryInputEl.value.trim() : '';
            if (name && query) {
                AppState.customCategories.push({ name, query });
                saveStateToLocalStorage('ok_custom_cats', AppState.customCategories);
                if (typeof renderCategoryPills === 'function') renderCategoryPills();
                if (nameInputEl) nameInputEl.value = '';
                if (queryInputEl) queryInputEl.value = '';
            }
        });
    }

    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => clearOfflineCacheStorage());
    }

    const confirmClearBtn = document.getElementById('confirm-clear-cache-btn');
    if (confirmClearBtn) {
        confirmClearBtn.onclick = () => executeConfirmClearStorage();
    }

    const cancelClearBtn = document.getElementById('cancel-clear-cache-btn');
    if (cancelClearBtn) {
        cancelClearBtn.onclick = () => {
            const modal = document.getElementById('cache-clear-modal');
            if (modal) modal.classList.replace('flex', 'hidden');
        };
    }

    setupPreferencePillsHandlers();
    setupPinSecurityHandlers();
    updateProfileStats();
}

function setupPinSecurityHandlers() {
    const savePinBtn = document.getElementById('save-pin-btn');
    const resetPinBtn = document.getElementById('reset-pin-btn');
    const oldPinInput = document.getElementById('old-pin-input');
    const newPinInput = document.getElementById('new-pin-input');
    const pinMsg = document.getElementById('pin-settings-msg');

    if (savePinBtn) {
        savePinBtn.addEventListener('click', () => {
            const oldVal = oldPinInput ? oldPinInput.value.trim() : '';
            const newVal = newPinInput ? newPinInput.value.trim() : '';

            if (oldVal !== AppState.pin) {
                if (pinMsg) {
                    pinMsg.innerText = "❌ Current PIN is incorrect.";
                    pinMsg.className = "text-xs text-red-400 font-semibold";
                    pinMsg.classList.remove('hidden');
                }
                return;
            }

            if (!/^\d{4}$/.test(newVal)) {
                if (pinMsg) {
                    pinMsg.innerText = "⚠️ New PIN must be exactly 4 digits.";
                    pinMsg.className = "text-xs text-amber-400 font-semibold";
                    pinMsg.classList.remove('hidden');
                }
                return;
            }

            AppState.pin = newVal;
            localStorage.setItem('ok_pin', newVal);
            if (oldPinInput) oldPinInput.value = '';
            if (newPinInput) newPinInput.value = '';

            if (pinMsg) {
                pinMsg.innerText = `✅ PIN updated successfully to: ${newVal}`;
                pinMsg.className = "text-xs text-accent font-bold";
                pinMsg.classList.remove('hidden');
                setTimeout(() => pinMsg.classList.add('hidden'), 3500);
            }
        });
    }

    if (resetPinBtn) {
        resetPinBtn.addEventListener('click', () => {
            AppState.pin = "0908";
            localStorage.setItem('ok_pin', "0908");
            if (oldPinInput) oldPinInput.value = '';
            if (newPinInput) newPinInput.value = '';
            if (pinMsg) {
                pinMsg.innerText = "🔄 PIN reset to default: 0908";
                pinMsg.className = "text-xs text-blue-400 font-bold";
                pinMsg.classList.remove('hidden');
                setTimeout(() => pinMsg.classList.add('hidden'), 3500);
            }
        });
    }
}

function setupPreferencePillsHandlers() {
    document.querySelectorAll('.pref-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const query = pill.getAttribute('data-query');
            if (query && typeof triggerLiveQuerySearch === 'function') {
                const input = document.getElementById('global-search-input');
                if (input) input.value = query;
                triggerLiveQuerySearch(query);

                // Switch view to discover
                document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
                const targetView = document.getElementById('view-discover');
                if (targetView) targetView.classList.remove('hidden');
            }
        });
    });
}

function updateProfileStats() {
    const favsVal = document.getElementById('stat-favs-val');
    const plVal = document.getElementById('stat-playlists-val');
    const favBadge = document.getElementById('favs-count-badge');

    if (favsVal) favsVal.innerText = AppState.favorites.length;
    if (plVal) plVal.innerText = AppState.playlists.length;
    if (favBadge) favBadge.innerText = `${AppState.favorites.length} tracks`;
    
    if (idb) {
        let tx = idb.transaction("audio_files", "readonly");
        let req = tx.objectStore("audio_files").count();
        req.onsuccess = () => {
            const count = req.result;
            const offlineVal = document.getElementById('stat-offline-val');
            const offlineBadge = document.getElementById('offline-count-badge');
            if (offlineVal) offlineVal.innerText = count;
            if (offlineBadge) offlineBadge.innerText = `${count} tracks`;
        };
    }
}

function calculateCacheStorageSize() {
    if (idb) {
        let tx = idb.transaction("audio_files", "readonly");
        let req = tx.objectStore("audio_files").getAll();
        req.onsuccess = () => {
            let totalBytes = 0;
            req.result.forEach(item => {
                if (item.buffer) totalBytes += item.buffer.byteLength;
            });
            const mb = (totalBytes / (1024 * 1024)).toFixed(2);
            const cacheText = document.getElementById('cache-size-text');
            if (cacheText) cacheText.innerText = `${req.result.length} tracks cached (${mb} MB used)`;

            const modalCount = document.getElementById('modal-cache-count');
            const modalMb = document.getElementById('modal-cache-mb');
            if (modalCount) modalCount.innerText = req.result.length;
            if (modalMb) modalMb.innerText = `${mb} MB`;
        };
    }
}

function clearOfflineCacheStorage() {
    calculateCacheStorageSize();
    const modal = document.getElementById('cache-clear-modal');
    if (modal) modal.classList.replace('hidden', 'flex');
}

function executeConfirmClearStorage() {
    if (idb) {
        let tx = idb.transaction("audio_files", "readwrite");
        tx.objectStore("audio_files").clear();
        tx.oncomplete = () => {
            refreshOfflineViewList();
            updateProfileStats();
            calculateCacheStorageSize();
            const modal = document.getElementById('cache-clear-modal');
            if (modal) modal.classList.replace('flex', 'hidden');
        };
    }
}

function renderFavoritesStackView() {
    const container = document.getElementById('fav-output-list');
    if (!container) return;
    container.innerHTML = '';
    if (AppState.favorites.length === 0) {
        container.innerHTML = `<p class="text-[11px] text-muted text-center py-12">No active favorites added yet.</p>`;
        return;
    }
    AppState.favorites.forEach((fav, i) => {
        const item = createStandardTrackRowItem(fav, true);
        item.querySelector('.trigger-playback-zone').onclick = () => {
            AppState.queue = [...AppState.favorites];
            if (typeof initializeTrackTargetPlayback === 'function') {
                initializeTrackTargetPlayback(i);
            }
        };
        container.appendChild(item);
    });
}

function renderPlaylistsVaultGrid() {
    const container = document.getElementById('playlists-grid-box');
    if (!container) return;
    container.innerHTML = '';
    if (AppState.playlists.length === 0) {
        container.innerHTML = `<p class="text-xs text-muted py-4 col-span-full">No playlists created.</p>`;
        return;
    }
    AppState.playlists.forEach((pl, idx) => {
        const card = document.createElement('div');
        card.className = "bg-app-card border border-app p-4 rounded-xl flex flex-col justify-between space-y-4 relative group hover:border-accent transition-colors";
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="cursor-pointer dynamic-play-pl-trigger flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-main group-hover:text-accent truncate">${pl.name}</h4>
                    <p class="text-[10px] text-muted mt-0.5 mono">${pl.tracks.length} tracks</p>
                </div>
                <button class="text-gray-500 hover:text-red-400 transition-colors p-1 text-xs action-del-pl"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="space-y-1 max-h-24 overflow-y-auto custom-scroll text-[11px] text-muted">
                ${pl.tracks.map(t => `<div class="truncate border-b border-app py-0.5"><i class="fa-solid fa-music text-[9px] mr-1 text-gray-500"></i> ${t.name}</div>`).join('') || '<div class="text-gray-500 italic">Empty playlist</div>'}
            </div>
        `;

        card.querySelector('.dynamic-play-pl-trigger').onclick = () => {
            if (pl.tracks.length > 0) {
                AppState.queue = [...pl.tracks];
                if (typeof initializeTrackTargetPlayback === 'function') {
                    initializeTrackTargetPlayback(0);
                }
            }
        };
        card.querySelector('.action-del-pl').onclick = () => {
            AppState.playlists.splice(idx, 1);
            saveStateToLocalStorage('ok_lists', AppState.playlists);
            renderPlaylistsVaultGrid();
            updateProfileStats();
        };
        container.appendChild(card);
    });
}

function launchPlaylistVaultAppendModal(track) {
    activeModalTrackObj = track;
    const container = document.getElementById('modal-playlists-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (AppState.playlists.length === 0) {
        container.innerHTML = `<p class="text-[10px] text-muted py-2">Create custom playlists first.</p>`;
    } else {
        AppState.playlists.forEach((pl) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left px-3 py-2 bg-app-body hover:bg-accent/15 hover:text-accent border border-app text-xs font-medium rounded-lg truncate block transition-all cursor-pointer";
            btn.innerText = pl.name;
            btn.onclick = () => {
                if (!pl.tracks.some(t => t.id === activeModalTrackObj.id)) {
                    pl.tracks.push(activeModalTrackObj);
                    saveStateToLocalStorage('ok_lists', AppState.playlists);
                    renderPlaylistsVaultGrid();
                    updateProfileStats();
                }
                const modal = document.getElementById('playlist-modal');
                if (modal) modal.classList.replace('flex', 'hidden');
            };
            container.appendChild(btn);
        });
    }
    const modal = document.getElementById('playlist-modal');
    if (modal) modal.classList.replace('hidden', 'flex');
}

function toggleFavoriteTrackState(track) {
    const idx = AppState.favorites.findIndex(f => f.id === track.id);
    if (idx > -1) AppState.favorites.splice(idx, 1);
    else AppState.favorites.push(track);
    saveStateToLocalStorage('ok_favs', AppState.favorites);
    if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
    updateProfileStats();
}

async function executeBinaryOfflineDownloadCache(track) {
    const url = track.downloadUrl?.[track.downloadUrl.length - 1]?.url || track.audioUrl || '';
    if (!url || !idb) return;
    
    const dDl = document.getElementById('dock-dl-action');
    if (dDl) dDl.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;
    const fsDlBtn = document.getElementById('fs-dl-btn');
    if (fsDlBtn) fsDlBtn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Downloading`;
    
    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        
        let tx = idb.transaction("audio_files", "readwrite");
        let store = tx.objectStore("audio_files");
        
        store.put({
            id: track.id,
            name: track.name,
            albumName: track.album?.name || track.albumName || 'Single Track',
            artUrl: track.image?.[track.image.length - 1]?.url || track.artUrl || '',
            buffer: buffer
        });
        
        tx.oncomplete = () => {
            if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
            refreshOfflineViewList();
            updateProfileStats();
            calculateCacheStorageSize();
        };
    } catch(e) {
        alert("Caching streams requires active connection access.");
        if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI();
    }
}

function refreshOfflineViewList() {
    const container = document.getElementById('offline-tracks-list');
    if (!container || !idb) return;
    container.innerHTML = '';
    
    let tx = idb.transaction("audio_files", "readonly");
    let store = tx.objectStore("audio_files");
    let req = store.getAll();
    
    req.onsuccess = () => {
        const tracks = req.result;
        if (tracks.length === 0) {
            container.innerHTML = `<p class="text-xs text-muted text-center py-12">No offline audio assets stored locally inside your device cache sandbox.</p>`;
            return;
        }
        tracks.forEach((t, i) => {
            const row = document.createElement('div');
            row.className = "flex items-center justify-between p-2 bg-app-card border border-app rounded-xl group hover:bg-app-card/80 transition-all";
            row.innerHTML = `
                <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer trigger-offline-play">
                    <img src="${t.artUrl}" class="w-9 h-9 rounded-lg bg-gray-800 object-cover border border-gray-700">
                    <div class="min-w-0 flex-1">
                        <h4 class="text-xs font-semibold text-main group-hover:text-accent truncate">${t.name}</h4>
                        <p class="text-[10px] text-muted truncate">${t.albumName}</p>
                    </div>
                </div>
                <button class="w-8 h-8 text-xs text-gray-500 hover:text-red-400 flex items-center justify-center action-del-offline"><i class="fa-solid fa-trash-can"></i></button>
            `;
            
            row.querySelector('.trigger-offline-play').onclick = () => {
                AppState.queue = [...tracks];
                if (typeof initializeTrackTargetPlayback === 'function') {
                    initializeTrackTargetPlayback(i);
                }
            };
            row.querySelector('.action-del-offline').onclick = () => {
                let delTx = idb.transaction("audio_files", "readwrite");
                delTx.objectStore("audio_files").delete(t.id);
                delTx.oncomplete = () => { 
                    refreshOfflineViewList(); 
                    if (typeof updateFloatingDockInterfaceUI === 'function') updateFloatingDockInterfaceUI(); 
                    updateProfileStats();
                    calculateCacheStorageSize();
                };
            };
            container.appendChild(row);
        });
    };
}
