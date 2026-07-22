<div align="center">
  <img src="images/icon-512.png" width="160" height="160" alt="Sunofy Logo" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);">
  <h1>Sunofy</h1>
  <p><em>dive into musical world</em></p>
  
  <p>
    <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fr2dapps%2FSunofy">
      <img src="https://vercel.com/button" alt="Deploy with Vercel">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa" alt="PWA Ready">
    <img src="https://img.shields.io/badge/Vercel-Serverless-black?style=for-the-badge&logo=vercel" alt="Vercel Ready">
    <img src="https://img.shields.io/badge/Audio-320kbps%20HQ-purple?style=for-the-badge&logo=music" alt="320kbps HQ">
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
  </p>
  
  <p>
    <strong>A Premium Progressive Web Application (PWA) Music Console</strong><br>
    Listen to songs on the go with your friends & family — fully customizable, offline-ready, serverless, and feature-packed.
  </p>
</div>

---

## 🌟 Key Features

### 🎵 Music Engine & Discovery
- 🟢 **Dual Engine Gateway (JioSaavn & YouTube Cobalt)**: Native 320kbps high-quality stream extraction with millisecond auto-failover.
- 📑 **Playlist & Album Search Engine**: Search public JioSaavn & YouTube playlists and movie albums (`[ Songs | Playlists | Albums ]`). Play full playlists in sequence or import them into your personal Library Vault!
- 🎛️ **JioSaavn & Spotify Style Curation Filters**: Curate music by **7 Languages**, **Top Singers** (Sid Sriram, Shreya Ghoshal, Arijit Singh), **Composers & Directors** (DSP, Thaman, A.R. Rahman, Anirudh), and **Genre Moods** (Mass Tollywood, Lo-Fi Chill, Gym Beats, Romantic).

### 👥 Listening & Offline Features
- 🟣 **VibeSync™ (Listen Together / Party Rooms)**: Host real-time music listening rooms with friends & family across unlimited devices in sync!
- 📂 **Local Music Folder Importer**: Open and play local MP3/M4A/FLAC files directly from your PC or smartphone storage with auto `Title - Artist` filename parsing.
- 📂 **Custom Download Folder**: Pick a preferred download destination directory in Settings (`File System Access API`).
- 📶 **PWA Offline Vault**: Download and cache audio files locally in IndexedDB to play anywhere without cellular data.

### 🎛️ Player & Audio Controls
- 📻 **Mini & Fullscreen Vinyl Deck**: Rotating vinyl disc deck with smooth seek bar, volume slider, and lockscreen MediaSession controls.
- ➕ **Add to Queue**: Append any track directly to your active playback queue without interrupting current music.
- 🔁 **3 Repeat Modes**: Cycle through **Repeat Off**, **Single Track Loop**, and **Full Queue Loop**.
- 🎛️ **5-Band Equalizer & Bass Boost**: Built-in Web Audio API Equalizer with custom gains & presets (**Bass Boost**, **Vocal Clarity**, **Pop**, **Acoustic**, **Rock**).
- 🌙 **Bedtime Sleep Timer**: Sleep countdown timer (15m, 30m, 45m, 60m) with automatic smooth volume fade-out.
- 🚗 **Car Play Large Touch Mode**: High-contrast, extra-large touch interface for safe listening while driving.

### 🛡️ Security & Performance
- 📊 **Live Rate Usage & Quota Monitor**: Live tracking of JioSaavn, YouTube Cobalt, and Vercel serverless API calls with latency ping metrics.
- 🔔 **Glassmorphism Toast Notification Engine**: Smooth non-intrusive floating toasts replacing blocky browser alert dialogs.
- 🎨 **9 Color Themes**: Dark, AMOLED Black, Ocean Blue, Deep Purple, Emerald Green, Warm Amber, Cyberpunk Neon, Sunset Crimson, and Studio Light.
- 🔐 **App-Synced Lockscreen & Hardware Biometrics**: Lockscreen matching active app theme with WebAuthn fingerprint authentication option.

---

## ⚡ Deployment Guide (Vercel & GitHub)

### One-Click Vercel Deployment
Click the button below to deploy your private instance of Sunofy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fr2dapps%2FSunofy)

### How to Make Your Repository Private
Once your project is deployed on Vercel:
1. Go to your repository on GitHub (`https://github.com/r2dapps/Sunofy`).
2. Click **Settings** -> Scroll to **Danger Zone**.
3. Click **Change repository visibility** -> Select **Make private**.
4. Confirm by typing the repository name.
5. **Vercel will continue working seamlessly** on cellular data and Wi-Fi using your private Vercel deployment URL (`https://your-sunofy-app.vercel.app`)!

---

## 📁 Directory Architecture

```text
Sunofy/
├── index.html          # Clean HTML markup & view router shell
├── manifest.json       # PWA Web Application Manifest
├── sw.js               # Service Worker for offline app shell caching
├── server.js           # Node.js Express server backend with GZIP decompression
├── vercel.json         # Vercel Serverless routing configuration
├── README.md           # Documentation & Feature overview
├── favicon.ico         # Root favicon fallback
├── api/                # Vercel Serverless Functions
│   └── search/
│       └── songs.js    # Decrypted 320kbps JioSaavn audio proxy
├── images/             # Organized Assets Directory
│   ├── favicon.ico     # App Favicon
│   ├── icon-192.png    # App Icon 192x192
│   └── icon-512.png    # App Icon 512x512
├── css/
│   ├── style.css       # Custom scrollbars, vinyl spin, slider track fill
│   └── themes.css      # CSS variables for all 9 theme presets
└── js/
    ├── app.js          # Shared AppState, PIN security, IndexedDB, router, toast notifications
    ├── themes.js       # Dynamic theme switcher & localStorage engine
    ├── player.js       # Audio engine, seek bar, volume control, MediaSession
    ├── queue.js        # Single source of truth for Queue, Next, Prev, Repeat Modes, Shuffle
    ├── search.js       # Search engine, playlist & album search, Category Pills & Music Filters
    ├── profile.js      # User profile editor, custom categories, cache cleaner, custom download folder
    ├── syncparty.js    # VibeSync™ Real-Time Listen Together BroadcastChannel engine
    ├── localfolder.js  # Local MP3/M4A Directory Importer with Title-Artist parser
    ├── equalizer.js     # 5-band Web Audio API EQ & Bass Boost engine
    ├── sleeptimer.js    # Bedtime sleep countdown timer module
    ├── carmode.js       # Car Play large-touch navigation interface
    └── update.js       # GitHub release update checker for r2dapps/Sunofy
```

---

## 🚀 Local Development

1. Clone the repository locally:
   ```bash
   git clone https://github.com/r2dapps/Sunofy.git
   cd Sunofy
   ```
2. Start the local backend proxy:
   ```bash
   node server.js
   ```
3. Open `http://localhost:3000` in your web browser.
4. Enter the PIN access code: `0908` (or your personal PIN).

---

<div align="center">
  <p>© 2026 Sunofy • Built with HTML5, Vanilla JS, Node.js & Tailwind CSS</p>
</div>
