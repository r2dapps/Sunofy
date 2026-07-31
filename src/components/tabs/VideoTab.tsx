import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Upload,
  Globe,
  RotateCcw,
  FastForward,
  Rewind,
  PictureInPicture,
  Flame,
  FolderOpen,
  Info,
  Check,
  Search,
  Youtube,
  X,
  History,
  Trash2,
  Bookmark,
  Tv,
  ListVideo,
  Heart,
  ChevronDown
} from 'lucide-react';

export interface SavedVideoItem {
  id: string;
  title: string;
  videoUrl: string;
  embedUrl?: string;
  type: 'mp4' | 'local' | 'youtube' | 'drive' | 'dailymotion' | 'vimeo';
  duration?: string;
  thumbnail?: string;
  playedAt: string;
}

interface SampleVideo {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  type: 'mp4' | 'youtube' | 'drive' | 'dailymotion' | 'vimeo';
  embedId?: string;
}

interface VideoTabProps {
  onShowToast: (msg: string) => void;
  onVideoPlay?: () => void;
  onVideoSelect?: (video: { url: string; title: string; type: string }) => void;
  isAudioPlaying?: boolean;
  onMinimize?: () => void;
  isEmbeddedInSyncParty?: boolean;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  onShowToast,
  onVideoPlay,
  onVideoSelect,
  isAudioPlaying,
  onMinimize,
  isEmbeddedInSyncParty = false,
}) => {
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  );
  const [videoTitle, setVideoTitle] = useState('Tears of Steel (Sci-Fi Movie)');
  const [videoSourceType, setVideoSourceType] = useState<'mp4' | 'local' | 'youtube' | 'drive' | 'dailymotion' | 'vimeo'>('mp4');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [localFileSize, setLocalFileSize] = useState<string | null>(null);

  // ProTip Modal State
  const [showProTipModal, setShowProTipModal] = useState(false);

  // Video History State (Persisted in localStorage)
  const [videoHistory, setVideoHistory] = useState<SavedVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('sunofy_video_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Tab View in Video Tab (Featured / Search Results / Watch History)
  const [activeSubTab, setActiveSubTab] = useState<'featured' | 'history' | 'search' | 'favorites' | 'queue'>('featured');

  // Video Player Controls State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLooping, setIsLooping] = useState(false);

  // Pause video if main music audio player becomes active
  useEffect(() => {
    if (isAudioPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isAudioPlaying]);

  // YouTube Search Query & Results State
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SampleVideo[]>([]);
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [isSearching, setIsSearching] = useState(false);

  // Favorites State
  const [videoFavorites, setVideoFavorites] = useState<SavedVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('sunofy_video_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Expandable Search Panel - Default open when embedded in SyncParty
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);

  // Video Queue State
  const [videoQueue, setVideoQueue] = useState<(SampleVideo | SavedVideoItem)[]>([]);

  const controlsTimeoutRef = useRef<any>(null);

  // Curated playable music videos catalog (No live streams)
  const playableMusicVideosCatalog: SampleVideo[] = [
    {
      id: 'mv_1',
      title: 'Ramuloo Ramulaa - Ala Vaikunthapurramuloo Video Song',
      category: 'Telugu Tollywood',
      duration: '4:15',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=13I3kY06nC4',
      type: 'youtube',
      embedId: '13I3kY06nC4',
    },
    {
      id: 'mv_2',
      title: 'Kalaavathi - Sarkaru Vaari Paata Video Song',
      category: 'Telugu Tollywood',
      duration: '4:02',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=k4yXQkG2s1E',
      type: 'youtube',
      embedId: 'k4yXQkG2s1E',
    },
    {
      id: 'mv_3',
      title: 'Naatu Naatu - RRR Full Video Song',
      category: 'Telugu Tollywood',
      duration: '4:35',
      thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=sAzlWScHTc4',
      type: 'youtube',
      embedId: 'sAzlWScHTc4',
    },
    {
      id: 'mv_4',
      title: 'Srivalli - Pushpa The Rise Video Song',
      category: 'Telugu Tollywood',
      duration: '3:45',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=hcMzwMrr1tU',
      type: 'youtube',
      embedId: 'hcMzwMrr1tU',
    },
    {
      id: 'mv_5',
      title: 'Arabic Kuthu - Halamithi Habibo Video Song',
      category: 'Tamil Hits',
      duration: '4:40',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=KVP9M1CInS4',
      type: 'youtube',
      embedId: 'KVP9M1CInS4',
    },
    {
      id: 'mv_6',
      title: 'Oo Antava Mava..Oo Oo Antava - Pushpa Video Song',
      category: 'Telugu Tollywood',
      duration: '3:50',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a1a2a4f529ed?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=s4A_UCo0EaM',
      type: 'youtube',
      embedId: 's4A_UCo0EaM',
    },
    {
      id: 'mv_7',
      title: 'Inkem Inkem Inkem Kaavale - Geetha Govindam Video Song',
      category: 'Telugu Melodies',
      duration: '4:28',
      thumbnail: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=o34A64C2Y5U',
      type: 'youtube',
      embedId: 'o34A64C2Y5U',
    },
    {
      id: 'mv_8',
      title: 'Blinding Lights - Official Video',
      category: 'Global Hits',
      duration: '4:22',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=350&fit=crop',
      videoUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
      type: 'youtube',
      embedId: '4NRXx6U8ABQ',
    },
  ];

  // Daily Random Pickup Seeded by Current Date (No Live Music)
  const sampleVideos = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const shuffled = [...playableMusicVideosCatalog];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs((hash + i) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sunofy_video_history', JSON.stringify(videoHistory));
    } catch (e) {
      console.error(e);
    }
  }, [videoHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('sunofy_video_favorites', JSON.stringify(videoFavorites));
    } catch (e) {
      console.error(e);
    }
  }, [videoFavorites]);

  // Fetch Search Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ytSearchQuery.trim() || ytSearchQuery.length < 2) {
        setSearchSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(ytSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.suggestions)) {
            setSearchSuggestions(data.suggestions.slice(0, 6));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [ytSearchQuery]);

  // Pause video if music player starts
  useEffect(() => {
    if (isAudioPlaying && isPlaying) {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  // Helper to add item to Video History
  const addToHistory = (item: {
    title: string;
    videoUrl: string;
    embedUrl?: string;
    type: 'mp4' | 'local' | 'youtube' | 'drive' | 'dailymotion' | 'vimeo';
    duration?: string;
    thumbnail?: string;
  }) => {
    setVideoHistory((prev) => {
      const filtered = prev.filter((v) => v.videoUrl !== item.videoUrl && v.title !== item.title);
      const newItem: SavedVideoItem = {
        id: 'vh_' + Date.now(),
        title: item.title,
        videoUrl: item.videoUrl,
        embedUrl: item.embedUrl,
        type: item.type,
        duration: item.duration || '00:00',
        thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=350&fit=crop',
        playedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return [newItem, ...filtered].slice(0, 30); // Keep last 30
    });
  };

  // URL Extraction Utilities
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const extractGoogleDriveId = (url: string) => {
    const regExp = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const extractDailymotionId = (url: string) => {
    const regExp = /(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const extractVimeoId = (url: string) => {
    const regExp = /(?:vimeo\.com\/)([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Play Selected Video
  const handleSelectVideo = (video: SampleVideo | SavedVideoItem) => {
    onVideoPlay?.();
    setVideoTitle(video.title);
    setLocalFileSize(null);

    const vType = ('type' in video && video.type) ? video.type : 'mp4';
    onVideoSelect?.({ url: video.videoUrl, title: video.title, type: vType });

    if ('type' in video && video.type === 'youtube' && ('embedId' in video || 'embedUrl' in video)) {
      const eUrl = 'embedUrl' in video && video.embedUrl 
        ? video.embedUrl 
        : `https://www.youtube.com/embed/${'embedId' in video ? video.embedId : ''}?autoplay=1&enablejsapi=1`;
      
      setVideoSourceType('youtube');
      setEmbedUrl(eUrl);
      addToHistory({
        title: video.title,
        videoUrl: video.videoUrl,
        embedUrl: eUrl,
        type: 'youtube',
        thumbnail: video.thumbnail,
      });
    } else {
      setVideoSourceType((video.type as any) || 'mp4');
      if (video.type === 'drive' || video.type === 'dailymotion' || video.type === 'vimeo') {
        setEmbedUrl('embedUrl' in video && video.embedUrl ? video.embedUrl : video.videoUrl);
      } else {
        setSelectedVideoUrl(video.videoUrl);
      setIsPlaying(true);
      }
      addToHistory({
        title: video.title,
        videoUrl: video.videoUrl,
        type: (video.type as any) || 'mp4',
        thumbnail: video.thumbnail,
      });
    }

    onShowToast(`Playing: ${video.title}`);
  };

  // Upload Local Video File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setSelectedVideoUrl(blobUrl);
      setVideoTitle(file.name);
      setVideoSourceType('local');

      const gb = file.size / (1024 * 1024 * 1024);
      const mb = file.size / (1024 * 1024);
      const sizeStr = gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
      setLocalFileSize(`${sizeStr} Local File`);

      
      setIsPlaying(true);
      addToHistory({
        title: file.name,
        videoUrl: blobUrl,
        type: 'local',
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=350&fit=crop',
      });
      onShowToast(`Loaded local video: ${file.name}`);
      onVideoSelect?.({ url: blobUrl, title: file.name, type: 'local' });
    }
  };

  // Universal Video URL Loader
  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = customInputUrl.trim();
    if (!url) {
      onShowToast('Please enter a video URL');
      return;
    }

    // 1. YouTube
    const ytId = extractYoutubeId(url);
    if (ytId) {
      onVideoPlay?.();
      const eUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`;
      setVideoSourceType('youtube');
      setEmbedUrl(eUrl);
      setVideoTitle('YouTube Stream');
      setLocalFileSize(null);
      addToHistory({ title: 'YouTube Stream', videoUrl: url, embedUrl: eUrl, type: 'youtube' });
      onVideoSelect?.({ url, title: 'YouTube Stream', type: 'youtube' });
      onShowToast('Loaded YouTube video!');
      setCustomInputUrl('');
      return;
    }

    // 2. Dailymotion
    const dmId = extractDailymotionId(url);
    if (dmId) {
      onVideoPlay?.();
      const eUrl = `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1`;
      setVideoSourceType('dailymotion');
      setEmbedUrl(eUrl);
      setVideoTitle('Dailymotion Stream');
      setLocalFileSize(null);
      addToHistory({ title: 'Dailymotion Stream', videoUrl: url, embedUrl: eUrl, type: 'dailymotion' });
      onVideoSelect?.({ url, title: 'Dailymotion Stream', type: 'dailymotion' });
      onShowToast('Loaded Dailymotion video!');
      setCustomInputUrl('');
      return;
    }

    // 3. Vimeo
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      onVideoPlay?.();
      const eUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      setVideoSourceType('vimeo');
      setEmbedUrl(eUrl);
      setVideoTitle('Vimeo Stream');
      setLocalFileSize(null);
      addToHistory({ title: 'Vimeo Stream', videoUrl: url, embedUrl: eUrl, type: 'vimeo' });
      onVideoSelect?.({ url, title: 'Vimeo Stream', type: 'vimeo' });
      onShowToast('Loaded Vimeo video!');
      setCustomInputUrl('');
      return;
    }

    // 4. Google Drive
    const driveId = extractGoogleDriveId(url);
    if (driveId) {
      onVideoPlay?.();
      const eUrl = `https://drive.google.com/file/d/${driveId}/preview`;
      setVideoSourceType('drive');
      setEmbedUrl(eUrl);
      setVideoTitle('Google Drive Cloud Video Stream');
      setLocalFileSize(null);
      addToHistory({ title: 'Google Drive Stream', videoUrl: url, embedUrl: eUrl, type: 'drive' });
      onVideoSelect?.({ url, title: 'Google Drive Stream', type: 'drive' });
      onShowToast('Loaded Google Drive cloud stream!');
      setCustomInputUrl('');
      return;
    }

    // 5. Direct MP4 / WebM / HLS
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      onVideoPlay?.();
      setVideoSourceType('mp4');
      setSelectedVideoUrl(url);
      setVideoTitle('Custom Video Stream');
      setLocalFileSize(null);
      setIsPlaying(true);
      addToHistory({ title: 'Custom Video Stream', videoUrl: url, type: 'mp4' });
      onVideoSelect?.({ url, title: 'Custom Video Stream', type: 'mp4' });
      onShowToast('Playing custom video URL!');
      setCustomInputUrl('');
      return;
    }

    onShowToast('Invalid or unsupported video URL format');
  };

  // YouTube Search Result Populator
  const handleYoutubeSearchSubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) {
      e.preventDefault();
    }
    const query = (overrideQuery || ytSearchQuery).trim();
    if (!query) {
      onShowToast('Please enter a YouTube search term');
      return;
    }
    
    // Collapse panel
    setIsSearchPanelOpen(false);

    setShowSuggestions(false);
    setIsSearching(true);
    setActiveSubTab('search');

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const rawItems = data.results || data.items || [];
        const results: SampleVideo[] = rawItems
          .slice(0, 20)
          .map((item: any, idx: number) => {
            const isPlaylist = item.type === 'playlist';
            const id = item.videoId || item.id;
            const dur = item.duration || item.durationText || (item.lengthSeconds > 0 ? formatTime(item.lengthSeconds) : 'Live');
            return {
              id: `yt_res_${id || idx}`,
              title: item.title,
              category: isPlaylist ? 'Playlist' : 'YouTube Video',
              duration: dur,
              thumbnail: item.thumbnail || item.image || item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              videoUrl: item.videoUrl || (isPlaylist ? `https://www.youtube.com/playlist?list=${id}` : `https://www.youtube.com/watch?v=${id}`),
              type: 'youtube',
              embedId: isPlaylist ? '' : id,
              embedUrl: item.embedUrl || (isPlaylist ? `https://www.youtube.com/embed/videoseries?list=${id}&autoplay=1` : `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`)
            };
          });
        
        setSearchResults(results);
        if (results.length > 0) {
          onShowToast(`Found ${results.length} YouTube results for "${query}"`);
        } else {
          onShowToast('No videos found.');
        }
      } else {
        onShowToast('Failed to fetch search results from YouTube.');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Error connecting to YouTube search service.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, item: SampleVideo | SavedVideoItem) => {
    e.stopPropagation();
    const isFav = videoFavorites.some((v) => v.videoUrl === item.videoUrl);
    if (isFav) {
      setVideoFavorites((prev) => prev.filter((v) => v.videoUrl !== item.videoUrl));
      onShowToast('Removed from favorites');
    } else {
      setVideoFavorites((prev) => [
        {
          id: 'fav_' + Date.now(),
          title: item.title,
          videoUrl: item.videoUrl,
          embedUrl: 'embedUrl' in item ? item.embedUrl : undefined,
          type: item.type as any,
          duration: item.duration,
          thumbnail: item.thumbnail,
          playedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      onShowToast('Added to favorites');
    }
  };

  // Video Controls Effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedData = () => {
      setDuration(video.duration);
      if (isPlaying) video.play().catch(() => {});
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (isLooping) return;
      setVideoQueue((prev) => {
        if (prev.length > 0) {
          const next = prev[0];
          setTimeout(() => {
            handleSelectVideo(next);
          }, 0);
          return prev.slice(1);
        }
        return prev;
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
    };
  }, [selectedVideoUrl, isPlaying, isLooping]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      onVideoPlay?.();
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    onShowToast(seconds > 0 ? `+${seconds}s Forward` : `${seconds}s Rewind`);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    onShowToast(`Speed: ${speed}x`);
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      onShowToast('Picture-in-Picture unavailable');
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const triggerActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const addToQueue = (e: React.MouseEvent, item: SampleVideo | SavedVideoItem) => {
    e.stopPropagation();
    setVideoQueue((prev) => [...prev, item]);
    onShowToast(`Added to queue: ${item.title}`);
  };

  const clearVideoHistory = () => {
    setVideoHistory([]);
    onShowToast('Cleared watch history');
  };

  const filteredVideos = sampleVideos.filter(
    (v) => searchCategory === 'All' || v.category.toLowerCase().includes(searchCategory.toLowerCase())
  );

  return (
    <div className={`space-y-4 animate-fade text-[var(--text-sunofy)] select-none relative overflow-hidden ${isEmbeddedInSyncParty ? 'p-1' : 'p-4 pb-24 min-h-screen'}`} style={{ backgroundColor: isEmbeddedInSyncParty ? 'transparent' : 'var(--bg-sunofy)' }}>
      {/* Background Gradient Animation */}
      {!isEmbeddedInSyncParty && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent-sunofy)] to-blue-900 mix-blend-screen canvas-slow-ambient"></div>
        </div>
      )}
      
      <div className="relative z-10 space-y-4">
      {/* Top Header Bar & Video Player Frame - Hidden when embedded in SyncParty */}
      {!isEmbeddedInSyncParty && (
        <>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="p-2 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:bg-[var(--hover-sunofy)] hover:border-[var(--accent-sunofy)] transition cursor-pointer text-[var(--text-sunofy)] hover:text-[var(--accent-sunofy)]"
                  title="Minimize Video Player"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-black tracking-tight text-[var(--text-sunofy)] flex items-center gap-2">
                  <Film className="w-5 h-5 text-[var(--accent-sunofy)]" /> Cinema Video Player
                </h2>
                <p className="text-[11px] font-semibold text-[var(--muted-sunofy)] mt-0.5">
                  Stream local files, Google Drive, YouTube, Dailymotion & Vimeo
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProTipModal(true)}
              className="px-3 py-1.5 rounded-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] text-xs font-bold text-[var(--accent-sunofy)] flex items-center gap-1.5 transition shadow-sm cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Pro Tip</span>
            </button>
          </div>

          <div
            ref={containerRef}
            onMouseMove={triggerActivity}
            onTouchStart={triggerActivity}
            className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-sunofy)] group"
          >
            {videoSourceType !== 'mp4' && videoSourceType !== 'local' ? (
              <iframe
                src={embedUrl}
                title="Video Player Stream"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={selectedVideoUrl}
                loop={isLooping}
                onClick={togglePlayPause}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />
            )}

            {(videoSourceType === 'mp4' || videoSourceType === 'local') && (
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 flex flex-col justify-between p-4 transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2 truncate max-w-[70%]">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] text-[10px] font-black uppercase tracking-wider">
                      {videoSourceType}
                    </span>
                    <span className="truncate">{videoTitle}</span>
                    {localFileSize && <span className="text-[10px] text-emerald-400 font-mono">({localFileSize})</span>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePiP}
                      className="p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                      title="Fullscreen"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => handleSkip(-10)}
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
                    title="Rewind 10s"
                  >
                    <Rewind className="w-5 h-5 fill-white" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-2xl cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>

                  <button
                    onClick={() => handleSkip(10)}
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
                    title="Forward 10s"
                  >
                    <FastForward className="w-5 h-5 fill-white" />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-[var(--accent-sunofy)] cursor-pointer h-1.5 rounded-lg bg-white/20"
                  />

                  <div className="flex items-center justify-between text-xs font-mono font-bold text-white/80">
                    <div className="flex items-center space-x-3">
                      <button onClick={togglePlayPause} className="hover:text-white cursor-pointer">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleSkip(-10)} className="hover:text-white cursor-pointer text-[10px]" title="-10s">
                        -10s
                      </button>
                      <button onClick={() => handleSkip(10)} className="hover:text-white cursor-pointer text-[10px]" title="+10s">
                        +10s
                      </button>
                      <span>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 relative">
                      <div className="relative">
                        <button
                          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                          className="p-1.5 hover:text-white cursor-pointer flex items-center gap-1"
                          title="Volume"
                        >
                          {volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-red-400" />
                          ) : volume < 0.5 ? (
                            <Volume1 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-[var(--accent-sunofy)]" />
                          )}
                        </button>

                        {showVolumeSlider && (
                          <div className="absolute right-0 bottom-8 z-50 bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade w-40">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-full accent-[var(--accent-sunofy)] cursor-pointer h-1.5 bg-white/20 rounded-lg"
                            />
                            <span className="text-[10px] text-[var(--accent-sunofy)] font-mono font-bold w-6">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/80 text-[10px] font-bold border border-white/10 cursor-pointer"
                        >
                          {playbackSpeed}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute right-0 bottom-8 z-50 bg-black/90 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl shadow-2xl flex flex-col gap-1 w-24">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleSpeedChange(s)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg text-left flex items-center justify-between cursor-pointer ${
                                  playbackSpeed === s
                                    ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)]'
                                    : 'text-white/80 hover:bg-white/10'
                                }`}
                              >
                                <span>{s}x</span>
                                {playbackSpeed === s && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsLooping(!isLooping);
                          onShowToast(isLooping ? 'Video Loop Off' : 'Video Loop On');
                        }}
                        className={`p-1.5 cursor-pointer ${isLooping ? 'text-[var(--accent-sunofy)]' : 'text-white/60 hover:text-white'}`}
                        title="Loop Video"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Expandable Input Toolbar */}
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
          className="w-full p-3 flex items-center justify-between hover:bg-[var(--hover-sunofy)] transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--accent-sunofy)]" />
            <span className="text-xs font-bold">Search & Play any link</span>
          </div>
          <span className="text-[10px] text-[var(--muted-sunofy)]">
            {isSearchPanelOpen ? 'Collapse' : 'Expand'}
          </span>
        </button>

        {isSearchPanelOpen && (
          <div className="p-3 border-t border-[var(--border-sunofy)] space-y-3 bg-[var(--bg-sunofy)]/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Universal Video URL Form */}
              <form onSubmit={handleLoadCustomUrl} className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-[var(--muted-sunofy)] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="Paste video URL (Drive, MP4)..."
                    className="w-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-[var(--accent-sunofy)]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] text-xs font-black hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                >
                  Play
                </button>
              </form>

              {/* YouTube Search Form */}
              <div className="relative">
                <form onSubmit={handleYoutubeSearchSubmit} className="flex gap-2 relative z-20">
                  <div className="relative flex-1">
                    <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={ytSearchQuery}
                      onChange={(e) => {
                        setYtSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search YouTube..."
                      className="w-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-[var(--accent-sunofy)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] text-xs font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl shadow-2xl z-30 overflow-hidden">
                    {searchSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          setYtSearchQuery(sug);
                          handleYoutubeSearchSubmit(e as any, sug);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--hover-sunofy)] transition border-b border-[var(--border-sunofy)] last:border-0"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Local Video File Picker Banner */}
            <label className="w-full bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition group">
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-[var(--accent-sunofy)] group-hover:scale-110 transition" />
                <span className="text-xs font-bold">Select Local MP4 / MKV</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--accent-sunofy)]">Browse</span>
              <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs (Featured / Favorites / Search / History) */}
      <div className="flex items-center justify-between border-b border-[var(--border-sunofy)] pb-2 px-1">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('featured')}
            className={`p-1.5 rounded-xl transition flex items-center cursor-pointer ${
              activeSubTab === 'featured'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-sm'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)]'
            }`}
            title="Featured"
          >
            <Flame className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`p-1.5 rounded-xl transition flex items-center cursor-pointer ${
              activeSubTab === 'favorites'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-sm'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)]'
            }`}
            title="Favorites"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {searchResults.length > 0 && (
            <button
              onClick={() => setActiveSubTab('search')}
              className={`p-1.5 rounded-xl transition flex items-center cursor-pointer ${
                activeSubTab === 'search'
                  ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-sm'
                  : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)]'
              }`}
              title="Search Results"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('history')}
            className={`p-1.5 rounded-xl transition flex items-center cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-sm'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)]'
            }`}
            title="History"
          >
            <History className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`p-1.5 rounded-xl transition flex items-center cursor-pointer ${
              activeSubTab === 'queue'
                ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] shadow-sm'
                : 'text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:bg-[var(--hover-sunofy)]'
            }`}
            title="Up Next (Queue)"
          >
            <ListVideo className="w-4 h-4" />
          </button>
        </div>

        {(activeSubTab === 'history' && videoHistory.length > 0) && (
          <button
            onClick={clearVideoHistory}
            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Featured Movies Grid */}
      {activeSubTab === 'featured' && (
        <div className="space-y-3">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Telugu Tollywood', 'Sci-Fi Movie', 'Animation', 'Chill Visuals', 'Fantasy'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                  searchCategory === cat
                    ? 'bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)]'
                    : 'bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all active:scale-98 shadow-sm group"
              >
                <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-black">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                    <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                    {video.duration}
                  </span>
                </div>

                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] uppercase font-bold text-[var(--accent-sunofy)] tracking-wider">
                        {video.category}
                      </span>
                      {video.type === 'youtube' && <span className="text-[9px] font-bold text-red-500">· YouTube</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => addToQueue(e, video)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Add to Queue"
                      >
                        <ListVideo className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(e, video)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Favorite"
                      >
                        <Heart className={`w-4 h-4 ${videoFavorites.some(v => v.videoUrl === video.videoUrl) ? 'fill-[var(--accent-sunofy)] text-[var(--accent-sunofy)]' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                    {video.title}
                  </h4>
                  <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">Click to play stream</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: YouTube Search Results */}
      {activeSubTab === 'search' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--muted-sunofy)]">
            Showing video results for <strong className="text-[var(--accent-sunofy)]">"{ytSearchQuery}"</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {searchResults.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all active:scale-98 shadow-sm group"
              >
                <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-black">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                    <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                    {video.duration}
                  </span>
                </div>

                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">YouTube Video</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => addToQueue(e, video)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Add to Queue"
                      >
                        <ListVideo className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(e, video)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Favorite"
                      >
                        <Heart className={`w-4 h-4 ${videoFavorites.some(v => v.videoUrl === video.videoUrl) ? 'fill-[var(--accent-sunofy)] text-[var(--accent-sunofy)]' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                    {video.title}
                  </h4>
                  <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">Click to watch now</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Video Watch History & Saved Playlist */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {videoHistory.length === 0 ? (
            <div className="text-center py-10 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-6">
              <History className="w-10 h-10 text-[var(--muted-sunofy)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[var(--text-sunofy)]">No Video History Yet</p>
              <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">
                Videos, Google Drive links, and YouTube streams you play will be automatically saved here for quick replay!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectVideo(item)}
                  className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all active:scale-98 shadow-sm group"
                >
                  <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-black">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                    <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                    {item.duration}
                  </span>
                </div>

                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] uppercase font-bold text-[var(--accent-sunofy)] tracking-wider">
                        {item.type}
                      </span>
                      <span className="text-[9px] text-[var(--muted-sunofy)]">· {item.playedAt}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => addToQueue(e, item)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Add to Queue"
                      >
                        <ListVideo className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(e, item)}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                        title="Favorite"
                      >
                        <Heart className={`w-4 h-4 ${videoFavorites.some(v => v.videoUrl === item.videoUrl) ? 'fill-[var(--accent-sunofy)] text-[var(--accent-sunofy)]' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[var(--muted-sunofy)] truncate mt-0.5">{item.videoUrl}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* Sub-Tab 4: Video Favorites */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-3">
          {videoFavorites.length === 0 ? (
            <div className="text-center py-10 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-6">
              <Heart className="w-10 h-10 text-[var(--muted-sunofy)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[var(--text-sunofy)]">No Favorites Yet</p>
              <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">
                Tap the heart icon on any video to save it here for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoFavorites.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectVideo(item)}
                  className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all active:scale-98 shadow-sm group"
                >
                  <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-black">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=350&fit=crop'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                      <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                      {item.duration || 'Video'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-[var(--accent-sunofy)] tracking-wider">
                        {item.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => addToQueue(e, item)}
                          className="p-1 text-[var(--muted-sunofy)] hover:text-[var(--accent-sunofy)] transition"
                          title="Add to Queue"
                        >
                          <ListVideo className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(e, item)}
                          className="p-1 text-[var(--accent-sunofy)] transition"
                          title="Favorite"
                        >
                          <Heart className="w-4 h-4 fill-[var(--accent-sunofy)] text-[var(--accent-sunofy)]" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[var(--muted-sunofy)] truncate mt-0.5">{item.videoUrl}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 5: Queue */}
      {activeSubTab === 'queue' && (
        <div className="space-y-3">
          {videoQueue.length === 0 ? (
            <div className="text-center py-10 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl p-6">
              <ListVideo className="w-10 h-10 text-[var(--muted-sunofy)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[var(--text-sunofy)]">Queue is Empty</p>
              <p className="text-[10px] text-[var(--muted-sunofy)] mt-0.5">
                Add videos to your queue to play them next.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-semibold text-[var(--muted-sunofy)]">Up Next: {videoQueue.length} video(s)</p>
                <button
                  onClick={() => setVideoQueue([])}
                  className="text-[10px] font-bold text-red-400 hover:text-red-500 transition cursor-pointer"
                >
                  Clear Queue
                </button>
              </div>
              {videoQueue.map((item, index) => (
                <div
                  key={`q_${index}_${item.id}`}
                  onClick={() => handleSelectVideo(item)}
                  className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)] p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all active:scale-98 shadow-sm group"
                >
                  <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-black">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=350&fit=crop'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition">
                      <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                      {item.duration || 'Video'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-[var(--accent-sunofy)] tracking-wider">
                        {item.type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoQueue((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1 text-[var(--muted-sunofy)] hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-sunofy)] truncate group-hover:text-[var(--accent-sunofy)] transition">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      </div>
      
      {/* ProTip Pop-up Modal */}
      {showProTipModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative">
            <button
              onClick={() => setShowProTipModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-[var(--bg-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-sunofy)]/20 text-[var(--accent-sunofy)] flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--text-sunofy)]">Pro Tip</h3>
                <p className="text-[10px] font-semibold text-[var(--muted-sunofy)]">Video Playback options</p>
              </div>
            </div>

            <div className="space-y-2 text-[10px] text-[var(--text-sunofy)] leading-relaxed font-medium max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="p-2 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]">
                <strong className="text-[var(--accent-sunofy)] block">1. Google Drive Cloud Streaming</strong>
                Paste public link for instant cloud streaming.
              </div>

              <div className="p-2 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]">
                <strong className="text-[var(--accent-sunofy)] block">2. Local Storage Files</strong>
                Play MP4/WebM/MKV files locally.
              </div>

              <div className="p-2 bg-[var(--bg-sunofy)] rounded-xl border border-[var(--border-sunofy)]">
                <strong className="text-[var(--accent-sunofy)] block">3. Universal Web Links</strong>
                Paste YouTube, Dailymotion, Vimeo or MP4 links.
              </div>
            </div>

            <button
              onClick={() => setShowProTipModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] text-xs font-black hover:scale-102 active:scale-98 transition cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
