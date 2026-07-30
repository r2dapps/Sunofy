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

---

### 🐙 Deploying with a Secondary / Collaborated GitHub Account

If you are using a secondary GitHub account or a collaborated team account linked to Vercel, follow these exact setup steps to ensure 100% clean deployment without build errors:

#### 1️⃣ Fork or Import Repository
- Fork or push the repository to your secondary GitHub account.

#### 2️⃣ Grant Vercel Access to the Repository
- Open your **Vercel Dashboard** -> Click **Add New...** -> **Project**.
- If your secondary repository does not appear in the list:
  1. Click **Adjust GitHub App Permissions** link in Vercel.
  2. Select your secondary GitHub account/organization.
  3. Under **Repository Access**, select **All Repositories** or select `Sunofy`.
  4. Click **Save**.

#### 3️⃣ Required Vercel Project Settings (CRITICAL)
When importing the project in Vercel, configure the build settings as follows:

| Vercel Setting | Required Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Other` | **Do NOT select Vite, React, or Next.js**. Sunofy is pure Vanilla HTML5 + Serverless. |
| **Root Directory** | `./` | Leave default root directory. |
| **Build Command** | *Leave EMPTY* | Override default by leaving blank (no build script needed). |
| **Output Directory** | *Leave EMPTY* | Override default by leaving blank (serves root `index.html`). |
| **Install Command** | *Leave EMPTY* | No dependencies required for static frontend. |

> [!IMPORTANT]
> **Why set Framework Preset to "Other"?**  
> If Vercel auto-detects a framework preset like Vite or Next.js, it will try to run `npm run build` which will fail because Sunofy is built with zero-build-step Vanilla HTML/JS and Vercel Serverless Functions (`api/search/songs.js`). Setting Preset to `Other` guarantees 100% instant deployment success!

---

### 🛠️ Common Vercel Deployment Troubleshooting

- ❌ **Build Error: `Command "npm run build" exited with 1`**  
  👉 **Fix:** Go to **Project Settings** -> **Build & Development Settings** -> Toggle **Override** next to **Build Command** and leave it completely blank. Set Framework Preset to `Other`. Re-deploy.

- ❌ **API 404 Error on Search**  
  👉 **Fix:** Make sure both `vercel.json` and the `api/` folder are committed to your repository's `main` branch. Vercel automatically exposes `api/search/songs.js` as `/api/search/songs`.

- ❌ **Repository Not Appearing in Vercel Import List**  
  👉 **Fix:** Check your secondary GitHub account permissions under GitHub -> **Settings** -> **Applications** -> **Vercel** -> Ensure repository access is enabled.

---

### 🔒 How to Make Your Repository Private After Deployment

Once your project is deployed on Vercel:
1. Go to your repository on GitHub (`https://github.com/your-username/Sunofy`).
2. Click **Settings** -> Scroll to **Danger Zone**.
3. Click **Change repository visibility** -> Select **Make private**.
4. Confirm by typing the repository name.
5. **Vercel will continue working seamlessly** on cellular data and Wi-Fi using your private Vercel URL (`https://your-sunofy-app.vercel.app`)!

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

