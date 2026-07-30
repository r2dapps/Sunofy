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

---

## 📖 Complete Beginner's Guide: How to Create a FREE Firebase Database for Sunofy VibeSync™ (Pin-to-Pin)

If you have **never used Firebase before**, follow these exact step-by-step instructions. It takes less than 2 minutes, is 100% free forever, and requires no credit card!

### Step 1: Open Firebase Console
1. Open your web browser and go to [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Log in with any standard Google (Gmail) account.

### Step 2: Create a New Project
1. Click the big **"+ Add project"** button (or "Create a project").
2. Type a name for your project (e.g., `sunofy-music` or `my-party-app`).
3. Click **Continue**.
4. Disable **Google Analytics** (toggle switch off) to keep it simple, then click **Create project**.
5. Wait 10 seconds for Google to set up your project, then click **Continue**.

### Step 3: Create a Realtime Database Instance
1. In the left-hand sidebar, click **Build** -> then select **Realtime Database**.
2. Click the blue **"Create Database"** button in the center of the page.
3. **Database Location**: Choose `Asia South (Mumbai)` or `United States` (closest to you), then click **Next**.
4. **Security Rules**: Select **Start in test mode**, then click **Enable**.

### Step 4: Copy Your Realtime Database URL
1. You will now see your database dashboard.
2. At the top of the page, copy the URL string that looks like this:
   `https://your-project-name-default-rtdb.firebaseio.com` (or ending in `.firebasedatabase.app`).
3. Set this URL in `js/syncparty.js` under `SUNOFY_FIREBASE_DB_URL`!

### Step 5: Make Database Rules Permanent (So It Never Expires)
1. Click on the **Rules** tab at the top of your Realtime Database dashboard.
2. Replace the text in the code editor with this exact JSON block:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. Click **Publish** at the top right. 
4. Done! Your Sunofy VibeSync™ Party rooms are now active 24/7/365 with zero cost!

---

## ⚡ Deployment Guide (Vercel & GitHub)

### One-Click Vercel Deployment
Click the button below to deploy your private instance of Sunofy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fr2dapps%2FSunofy)

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
    ├── syncparty.js    # VibeSync™ Real-Time Listen Together Firebase engine with Kick Member feature
    ├── localfolder.js  # Local MP3/M4A Directory Importer with Title-Artist parser
    ├── equalizer.js     # 5-band Web Audio API EQ & Bass Boost engine
    ├── sleeptimer.js    # Bedtime sleep countdown timer module
    ├── carmode.js       # Car Play large-touch navigation interface
    └── update.js       # GitHub release update checker for r2dapps/Sunofy
```

---

<div align="center">
  <p>© 2026 Sunofy • Built with HTML5, Vanilla JS, Node.js & Tailwind CSS</p>
</div>
