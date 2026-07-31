# Sunofy VibeSync™ (SyncParty) - Bugs & Ideas Roadmap

Here is a compiled list of bugs, edge cases, and UX ideas for the **Sunofy SyncParty** feature. We can tackle these in the next session to make the multi-device listening experience flawless.

## 🐛 Identified Bugs & Edge Cases

### 1. Page Refresh Drops Connection
- **Bug:** If a Host or Listener accidentally refreshes the page (or hits a PWA update), they instantly leave the room and have to manually type the room code again.
- **Solution:** We need to persist `AppState.syncRoomId` and `AppState.isSyncHost` in `localStorage`. On page load, if a saved room exists, it should seamlessly auto-reconnect them in the background without dropping the session.

### 2. Listener Playback Desync (Rogue Listeners)
- **Bug:** If a member manually clicks "Play" on a different song while in the room, they break away from the Host's sync state and get stuck playing their own song.
- **Solution:** 
  - **Option A (Strict Mode):** Completely disable the play/pause/skip buttons for Listeners while they are in a room. 
  - **Option B (Resync Button):** Allow them to wander off, but show a prominent **"Sync to Host"** button that instantly teleports their audio player back to exactly where the Host is.

### 3. Track Request Limitations
- **Bug:** Currently, `promptListenerTrackRequest()` just uses a generic JavaScript `prompt()` to ask for a song name, which pushes a fake track object to the Host without a real audio URL.
- **Solution:** Listeners need to be able to actually use the search bar, click on a real song, and press an "Add to Host Queue" button instead of the regular Play button. 

---

## 💡 UX / UI Ideas

### 1. Dedicated "Clean" Full-Screen Watch Party View
- **Idea:** Right now, the Sync Party is just a dock overlay on top of the regular app. 
- **Implementation:** When you join a room, the app should smoothly transition into a **"Theater Mode" / "Clean Room"**. 
  - Hide the heavy browsing UI.
  - Show a massive beautiful album art cover.
  - Show live floating emoji reactions bursting from the bottom.
  - Show a neat list of connected avatars at the top.
  - Only a prominent "Leave Party" button will allow them to exit this view and return to normal browsing.

### 2. Host-Only Navigation
- **Idea:** To keep the party focused, listeners should be locked into the "Theater Mode" screen.
- **Implementation:** Only the Host is allowed to minimize the player and browse for new songs to queue. If a listener wants to browse, they must hit "Leave Party" (or use a dedicated "Request Song" UI panel).

### 3. Visual Latency / Ping Indicators
- **Idea:** The ping monitors are already built into the engine (`startPingMonitor`). We should expose a visual Wi-Fi style icon next to each listener's avatar. If someone is buffering or has high latency, it turns yellow/red so the Host knows they are lagging behind!
