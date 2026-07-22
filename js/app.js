// SHARED APPLICATION STATE (SINGLE TRUTH REPOSITORY)
const AppState = {
    version: "1.2.0",
    appName: localStorage.getItem('ok_app_name') || "Sunofy",
    tagline: "dive into musical world",
    pin: localStorage.getItem('ok_pin') || "0908",
    lockType: localStorage.getItem('ok_lock_type') || 'pin', // 'pin', 'biometric', 'disabled'
    // Dynamic API Mirrors: uses localhost when on PC, and cloud endpoints when on mobile / GitHub Pages
    apiMirrors: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? [
            "http://localhost:3000/api/search/songs",
            "./api/search/songs",
            "https://saavn.sumit.co/api/search/songs"
          ]
        : [
            "./api/search/songs",
            "https://saavn.sumit.co/api/search/songs",
            "https://jiosaavn-api-v3.vercel.app/api/search/songs"
          ],
    apiEndpoint: "./api/search/songs",
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    repeatMode: 0, // 0: Off, 1: Loop Track, 2: Loop Queue
    shuffle: false,
    theme: localStorage.getItem('ok_theme') || 'dark',
    volume: 0.7,
    recentSearches: JSON.parse(localStorage.getItem('ok_hist')) || [],
    customCategories: JSON.parse(localStorage.getItem('ok_custom_cats')) || [
        { name: "🎵 Telugu Melodies", query: "Telugu Melodies" },
        { name: "🎤 Sid Sriram Hits", query: "Sid Sriram Melodies" },
        { name: "🎧 DSP Hits", query: "Devi Sri Prasad Hits" },
        { name: "🥁 Thaman Mix", query: "Thaman S Blockbusters" },
        { name: "🎺 AR Rahman", query: "AR Rahman Telugu Hits" },
        { name: "🍿 Tollywood Beats", query: "Telugu Mass Beats" },
        { name: "🌅 Lo-Fi Chill", query: "Telugu Lo-Fi" },
        { name: "🔥 Trending Hits", query: "Latest Telugu Songs" }
    ],
    favorites: JSON.parse(localStorage.getItem('ok_favs')) || [],
    playlists: JSON.parse(localStorage.getItem('ok_lists')) || [],
    musicProvider: localStorage.getItem('ok_music_provider') || 'jiosaavn', // 'jiosaavn', 'ytmusic'
    syncRoomId: null,
    isSyncHost: false,
    profile: JSON.parse(localStorage.getItem('ok_profile')) || {
        name: "Music Curator",
        handle: "@sunofy_music",
        bio: "Dive into musical world with friends & family",
        avatar: "images/icon-512.png"
    }
};

let appAuthenticated = false;
let deferredPwaPrompt = null;
let idb = null;

// ─── API RESILIENCE LAYER ──────────────────────────────────────────────────
// In-memory response cache: key → { data, ts }
const _apiCache = new Map();
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Tries each mirror in AppState.apiMirrors in order.
 * Returns parsed JSON from the first mirror that responds with 2xx.
 * Results are cached to avoid hammering any single endpoint.
 */
async function apiFetch(path, params = {}) {
    const queryStr = new URLSearchParams(params).toString();
    const cacheKey = `${path}?${queryStr}`;

    // Return cached result if still fresh (0 network requests made!)
    const cached = _apiCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < API_CACHE_TTL) {
        return cached.data;
    }

    const mirrors = AppState.apiMirrors;
    let lastError;
    const startTime = Date.now();

    for (let i = 0; i < mirrors.length; i++) {
        const base = mirrors[i];
        const url = `${base}?${queryStr}`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) {
                if (res.status === 429) {
                    console.warn(`[API] 429 on mirror ${i}: ${base}`);
                    continue;
                }
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            
            // Increment request count & update live metrics UI
            AppState.requestCount = (AppState.requestCount || 0) + 1;
            if (base.includes('saavn') || base.includes('3000')) {
                AppState.jiosaavnReqCount = (AppState.jiosaavnReqCount || 0) + 1;
            } else if (base.includes('cobalt')) {
                AppState.youtubeReqCount = (AppState.youtubeReqCount || 0) + 1;
            } else if (base.includes('vercel')) {
                AppState.vercelReqCount = (AppState.vercelReqCount || 0) + 1;
            }

            localStorage.setItem('ok_req_count', AppState.requestCount.toString());
            const latency = Date.now() - startTime;
            updateApiMetricsBadge(latency);

            _apiCache.set(cacheKey, { data, ts: Date.now() });
            AppState.apiEndpoint = base; // remember active mirror
            return data;
        } catch (err) {
            lastError = err;
            console.warn(`[API] Mirror ${i} failed (${base}):`, err.message);
        }
    }

    throw lastError || new Error('All API mirrors failed');
}

function updateApiMetricsBadge(latencyMs = 24) {
    const reqCountEl = document.getElementById('api-req-count-val');
    const latencyEl = document.getElementById('api-latency-val');
    const jioCountEl = document.getElementById('jiosaavn-req-count-val');
    const ytCountEl = document.getElementById('yt-req-count-val');
    const vercelCountEl = document.getElementById('vercel-req-count-val');

    if (reqCountEl) reqCountEl.innerText = `${AppState.requestCount || 0} made`;
    if (latencyEl) latencyEl.innerText = `${latencyMs}ms ping`;
    if (jioCountEl) jioCountEl.innerText = `${AppState.jiosaavnReqCount || 0} calls`;
    if (ytCountEl) ytCountEl.innerText = `${AppState.youtubeReqCount || 0} calls`;
    if (vercelCountEl) vercelCountEl.innerText = `${AppState.vercelReqCount || 0} calls`;
}
// ──────────────────────────────────────────────────────────────────────────

// INDEXEDDB BINARY CACHE DATABASE SETUP
function initIndexedDB() {
    const idbReq = indexedDB.open("OctaveOfflineCacheData", 1);
    idbReq.onupgradeneeded = (e) => {
        let db = e.target.result;
        if (!db.objectStoreNames.contains("audio_files")) {
            db.createObjectStore("audio_files", { keyPath: "id" });
        }
    };
    idbReq.onsuccess = (e) => { 
        idb = e.target.result; 
        if (typeof refreshOfflineViewList === 'function') refreshOfflineViewList(); 
        if (typeof updateProfileStats === 'function') updateProfileStats();
        if (typeof calculateCacheStorageSize === 'function') calculateCacheStorageSize();
    };
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true || 
           document.referrer.includes('android-app://');
}

// PWA SERVICE WORKER & PROMPT POPUP SETUP
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered successfully:', reg.scope))
                .catch(err => console.log('SW registration failed:', err));
        });
    }

    if (isStandalone()) {
        const sideBtn = document.getElementById('pwa-install-side-btn');
        const mainBtn = document.getElementById('pwa-install-main-btn');
        if (sideBtn) sideBtn.classList.add('hidden');
        if (mainBtn) mainBtn.classList.add('hidden');
        return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
    });

    setTimeout(() => {
        if (!isStandalone() && localStorage.getItem('pwa_banner_dismissed') !== 'true') {
            showPwaInstallBanner();
        }
    }, 4000);
}

function showPwaInstallBanner() {
    if (isStandalone() || localStorage.getItem('pwa_banner_dismissed') === 'true') return;
    const banner = document.getElementById('pwa-install-popup-banner');
    if (banner) {
        banner.classList.remove('translate-y-full', 'hidden', 'opacity-0');
        banner.classList.add('translate-y-0', 'opacity-100');
    }
}

function setupPwaAndShareHandlers() {
    const bannerInstallBtn = document.getElementById('pwa-banner-install-btn');
    const bannerCloseBtn = document.getElementById('pwa-banner-close-btn');
    const banner = document.getElementById('pwa-install-popup-banner');

    if (bannerCloseBtn && banner) {
        bannerCloseBtn.onclick = () => {
            banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_dismissed', 'true');
        };
    }

    const installButtons = [
        bannerInstallBtn, 
        document.getElementById('pwa-install-side-btn'), 
        document.getElementById('pwa-install-main-btn')
    ];

    installButtons.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', async () => {
            if (deferredPwaPrompt) {
                deferredPwaPrompt.prompt();
                const { outcome } = await deferredPwaPrompt.userChoice;
                if (outcome === 'accepted') {
                    if (banner) banner.classList.add('hidden');
                }
                deferredPwaPrompt = null;
            } else {
                alert("To install Sunofy on your phone:\n\n1. Tap your browser's menu (⋮ or Share)\n2. Select 'Add to Home Screen' or 'Install App'.");
            }
        });
    });

    const shareBtn = document.getElementById('share-app-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: `${AppState.appName} Music Console`,
                text: `Listen to awesome songs offline on ${AppState.appName}!`,
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {}
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert("App link copied to clipboard! Share it with your friends.");
            }
        });
    }
}

// PIN & HARDWARE BIOMETRIC FINGERPRINT LOCK SYSTEM ROUTINES
async function initPinLockSystem() {
    if (AppState.lockType === 'disabled') {
        unlockApplicationShell();
        return;
    }

    let inputPinBuffer = "";
    const pinOverlay = document.getElementById('pin-overlay');
    const pinErr = document.getElementById('pin-err');
    const bioBtn = document.getElementById('biometric-fingerprint-btn');
    
    // Apply current active theme to body so lockscreen instantly inherits app colors
    if (typeof applyThemeClassToBody === 'function') {
        applyThemeClassToBody(AppState.theme);
    }

    // CHECK IF HARDWARE BIOMETRIC IS ACTUAL ENABLED ON DEVICE
    let isBiometricAvailableOnDevice = false;
    if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        try {
            isBiometricAvailableOnDevice = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch(e) {
            isBiometricAvailableOnDevice = false;
        }
    }

    if (bioBtn) {
        if (isBiometricAvailableOnDevice) {
            bioBtn.classList.remove('hidden');
            bioBtn.classList.add('flex');
            
            bioBtn.addEventListener('click', async () => {
                try {
                    // Actual hardware WebAuthn challenge invocation
                    const publicKeyCredentialCreationOptions = {
                        challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
                        rp: { name: "Sunofy Auth" },
                        user: { id: new Uint8Array(16), name: "user@sunofy", displayName: "Sunofy User" },
                        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                        authenticatorSelection: { userVerification: "preferred" },
                        timeout: 60000
                    };
                    await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
                    unlockApplicationShell();
                } catch(err) {
                    // If hardware user verification passes or is cancelled, unlock if verified
                    if (err.name !== 'NotAllowedError') {
                        unlockApplicationShell();
                    }
                }
            });
        } else {
            // Hide fingerprint icon button if hardware biometric is NOT enabled on device
            bioBtn.classList.remove('flex');
            bioBtn.classList.add('hidden');
        }
    }

    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (val === 'clr') {
                inputPinBuffer = "";
            } else {
                if (inputPinBuffer.length < 4) inputPinBuffer += val;
            }
            updatePinVisualizerDots(inputPinBuffer);
            
            if (inputPinBuffer.length === 4) {
                if (inputPinBuffer === AppState.pin) {
                    unlockApplicationShell();
                } else {
                    inputPinBuffer = "";
                    updatePinVisualizerDots(inputPinBuffer);
                    if (pinErr) {
                        pinErr.classList.remove('invisible');
                        setTimeout(() => pinErr.classList.add('invisible'), 2500);
                    }
                }
            }
        });
    });
}

function updatePinVisualizerDots(buffer) {
    const dotsContainer = document.getElementById('pin-dots');
    if (!dotsContainer) return;
    const dots = dotsContainer.children;
    for (let i = 0; i < 4; i++) {
        if (i < buffer.length) {
            dots[i].className = "w-3.5 h-3.5 rounded-full bg-accent border border-accent/40 shadow-[0_0_10px_var(--accent-glow)] transition-all";
        } else {
            dots[i].className = "w-3.5 h-3.5 rounded-full bg-app-card border border-app transition-all";
        }
    }
}

function unlockApplicationShell() {
    const pinOverlay = document.getElementById('pin-overlay');
    const appContent = document.getElementById('app-content');
    if (pinOverlay) {
        pinOverlay.classList.add('opacity-0');
        setTimeout(() => pinOverlay.remove(), 500);
    }
    if (appContent) appContent.classList.remove('opacity-0');
    appAuthenticated = true;
    initializeAppCoreArchitecture();
}

// GLOBAL DESKTOP KEYBOARD SHORTCUTS
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (!appAuthenticated) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        const audioNode = document.getElementById('audio-node');
        if (!audioNode) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (typeof toggleAudioPlayPause === 'function') toggleAudioPlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (typeof playNextTrack === 'function') playNextTrack();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (typeof playPrevTrack === 'function') playPrevTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                audioNode.volume = Math.min(1, audioNode.volume + 0.05);
                AppState.volume = audioNode.volume;
                if (typeof updateSpeakerIcons === 'function') updateSpeakerIcons(audioNode.volume);
                break;
            case 'ArrowDown':
                e.preventDefault();
                audioNode.volume = Math.max(0, audioNode.volume - 0.05);
                AppState.volume = audioNode.volume;
                if (typeof updateSpeakerIcons === 'function') updateSpeakerIcons(audioNode.volume);
                break;
            case 'KeyM':
                audioNode.muted = !audioNode.muted;
                if (typeof updateSpeakerIcons === 'function') updateSpeakerIcons(audioNode.muted ? 0 : audioNode.volume);
                break;
            case 'KeyF':
                if (AppState.queueIndex > -1 && AppState.queue[AppState.queueIndex]) {
                    if (typeof toggleFavoriteTrackState === 'function') toggleFavoriteTrackState(AppState.queue[AppState.queueIndex]);
                    if (typeof renderFavoritesStackView === 'function') renderFavoritesStackView();
                }
                break;
            case 'KeyL':
                if (typeof toggleLoopMode === 'function') toggleLoopMode();
                break;
            case 'KeyS':
                if (typeof toggleShuffleMode === 'function') toggleShuffleMode();
                break;
        }
    });
}

// VIEW ROUTER NAVIGATION HANDLERS
function switchAppView(target) {
    if (!target) return;

    document.querySelectorAll('aside .nav-btn').forEach(b => {
        b.className = "nav-btn w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:bg-gray-800/40 hover:text-gray-200";
        if (b.getAttribute('data-target') === target) {
            b.className = "nav-btn w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer bg-green-500/10 text-green-400 font-bold";
        }
    });

    document.querySelectorAll('#mobile-bottom-nav .nav-btn').forEach(b => {
        b.className = "nav-btn flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200 p-1 cursor-pointer transition-all";
        if (b.getAttribute('data-target') === target) {
            b.className = "nav-btn flex flex-col items-center gap-1 text-green-400 p-1 cursor-pointer transition-all font-bold";
        }
    });

    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(`view-${target}`);
    if (targetView) targetView.classList.remove('hidden');

    if (target === 'profile') {
        if (typeof updateProfileStats === 'function') updateProfileStats();
        if (typeof calculateCacheStorageSize === 'function') calculateCacheStorageSize();
    }
    if (target === 'favorites' && typeof renderFavoritesStackView === 'function') {
        renderFavoritesStackView();
    }
    if (target === 'offline' && typeof refreshOfflineViewList === 'function') {
        refreshOfflineViewList();
    }
}

function setupViewNavigationHandlers() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            switchAppView(target);
        });
    });
}

function updateAppBrandDisplay() {
    document.querySelectorAll('.app-name-text').forEach(el => el.innerText = AppState.appName);
    const titleTag = document.getElementById('app-title-tag');
    if (titleTag) titleTag.innerText = `${AppState.appName} - ${AppState.tagline}`;
    const heading = document.getElementById('pin-app-heading');
    if (heading) heading.innerText = `${AppState.appName} Music Console`;
}

function saveStateToLocalStorage(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}

function initializeAppCoreArchitecture() {
    updateAppBrandDisplay();
    if (typeof setupProfileDataBindings === 'function') setupProfileDataBindings();
    setupViewNavigationHandlers();
    setupKeyboardShortcuts();
    if (typeof setupFormHandlers === 'function') setupFormHandlers();
    if (typeof setupAudioHardwareEngineControls === 'function') setupAudioHardwareEngineControls();
    if (typeof setupFullscreenPlayerControls === 'function') setupFullscreenPlayerControls();
    setupPwaAndShareHandlers();
    if (typeof renderCategoryPills === 'function') renderCategoryPills();
    if (typeof setupQueueDrawerHandlers === 'function') setupQueueDrawerHandlers();
    if (typeof setupThemeSelectorHandlers === 'function') setupThemeSelectorHandlers();

    if (typeof renderHistoryTagsFeed === 'function') renderHistoryTagsFeed();
    if (typeof renderFavoritesStackView === 'function') renderFavoritesStackView();
    if (typeof renderPlaylistsVaultGrid === 'function') renderPlaylistsVaultGrid();
    if (typeof triggerLiveQuerySearch === 'function') {
        const input = document.getElementById('global-search-input');
        triggerLiveQuerySearch(input && input.value ? input.value : 'Telugu Melodies');
    }

    if (typeof updateMiniPlayerIdleState === 'function') updateMiniPlayerIdleState();
    if (typeof initUpdateChecker === 'function') initUpdateChecker();
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeEngine();
    initServiceWorker();
    initIndexedDB();
    initPinLockSystem();
});

function showToastNotification(msg, icon = 'info') {
    let container = document.getElementById('toast-container-box');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-box';
        container.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none max-w-xs w-full px-4";
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = "bg-app-card/95 backdrop-blur-md border border-accent/40 text-main text-xs font-semibold py-2.5 px-4 rounded-xl shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto";
    
    let iconClass = "fa-solid fa-circle-info text-accent";
    if (icon === 'success') iconClass = "fa-solid fa-circle-check text-green-400";
    if (icon === 'download') iconClass = "fa-solid fa-cloud-arrow-down text-blue-400";
    if (icon === 'queue') iconClass = "fa-solid fa-layer-group text-purple-400";
    if (icon === 'error') iconClass = "fa-solid fa-triangle-exclamation text-red-400";

    toast.innerHTML = `<i class="${iconClass} text-sm shrink-0"></i><span class="truncate flex-1">${msg}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        toast.classList.replace('translate-y-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
