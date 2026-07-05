import React, { useState } from "react";
import {
  Play,
  Pause,
  Heart,
  AlertTriangle,
  Download,
  MoreVertical,
} from "lucide-react";
import { Song, Playlist } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SongRowProps {
  key?: string;
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: (song: Song) => void;
  favorites: string[];
  onToggleFavorite: (songId: string) => Promise<void>;
  playlists: Playlist[];
  onAddSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  downloadedSongs: string[];
  onToggleDownload: (songId: string) => void;
  onReportSong: (song: Song) => void;
  onSelectArtist?: (artistName: string) => void;
  index: number;
}

export default function SongRow({
  song,
  isPlaying,
  isCurrent,
  onPlay,
  favorites,
  onToggleFavorite,
  playlists,
  onAddSongToPlaylist,
  downloadedSongs,
  onToggleDownload,
  onReportSong,
  onSelectArtist,
  index,
}: SongRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isFavorited = favorites.includes(song.id);
  const isDownloaded = downloadedSongs.includes(song.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
      className={`group relative flex items-center justify-between border-b border-zinc-100 p-4 transition-all hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-950/40 ${
        isCurrent
          ? "bg-red-50/25 dark:bg-red-950/5 border-l-2 border-l-red-500"
          : "border-l-2 border-l-transparent"
      }`}
    >
      {/* LEFT: Index, Artwork, Title & Artist */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Play/Pause hover index */}
        <div className="w-6 text-center font-mono text-xs text-zinc-400 shrink-0 relative flex items-center justify-center">
          <span className="group-hover:opacity-0 transition-opacity">
            {isCurrent && isPlaying ? (
              <span className="flex items-center gap-0.5 justify-center h-3 w-3">
                <span className="w-0.5 h-3 bg-red-500 animate-[bounce_0.8s_infinite_-0.2s]" />
                <span className="w-0.5 h-3 bg-red-500 animate-[bounce_0.8s_infinite_-0.4s]" />
                <span className="w-0.5 h-3 bg-red-500 animate-[bounce_0.8s_infinite]" />
              </span>
            ) : (
              index + 1
            )}
          </span>
          <button
            onClick={() => onPlay(song)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-600 transition-opacity focus:outline-none"
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Small Cover Artwork */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <img
            src={
              song.coverUrl ||
              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"
            }
            alt={song.title}
            className="h-full w-full object-cover"
          />
          {/* Quick overlay play on cover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => onPlay(song)}>
            {isCurrent && isPlaying ? (
              <Pause className="h-3 w-3 text-white fill-current" />
            ) : (
              <Play className="h-3 w-3 text-white fill-current ml-0.5" />
            )}
          </div>
        </div>

        {/* Title, Artist, Album */}
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h4
              onClick={() => onPlay(song)}
              className={`font-serif text-[14px] font-black tracking-tight truncate cursor-pointer transition-colors ${
                isCurrent
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 dark:group-hover:text-red-400"
              }`}
            >
              {song.title}
            </h4>
            {isDownloaded && (
              <span
                className="flex h-3.5 w-3.5 items-center justify-center bg-red-600/10 text-red-600 rounded-sm"
                title="Downloaded offline"
              >
                <Download className="h-2 w-2" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <button
              onClick={() => onSelectArtist?.(song.artist)}
              className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:underline cursor-pointer"
            >
              {song.artist}
            </button>
            {song.featuredArtists && song.featuredArtists.length > 0 && (
              <span className="font-sans text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                feat.{" "}
                {song.featuredArtists.map((featArtist, i) => (
                  <React.Fragment key={featArtist}>
                    <button
                      onClick={() => onSelectArtist?.(featArtist)}
                      className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:underline cursor-pointer"
                    >
                      {featArtist}
                    </button>
                    {i < song.featuredArtists!.length - 1 && ", "}
                  </React.Fragment>
                ))}
              </span>
            )}
            {song.album && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <p className="font-serif text-[10.5px] text-zinc-400 dark:text-zinc-500 italic truncate">
                  {song.album}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Genre, Plays count, Favorite Heart, More Actions Menu */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        {/* Genre Badge (Hidden on mobile) */}
        <span className="hidden sm:inline-block rounded-none border border-zinc-200 px-2 py-0.5 font-mono text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest dark:border-zinc-800 dark:text-zinc-400">
          {song.genres?.[0] || "Music"}
        </span>

        {/* Plays Count (Hidden on mobile) */}
        <span className="hidden md:inline-block font-mono text-[10.5px] text-zinc-400 w-20 text-right">
          {song.listensCount?.toLocaleString() || 0} plays
        </span>

        {/* Favorite Heart Button */}
        <button
          onClick={() => onToggleFavorite(song.id)}
          className={`rounded-none p-1.5 transition-all ${
            isFavorited
              ? "text-red-500 scale-105"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <Heart className={`h-4.5 w-4.5 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* More Actions Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-none bg-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>

          {/* Absolute Actions Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 bottom-9 md:bottom-auto md:top-9 z-40 w-44 rounded-none border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                    Add to Playlist
                  </p>
                  <div className="max-h-24 overflow-y-auto border-b border-zinc-100 pb-1.5 mb-1.5 dark:border-zinc-900 space-y-0.5">
                    {playlists.length === 0 ? (
                      <p className="px-2 py-0.5 font-sans text-[10px] text-zinc-400 italic">
                        No playlists
                      </p>
                    ) : (
                      playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={async () => {
                            await onAddSongToPlaylist(pl.id, song.id);
                            setShowMenu(false);
                          }}
                          className="flex w-full items-center rounded-none px-2 py-1 font-sans text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900 truncate text-left"
                        >
                          {pl.name}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Offline download toggle */}
                  <button
                    onClick={() => {
                      onToggleDownload(song.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 font-sans text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isDownloaded ? "Remove Offline" : "Save Offline"}
                  </button>

                  {/* Report complaint */}
                  <button
                    onClick={() => {
                      onReportSong(song);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 font-sans text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Report DMCA
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
