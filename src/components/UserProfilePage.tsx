import React, { useMemo } from "react";
import { UserProfile, PlaybackHistory, Song, ArtistProfile } from "../types";
import { motion } from "motion/react";
import { User, Music, Mic2, Star, Clock } from "lucide-react";

interface UserProfilePageProps {
  userProfile: UserProfile | null;
  history: PlaybackHistory[];
  songs: Song[];
  artists: ArtistProfile[];
  darkMode: boolean;
}

export default function UserProfilePage({
  userProfile,
  history,
  songs,
  artists,
  darkMode,
}: UserProfilePageProps) {
  // Calculate top artist and top track
  const stats = useMemo(() => {
    if (!history.length) return { topSong: null, topArtist: null, totalListens: 0 };

    const songCounts: Record<string, number> = {};
    const artistCounts: Record<string, number> = {};

    history.forEach((h) => {
      songCounts[h.songId] = (songCounts[h.songId] || 0) + 1;
      const song = songs.find((s) => s.id === h.songId);
      if (song) {
        artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
      }
    });

    let topSongId = "";
    let maxSong = 0;
    for (const [id, count] of Object.entries(songCounts)) {
      if (count > maxSong) {
        maxSong = count;
        topSongId = id;
      }
    }

    let topArtistName = "";
    let maxArtist = 0;
    for (const [name, count] of Object.entries(artistCounts)) {
      if (count > maxArtist) {
        maxArtist = count;
        topArtistName = name;
      }
    }

    const topSong = songs.find((s) => s.id === topSongId) || null;
    let topArtist = artists.find((a) => a.name === topArtistName || a.id === topArtistName) || null;

    return {
      topSong,
      topArtistName,
      topArtist,
      topSongCount: maxSong,
      topArtistCount: maxArtist,
      totalListens: history.length,
    };
  }, [history, songs, artists]);

  if (!userProfile) {
    return (
      <div className={`p-8 flex items-center justify-center h-full ${darkMode ? "text-white" : "text-zinc-900"}`}>
        <p className="font-sans text-xs text-zinc-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col md:flex-row items-center md:items-start gap-6 border-b pb-8 ${
          darkMode ? "border-zinc-800" : "border-zinc-200"
        }`}
      >
        <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-none border ${
            darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-100"
          }`}
        >
          {userProfile.photoURL ? (
            <img src={userProfile.photoURL} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User size={32} className={darkMode ? "text-zinc-500" : "text-zinc-400"} />
          )}
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className={`font-serif text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-zinc-950"}`}>
            {userProfile.displayName || "Music Lover"}
          </h1>
          <p className={`mt-1 font-sans text-xs ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>
            {userProfile.email}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] md:text-[10px] font-semibold uppercase tracking-wider ${
              userProfile.role === "admin" 
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" 
                : userProfile.role === "author"
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}>
              <Star size={12} />
              <span>{userProfile.role}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] md:text-[10px] uppercase tracking-wider ${
              darkMode ? "bg-zinc-800/50 text-zinc-400" : "bg-zinc-100/50 text-zinc-500"
            }`}>
              <Clock size={12} />
              <span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Artist */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
          className={`flex flex-col border p-6 transition-colors ${darkMode ? "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Mic2 size={16} className={darkMode ? "text-zinc-400" : "text-zinc-500"} />
            <h2 className={`font-sans text-xs font-bold uppercase tracking-wider ${darkMode ? "text-zinc-300" : "text-zinc-600"}`}>
              Top Artist
            </h2>
          </div>
          
          {stats.topArtistName ? (
            <div className="flex items-center gap-4 mt-auto">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border ${
                  darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"
                }`}>
                {stats.topArtist?.imageUrl ? (
                  <img src={stats.topArtist.imageUrl} alt={stats.topArtistName} className="h-full w-full object-cover" />
                ) : (
                  <span className={`font-serif text-xl font-bold ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    {stats.topArtistName.charAt(0).toUpperCase()}
                  </span>
                )}
              </motion.div>
              <div>
                <h3 className={`font-serif text-lg font-bold ${darkMode ? "text-white" : "text-zinc-950"}`}>
                  {stats.topArtistName}
                </h3>
                <p className={`mt-0.5 font-mono text-[11px] md:text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                  {stats.topArtistCount} PLAYS
                </p>
              </div>
            </div>
          ) : (
            <p className={`mt-auto font-sans text-xs ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>
              Not enough data yet.
            </p>
          )}
        </motion.div>

        {/* Top Track */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2 }}
          className={`flex flex-col border p-6 transition-colors ${darkMode ? "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Music size={16} className={darkMode ? "text-zinc-400" : "text-zinc-500"} />
            <h2 className={`font-sans text-xs font-bold uppercase tracking-wider ${darkMode ? "text-zinc-300" : "text-zinc-600"}`}>
              Top Track
            </h2>
          </div>
          
          {stats.topSong ? (
            <div className="flex items-center gap-4 mt-auto">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border ${
                  darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"
                }`}>
                {stats.topSong.coverUrl ? (
                  <img src={stats.topSong.coverUrl} alt={stats.topSong.title} className="h-full w-full object-cover" />
                ) : (
                  <Music size={20} className={darkMode ? "text-zinc-500" : "text-zinc-400"} />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className={`truncate font-serif text-lg font-bold ${darkMode ? "text-white" : "text-zinc-950"}`}>
                  {stats.topSong.title}
                </h3>
                <p className={`truncate mt-0.5 font-sans text-xs ${darkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  {stats.topSong.artist}
                </p>
                <p className={`mt-1 font-mono text-[11px] md:text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                  {stats.topSongCount} PLAYS
                </p>
              </div>
            </div>
          ) : (
            <p className={`mt-auto font-sans text-xs ${darkMode ? "text-zinc-500" : "text-zinc-400"}`}>
              Not enough data yet.
            </p>
          )}
        </motion.div>
      </div>

    </div>
  );
}
