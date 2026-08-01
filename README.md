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

> [!CAUTION]
> **PROPRIETARY & INTELLECTUAL PROPERTY NOTICE**  
> **STRICTLY PROHIBITED**: Copying, stealing, re-distributing, scraping, mirroring, or using any portion of this source code or design system without explicit written authorization is strictly forbidden and subject to copyright enforcement.

---

## ✨ Key Features & Architecture

### 📻 1. Continuous WebRTC Voice Transmission & Sync Party
- **Continuous Zero-Latency Live Voice**: Instant WebRTC `RTCPeerConnection` mesh streaming over Google public STUN & Metered TURN servers.
- **Inter-City Latency Compensation**: Calculates transit network delay and applies smooth micro-speed adjustments (`1.025x` / `0.975x`) to eliminate audio jumping or relooping over long distances.
- **Host Playback & Timeline Ownership**: Host owns room playback position (`currentTime`), play/pause, and queueing with instant drift correction.
- **Host Mic Lock Control**: Host can lock/unlock listener microphones in real time with automatic client hardware mute enforcement.

### 🎬 2. Clean Video Watch Stage & Individual Fullscreen Mode
- **Smart Stage Switching**: Audio song progress bars and vinyl disc graphics automatically hide when a YouTube Watch Party video is playing.
- **Individual Fullscreen Mode**: Tap `[ ⛶ ]` on any video to expand it to full screen individually on your phone or laptop while retaining live room voice chat.

### 🎆 3. Custom Reaction Engine & Live Floating Confetti
- **Preset & Custom Emoji Support**: Send quick reactions (`🔥`, `❤️`, `👏`, `😂`, `🎉`, `🚀`, `💯`, `⚡`, `👑`, `🤩`) or type any custom emoji/text reaction.
- **Zero Chat Spam**: Reactions trigger lightweight real-time confetti particle bursts (`z-[999999]`) floating across the Live Stage without clogging room chat logs.

### 💬 4. Docked Bottom Navigation Bar & Unread Notifications
- **Auto-Expanding Bottom Console**: Tapping any tab icon in the bottom tray bar automatically expands the console card for optimal UX.
- **Unread Chat Red Blip**: Pulsing red dot notification appears on the Chat icon when new messages arrive.
- **Smart Chat Auto-Scroll**: Smoothly auto-scrolls to the latest message on arrival.

### 🎛️ 5. Master Studio Volume Mixer & Equalizer
- **Unified 2-Channel Volume Controls**: 
  - 🔊 **Room Media Volume**: Single master slider for Music & YouTube Video playback.
  - 🎙️ **Voice Stream Volume**: Dedicated master slider for incoming WebRTC live microphone audio.
- **24-Segment LED VU Level Meter**: Real-time microphone audio frequency visualizer with peak hold.
- **10-Band Graphic Equalizer**: Preamp, Bass Boost, Spatial Stereo Panner, and Reverb Echo controls.

### 🌐 6. Cross-Network WebRTC Architecture Guide
- Detailed documentation in [`WEBRTC_CROSS_NETWORK_GUIDE.md`](./WEBRTC_CROSS_NETWORK_GUIDE.md) explaining Wi-Fi (STUN) vs 4G/5G Cellular Data (CGNAT TURN over Port 443).

### 💻 7. PC Keyboard Shortcuts & Hotkey Controls
- **Space / Enter / K**: Play / Pause toggle.
- **ArrowRight / ArrowLeft**: Seek +5s / -5s.
- **ArrowUp / ArrowDown**: Volume control (+5% / -5%).
- **N / P / M**: Next track, Previous track, Mute / Unmute.

### 📲 8. Local Media & Offline Fallback Architecture
- **Device Folder Uploads**: IndexedDB & File System Access API support for loading local MP3, AAC, FLAC, and MP4 videos for offline playback and car audio.
- **PWA 1-Tap Installation**: Native `beforeinstallprompt` installation banner and guide for Android, iOS, and Desktop.

### 🧹 9. Zero-Cost Firebase Storage & Quota Auto-Cleanup
- **Zero Accumulation Policy**: Ephemeral voice signals, reactions, and old room nodes are automatically swept and deleted from Firebase within seconds/minutes to ensure 100% free-tier operation.

---

## 🚀 Developed by Razel Tech
Designed & Developed by **Razel Tech** with ❤️.
