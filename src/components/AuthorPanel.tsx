import React, { useState, useRef } from "react";
import {
  Plus,
  Music,
  Check,
  Save,
  AlertCircle,
  FileText,
  Clock,
  XCircle,
  Edit3,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Song, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { saveFile, compressImage } from "../lib/indexedDbStorage";

interface AuthorPanelProps {
  userProfile: UserProfile | null;
  songs: Song[];
  onUploadSong: (songData: Omit<Song, "id" | "listensCount" | "likesCount" | "uploadedBy" | "authorName" | "status" | "createdAt">) => Promise<string>;
  onEditSong: (songId: string, updatedFields: Partial<Song>) => Promise<void>;
}

export default function AuthorPanel({
  userProfile,
  songs,
  onUploadSong,
  onEditSong,
}: AuthorPanelProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Filter songs uploaded by this creator
  const mySongs = songs.filter((s) => s.uploadedBy === userProfile?.uid);

  // Form states
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState(userProfile?.displayName || "");
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [album, setAlbum] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genres, setGenres] = useState("");
  const [tags, setTags] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // File upload states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

  // Edit states
  const [editTitle, setEditTitle] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [editLyrics, setEditLyrics] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");

  // Edit file states
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string>("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editAudioInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = async (file: File) => {
    setCoverFile(file);
    try {
      const base64 = await compressImage(file, 800, 800);
      setCoverPreview(base64);
    } catch (e) {
      console.error("Compression error: ", e);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleEditCoverChange = async (file: File) => {
    setEditCoverFile(file);
    try {
      const base64 = await compressImage(file, 800, 800);
      setEditCoverPreview(base64);
    } catch (e) {
      console.error("Compression error: ", e);
      setEditCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !artist.trim() || !lyrics.trim() || (!audioFile && !audioUrl.trim())) {
      setError("Please fill in all mandatory fields: Title, Artist, Lyrics, and Audio file or stream URL.");
      return;
    }

    setSubmitting(true);
    try {
      const genresArray = genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      const featuredArtistsArray = featuredArtists
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a !== "");

      let finalAudioUrl = audioUrl;
      let finalCoverUrl = coverPreview || coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400";

      // If cover image is provided, compress it to base64
      if (coverFile) {
        finalCoverUrl = await compressImage(coverFile);
      }

      // Call parent creator to upload and return the new song's ID
      const songId = await onUploadSong({
        title,
        artist,
        featuredArtists: featuredArtistsArray,
        album,
        lyrics,
        audioUrl: finalAudioUrl,
        coverUrl: finalCoverUrl,
        genres: genresArray.length > 0 ? genresArray : ["Electronic"],
        tags: tagsArray,
      });

      // Upload audio file to IndexedDB if provided
      if (audioFile) {
        await saveFile(songId, "audio", audioFile);
      }

      // Clear states
      setTitle("");
      setAlbum("");
      setAudioUrl("");
      setCoverUrl("");
      setCoverPreview("");
      setAudioFile(null);
      setCoverFile(null);
      setGenres("");
      setTags("");
      setLyrics("");
      setShowUploadForm(false);
    } catch (err) {
      setError("Submission failed. Check your network or permissions.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;

    setSubmitting(true);
    try {
      let finalCover = editCoverPreview || editCoverUrl;

      await onEditSong(editingSong.id, {
        title: editTitle,
        album: editAlbum,
        lyrics: editLyrics,
        coverUrl: finalCover,
      });

      // Secure save new assets in IndexedDB
      if (editAudioFile) {
        await saveFile(editingSong.id, "audio", editAudioFile);
      }
      if (editCoverFile) {
        await saveFile(editingSong.id, "image", editCoverFile);
      }

      setEditingSong(null);
      setEditAudioFile(null);
      setEditCoverFile(null);
      setEditCoverPreview("");
    } catch (err) {
      console.error("Failed to edit track: ", err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditAlbum(song.album || "");
    setEditLyrics(song.lyrics);
    setEditCoverUrl(song.coverUrl || "");
    setEditCoverPreview(song.coverUrl || "");
    setEditAudioFile(null);
    setEditCoverFile(null);
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-black italic text-zinc-900 dark:text-zinc-50 tracking-tight">
            Creator Studio
          </h2>
          <p className="font-serif text-xs italic text-zinc-500 dark:text-zinc-400 mt-1">
            Upload original tracks, synchronize lyric lines, and monitor your submission approvals.
          </p>
        </div>
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex h-10 items-center gap-1.5 rounded-none bg-red-600 px-5 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-transform active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" /> Upload New Track
          </button>
        )}
      </div>

      {/* Main Panel Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Upload Form / Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {showUploadForm && (
            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
                <h3 className="font-serif text-base font-bold italic text-zinc-900 dark:text-zinc-100">
                  Submit Song for Verification
                </h3>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="rounded-none p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2.5 rounded-none border border-rose-200 bg-rose-50 p-3.5 font-sans text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Song Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Moonlight Dreams"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Artist / Band Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Neon Skyline"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Featured Artists (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Daft Punk, The Weeknd"
                      value={featuredArtists}
                      onChange={(e) => setFeaturedArtists(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Album Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Retro Waves Vol 2"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Genres (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Synthwave, Electronic, Retro"
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AUDIO FILE DROPZONE */}
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Audio Streaming File *</label>
                    <div
                      onClick={() => audioInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("audio/")) {
                          setAudioFile(file);
                        }
                      }}
                      className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3"
                    >
                      <input
                        type="file"
                        ref={audioInputRef}
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAudioFile(file);
                        }}
                        className="hidden"
                      />
                      {audioFile ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-12 w-12 items-center justify-center bg-red-500/15 text-red-500 rounded-none shrink-0">
                            <Music className="h-6 w-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate">{audioFile.name}</p>
                            <p className="font-mono text-[9px] text-zinc-450 mt-0.5">{(audioFile.size / 1024 / 1024).toFixed(2)} MB • Audio Track</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioFile(null);
                            }}
                            className="ml-auto rounded-none p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors mb-1" />
                          <p className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Drag & Drop or <span className="text-red-500">Choose Audio File</span>
                          </p>
                          <p className="font-mono text-[8px] text-zinc-400 mt-0.5">MP3, WAV, M4A (Secure IndexedDB Storage)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* COVER IMAGE FILE DROPZONE */}
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cover Image File</label>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          await handleCoverChange(file);
                        }
                      }}
                      className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3"
                    >
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleCoverChange(file);
                        }}
                        className="hidden"
                      />
                      {coverPreview ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={coverPreview} alt="Cover Preview" className="h-14 w-14 object-cover border border-zinc-200 dark:border-zinc-850 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate">{coverFile?.name || "Uploaded Artwork"}</p>
                            <p className="font-mono text-[9px] text-zinc-450 mt-0.5">Auto-Compressed JPEG</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverFile(null);
                              setCoverPreview("");
                            }}
                            className="ml-auto rounded-none p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors mb-1" />
                          <p className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Drag & Drop or <span className="text-red-500">Choose Image File</span>
                          </p>
                          <p className="font-mono text-[8px] text-zinc-400 mt-0.5">JPG, PNG (JPEG Auto-optimized)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Fallback Audio URL if no file uploaded */}
                {!audioFile && (
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Optional Fallback Audio URL (MP3 stream)</label>
                    <input
                      type="text"
                      placeholder="https://example.com/stream.mp3"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Tags / Keywords (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="chill, night, background, beat"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Song Lyrics *</label>
                    <span className="font-mono text-[8px] tracking-wider text-zinc-400">Include timestamp prefix: [00:15] Cruising down...</span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder={`[00:00] (Intro beats)
[00:15] High above the glowing stars...
[00:20] Fading into neon beams...`}
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    className="w-full rounded-none border border-zinc-200 bg-zinc-50 p-3.5 font-sans text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-none bg-red-600 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting Track..." : "Submit to Verification Review Queue"}
                </button>
              </form>
            </div>
          )}

          {/* EDIT MODE */}
          {editingSong && (
            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
                <h3 className="font-serif text-base font-bold italic text-zinc-900 dark:text-zinc-100">
                  Edit Track details: {editingSong.title}
                </h3>
                <button
                  onClick={() => setEditingSong(null)}
                  className="rounded-none p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Album</label>
                    <input
                      type="text"
                      value={editAlbum}
                      onChange={(e) => setEditAlbum(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EDIT AUDIO FILE DROPZONE */}
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Replace Audio File (Optional)</label>
                    <div
                      onClick={() => editAudioInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("audio/")) {
                          setEditAudioFile(file);
                        }
                      }}
                      className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3"
                    >
                      <input
                        type="file"
                        ref={editAudioInputRef}
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setEditAudioFile(file);
                        }}
                        className="hidden"
                      />
                      {editAudioFile ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-12 w-12 items-center justify-center bg-red-500/15 text-red-500 rounded-none shrink-0">
                            <Music className="h-6 w-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate">{editAudioFile.name}</p>
                            <p className="font-mono text-[9px] text-zinc-450 mt-0.5">{(editAudioFile.size / 1024 / 1024).toFixed(2)} MB • Audio Track</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditAudioFile(null);
                            }}
                            className="ml-auto rounded-none p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors mb-1" />
                          <p className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Drag & Drop or <span className="text-red-500">Choose New Audio</span>
                          </p>
                          <p className="font-mono text-[8px] text-zinc-400 mt-0.5">Keep blank to retain original audio</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* EDIT COVER IMAGE FILE DROPZONE */}
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Replace Cover Image</label>
                    <div
                      onClick={() => editCoverInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          await handleEditCoverChange(file);
                        }
                      }}
                      className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3"
                    >
                      <input
                        type="file"
                        ref={editCoverInputRef}
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleEditCoverChange(file);
                        }}
                        className="hidden"
                      />
                      {editCoverPreview ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={editCoverPreview} alt="Cover Preview" className="h-14 w-14 object-cover border border-zinc-200 dark:border-zinc-850 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate">{editCoverFile?.name || "Original Artwork"}</p>
                            <p className="font-mono text-[9px] text-zinc-450 mt-0.5">JPEG Compressed</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditCoverFile(null);
                              setEditCoverPreview(editingSong.coverUrl || "");
                            }}
                            className="ml-auto rounded-none p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors mb-1" />
                          <p className="font-sans text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Drag & Drop or <span className="text-red-500">Choose New Cover</span>
                          </p>
                          <p className="font-mono text-[8px] text-zinc-400 mt-0.5">JPG, PNG (Retains current cover if blank)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lyrics</label>
                  <textarea
                    rows={8}
                    value={editLyrics}
                    onChange={(e) => setEditLyrics(e.target.value)}
                    className="w-full rounded-none border border-zinc-200 bg-zinc-50 p-3.5 font-sans text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingSong(null)}
                    className="rounded-none bg-zinc-150 px-4 py-2 font-sans text-xs font-bold text-zinc-650 dark:bg-zinc-850 dark:text-zinc-400 uppercase tracking-wider text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-none bg-red-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-red-700 uppercase tracking-wider text-[10px]"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showUploadForm && !editingSong && (
            <div className="rounded-none border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
              <Music className="mx-auto h-12 w-12 text-red-500/40 animate-bounce" />
              <h3 className="mt-4 font-serif text-base font-bold text-zinc-900 dark:text-zinc-200">
                Ready to publish your music?
              </h3>
              <p className="mx-auto mt-1 max-w-sm font-serif text-xs italic text-zinc-500 dark:text-zinc-400">
                Submit your songs with lyrics, artwork, and streaming links. We'll synchronize the lyric lines automatically for listeners!
              </p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="mt-5 rounded-none bg-red-600 px-5 py-2 font-sans text-[10px] uppercase tracking-widest font-bold text-white shadow-sm hover:bg-red-700 cursor-pointer"
              >
                Launch Submission Wizard
              </button>
            </div>
          )}
        </div>

        {/* My Submissions List side column */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
          <h3 className="font-mono text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest mb-4">
            My Upload Catalog ({mySongs.length})
          </h3>

          {mySongs.length === 0 ? (
            <p className="font-serif text-xs text-zinc-400 dark:text-zinc-500 py-6 text-center italic">
              No tracks uploaded by you yet.
            </p>
          ) : (
            <div className="space-y-3.5">
              {mySongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between border-b border-zinc-50 pb-3 dark:border-zinc-900"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                      alt={song.title}
                      className="h-10 w-10 rounded-none object-cover border border-zinc-200 dark:border-zinc-800"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-serif text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {song.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {song.status === "approved" ? (
                          <span className="inline-flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-wider font-bold text-emerald-500">
                            <Check className="h-2.5 w-2.5" /> Approved
                          </span>
                        ) : song.status === "pending" ? (
                          <span className="inline-flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-wider font-bold text-amber-500">
                            <Clock className="h-2.5 w-2.5" /> Reviewing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-wider font-bold text-rose-500">
                            <XCircle className="h-2.5 w-2.5" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startEditing(song)}
                    className="rounded-none p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                    title="Edit lyrics or details"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
