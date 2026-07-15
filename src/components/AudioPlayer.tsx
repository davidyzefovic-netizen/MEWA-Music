import React, { useState, useRef, useEffect } from "react";
import { Repeat, Repeat1, Shuffle, ListMusic, X, 
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Heart,
  ListPlus,
  Mic2,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  Music,
  Maximize2,
  Minimize2,
  PanelBottom,
} from "lucide-react";
import { Song, Playlist, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AudioPlayerProps {
  playbackMode?: "normal" | "loop" | "loop-one" | "shuffle";
  setPlaybackMode?: (mode: "normal" | "loop" | "loop-one" | "shuffle") => void;
  queue?: Song[];
  setQueue?: (queue: Song[]) => void;
  showQueue?: boolean;
  setShowQueue?: (show: boolean) => void;
  originalQueue?: Song[];
  onPlaySong?: (song: Song, context?: Song[]) => void;
  userProfile?: UserProfile | null;
  currentSong: Song | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  favorites: string[];
  onToggleFavorite: (songId: string) => Promise<void>;
  playlists: Playlist[];
  onAddSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  downloadedSongs: string[];
  onToggleDownload: (songId: string) => void;
  onPlayIncrement: (songId: string) => void;
}

interface LyricLine {
  time: number; // in seconds
  text: string;
}

export default function AudioPlayer({
  userProfile,
  currentSong,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrev,
  favorites,
  onToggleFavorite,
  playlists,
  onAddSongToPlaylist,
  downloadedSongs,
  onToggleDownload,
  onPlayIncrement,
  playbackMode = "normal",
  setPlaybackMode,
  queue = [],
  setQueue,
  showQueue = false,
  setShowQueue,
  originalQueue = [],
  onPlaySong,
}: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [isFullScreenLyrics, setIsFullScreenLyrics] = useState(false);
  const [isInlineControls, setIsInlineControls] = useState(false);
  const [showPlaylistsMenu, setShowPlaylistsMenu] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [incrementTriggered, setIncrementTriggered] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse lyrics LRC format
  useEffect(() => {
    if (!currentSong) {
      setParsedLyrics([]);
      return;
    }

    const lines = currentSong.lyrics.split("\n");
    const parsed: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2}))?\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3], 10) : 0;
        const totalSeconds = minutes * 60 + seconds + milliseconds / 100;
        const text = line.replace(timeRegex, "").trim();
        parsed.push({ time: totalSeconds, text });
      } else {
        const clean = line.trim();
        if (clean) {
          parsed.push({ time: -1, text: clean });
        }
      }
    }

    const hasTimestamps = parsed.some((l) => l.time >= 0);
    if (hasTimestamps) {
      parsed.sort((a, b) => a.time - b.time);
    }
    setParsedLyrics(parsed);
    setActiveLineIndex(-1);
    setIncrementTriggered(false);
  }, [currentSong]);

  // Audio loading and control logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    let active = true;
    const loadAudio = async () => {
      if (!active) return;

      audio.src = currentSong.audioUrl || "";
      audio.load();

      if (isPlaying) {
        audio.play().catch((err) => {
          console.error("Audio autoplay block: ", err);
          setIsPlaying(false);
        });
      }
    };

    loadAudio();

  
  return () => {
      active = false;
    };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle time update
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = audio.currentTime;

    // Restrict to 25 seconds for unregistered users
    if (!userProfile && time >= 25) {
      audio.pause();
      audio.currentTime = 25;
      setIsPlaying(false);
      setCurrentTime(25);
      return;
    }

    setCurrentTime(time);

    // Track when user has listened to at least 15 seconds or 50% of song
    if (!incrementTriggered && currentSong && (time > 15 || time > audio.duration * 0.5)) {
      onPlayIncrement(currentSong.id);
      setIncrementTriggered(true);
    }

    // Determine current active lyric line
    const timedLyrics = parsedLyrics.filter((l) => l.time >= 0);
    if (timedLyrics.length > 0) {
      let activeIndex = -1;
      for (let i = 0; i < timedLyrics.length; i++) {
        if (time >= timedLyrics[i].time) {
          activeIndex = i;
        } else {
          break;
        }
      }
      setActiveLineIndex(activeIndex);
    }
  };

  // Scroll active lyrics line into view
  useEffect(() => {
    if (showLyrics && activeLineIndex >= 0 && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.children[activeLineIndex] as HTMLElement;
      if (activeElement) {
        lyricsContainerRef.current.scrollTo({
          top: activeElement.offsetTop - lyricsContainerRef.current.clientHeight / 2 + 20,
          behavior: "smooth",
        });
      }
    }
  }, [activeLineIndex, showLyrics]);

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    onNext();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    let seekValue = parseFloat(e.target.value);
    
    if (!userProfile && seekValue > 25) {
      seekValue = 25;
    }

    audio.currentTime = seekValue;
    setCurrentTime(seekValue);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audio.volume = newVol;
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    audio.muted = targetMute;
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return "0:00";
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!currentSong) return null;

  const isFavorited = favorites.includes(currentSong.id);
  const isDownloaded = downloadedSongs.includes(currentSong.id);

  const isControlsInline = showLyrics && isFullScreenLyrics && isInlineControls;

  const renderCenterControls = () => (
    <div className={isControlsInline ? "flex flex-col items-center w-full max-w-md" : "flex flex-1 flex-col items-center max-w-lg"}>
      
          {/* Action Row */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setPlaybackMode && setPlaybackMode(playbackMode === "shuffle" ? "normal" : "shuffle")}
              className={`rounded-none p-2 transition-colors ${
                playbackMode === "shuffle"
                  ? "text-red-500"
                  : "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={onPrev}
              className="rounded-none p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <SkipBack className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-none bg-red-600 text-white shadow-md shadow-red-600/20 transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={onNext}
              className="rounded-none p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <SkipForward className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => {
                if (!setPlaybackMode) return;
                if (playbackMode === "normal" || playbackMode === "shuffle") setPlaybackMode("loop");
                else if (playbackMode === "loop") setPlaybackMode("loop-one");
                else setPlaybackMode("normal");
              }}
              className={`rounded-none p-2 transition-colors ${
                playbackMode === "loop" || playbackMode === "loop-one"
                  ? "text-red-500"
                  : "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title={playbackMode === "loop-one" ? "Repeat One" : "Repeat List"}
            >
              {playbackMode === "loop-one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="mt-1 flex w-full items-center gap-3">
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="h-1 w-full cursor-pointer appearance-none rounded-none bg-zinc-200 dark:bg-zinc-800 accent-red-600"
            />
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-left">
              {formatTime(duration)}
            </span>
          </div>
        
    </div>
  );

  const renderRightActions = () => (
    <div className={isControlsInline ? "flex items-center justify-center gap-6 w-full max-w-md mt-4" : "flex w-1/4 items-center justify-end gap-3.5"}>
      
          {/* Queue Menu */}
          <div className="relative">
            <button
              onClick={() => setShowQueue && setShowQueue(!showQueue)}
              className={`flex h-8 w-8 items-center justify-center rounded-none transition-all ${
                showQueue
                  ? "bg-red-500/10 text-red-500"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
              title="Queue"
            >
              <ListMusic className="h-4.5 w-4.5" />
            </button>

            <AnimatePresence>
              {showQueue && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowQueue(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-10 right-0 z-40 w-80 rounded-none border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col"
                  >
                    <div className="flex items-center justify-between px-2 py-1 mb-2">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Up Next
                      </p>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {queue.length} songs
                      </span>
                    </div>
                    <div className="flex-1 max-h-80 overflow-y-auto space-y-1 pr-1">
                      {queue.length === 0 ? (
                        <p className="px-2 py-4 text-center font-sans text-xs text-zinc-400 italic">
                          Queue is empty
                        </p>
                      ) : (
                        queue.map((qSong, index) => (
                          <div
                            key={`${qSong.id}-${index}`}
                            className="group flex items-center justify-between rounded-none p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={qSong.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=40"}
                                alt={qSong.title}
                                className="h-8 w-8 object-cover border border-zinc-200 dark:border-zinc-850"
                              />
                              <div className="overflow-hidden">
                                <p className="font-serif text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                                  {qSong.title}
                                </p>
                                <p className="font-sans text-[9px] truncate text-zinc-500">
                                  {qSong.artist}
                                </p>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity gap-1">
                              <button
                                onClick={() => {
                                  if (onPlaySong) {
                                    onPlaySong(qSong, originalQueue);
                                  }
                                }}
                                className="p-1 text-red-500 hover:text-red-600"
                                title="Play now"
                              >
                                <Play className="h-3 w-3 fill-current" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (setQueue) {
                                    const newQueue = [...queue];
                                    newQueue.splice(index, 1);
                                    setQueue(newQueue);
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                title="Remove from queue"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Lyrics Sync Switch */}
          <button
            onClick={() => {
              if (showLyrics) {
                setShowLyrics(false);
                setIsFullScreenLyrics(false);
              } else {
                setShowLyrics(true);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-none transition-all ${
              showLyrics
                ? "bg-red-500/10 text-red-500"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
            title="Synchronized Lyrics"
          >
            {showLyrics ? <ChevronDown className="h-4.5 w-4.5" /> : <Mic2 className="h-4.5 w-4.5" />}
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => onToggleFavorite(currentSong.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-none transition-all ${
              isFavorited
                ? "text-red-500 scale-110"
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
            title="Favorite"
          >
            <Heart className={`h-4.5 w-4.5 ${isFavorited ? "fill-current" : ""}`} />
          </button>

          {/* Playlists Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPlaylistsMenu(!showPlaylistsMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-none text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Add to Playlist"
            >
              <ListPlus className="h-4.5 w-4.5" />
            </button>
            <AnimatePresence>
              {showPlaylistsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowPlaylistsMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-10 right-0 z-40 w-48 rounded-none border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <p className="px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                      Add to Playlist
                    </p>
                    <div className="mt-1 max-h-40 overflow-y-auto space-y-0.5">
                      {playlists.length === 0 ? (
                        <p className="px-2 py-1 font-sans text-[10px] text-zinc-400 italic">
                          No custom playlists
                        </p>
                      ) : (
                        playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={async () => {
                              await onAddSongToPlaylist(pl.id, currentSong.id);
                              setShowPlaylistsMenu(false);
                            }}
                            className="flex w-full items-center rounded-none px-2 py-1.5 font-sans text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            {pl.name}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Offline Download button */}
          <button
            onClick={() => onToggleDownload(currentSong.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-none transition-all ${
              isDownloaded
                ? "bg-red-500/10 text-red-500"
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
            title={isDownloaded ? "Available Offline" : "Download for Offline"}
          >
            <Download className="h-4.5 w-4.5" />
          </button>

          {/* Divider */}
          <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-16 cursor-pointer appearance-none rounded-none bg-zinc-200 dark:bg-zinc-800 accent-red-600"
            />
          </div>
        
    </div>
  );


  return (
    <motion.div layout transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed ${showLyrics ? 'top-0 bottom-0 z-[60]' : 'bottom-16'} md:top-auto md:bottom-0 left-0 right-0 z-50 flex flex-col bg-white/95 border-t border-zinc-200/80 shadow-2xl transition-colors dark:border-zinc-800 dark:bg-zinc-950/95 backdrop-blur-lg`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Expanded Synced Lyrics Panel */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: typeof window !== "undefined" && window.innerWidth < 768 
                ? "100%" 
                : (isFullScreenLyrics ? (isControlsInline ? "100dvh" : "calc(100dvh - 5rem)") : "450px"), 
              opacity: 1 
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative w-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden border-b border-white/5`}
            onTouchStart={(e) => {
              setTouchEndX(null);
              setTouchEndY(null);
              setTouchStartX(e.targetTouches[0].clientX);
              setTouchStartY(e.targetTouches[0].clientY);
            }}
            onTouchMove={(e) => {
              setTouchEndX(e.targetTouches[0].clientX);
              setTouchEndY(e.targetTouches[0].clientY);
            }}
            onTouchEnd={() => {
              if (touchStartX === null || touchEndX === null || touchStartY === null || touchEndY === null) return;
              const distanceX = touchStartX - touchEndX;
              const distanceY = touchStartY - touchEndY;
              const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
              const minSwipeDistance = 50;
              
              if (isHorizontalSwipe) {
                if (distanceX > minSwipeDistance) {
                  onNext();
                } else if (distanceX < -minSwipeDistance) {
                  onPrev();
                }
              }
            }}
          >
            {/* Blurred background image layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
               <img
                  src={
                    currentSong.coverUrl ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                  }
                  alt="bg"
                  className="w-full h-full object-cover opacity-30 blur-3xl saturate-[1.5]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40 mix-blend-multiply" />
            </div>

            {/* Top right actions */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[70] flex items-center gap-2 md:gap-3">
               {isFullScreenLyrics && (
                 <button
                   onClick={() => setIsInlineControls(!isInlineControls)}
                   className="hidden md:flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-none bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
                   title={isInlineControls ? "Move Controls to Bottom" : "Move Controls to Center"}
                 >
                   <PanelBottom className={`h-4 w-4 md:h-5 md:w-5 ${!isInlineControls ? "opacity-50" : ""}`} />
                 </button>
               )}
               <button
                 onClick={() => setIsFullScreenLyrics(!isFullScreenLyrics)}
                 className="hidden md:flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-none bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
                 title={isFullScreenLyrics ? "Exit Fullscreen" : "Fullscreen Lyrics"}
               >
                 {isFullScreenLyrics ? <Minimize2 className="h-4 w-4 md:h-5 md:w-5" /> : <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />}
               </button>
               <button
                  onClick={() => {
                  setShowLyrics(false);
                  setIsFullScreenLyrics(false);
                }}
                  className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-none bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
                  title="Close Lyrics"
                >
                  <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
                </button>
            </div>

            {/* Left Cover area */}
            <div className="relative z-10 hidden md:flex w-1/2 p-8 flex-col items-center justify-center border-r border-white/5">
                <img
                  src={
                    currentSong.coverUrl ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                  }
                  alt={currentSong.title}
                  className="w-64 h-64 object-cover rounded-md shadow-2xl ring-1 ring-white/10"
                />
                <div className="w-full max-w-sm mt-6 text-center">
                  <h3 className="font-serif text-3xl font-black text-white truncate drop-shadow-md pb-1">
                    {currentSong.title}
                  </h3>
                  <p className="font-sans text-lg text-zinc-300 font-bold uppercase tracking-widest truncate">
                    {currentSong.artist}
                    {currentSong.featuredArtists && currentSong.featuredArtists.length > 0 && (
                      <span className="opacity-80 lowercase text-sm ml-1">feat. {currentSong.featuredArtists.join(", ")}</span>
                    )}
                  </p>
                </div>
                {isControlsInline && (
                  <div className="w-full mt-10 flex flex-col items-center">
                    {renderCenterControls()}
                    {renderRightActions()}
                  </div>
                )}
            </div>

            {/* Right Lyrics area (Desktop) */}
            <div className="relative z-10 hidden md:flex w-1/2 flex-col pt-8 pb-8 px-6 md:px-12 h-full">
              {parsedLyrics.length > 0 ? (
                <div
                  className="flex-1 overflow-y-auto no-scrollbar mask-image-fade"
                  ref={lyricsContainerRef}
                >
                  <div className="pb-[20vh] pt-10">
                    {parsedLyrics.map((line, idx) => {
                      const isActive = activeLineIndex === idx;
                      return (
                        <p
                          key={idx}
                          className={`my-4 font-serif text-lg sm:text-xl font-bold transition-all duration-300 cursor-pointer ${
                            isActive
                              ? "text-white scale-[1.02] transform origin-left drop-shadow-md"
                              : "text-white/40 hover:text-white/70"
                          }`}
                          onClick={() => {
                            if (audioRef.current && line.time >= 0) {
                              audioRef.current.currentTime = line.time;
                            }
                          }}
                        >
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                  <Mic2 className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-serif text-xl italic">No synced lyrics available.</p>
                </div>
              )}
            </div>

            
            
            {/* Mobile Full Player area */}
            <div className="relative z-10 flex md:hidden w-full flex-col p-6 pt-16 h-full justify-between pb-10 overflow-y-auto no-scrollbar">
                
                
                <div className="flex flex-col items-center flex-1 justify-center min-h-[300px]">
                   <img
                     src={currentSong.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"}
                     alt={currentSong.title}
                     className="w-full aspect-square max-w-[220px] object-cover rounded-[2rem] shadow-2xl ring-1 ring-white/10"
                   />
                   <div className="w-full mt-8 text-center px-4">
                     <h3 className="font-serif text-3xl font-black text-white truncate drop-shadow-md pb-1">
                       {currentSong.title}
                     </h3>
                     <p className="font-sans text-base text-zinc-300 font-medium tracking-wide truncate">
                       {currentSong.artist}
                       {currentSong.featuredArtists && currentSong.featuredArtists.length > 0 && (
                         <span className="opacity-80 text-sm ml-1">feat. {currentSong.featuredArtists.join(", ")}</span>
                       )}
                     </p>
                   </div>
                </div>

                <div className="flex flex-col items-center w-full mt-4">
                  {/* Progress Bar */}
                  <div className="w-full max-w-[320px] flex items-center gap-3 mb-8">
                    <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 flex items-center h-4 group">
                        <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeekChange}
                        className="absolute inset-0 w-full h-1 my-auto cursor-pointer appearance-none rounded-full bg-zinc-700/50 accent-white"
                        style={{ zIndex: 10 }}
                        />
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 w-8 text-left">{formatTime(duration)}</span>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center justify-between w-full max-w-[320px] mb-8">
                    <button onClick={() => setPlaybackMode && setPlaybackMode(playbackMode === "shuffle" ? "normal" : "shuffle")} className={`p-2 transition-colors ${playbackMode === "shuffle" ? "text-red-500" : "text-zinc-400 hover:text-white"}`}>
                      <Shuffle className="h-5 w-5" />
                    </button>
                    <button onClick={onPrev} className="p-2 text-white hover:text-zinc-300 transition-colors">
                      <SkipBack className="h-8 w-8 fill-current" />
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95">
                      {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                    </button>
                    <button onClick={onNext} className="p-2 text-white hover:text-zinc-300 transition-colors">
                      <SkipForward className="h-8 w-8 fill-current" />
                    </button>
                    <button onClick={() => {
                        if (!setPlaybackMode) return;
                        if (playbackMode === "normal" || playbackMode === "shuffle") setPlaybackMode("loop");
                        else if (playbackMode === "loop") setPlaybackMode("loop-one");
                        else setPlaybackMode("normal");
                      }} className={`p-2 transition-colors ${playbackMode === "loop" || playbackMode === "loop-one" ? "text-red-500" : "text-zinc-400 hover:text-white"}`}>
                      {playbackMode === "loop-one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Volume Bar */}
                  <div className="w-full max-w-[320px] flex items-center gap-3">
                    <button onClick={() => {
                        if (volume > 0) { setPreviousVolume(volume); handleVolumeChange({ target: { value: 0 } } as any); }
                        else { handleVolumeChange({ target: { value: previousVolume || 1 } } as any); }
                      }} className="text-zinc-400 hover:text-white transition-colors">
                      {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700/50 accent-white"
                    />
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Player Row (visible < md) */}
      <div className={`${showLyrics || isControlsInline ? 'hidden' : 'flex md:hidden'} flex-col w-full relative`}>
        {/* Top Progress Bar */}
        <input
           type="range"
           min={0}
           max={duration || 100}
           value={currentTime}
           onChange={handleSeekChange}
           className="absolute top-0 left-0 w-full h-[2px] -mt-[1px] cursor-pointer appearance-none bg-zinc-200 dark:bg-zinc-800 accent-red-600 z-10"
        />
        <div className="flex h-14 items-center justify-between px-3">
           {/* Left: Cover & Info */}
           <div className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer" onClick={() => {
              setShowLyrics(true);
           }}>
             <img src={currentSong.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"} alt="cover" className="h-10 w-10 object-cover shrink-0 rounded-none border border-zinc-200 dark:border-zinc-850" />
             <div className="flex flex-col overflow-hidden min-w-0 pr-2 text-left">
               <span className="font-serif text-sm font-black italic tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{currentSong.title}</span>
               <span className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{currentSong.artist}</span>
             </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                 <SkipBack className="h-4 w-4" fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="p-2 text-zinc-900 dark:text-white">
                 {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                 <SkipForward className="h-4 w-4" fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowLyrics(!showLyrics); }} className={`p-2 ${showLyrics ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                 <ChevronUp className="h-5 w-5" />
              </button>
           </div>
        </div>
      </div>

      {/* Main Player Row (Desktop) */}
      <div className={`h-20 items-center justify-between px-6 ${isControlsInline ? 'hidden' : 'hidden md:flex'}`}>
        {/* Left: Song Meta */}
        <div className="flex w-1/4 items-center gap-3">
          <div className="relative group shrink-0">
            <img
              src={
                currentSong.coverUrl ||
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
              }
              alt={currentSong.title}
              className="h-12 w-12 rounded-none object-cover border border-zinc-200 dark:border-zinc-850 shadow-sm"
            />
            {isDownloaded && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-none bg-red-600 text-white border-2 border-white dark:border-zinc-950" title="Available Offline">
                <Download className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-serif text-sm font-black italic tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {currentSong.title}
            </h4>
            <p className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {currentSong.artist}
              {currentSong.featuredArtists && currentSong.featuredArtists.length > 0 && (
                <span className="opacity-80"> feat. {currentSong.featuredArtists.join(", ")}</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Controls & Seek */}
        {renderCenterControls()}
        {/* Right: Auxiliary Actions */}
        {renderRightActions()}
      </div>
    </motion.div>
  );
}
