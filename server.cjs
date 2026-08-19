var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  const parseDurationSeconds = (str) => {
    if (!str) return 210;
    const parts = str.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 210;
  };
  app.get("/api/search/songs", async (req, res) => {
    const query = req.query.query || "Telugu Melodies";
    const mirrors = [
      `https://jiosaavn-api-beta.vercel.app/search/songs?query=${encodeURIComponent(query)}`,
      `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/songs?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`
    ];
    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {
      }
    }
    res.status(500).json({ success: false, message: "All JioSaavn search mirrors unreachable" });
  });
  app.get("/api/search/playlists", async (req, res) => {
    const query = req.query.query || "Telugu Hits";
    const mirrors = [
      `https://jiosaavn-api-beta.vercel.app/search/playlists?query=${encodeURIComponent(query)}`,
      `https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/playlists?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/playlists?query=${encodeURIComponent(query)}`
    ];
    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {
      }
    }
    res.status(500).json({ success: false, message: "Playlists API unreachable" });
  });
  app.get("/api/playlists", async (req, res) => {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ success: false, message: "Missing id parameter" });
      return;
    }
    const mirrors = [
      `https://jiosaavn-api-beta.vercel.app/playlists?id=${encodeURIComponent(id)}&limit=200`,
      `https://saavn.sumit.co/api/playlists?id=${encodeURIComponent(id)}&limit=200`,
      `https://saavn-api.vercel.app/playlists?id=${encodeURIComponent(id)}&limit=200`,
      `https://saavn.dev/api/playlists?id=${encodeURIComponent(id)}&limit=200`
    ];
    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {
      }
    }
    res.status(500).json({ success: false, message: "Playlist details API unreachable" });
  });
  app.get("/api/search/albums", async (req, res) => {
    const query = req.query.query || "Telugu Albums";
    const mirrors = [
      `https://jiosaavn-api-beta.vercel.app/search/albums?query=${encodeURIComponent(query)}`,
      `https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/albums?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/albums?query=${encodeURIComponent(query)}`
    ];
    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {
      }
    }
    res.status(500).json({ success: false, message: "Albums API unreachable" });
  });
  app.get("/api/youtube/search", async (req, res) => {
    const query = req.query.q || req.query.query || "Telugu Hits";
    const filter = req.query.filter || "music_songs";
    const pipedInstances = [
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=${filter}`,
      `https://api.piped.yt/search?q=${encodeURIComponent(query)}&filter=${filter}`,
      `https://pipedapi.mha.fi/search?q=${encodeURIComponent(query)}&filter=${filter}`
    ];
    for (const pipedUrl of pipedInstances) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4e3);
        const pRes = await fetch(pipedUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (pRes.ok) {
          const pData = await pRes.json();
          const items = pData.items || pData;
          if (Array.isArray(items) && items.length > 0) {
            const results = items.filter((it) => it.type === "stream" || it.videoId).slice(0, 15).map((it) => ({
              id: it.url ? it.url.replace("/watch?v=", "") : it.videoId || "yt_id",
              videoId: it.url ? it.url.replace("/watch?v=", "") : it.videoId || "yt_id",
              title: it.title || "YouTube Song",
              artist: it.uploaderName || "YouTube Artist",
              author: it.uploaderName || "YouTube Artist",
              lengthSeconds: it.duration || 210,
              duration: it.duration ? `${Math.floor(it.duration / 60)}:${(it.duration % 60).toString().padStart(2, "0")}` : "3:30",
              thumbnail: it.thumbnail || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`,
              image: it.thumbnail || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`,
              downloadUrl: `/api/youtube/stream?id=${it.url ? it.url.replace("/watch?v=", "") : it.videoId}`
            }));
            if (results.length > 0) {
              res.json({ success: true, results, items: results });
              return;
            }
          }
        }
      } catch (e) {
      }
    }
    try {
      const ytUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5e3);
      const ytRes = await fetch(ytUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      clearTimeout(timeout);
      if (ytRes.ok) {
        const html = await ytRes.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/window\[\"ytInitialData\"\] = ({.*?});/s);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          const contents = parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
          const results = [];
          for (const item of contents) {
            const v = item.videoRenderer;
            if (v && v.videoId) {
              const durText = v.lengthText?.simpleText || "3:30";
              const title = v.title?.runs?.[0]?.text || "YouTube Music";
              const author = v.ownerText?.runs?.[0]?.text || "YouTube Artist";
              const thumbUrl = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
              results.push({
                id: v.videoId,
                type: "video",
                videoId: v.videoId,
                title,
                artist: author,
                author,
                lengthSeconds: parseDurationSeconds(durText),
                duration: durText,
                durationText: durText,
                videoThumbnails: [{ url: thumbUrl }],
                thumbnail: thumbUrl,
                image: thumbUrl,
                downloadUrl: `/api/youtube/stream?id=${v.videoId}`,
                videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&enablejsapi=1`
              });
            }
          }
          if (results.length > 0) {
            res.json({ success: true, results, items: results });
            return;
          }
        }
      }
    } catch (err) {
      console.warn("YouTube scraping failed");
    }
    res.json({
      success: true,
      results: [
        {
          id: "oxg2fCTF3BQ",
          type: "video",
          videoId: "oxg2fCTF3BQ",
          title: `${query} - YouTube Audio`,
          artist: "YouTube Music",
          author: "YouTube",
          lengthSeconds: 240,
          duration: "4:00",
          thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=350&fit=crop",
          image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=350&fit=crop",
          downloadUrl: "/api/youtube/stream?id=oxg2fCTF3BQ"
        }
      ],
      items: []
    });
  });
  app.get("/api/youtube/playlist", async (req, res) => {
    const listId = req.query.id;
    if (!listId) {
      res.status(400).json({ success: false, message: "Missing playlist id" });
      return;
    }
    try {
      const ytUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6e3);
      const ytRes = await fetch(ytUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      clearTimeout(timeout);
      if (ytRes.ok) {
        const html = await ytRes.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/window\["ytInitialData"\] = ({.*?});/s);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          const tabs = parsed.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          let contents = [];
          let mixContents = [];
          for (const tab of tabs) {
            if (tab.tabRenderer?.content?.sectionListRenderer?.contents) {
              const sectionContents = tab.tabRenderer.content.sectionListRenderer.contents;
              for (const sec of sectionContents) {
                if (sec.itemSectionRenderer?.contents) {
                  for (const item of sec.itemSectionRenderer.contents) {
                    if (item.playlistVideoListRenderer?.contents) {
                      contents = item.playlistVideoListRenderer.contents;
                    } else if (item.lockupViewModel && item.lockupViewModel.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
                      mixContents.push(item);
                    }
                  }
                }
              }
            }
          }
          const results = [];
          for (const item of contents) {
            const v = item.playlistVideoRenderer;
            if (v && v.videoId && v.isPlayable) {
              const durText = v.lengthText?.simpleText || "3:30";
              const title = v.title?.runs?.[0]?.text || "YouTube Song";
              const author = v.shortBylineText?.runs?.[0]?.text || "YouTube Artist";
              const thumbUrl = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
              results.push({
                id: v.videoId,
                type: "video",
                videoId: v.videoId,
                title,
                artist: author,
                author,
                lengthSeconds: parseDurationSeconds(durText),
                duration: durText,
                durationText: durText,
                videoThumbnails: [{ url: thumbUrl }],
                thumbnail: thumbUrl,
                image: thumbUrl,
                downloadUrl: `/api/youtube/stream?id=${v.videoId}`,
                videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&enablejsapi=1`
              });
            }
          }
          for (const item of mixContents) {
            const v = item.lockupViewModel;
            if (v && v.contentId) {
              const title = v.metadata?.lockupMetadataViewModel?.title?.content || "YouTube Song";
              let author = "YouTube Artist";
              let durText = "3:30";
              const parts = v.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts;
              if (parts && parts.length > 0) {
                author = parts[0]?.text?.content || author;
              }
              const thumbUrl = v.image?.imageViewModel?.image?.sources?.[0]?.url || `https://i.ytimg.com/vi/${v.contentId}/hqdefault.jpg`;
              results.push({
                id: v.contentId,
                type: "video",
                videoId: v.contentId,
                title,
                artist: author,
                author,
                lengthSeconds: parseDurationSeconds(durText),
                duration: durText,
                durationText: durText,
                videoThumbnails: [{ url: thumbUrl }],
                thumbnail: thumbUrl,
                image: thumbUrl,
                downloadUrl: `/api/youtube/stream?id=${v.contentId}`,
                videoUrl: `https://www.youtube.com/watch?v=${v.contentId}`,
                embedUrl: `https://www.youtube.com/embed/${v.contentId}?autoplay=1&enablejsapi=1`
              });
            }
          }
          if (results.length > 0) {
            res.json({ success: true, results, items: results });
            return;
          }
        }
      }
    } catch (err) {
      console.warn("YouTube playlist scraping failed", err);
    }
    res.status(500).json({ success: false, message: "Failed to extract playlist" });
  });
  app.get("/api/youtube/stream", async (req, res) => {
    const videoId = req.query.id || req.query.videoId;
    if (!videoId) {
      res.status(400).send("Missing video id");
      return;
    }
    const pipedStreamUrls = [
      `https://pipedapi.kavin.rocks/streams/${videoId}`,
      `https://api.piped.yt/streams/${videoId}`,
      `https://pipedapi.mha.fi/streams/${videoId}`
    ];
    for (const pUrl of pipedStreamUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4e3);
        const pRes = await fetch(pUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
        clearTimeout(timeout);
        if (pRes.ok) {
          const data = await pRes.json();
          const audioStreams = data.audioStreams || [];
          if (audioStreams.length > 0) {
            const bestStream = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            if (bestStream && bestStream.url) {
              res.redirect(bestStream.url);
              return;
            }
          }
        }
      } catch (e) {
      }
    }
    const cobaltInstances = [
      "https://api.cobalt.tools/",
      "https://co.wuk.sh/api/json",
      "https://cobalt.qtfy.dev/"
    ];
    for (const cobUrl of cobaltInstances) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4e3);
        const cRes = await fetch(cobUrl, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            audioFormat: "mp3",
            isAudioOnly: true
          })
        });
        clearTimeout(timeout);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.url) {
            res.redirect(cData.url);
            return;
          }
        }
      } catch (e) {
      }
    }
    res.status(404).send("YouTube streaming is no longer supported via proxy. Please use Cobalt or the official YouTube Music engine.");
  });
  app.get("/api/suggestions", async (req, res) => {
    const q = req.query.q || req.query.query || "";
    if (!q.trim()) {
      res.json({ success: true, suggestions: [] });
      return;
    }
    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q.trim())}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const suggestRes = await fetch(suggestUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      clearTimeout(timeout);
      if (suggestRes.ok) {
        const data = await suggestRes.json();
        if (data && Array.isArray(data[1])) {
          res.json({ success: true, suggestions: data[1].slice(0, 8) });
          return;
        }
      }
    } catch (e) {
    }
    res.json({ success: true, suggestions: [] });
  });
  app.get("/api/proxy-audio", async (req, res) => {
    const audioUrl = req.query.url;
    if (!audioUrl) {
      res.status(400).send("Missing url parameter");
      return;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(audioUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        res.status(response.status).send("Failed to fetch remote audio stream");
        return;
      }
      const contentType = response.headers.get("content-type") || "audio/mpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      res.status(500).send(err.message || "Error proxying audio");
    }
  });
  let cloudLibraryData = null;
  app.get("/api/library/sync", (req, res) => {
    res.json(cloudLibraryData || { status: "empty" });
  });
  app.post("/api/library/sync", (req, res) => {
    cloudLibraryData = {
      ...req.body,
      updatedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString()
    };
    res.json({ success: true, updatedAt: cloudLibraryData.updatedAt });
  });
  const syncRoomsMap = /* @__PURE__ */ new Map();
  app.get("/api/sync/rooms", (req, res) => {
    const code = req.query.code || "SUNO-8492";
    const roomState = syncRoomsMap.get(code);
    if (roomState) {
      res.json({ success: true, state: roomState });
    } else {
      res.status(404).json({ success: false, message: "Room not found" });
    }
  });
  app.post("/api/sync/rooms", (req, res) => {
    const { roomCode, state } = req.body;
    if (roomCode && state) {
      syncRoomsMap.set(roomCode, state);
      res.json({ success: true, roomCode });
    } else {
      res.status(400).json({ success: false, message: "Invalid room payload" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Sunofy Music Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
