<div align="center">
  <img src="images/icon-512.png" width="160" height="160" alt="Sunofy Logo" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);">
  <h1>Sunofy</h1>
  <p><em>dive into musical world</em></p>
  <p>
    <strong>A Premium Progressive Web Application (PWA) Music Console</strong><br>
    Listen to songs on the go with your friends — fully customizable, offline-ready, and feature-packed.
  </p>
</div>

---

## 🌟 Key Features

- 🎛️ **JioSaavn & Spotify Style Curation Filters**: Mobile & Desktop top search bar Filter button opening comprehensive filters for **7 Languages**, **Top Singers** (Sid Sriram, Shreya Ghoshal, Arijit Singh), **Composers & Directors** (DSP, Thaman, A.R. Rahman, Anirudh), and **Genre Moods** (Mass Tollywood, Lo-Fi Chill, Gym Beats, Romantic).
- 📻 **Mini & Fullscreen Deck**: Sleek vinyl disc rotating deck with smooth seek bar, synced **Volume slider**, and lockscreen MediaSession controls.
- 🔁 **3 Repeat Modes**: Cycle through **Repeat Off**, **Single Track Loop**, and **Full Queue Loop** with active visual badges.
- 🎛️ **5-Band Equalizer & Bass Boost**: Built-in Web Audio API Equalizer with custom gains & presets (**Bass Boost**, **Vocal Clarity**, **Pop**, **Acoustic**, **Rock**).
- 🌙 **Bedtime Sleep Timer**: Sleep countdown timer (15m, 30m, 45m, 60m) with automatic smooth volume fade-out.
- 🚗 **Car Play Large Touch Mode**: High-contrast, extra-large touch interface for safe listening while driving or traveling.
- 📶 **PWA Offline Vault**: Download and cache audio files locally in IndexedDB to play without cellular data.
- 🎨 **9 Color Themes**: Dark, AMOLED Black, Ocean Blue, Deep Purple, Emerald Green, Warm Amber, Cyberpunk Neon, Sunset Crimson, and Studio Light.
- 🔐 **App-Synced Lockscreen & Hardware Biometrics**: Lockscreen matching active app theme, music sub-icons on keypad numbers, and native WebAuthn device fingerprint authentication.

---

## 📁 Directory Architecture

```text
Sunofy/
├── index.html          # Clean HTML markup & view router shell
├── manifest.json       # PWA Web Application Manifest
├── sw.js               # Service Worker for offline app shell caching
├── README.md           # Documentation & Feature overview
├── favicon.ico         # Root favicon fallback
├── images/             # Organized Assets Directory
│   ├── favicon.ico     # App Favicon
│   ├── icon-192.png    # App Icon 192x192
│   └── icon-512.png    # App Icon 512x512
├── css/
│   ├── style.css       # Custom scrollbars, vinyl spin, slider track fill
│   └── themes.css      # CSS variables for all 9 theme presets
└── js/
    ├── app.js          # Shared AppState, PIN security, IndexedDB, router
    ├── themes.js       # Dynamic theme switcher & localStorage engine
    ├── player.js       # Audio engine, seek bar, volume control, MediaSession
    ├── queue.js        # Single source of truth for Queue, Next, Prev, Repeat Modes, Shuffle
    ├── search.js       # Saavn API queries, recent history tags, Category Pills & Music Filters
    ├── profile.js      # User profile editor, custom categories, cache cleaner
    ├── equalizer.js     # 5-band Web Audio API EQ & Bass Boost engine
    ├── sleeptimer.js    # Bedtime sleep countdown timer module
    ├── carmode.js       # Car Play large-touch navigation interface
    └── update.js       # GitHub release update checker for r2dapps/Sunofy
```

---

## 🚀 Quick Start

1. Open `index.html` in any modern web browser or serve locally using VS Code Live Server.
2. Enter the PIN access code: `0908`.
3. Tap **Filters** in the top search bar on mobile or desktop to curate by language, singer, composer, or genre.
4. Tap **Install App** to add Sunofy as a native Progressive Web Application on mobile or desktop.

---

<div align="center">
  <p>© 2026 Sunofy • Built with HTML5, Vanilla JS & Tailwind CSS</p>
</div>
