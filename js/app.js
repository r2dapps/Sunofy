// SHARED APPLICATION STATE (SINGLE TRUTH REPOSITORY)
const AppState = {
    version: "1.2.0",
    appName: localStorage.getItem('ok_app_name') || "Sunofy",
    tagline: "dive into musical world",
    pin: localStorage.getItem('ok_pin') || "0908",
    lockTheme: localStorage.getItem('ok_lock_theme') || "classic",
    apiEndpoint: "https://saavn.sumit.co/api/search/songs",
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
    profile: JSON.parse(localStorage.getItem('ok_profile')) || {
        name: "Music Curator",
        handle: "@school_vibes",
        bio: "Listening & sharing beats with friends on the go",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"
    }
};

let appAuthenticated = false;
let deferredPwaPrompt = null;
let idb = null;

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

// PWA SERVICE WORKER & PROMPT POPUP SETUP
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered successfully:', reg.scope))
                .catch(err => console.log('SW registration failed:', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        showPwaInstallBanner();
    });

    setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            showPwaInstallBanner();
        }
    }, 2000);
}

function showPwaInstallBanner() {
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
        bannerCloseBtn.onclick = () => banner.classList.add('hidden');
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

// PIN & BIOMETRIC FINGERPRINT LOCK SYSTEM ROUTINES
function initPinLockSystem() {
    let inputPinBuffer = "";
    const pinOverlay = document.getElementById('pin-overlay');
    const pinErr = document.getElementById('pin-err');
    
    // Apply initial Lockscreen Theme class
    if (pinOverlay) {
        pinOverlay.className = `fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 transition-opacity duration-500 lock-${AppState.lockTheme}`;
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

    // Biometric Fingerprint Lock Trigger Handler
    const bioBtn = document.getElementById('biometric-fingerprint-btn');
    if (bioBtn) {
        bioBtn.addEventListener('click', async () => {
            bioBtn.classList.add('animate-ping', 'text-green-400');
            
            if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
                try {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    if (available) {
                        // Native WebAuthn platform authenticator verification
                        unlockApplicationShell();
                        return;
                    }
                } catch(e) {}
            }

            // Biometric Scan Effect Fallback
            setTimeout(() => {
                bioBtn.classList.remove('animate-ping');
                unlockApplicationShell();
            }, 600);
        });
    }
}

function updatePinVisualizerDots(buffer) {
    const dotsContainer = document.getElementById('pin-dots');
    if (!dotsContainer) return;
    const dots = dotsContainer.children;
    for (let i = 0; i < 4; i++) {
        if (i < buffer.length) {
            dots[i].className = "w-3.5 h-3.5 rounded-full bg-green-500 border border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] transition-all";
        } else {
            dots[i].className = "w-3.5 h-3.5 rounded-full bg-gray-800 border border-gray-700 transition-all";
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
function setupViewNavigationHandlers() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
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
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeEngine();
    initServiceWorker();
    initIndexedDB();
    initPinLockSystem();
});
