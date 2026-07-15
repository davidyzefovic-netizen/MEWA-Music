import React, { useState } from "react";
import {
  Play,
  Pause,
  Heart,
  ListPlus,
  AlertTriangle,
  Download,
  MoreVertical,
} from "lucide-react";
import { Song, Playlist } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SongCardProps {
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
}

export default function SongCard({
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
}: SongCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isFavorited = favorites.includes(song.id);
  const isDownloaded = downloadedSongs.includes(song.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col rounded-none border bg-white p-4 transition-all shadow-sm dark:bg-zinc-950 ${
        isCurrent
          ? "border-red-500/50 ring-1 ring-red-500/10 dark:border-red-500/30"
          : "border-zinc-150 hover:shadow-md dark:border-zinc-900 dark:hover:border-zinc-800"
      }`}
    >
      {/* Cover Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-none bg-zinc-100 dark:bg-zinc-900">
        <img
          src={
            song.coverUrl ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
          }
          alt={song.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with Play button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onPlay(song)}
            className="flex h-12 w-12 items-center justify-center rounded-none bg-red-600 text-white shadow-lg shadow-red-600/20 transition-transform hover:scale-105 active:scale-95"
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-5.5 w-5.5 fill-current" />
            ) : (
              <Play className="h-5.5 w-5.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {isDownloaded && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-none bg-red-600 text-white shadow-sm"
              title="Downloaded offline"
            >
              <Download className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        {/* Top-Right More Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-2.5 right-2.5 flex h-7.5 w-7.5 items-center justify-center rounded-none bg-black/30 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/50"
        >
          <MoreVertical className="h-4 w-4" />
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
                className="absolute top-11 right-2.5 z-40 w-44 rounded-none border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              >
                {/* Playlist Sub-option */}
                <p className="px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                  Add to Playlist
                </p>
                <div className="max-h-24 overflow-y-auto border-b border-zinc-100 pb-1.5 mb-1.5 dark:border-zinc-900 space-y-0.5">
                  {playlists.length === 0 ? (
                    <p className="px-2 py-0.5 font-sans text-[11px] md:text-[10px] text-zinc-400 italic">
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

      {/* Meta details */}
      <div className="mt-3 flex items-start justify-between gap-1">
        <div className="overflow-hidden">
          <h4
            className={`font-serif text-[15px] font-black italic tracking-tight truncate cursor-pointer transition-colors ${
              isCurrent
                ? "text-red-500 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 dark:group-hover:text-red-400"
            }`}
            onClick={() => onPlay(song)}
          >
            {song.title}
          </h4>
          <div className="mt-0.5 truncate text-left flex items-center gap-1 flex-wrap">
            <button
              onClick={() => onSelectArtist?.(song.artist)}
              className="inline-block font-sans text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:underline cursor-pointer"
            >
              {song.artist}
            </button>
            {song.featuredArtists && song.featuredArtists.length > 0 && (
              <span className="font-sans text-xs text-zinc-400 dark:text-zinc-500">
                feat.{" "}
                {song.featuredArtists.map((featArtist, i) => (
                  <React.Fragment key={featArtist}>
                    <button
                      onClick={() => onSelectArtist?.(featArtist)}
                      className="inline-block font-sans text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:underline cursor-pointer"
                    >
                      {featArtist}
                    </button>
                    {i < song.featuredArtists!.length - 1 && ", "}
                  </React.Fragment>
                ))}
              </span>
            )}
          </div>
          {song.album && (
            <p className="font-serif text-[11px] md:text-[10px] text-zinc-400 dark:text-zinc-500 italic truncate mt-0.5">
              {song.album}
            </p>
          )}
        </div>

        {/* Favorite heart button */}
        <button
          onClick={() => onToggleFavorite(song.id)}
          className={`shrink-0 rounded-none p-1 transition-all ${
            isFavorited
              ? "text-red-500 scale-105"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Genres and playcount footer */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100/60 pt-2.5 dark:border-zinc-900/60">
        <span className="rounded-none border border-zinc-200 px-2 py-0.5 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest dark:border-zinc-800 dark:text-zinc-400">
          {song.genres?.[0] || "Music"}
        </span>
        <span className="font-mono text-[9px] text-zinc-400">
          {song.listensCount?.toLocaleString() || 0} plays
        </span>
      </div>
    </motion.div>
  );
}
