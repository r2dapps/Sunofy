import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Helper to parse duration string (e.g. "3:45" or "1:12:00") into seconds
  const parseDurationSeconds = (str?: string): number => {
    if (!str) return 210;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 210;
  };

  // 1. JioSaavn Search API Proxy Endpoint
  app.get('/api/search/songs', async (req: Request, res: Response) => {
    const query = (req.query.query as string) || 'Telugu Melodies';

    const mirrors = [
      `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/songs?query=${encodeURIComponent(query)}`,
      `https://jiosaavn-api-beta.vercel.app/search/songs?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`,
    ];

    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {
        // Try next mirror
      }
    }

    res.status(500).json({ success: false, message: 'All JioSaavn search mirrors unreachable' });
  });

  // 1a2. JioSaavn Search Playlists Proxy Endpoint
  app.get('/api/search/playlists', async (req: Request, res: Response) => {
    const query = (req.query.query as string) || 'Telugu Hits';
    const mirrors = [
      `https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/playlists?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/playlists?query=${encodeURIComponent(query)}`,
    ];

    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Playlists API unreachable' });
  });

  // 1a3. JioSaavn Playlist Details Proxy Endpoint
  app.get('/api/playlists', async (req: Request, res: Response) => {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ success: false, message: 'Missing id parameter' });
      return;
    }
    const mirrors = [
      `https://saavn.sumit.co/api/playlists?id=${encodeURIComponent(id)}`,
      `https://saavn-api.vercel.app/playlists?id=${encodeURIComponent(id)}`,
      `https://saavn.dev/api/playlists?id=${encodeURIComponent(id)}`,
    ];

    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Playlist details API unreachable' });
  });

  // 1a4. JioSaavn Search Albums Proxy Endpoint
  app.get('/api/search/albums', async (req: Request, res: Response) => {
    const query = (req.query.query as string) || 'Telugu Albums';
    const mirrors = [
      `https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}`,
      `https://saavn-api.vercel.app/search/albums?query=${encodeURIComponent(query)}`,
      `https://saavn.dev/api/search/albums?query=${encodeURIComponent(query)}`,
    ];

    for (const mirrorUrl of mirrors) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(mirrorUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.data || Array.isArray(data) || data.success)) {
            res.json(data);
            return;
          }
        }
      } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Albums API unreachable' });
  });

  // 1b. Dedicated YouTube / YouTube Music Search API Endpoint
  app.get('/api/youtube/search', async (req: Request, res: Response) => {
    const query = (req.query.q as string) || (req.query.query as string) || 'Telugu Hits';
    
    // 1. Try Piped API instances first (Fastest and reliable)
    const pipedInstances = [
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      `https://api.piped.yt/search?q=${encodeURIComponent(query)}&filter=music_songs`,
      `https://pipedapi.mha.fi/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    ];

    for (const pipedUrl of pipedInstances) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const pRes = await fetch(pipedUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        if (pRes.ok) {
          const pData = await pRes.json();
          const items = pData.items || pData;
          if (Array.isArray(items) && items.length > 0) {
            const results = items
              .filter((it: any) => it.type === 'stream' || it.videoId)
              .slice(0, 15)
              .map((it: any) => ({
                id: it.url ? it.url.replace('/watch?v=', '') : (it.videoId || 'yt_id'),
                videoId: it.url ? it.url.replace('/watch?v=', '') : (it.videoId || 'yt_id'),
                title: it.title || 'YouTube Song',
                artist: it.uploaderName || 'YouTube Artist',
                author: it.uploaderName || 'YouTube Artist',
                lengthSeconds: it.duration || 210,
                duration: it.duration ? `${Math.floor(it.duration / 60)}:${(it.duration % 60).toString().padStart(2, '0')}` : '3:30',
                thumbnail: it.thumbnail || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`,
                image: it.thumbnail || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`,
                downloadUrl: `/api/youtube/stream?id=${it.url ? it.url.replace('/watch?v=', '') : it.videoId}`,
              }));
            if (results.length > 0) {
              res.json({ success: true, results, items: results });
              return;
            }
          }
        }
      } catch (e) {}
    }

    // 2. Try direct YouTube HTML scraping fallback
    try {
      const ytUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const ytRes = await fetch(ytUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timeout);

      if (ytRes.ok) {
        const html = await ytRes.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/window\[\"ytInitialData\"\] = ({.*?});/s);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          const contents = parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
          
          const results: any[] = [];
          for (const item of contents) {
            const v = item.videoRenderer;
            if (v && v.videoId) {
              const durText = v.lengthText?.simpleText || '3:30';
              const title = v.title?.runs?.[0]?.text || 'YouTube Music';
              const author = v.ownerText?.runs?.[0]?.text || 'YouTube Artist';
              const thumbUrl = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
              
              results.push({
                id: v.videoId,
                type: 'video',
                videoId: v.videoId,
                title: title,
                artist: author,
                author: author,
                lengthSeconds: parseDurationSeconds(durText),
                duration: durText,
                durationText: durText,
                videoThumbnails: [{ url: thumbUrl }],
                thumbnail: thumbUrl,
                image: thumbUrl,
                downloadUrl: `/api/youtube/stream?id=${v.videoId}`,
                videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&enablejsapi=1`,
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
      console.warn('YouTube scraping failed');
    }

    // 3. Fallback mock YouTube item
    res.json({
      success: true,
      results: [
        {
          id: 'oxg2fCTF3BQ',
          type: 'video',
          videoId: 'oxg2fCTF3BQ',
          title: `${query} - YouTube Audio`,
          artist: 'YouTube Music',
          author: 'YouTube',
          lengthSeconds: 240,
          duration: '4:00',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=350&fit=crop',
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=350&fit=crop',
          downloadUrl: '/api/youtube/stream?id=oxg2fCTF3BQ',
        }
      ],
      items: []
    });
  });

  // 1b2. Dedicated YouTube Stream Link Resolver (Tries Piped, Cobalt & Invidious)
  app.get('/api/youtube/stream', async (req: Request, res: Response) => {
    const videoId = (req.query.id as string) || (req.query.videoId as string);
    if (!videoId) {
      res.status(400).send('Missing video id');
      return;
    }

    // A. Try Piped API Streams
    const pipedStreamUrls = [
      `https://pipedapi.kavin.rocks/streams/${videoId}`,
      `https://api.piped.yt/streams/${videoId}`,
      `https://pipedapi.mha.fi/streams/${videoId}`,
    ];

    for (const pUrl of pipedStreamUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const pRes = await fetch(pUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        if (pRes.ok) {
          const data = await pRes.json();
          const audioStreams = data.audioStreams || [];
          if (audioStreams.length > 0) {
            // Pick highest quality audio stream
            const bestStream = audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            if (bestStream && bestStream.url) {
              res.redirect(bestStream.url);
              return;
            }
          }
        }
      } catch (e) {}
    }

    // B. Try Cobalt API instances
    const cobaltInstances = [
      'https://api.cobalt.tools/',
      'https://co.wuk.sh/api/json',
      'https://cobalt.qtfy.dev/',
    ];

    for (const cobUrl of cobaltInstances) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const cRes = await fetch(cobUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            audioFormat: 'mp3',
            isAudioOnly: true,
          }),
        });
        clearTimeout(timeout);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.url) {
            res.redirect(cData.url);
            return;
          }
        }
      } catch (e) {}
    }

    // C. Fallback to sample high quality audio stream
    res.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  });

  // 1c. Search Suggestions Endpoint (Proxies Google YouTube Search Complete without CORS issues)
  app.get('/api/suggestions', async (req: Request, res: Response) => {
    const q = (req.query.q as string) || (req.query.query as string) || '';
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
        headers: { 'User-Agent': 'Mozilla/5.0' },
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
      // Fallback silent failure
    }
    res.json({ success: true, suggestions: [] });
  });

  // 2. Audio Proxy Endpoint to bypass CORS when saving tracks for offline
  app.get('/api/proxy-audio', async (req: Request, res: Response) => {
    const audioUrl = req.query.url as string;
    if (!audioUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        res.status(response.status).send('Failed to fetch remote audio stream');
        return;
      }
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      res.status(500).send(err.message || 'Error proxying audio');
    }
  });

  // 3. Cloud Library Sync Endpoint
  let cloudLibraryData: any = null;

  app.get('/api/library/sync', (req: Request, res: Response) => {
    res.json(cloudLibraryData || { status: 'empty' });
  });

  app.post('/api/library/sync', (req: Request, res: Response) => {
    cloudLibraryData = {
      ...req.body,
      updatedAt: new Date().toLocaleTimeString(),
    };
    res.json({ success: true, updatedAt: cloudLibraryData.updatedAt });
  });

  // 3. Sync Party Rooms Endpoint
  const syncRoomsMap = new Map<string, any>();

  app.get('/api/sync/rooms', (req: Request, res: Response) => {
    const code = (req.query.code as string) || 'SUNO-8492';
    const roomState = syncRoomsMap.get(code);
    if (roomState) {
      res.json({ success: true, state: roomState });
    } else {
      res.status(404).json({ success: false, message: 'Room not found' });
    }
  });

  app.post('/api/sync/rooms', (req: Request, res: Response) => {
    const { roomCode, state } = req.body;
    if (roomCode && state) {
      syncRoomsMap.set(roomCode, state);
      res.json({ success: true, roomCode });
    } else {
      res.status(400).json({ success: false, message: 'Invalid room payload' });
    }
  });

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sunofy Music Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
