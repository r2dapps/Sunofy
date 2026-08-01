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

## 🎵 Music Engine Architecture & Limitations

Sunofy supports **4 interchangeable music engines**, each with distinct capabilities and browser-level constraints. Here's an honest technical breakdown of what works, what doesn't, and exactly how we handled each limitation.

---

### 1. 🎧 JioSaavn Engine (`jiosaavn`)

**What it does:** Searches and streams from JioSaavn's public CDN via CORS-enabled community API mirrors.

**How search works:**
- Calls `/search/songs`, `/search/playlists`, `/search/albums` on a cascade of public Saavn API mirrors (`saavn.sumit.co`, `saavn-api.vercel.app`, etc.)
- On localhost: also tries a local Express proxy (`/api`) first for fastest response

**How playback works:**
- Returns direct `.mp3` CDN stream URLs from JioSaavn (`aac.saavncdn.com`) — these are fully CORS-allowed
- Loaded natively into the HTML5 `<audio>` element with no proxying needed

**Limitations:**
- `http://` stream URLs are rewritten to `https://` to avoid mixed-content browser blocks
- API mirrors can go down; the cascade tries 3–4 mirrors before falling back to local mock songs

---

### 2. ⚡ Cobalt YT Engine (`cobalt`)

**What it does:** Searches YouTube and extracts a direct audio-only CDN stream via the Cobalt API, then plays it in the standard `<audio>` element.

**Why Cobalt is needed:**
> Browsers block direct YouTube audio streams (`youtube.com/...`) in `<audio>` tags with a CORS error — YouTube's servers return no `Access-Control-Allow-Origin` header for audio resources. You **cannot** play a YouTube URL natively in `<audio>`.

**How it works:**
1. `searchYoutubeCobalt()` finds YouTube tracks with video IDs and thumbnails
2. On play, `extractCobaltStream(youtubeUrl)` calls a Cobalt API instance with `{ downloadMode: "audio", audioFormat: "mp3" }`
3. Cobalt returns a temporary direct CDN audio URL (e.g., `googlevideo.com/...`) which **is** CORS-allowed
4. That URL is loaded into `<audio>` and plays normally

**Known issues & mitigations:**
| Problem | Mitigation |
|---|---|
| `api.cobalt.tools` blocks third-party use (bot protection, Cloudflare Turnstile) | Cascade through 4 community-hosted Cobalt instances before falling back |
| Old API schema: `videoQuality: "audio"` → `400 Bad Request` | Fixed to correct schema: `downloadMode: "audio"` |
| Cobalt stream URLs are temporary (expire in ~6–24 hrs) | Re-extract on each play; never cache stream URLs |

---

### 3. 🎵 YouTube Music Engine (`youtube`)

**What it does:** Searches YouTube Music and renders playback via a **YouTube iframe embed** instead of `<audio>`.

**Why iframe instead of `<audio>`:**
> YouTube Music audio URLs hit the same CORS wall as regular YouTube. Even Cobalt can be unreliable. The cleanest zero-CORS solution: embed the YouTube player iframe directly in the UI — YouTube serves its own audio with full permission.

**How it works:**
1. Search: uses `searchYoutubeCobalt()` (same as Cobalt engine) to get YouTube video IDs + thumbnails
2. Playback: instead of loading URL into `<audio>`, a YouTube `<iframe>` embed is rendered in the **disc/vinyl area** of the mini player and full player
3. Play/pause from Sunofy's own buttons → sent via `postMessage` to the iframe using the **YouTube IFrame Player API** (`{ event: "command", func: "playVideo"/"pauseVideo" }`)

**Visual integration:**
- **Mini player**: Circular iframe clipped with `border-radius: 50%`, replacing the spinning vinyl disc
- **Full player**: Full disc area replaced by the YouTube iframe (video or thumbnail shows)
- `controls=0` hides YouTube's native UI; `enablejsapi=1` enables postMessage control

**Lock screen protection:**
> When the app is locked (PIN screen shown), MiniPlayer and FullPlayerModal are completely unmounted from the DOM — the iframe is destroyed, making **zero network requests**, preventing the YouTube URL from appearing in OS media/lock screen notifications.

---

### 4. 💾 Local Engine (`local`)

**What it does:** Plays audio files loaded from the user's device — no network, no CORS, fully offline.

**How it works:**
- **Downloaded tracks**: Stored as `offlineBlobUrl` (IndexedDB blob URLs) from previously downloaded JioSaavn/Cobalt tracks
- **Folder imports**: File System Access API / `<input type="file">` — creates `URL.createObjectURL(file)` blob URLs
- **Mock fallback**: 8 pre-seeded demo tracks using Google's public sample audio OGG files for testing without any local files

**Limitations:**
- Blob URLs expire when the browser tab closes (downloaded tracks need re-cache via IndexedDB)
- No search results — Discover and Search show only locally available tracks in local mode

---

### Engine Comparison Table

| Feature | 🎧 JioSaavn | ⚡ Cobalt YT | 🎵 YT Music | 💾 Local |
|---|---|---|---|---|
| Search | ✅ Full catalog | ✅ YouTube search | ✅ YouTube search | ✅ Device files only |
| Audio element (`<audio>`) | ✅ Native CDN URL | ✅ Via Cobalt extract | ❌ CORS blocked | ✅ Blob URL |
| Iframe embed | ❌ Not needed | ❌ Not needed | ✅ Disc iframe | ❌ Not needed |
| Offline support | ❌ | ❌ | ❌ | ✅ |
| Thumbnails | ✅ JioSaavn CDN | ✅ YouTube thumbnail | ✅ YouTube thumbnail | ⚠️ Icon fallback |
| Lock screen safe | ✅ | ✅ | ✅ (unmounted when locked) | ✅ |
| Needs backend | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Developed by Razel Tech
Designed & Developed by **Razel Tech** with ❤️.
