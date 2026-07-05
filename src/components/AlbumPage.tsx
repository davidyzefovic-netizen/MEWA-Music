import React, { useState } from "react";
import { Album, Song, UserProfile } from "../types";
import { ArrowLeft, Play, Edit3, Trash2, Plus, Minus } from "lucide-react";

interface AlbumPageProps {
  album: Album;
  songs: Song[];
  userProfile: UserProfile | null;
  onBack: () => void;
  onPlaySong: (song: Song) => void;
  onUpdateAlbum: (albumId: string, updatedFields: Partial<Album>) => Promise<void>;
  onDeleteAlbum: (albumId: string) => Promise<void>;
  onUpdateSongDetails: (songId: string, fields: Partial<Song>) => Promise<void>;
}

export default function AlbumPage({
  album,
  songs,
  userProfile,
  onBack,
  onPlaySong,
  onUpdateAlbum,
  onDeleteAlbum,
  onUpdateSongDetails,
}: AlbumPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBehindTheScenes, setEditBehindTheScenes] = useState(album.behindTheScenes || "");

  const canEdit =
    userProfile && (userProfile.uid === album.createdBy || userProfile.role === "admin" || userProfile.role === "author");

  const albumSongs = songs.filter((s) => s.album === album.title && s.artist === album.artistName && s.status === "approved");
  const otherArtistSongs = songs.filter((s) => s.album !== album.title && s.artist === album.artistName && s.status === "approved");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateAlbum(album.id, {
        behindTheScenes: editBehindTheScenes,
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update album");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${album.title}?`)) {
      await onDeleteAlbum(album.id);
    }
  };

  const handleAddTrack = async (songId: string) => {
    try {
      await onUpdateSongDetails(songId, { album: album.title });
    } catch (err) {
      alert("Failed to add track");
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    try {
      await onUpdateSongDetails(songId, { album: "" });
    } catch (err) {
      alert("Failed to remove track");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 relative bg-zinc-50 dark:bg-zinc-950">
      {/* Header Banner */}
      <div className="relative h-64 w-full bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={album.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200"}
            alt={album.title}
            className="w-full h-full object-cover opacity-40 blur-2xl scale-110 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex h-8.5 items-center gap-1.5 rounded-none bg-black/45 px-3.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors cursor-pointer z-20"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {canEdit && (
          <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-8.5 items-center gap-1.5 rounded-none bg-zinc-800 px-3.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Album
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex h-8.5 items-center gap-1.5 rounded-none bg-red-600 px-3.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Info Block (Avatar Overlapping) */}
      <div className="px-8 relative z-10 flex flex-col sm:flex-row sm:items-end gap-6 -mt-20 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="h-48 w-48 border-4 border-zinc-950 bg-zinc-800 shrink-0 shadow-2xl overflow-hidden relative">
          <img
            src={album.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-zinc-900 dark:text-white pb-2">
          <h1 className="font-serif text-4xl font-black italic tracking-tight uppercase sm:text-5xl mt-1 drop-shadow-md">
            {album.title}
          </h1>
          <p className="mt-2 font-sans text-xl text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest">
            {album.artistName}
          </p>
          {album.releaseYear && (
            <p className="mt-1 font-mono text-xs text-zinc-500 uppercase tracking-widest">
              Release: {album.releaseYear}
            </p>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Songs */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-black italic tracking-widest text-zinc-900 uppercase dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Треки
          </h3>
          
          {albumSongs.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-4">No tracks uploaded to this album yet.</p>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/50">
              {albumSongs.map((song, idx) => (
                <div key={song.id} className="flex items-center justify-between py-3 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs text-zinc-400 w-4 text-right">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <h5 className="font-serif text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {song.title}
                      </h5>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveTrack(song.id)}
                        className="flex h-8 w-8 items-center justify-center bg-zinc-100 border border-zinc-200 text-red-600 hover:bg-red-600 hover:text-white dark:bg-zinc-800 dark:border-zinc-700 transition-all rounded-full shrink-0"
                        title="Remove from album"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onPlaySong(song)}
                      className="flex h-8 w-8 items-center justify-center bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-red-600 hover:text-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-red-600 transition-all rounded-full shrink-0"
                    >
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isEditing && otherArtistSongs.length > 0 && (
            <div className="mt-8">
              <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wider">
                Add existing tracks
              </h4>
              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                {otherArtistSongs.map((song) => (
                  <div key={song.id} className="flex items-center justify-between py-2 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="truncate">
                      <h5 className="font-serif text-sm text-zinc-700 dark:text-white truncate">
                        {song.title}
                      </h5>
                    </div>
                    <button
                      onClick={() => handleAddTrack(song.id)}
                      className="flex h-7 w-7 items-center justify-center bg-zinc-200 border border-zinc-300 text-zinc-700 hover:bg-emerald-600 hover:text-white dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-emerald-600 transition-all rounded-full shrink-0"
                      title="Add to album"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Behind the scenes (Как делали) */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-black italic tracking-widest text-zinc-900 uppercase dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Как делали
          </h3>
          
          {isEditing ? (
            <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4">
              <textarea
                value={editBehindTheScenes}
                onChange={(e) => setEditBehindTheScenes(e.target.value)}
                placeholder="Share stories about the creation of this album..."
                className="w-full h-40 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 p-3 focus:outline-none focus:border-red-500 mb-4 font-sans resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Save Details
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 min-h-[200px]">
              {album.behindTheScenes ? (
                <p className="font-sans text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {album.behindTheScenes}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic text-center py-12">
                  No behind-the-scenes information available yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
