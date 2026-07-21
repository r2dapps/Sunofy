<div align="center">
  <img src="icon-512.png" width="160" height="160" alt="Sunofy Logo" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);">
  <h1>Sunofy</h1>
  <p><em>dive into musical world</em></p>
  <p>
    <strong>A Premium Progressive Web Application (PWA) Music Console</strong><br>
    Listen to songs on the go with your friends — fully customizable, offline-ready, and feature-packed.
  </p>
</div>

---

## 🌟 Key Features

- 📻 **Mini & Fullscreen Player**: Sleek vinyl disc rotating deck with smooth progress sliders and MediaSession lockscreen controls.
- 📶 **PWA Offline Storage Vault**: Download and cache high-quality audio files locally in IndexedDB to play without cellular data.
- 🎨 **9 Theme Presets & Custom Colors**: Dark, AMOLED Black, Ocean Blue, Deep Purple, Emerald Green, Warm Amber, Cyberpunk Neon, Sunset Crimson, and Studio Light.
- 🎛️ **5-Band Equalizer & Bass Boost**: Built-in Web Audio API Equalizer with presets (Bass Boost, Vocal Clarity, Pop, Acoustic, Rock).
- ⏱️ **Bedtime Sleep Timer**: Sleep countdown timer (15m, 30m, 45m, 60m) with automatic smooth volume fade-out.
- 🚗 **Car Play Large Touch Mode**: High-contrast, extra-large touch interface for safe listening while riding or traveling.
- 🎶 **Up Next Queue Drawer**: Full queue management, shuffle, loop track, and loop queue state machines.
- 🎙️ **Song Lyrics Viewer**: Async lyrics fetching with graceful fallback for instrumental tracks.
- 🎯 **Music Curation Preferences**: Favorite Singers (Sid Sriram, Shreya Ghoshal, Arijit Singh) & Music Directors (DSP, Thaman S, A.R. Rahman).

---

## 📁 Modular Directory Architecture

```text
Sunofy/
├── index.html          # Clean HTML markup & view router shell
├── manifest.json       # PWA Web Application Manifest
├── sw.js               # Service Worker for offline app shell caching
├── README.md           # Documentation & Feature overview
├── favicon.ico         # App Favicon
├── icon-192.png        # App Icon 192x192
├── icon-512.png        # App Icon 512x512
├── css/
│   ├── style.css       # Custom scrollbars, vinyl spin, slider track fill
│   └── themes.css      # CSS variables for all 9 theme presets
└── js/
    ├── app.js          # Shared AppState, PIN security, IndexedDB, router
    ├── themes.js       # Dynamic theme switcher & localStorage engine
    ├── player.js       # HTML5 audio engine, seek bar, MediaSession controls
    ├── queue.js        # Single source of truth for Queue, Next, Prev, Shuffle
    ├── search.js       # JioSaavn API queries, recent history tags, category pills
    ├── profile.js      # User profile editor, custom categories, cache cleaner
    ├── equalizer.js     # 5-band Web Audio API EQ & Bass Boost engine
    ├── sleeptimer.js    # Bedtime sleep countdown timer module
    ├── carmode.js       # Car Play large-touch navigation interface
    ├── update.js       # GitHub release update checker for r2dapps/Sunofy
    └── lyrics.js       # Song lyrics fetcher & drawer viewer
```

---

## 🚀 Quick Start

1. Open `index.html` in any modern web browser or serve locally using VS Code Live Server.
2. Enter the PIN access code: `0908`.
3. Tap **Install App** to add Sunofy as a native Progressive Web Application on mobile or desktop.

---

<div align="center">
  <p>© 2026 Sunofy • Built with HTML5, Vanilla JS & Tailwind CSS</p>
</div>
