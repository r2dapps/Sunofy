<div align="center">

# 🎧 Sunofy Music & Cinema Media Player
### *Powered by Razel Tech*

**High-Fidelity Music Player, Real-Time WebRTC Sync Party Rooms, PWA App Installation & Cinema Video Stage**

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Android%20%7C%20iOS%20%7C%20Desktop-1DB954?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Powered by](https://img.shields.io/badge/Powered%20By-Razel%20Tech-ff0055.svg)](#)

</div>

---

## ✨ Key Features & Architecture

### 📻 1. Continuous WebRTC Voice Transmission & Sync Party
- **Continuous Zero-Latency Live Voice**: Instant WebRTC `RTCPeerConnection` mesh streaming over Google public STUN & Metered TURN servers.
- **Host Playback & Timeline Ownership**: Host owns room playback position (`currentTime`), play/pause, and queueing with instant drift correction.
- **Host Mic Lock Control**: Host can lock/unlock listener microphones in real time with automatic client hardware mute enforcement.
- **Dynamic Split-View & Full-Height Stage**: Eliminates empty black space on mobile screens with responsive 50/50 split-view and dynamic full-height stage options.

### 🎆 2. Ephemeral Floating Confetti Emoji Reactions
- **Zero Chat Spam**: Emoji reactions (🔥, ❤️, 🎵, 👏, 🎉, 🚀) trigger lightweight real-time confetti particle bursts (`z-[999999]`) floating across the Live Stage without clogging room chat logs.

### 🎛️ 3. Web Audio Studio Mixer & Equalizer
- **24-Segment LED VU Level Meter**: Real-time microphone audio frequency visualizer with peak hold.
- **Quick Preset Sliders**: 1-click volume balance presets (`100%`, `50%`, `Mute`) for Room Music and Voice Stream audio channels.
- **10-Band Graphic Equalizer**: Preamp, Bass Boost, Spatial Stereo Panner, and Reverb Echo controls.

### 💻 4. PC Keyboard Shortcuts & Hotkey Controls
- **Space / Enter / K**: Play / Pause toggle.
- **ArrowRight / ArrowLeft**: Seek +5s / -5s.
- **ArrowUp / ArrowDown**: Volume control (+5% / -5%).
- **N / P / M**: Next track, Previous track, Mute / Unmute.

### 📲 5. Local Media & Offline Fallback Architecture
- **Device Folder Uploads**: IndexedDB & File System Access API support for loading local MP3, AAC, FLAC, and MP4 videos for offline playback and car audio.
- **PWA 1-Tap Installation**: Native `beforeinstallprompt` installation banner and guide for Android, iOS, and Desktop.

### 🧹 6. Zero-Cost Firebase Storage & Quota Auto-Cleanup
- **Zero Accumulation Policy**: Ephemeral voice signals, reactions, and old room nodes are automatically swept and deleted from Firebase within seconds/minutes to ensure 100% free-tier operation.

---

## 🚀 Developed by Razel Tech
Designed & Developed by **Razel Tech** with ❤️.
