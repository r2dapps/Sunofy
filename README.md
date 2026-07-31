<div align="center">

# 🎧 Sunofy Music & Cinema Media Player

**High-Fidelity Music Player, Real-Time Sync Party Listening Rooms, PWA App Installation & Cinema Video Stage**

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Android%20%7C%20iOS%20%7C%20Desktop-1DB954?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

</div>

> [!CAUTION]
> **PROPRIETARY & INTELLECTUAL PROPERTY NOTICE**  
> **STRICTLY PROHIBITED**: Copying, stealing, re-distributing, scraping, mirroring, or using any portion of this source code or design system without explicit written authorization is strictly forbidden and subject to copyright enforcement.

---

## ✨ Key Features

### 📻 1. Real-Time Sync Party Rooms
- **Synchronized Playback**: Host actions (play, pause, seek slider) sync live to all room listeners in real-time.
- **Exact Duration Alignment**: Progress bars (`0:25 / 4:47`) stay in 1:1 sync across all host and listener screens.
- **Host Queue Approval**: Members can request songs or video links, requiring Host approval before queueing.
- **Member Avatars & Custom Uploads**: Live user avatars (`🎧`, `👑`, `🎸`, or custom uploaded profile photos).
- **Room QR Code & One-Tap Share**: Invite friends with room codes or scannable QR codes.

### 🎙️ 2. Live Voice Microphone Transmission
- **Toggleable Mic (Mic Live / Mic Off)**: One-tap microphone activation directly in room header and chat.
- **Audio & Haptic Feedback**: Ascending dual-tone for Mic ON, descending dual-tone for Mic OFF, paired with haptic vibrations (`navigator.vibrate`).
- **Complete Mic Hardware Shutdown**: Stopping mic immediately kills hardware `MediaStreamTrack`s so browser microphone indicators turn off 100%.

### 🎆 3. 3D Floating Emoji Reactions
- Dynamic floating emoji particles (`🔥`, `❤️`, `👏`, `😂`, `🎉`, `🚀`) with 3D rotation, scaling pulse, glowing drop-shadows, and haptic feedback.

### 🎬 4. Cinema Video Player & Watch Party
- Stream **YouTube, Google Drive, Dailymotion, Vimeo, and local MP4/MKV files**.
- Dedicated Watch Party Stage at top with auto-expanded **Search & Play** inputs below.

### 🎛️ 5. Web Audio API Equalizer & Audio FX
- **10-Band Graphic Equalizer**: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz BiquadFilter gains (-12dB to +12dB).
- **Audio Processing**: Preamp Gain, Bass Boost, Spatial Stereo Panner, and Reverb Echo presets.
- **Auto-Resume AudioContext**: Ensures filters apply immediately across all browsers.

### 📲 6. Cross-Platform PWA Installation
- **Android & Desktop**: Native `beforeinstallprompt` 1-tap app installation.
- **iOS Safari**: Step-by-step visual Add-to-Home-Screen guide (Share `⎋` -> Add to Home Screen `+`).
- **Offline Caching**: ServiceWorker caching for instant startup without network.

### 🔒 7. Security & Passcode Protection
- **Default App PIN**: `0908` across lock screen overlays and profile setup.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS
- **Icons**: Lucide React, FontAwesome 6
- **Realtime Networking**: Firebase Realtime Database & Web BroadcastChannel API
- **Audio DSP**: HTML5 Web Audio API (`AudioContext`, `BiquadFilterNode`, `StereoPannerNode`, `AnalyserNode`)
- **Storage**: IndexedDB for offline audio blobs & localStorage for settings/playlists

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**

### Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/r2dapps/Sunofy.git
   cd Sunofy
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🛡️ Security & Performance Audit Summary

- **API Redundancy**: All JioSaavn & YouTube API requests use client-side debouncing and memory caching to prevent unnecessary network loops.
- **CORS Safety**: External media streams specify `crossOrigin="anonymous"` to prevent browser canvas/audio taint.
- **Privacy & Security**: Passcodes (`0908`) and user profiles stay 100% local on client device storage. Microphone tracks are completely stopped upon muting.

---

<div align="center">
  <b>Sunofy Music & Cinema Media Player</b> • Built with React 19 & Web Audio API
</div>
