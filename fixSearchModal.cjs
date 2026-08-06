const fs = require('fs');
let content = fs.readFileSync('src/components/SearchModal.tsx', 'utf-8');

// 1. Update prop types
content = content.replace(
  'onDownloadCollection?: (query: string, name: string) => void;',
  'onDownloadCollection?: (tracks: Track[], name: string) => void;'
);
content = content.replace(
  'onAddCollectionToQueue?: (query: string, name: string) => void;',
  'onAddCollectionToQueue?: (tracks: Track[], name: string) => void;'
);

// 2. Add realPlaylists and realAlbums state
content = content.replace(
  'const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);',
  'const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);\n  const [realPlaylists, setRealPlaylists] = useState<any[]>([]);\n  const [realAlbums, setRealAlbums] = useState<any[]>([]);'
);

// 3. Update handleSearch to fetch real data
const newHandleSearch = `
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setRealPlaylists([]);
      setRealAlbums([]);
      return;
    }

    setLoading(true);
    setSuggestions([]);
    try {
      if (searchTerm.includes('youtube.com') || searchTerm.includes('youtu.be')) {
        if (musicSource !== 'cobalt' && musicSource !== 'youtube') {
          setEngineConflict(true);
          setResults([]);
          setLoading(false);
          return;
        }
        setEngineConflict(false);
        
        if (searchTerm.includes('playlist?list=')) {
        let listId = '';
        try {
          const urlObj = new URL(searchTerm);
          listId = urlObj.searchParams.get('list') || '';
        } catch(e) {
          listId = searchTerm.split('list=')[1]?.split('&')[0] || '';
        }
        if (listId) {
          const tracks = await musicApi.getYoutubePlaylist(listId);
          setResults(tracks);
          setRealPlaylists([{
             id: 'yt_playlist',
             name: 'YouTube Playlist',
             trackCount: \`\${tracks.length} tracks\`,
             image: tracks[0]?.image || './icon-192.png',
             isActualTracks: true
          }]);
          setRealAlbums([]);
          setLoading(false);
          return;
        }
      }

      }

      setEngineConflict(false);
      saveRecentSearch(searchTerm);

      if (musicSource === 'local') {
        const lower = searchTerm.toLowerCase();
        const allLocal = [...downloads, ...localFolderTracks];
        const filtered = allLocal.filter((t) => 
          (t.title && t.title.toLowerCase().includes(lower)) || 
          (t.artist && t.artist.toLowerCase().includes(lower)) ||
          (t.album && t.album.toLowerCase().includes(lower))
        );
        setResults(filtered);
        setRealPlaylists([]);
        setRealAlbums([]);
      } else {
        const [tracks, plRes, albRes] = await Promise.all([
          musicApi.searchSongs(searchTerm),
          musicApi.searchPlaylists(searchTerm).catch(() => []),
          musicApi.searchAlbums(searchTerm).catch(() => [])
        ]);
        setResults(tracks);
        setRealPlaylists((plRes || []).map((p: any) => ({
          id: p.id,
          name: p.title || p.name,
          trackCount: p.songCount ? \`\${p.songCount} tracks\` : 'Playlist',
          image: p.image?.[2]?.url || p.image?.[1]?.url || p.image?.[0]?.url || p.image || './icon-192.png'
        })));
        setRealAlbums((albRes || []).map((a: any) => ({
          id: a.id,
          name: a.title || a.name,
          artist: a.artist || a.primaryArtists || 'Various Artists',
          trackCount: a.songCount ? \`\${a.songCount} tracks\` : 'Album',
          image: a.image?.[2]?.url || a.image?.[1]?.url || a.image?.[0]?.url || a.image || './icon-192.png'
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
`;

const oldHandleSearchRegex = /const handleSearch = async \(searchTerm: string\) => \{[\s\S]*?setLoading\(false\);\s*\}\s*\};/;
content = content.replace(oldHandleSearchRegex, newHandleSearch.trim() + ';');


// 4. Remove Dummy generation (searchPlaylists and searchAlbums const declarations)
content = content.replace(/\/\/\s*Mock generated playlist \/ album collections derived from query[\s\S]*?\] :\s*\[\];/g, '');

// 5. Replace searchPlaylists with realPlaylists in the render
content = content.replace(/searchPlaylists/g, 'realPlaylists');
content = content.replace(/searchAlbums/g, 'realAlbums');


// 6. Rewrite handlePlayCollectionQuery to handlePlayRealCollection
const newPlayRealCollection = `
  const handlePlayRealCollection = async (id: string, type: 'playlist'|'album'|'youtube_playlist') => {
    if (type === 'youtube_playlist') {
       handlePlayCollection(results);
       return;
    }
    setLoading(true);
    try {
       const details = type === 'playlist' ? await musicApi.getPlaylistDetails(id) : await musicApi.getAlbumDetails(id);
       if (details && details.songs && details.songs.length > 0) {
          handlePlayCollection(details.songs);
       } else {
          console.warn('Empty collection');
       }
    } catch(e) {
       console.error(e);
    } finally {
       setLoading(false);
    }
  };

  const handleAddRealCollectionToQueue = async (id: string, name: string, type: 'playlist'|'album'|'youtube_playlist') => {
    if (type === 'youtube_playlist') {
       onAddCollectionToQueue?.(results, name);
       return;
    }
    setLoading(true);
    try {
       const details = type === 'playlist' ? await musicApi.getPlaylistDetails(id) : await musicApi.getAlbumDetails(id);
       if (details && details.songs && details.songs.length > 0) {
          onAddCollectionToQueue?.(details.songs, name);
       }
    } catch(e) {
       console.error(e);
    } finally {
       setLoading(false);
    }
  };
`;

const oldHandlePlayCollectionQueryRegex = /const handlePlayCollectionQuery = async \(colQuery: string\) => \{[\s\S]*?\}\s*\};/;
content = content.replace(oldHandlePlayCollectionQueryRegex, newPlayRealCollection.trim());


// 7. Update UI onClick handlers for playlists and albums
content = content.replace(/handlePlayCollectionQuery\(pl\.name\)/g, "handlePlayRealCollection(pl.id, pl.isActualTracks ? 'youtube_playlist' : 'playlist')");
content = content.replace(/onAddCollectionToQueue\(pl\.name, pl\.name\)/g, "handleAddRealCollectionToQueue(pl.id, pl.name, pl.isActualTracks ? 'youtube_playlist' : 'playlist')");

content = content.replace(/handlePlayCollectionQuery\(album\.name\)/g, "handlePlayRealCollection(album.id, 'album')");
content = content.replace(/onAddCollectionToQueue\(album\.name, album\.name\)/g, "handleAddRealCollectionToQueue(album.id, album.name, 'album')");

fs.writeFileSync('src/components/SearchModal.tsx', content);
console.log('SearchModal updated.');
