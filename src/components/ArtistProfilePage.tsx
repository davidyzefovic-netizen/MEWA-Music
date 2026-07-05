import React, { useState, useRef } from "react";
import {
  MapPin,
  Calendar,
  Eye,
  ArrowLeft,
  Edit3,
  X,
  FileText,
  Play,
  Sparkles,
  Info,
  Globe,
  FileImage,
  Upload,
  Trash2,
} from "lucide-react";
import { ArtistProfile, Song, UserProfile, Album } from "../types";
import { compressImage } from "../lib/indexedDbStorage";

interface ArtistProfilePageProps {
  artist: ArtistProfile;
  songs: Song[];
  albums: Album[];
  userProfile: UserProfile | null;
  onBack: () => void;
  onPlaySong: (song: Song) => void;
  onUpdateArtist: (artistId: string, updatedFields: Partial<ArtistProfile>) => Promise<void>;
  onDeleteArtist?: (artistId: string) => Promise<void>;
  onCreateAlbum?: (albumData: Omit<Album, "id" | "createdAt" | "createdBy">) => Promise<string>;
  onUpdateAlbum?: (albumId: string, updatedFields: Partial<Album>) => Promise<void>;
  onDeleteAlbum?: (albumId: string) => Promise<void>;
  onViewAlbum?: (albumId: string) => void;
  enableTyping?: boolean;
}

export default function ArtistProfilePage({
  artist,
  songs,
  albums,
  userProfile,
  onBack,
  onPlaySong,
  onUpdateArtist,
  onDeleteArtist,
  onCreateAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
  onViewAlbum,
  enableTyping = true,
}: ArtistProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [typedBio, setTypedBio] = useState("");
  const bioRef = useRef(artist.bio || "");

  React.useEffect(() => {
    bioRef.current = artist.bio || "";
    if (!enableTyping || !artist.bio) {
      setTypedBio(artist.bio || "");
      return;
    }
    
    setTypedBio("");
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < bioRef.current.length) {
        setTypedBio(bioRef.current.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 15); // Fast typing speed

    return () => clearInterval(intervalId);
  }, [artist.bio, enableTyping]);

  // Edit fields
  const [editName, setEditName] = useState(artist.name || "");
  const [editBio, setEditBio] = useState(artist.bio || "");
  const [editHometown, setEditHometown] = useState(artist.hometown || "");
  const [editFormedIn, setEditFormedIn] = useState(artist.formedIn || "");

  // Files
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState(artist.imageUrl || "");
  const [editBannerPreview, setEditBannerPreview] = useState(artist.bannerUrl || "");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Trivia states (local crowd-sourced trivia facts)
  const [trivia, setTrivia] = useState<string[]>([
    "Began recording homemade tapes in their childhood bedroom.",
    "Known for combining live classic analog synths with modern digital wave production.",
    "First signature live set debuted at the MEWA Warehouse Showcase.",
  ]);
  const [newFact, setNewFact] = useState("");

  // Filter songs belonging to this artist (case-insensitive name match)
  const artistSongs = songs.filter(
    (s) => s.artist.toLowerCase() === artist.name.toLowerCase() && s.status === "approved"
  );

  const handleImageChange = async (file: File) => {
    setEditImageFile(file);
    try {
      const base64 = await compressImage(file, 800, 800);
      setEditImagePreview(base64);
    } catch (e) {
      console.error(e);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = async (file: File) => {
    setEditBannerFile(file);
    try {
      const base64 = await compressImage(file, 1200, 600);
      setEditBannerPreview(base64);
    } catch (e) {
      console.error(e);
      setEditBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await onUpdateArtist(artist.id, {
        name: editName.trim(),
        bio: editBio.trim(),
        hometown: editHometown.trim(),
        formedIn: editFormedIn.trim(),
        imageUrl: editImagePreview,
        bannerUrl: editBannerPreview,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTrivia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setTrivia([...trivia, newFact.trim()]);
    setNewFact("");
  };

  // Check permission to edit (creator or administrator)
  const canEdit =
    userProfile && (userProfile.uid === artist.createdBy || userProfile.role === "admin" || userProfile.role === "author");

  const artistAlbums = albums.filter((a) => a.artistId === artist.id);

  // Album creation state
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState("");
  const [newAlbumCover, setNewAlbumCover] = useState("");
  
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  const handleAlbumCoverChange = async (file: File) => {
    try {
      const base64 = await compressImage(file, 800, 800);
      setNewAlbumCover(base64);
    } catch (e) {
      console.error(e);
      setNewAlbumCover(URL.createObjectURL(file));
    }
  };

  if (showAllAlbums) {
    return (
      <div className="flex-1 overflow-y-auto pb-28 relative bg-zinc-50 dark:bg-zinc-950">
        <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6">
          <div className="h-20 w-20 rounded-none overflow-hidden border-2 border-zinc-800 shrink-0">
             <img src={artist.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"} alt={artist.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-black uppercase text-zinc-900 dark:text-zinc-100">{artist.name}</h2>
            <p className="font-sans text-sm text-zinc-500 uppercase tracking-widest mt-1">Все Альбомы</p>
          </div>
          <button
            onClick={() => setShowAllAlbums(false)}
            className="ml-auto flex items-center gap-2 font-sans text-xs uppercase font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {artistAlbums.map((album) => {
              const albumSongs = artistSongs.filter(s => s.album === album.title);
              return (
                <div
                  key={album.id}
                  className="group relative cursor-pointer flex flex-col"
                  onClick={() => onViewAlbum && onViewAlbum(album.id)}
                >
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 mb-3 overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-sm">
                    <img
                      src={album.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      {canEdit && onDeleteAlbum && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDeleteAlbum(album.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {albumSongs[0] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong(albumSongs[0]);
                          }}
                          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl"
                        >
                          <Play className="h-5 w-5 fill-current ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {album.title}
                  </h4>
                  <p className="font-sans text-xs text-zinc-500 mt-1 truncate">
                    {albumSongs.length} tracks {album.releaseYear ? `• ${album.releaseYear}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const handleCreateAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim() || !onCreateAlbum) return;
    setSubmitting(true);
    try {
      await onCreateAlbum({
        title: newAlbumTitle.trim(),
        artistId: artist.id,
        artistName: artist.name,
        coverUrl: newAlbumCover,
        releaseYear: newAlbumYear,
      });
      setIsCreatingAlbum(false);
      setNewAlbumTitle("");
      setNewAlbumYear("");
      setNewAlbumCover("");
    } catch (err: any) {
      alert(err.message || "Failed to create album");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 relative">
      {/* Dynamic Header Banner */}
      <div className="relative h-64 w-full bg-zinc-900">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={artist.bannerUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200"}
            alt={artist.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-zinc-950/80" />
        </div>

        {/* Back navigation */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex h-8.5 items-center gap-1.5 rounded-none bg-black/45 px-3.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors cursor-pointer z-20"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to artists
        </button>

        {/* Edit page trigger */}
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 flex h-8.5 items-center gap-1.5 rounded-none bg-red-600 px-3.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors cursor-pointer z-20"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </button>
        )}
      </div>

      {/* Overlapping Info block */}
      <div className="px-8 relative z-10 flex flex-col sm:flex-row sm:items-end gap-6 -mt-20 mb-8">
        <div className="h-40 w-40 rounded-full border-4 border-zinc-950 bg-zinc-800 shrink-0 shadow-2xl overflow-hidden">
          <img
            src={artist.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"}
            alt={artist.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-white pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Verified Artist Profile
            </span>
          </div>
          <h1 className="font-serif text-4xl font-black italic tracking-tight uppercase sm:text-5xl mt-1 text-zinc-50 drop-shadow-md">
            {artist.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-5 text-sm font-semibold text-zinc-300">
            {artist.hometown && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{artist.hometown}</span>
              </div>
            )}
            {artist.formedIn && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Established: {artist.formedIn}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-zinc-400" />
              <span>{(artist.views || 0).toLocaleString()} visitors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content split */}
      <div className="px-8 pb-8">
        {isEditing ? (
          /* EDIT PROFILE SECTION */
          <div className="max-w-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-850 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
              <h3 className="font-serif text-sm font-black italic text-zinc-900 dark:text-zinc-50">
                Update Artist Wiki: {artist.name}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Artist Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Hometown / Origin</label>
                  <input
                    type="text"
                    value={editHometown}
                    onChange={(e) => setEditHometown(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Formed In / Years Active</label>
                  <input
                    type="text"
                    value={editFormedIn}
                    onChange={(e) => setEditFormedIn(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* RE-UPLOAD SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Replace Avatar Photo</label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-850 dark:bg-zinc-900/30 transition-all p-3 text-center"
                  >
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleImageChange(file);
                      }}
                      className="hidden"
                    />
                    {editImagePreview ? (
                      <div className="flex items-center gap-2 w-full text-left">
                        <img src={editImagePreview} alt="Preview" className="h-14 w-14 object-cover border border-zinc-250 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-sans text-[10px] font-semibold text-zinc-900 dark:text-zinc-150 truncate">{editImageFile?.name || "Original Artwork"}</p>
                          <p className="font-mono text-[8px] text-zinc-400">Compressed JPEG</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                        <span className="font-sans text-[10px] text-zinc-500">Choose Image File</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Replace Header Banner</label>
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-850 dark:bg-zinc-900/30 transition-all p-3 text-center"
                  >
                    <input
                      type="file"
                      ref={bannerInputRef}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleBannerChange(file);
                      }}
                      className="hidden"
                    />
                    {editBannerPreview ? (
                      <div className="flex items-center gap-2 w-full text-left">
                        <img src={editBannerPreview} alt="Preview" className="h-14 w-20 object-cover border border-zinc-250 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-sans text-[10px] font-semibold text-zinc-900 dark:text-zinc-150 truncate">{editBannerFile?.name || "Original Banner"}</p>
                          <p className="font-mono text-[8px] text-zinc-400">Compressed JPEG</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-5 w-5 text-zinc-400 mb-1" />
                        <span className="font-sans text-[10px] text-zinc-500">Choose Banner File</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Biography</label>
                <textarea
                  rows={6}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-none border border-zinc-200 bg-zinc-50 p-3.5 font-sans text-xs leading-relaxed dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-between">
                {onDeleteArtist ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this artist profile? This cannot be undone.")) {
                        setSubmitting(true);
                        try {
                          await onDeleteArtist(artist.id);
                        } catch (err: any) {
                          setError(err.message || "Failed to delete artist.");
                          setSubmitting(false);
                        }
                      }
                    }}
                    disabled={submitting}
                    className="rounded-none border border-red-600/30 text-red-600 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Artist
                  </button>
                ) : <div />}
                
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-none bg-zinc-150 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-wider text-zinc-650 dark:bg-zinc-850 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-none bg-red-600 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-700"
                  >
                    {submitting ? "Saving..." : "Save Artist"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* PROFILE LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT BIOGRAPHY COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950 h-full">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-5">
                  <FileText className="h-4.5 w-4.5 text-zinc-500" />
                  <h3 className="font-serif text-lg font-black italic tracking-widest text-zinc-900 uppercase dark:text-zinc-100">
                    Биография
                  </h3>
                </div>

                {artist.bio ? (
                  <p className="font-sans text-sm text-zinc-700 leading-relaxed dark:text-zinc-300 whitespace-pre-line relative">
                    {typedBio}
                    {enableTyping && typedBio.length < artist.bio.length && (
                      <span className="inline-block w-1.5 h-4 bg-zinc-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                ) : (
                  <div className="text-center py-6 text-zinc-400 italic font-sans text-xs">
                    No bio has been written for {artist.name} yet. Be the first to annotate!
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-3 block mx-auto text-red-600 hover:underline font-bold text-[10px] uppercase tracking-wider"
                      >
                        Create Wiki Content Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT ALBUMS COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                    <h3 className="font-serif text-lg font-black italic tracking-widest text-zinc-900 uppercase dark:text-zinc-100">
                      Альбомы
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {canEdit && (
                      <button
                        onClick={() => setIsCreatingAlbum(!isCreatingAlbum)}
                        className="font-sans text-[10px] uppercase tracking-wider font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        {isCreatingAlbum ? "Cancel" : "+ New Album"}
                      </button>
                    )}
                    <span className="font-mono text-[9px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 dark:bg-zinc-850 dark:text-zinc-400">
                      {artistAlbums.length} RELEASES
                    </span>
                  </div>
                </div>

                {isCreatingAlbum && (
                  <form onSubmit={handleCreateAlbumSubmit} className="mb-8 p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Create New Album</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Album Title *</label>
                        <input
                          required
                          type="text"
                          value={newAlbumTitle}
                          onChange={(e) => setNewAlbumTitle(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Release Year</label>
                        <input
                          type="text"
                          value={newAlbumYear}
                          onChange={(e) => setNewAlbumYear(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && e.target.files[0] && handleAlbumCoverChange(e.target.files[0])}
                        className="text-xs text-zinc-500"
                      />
                      {newAlbumCover && (
                        <img src={newAlbumCover} alt="preview" className="mt-2 h-20 w-20 object-cover border border-zinc-200 dark:border-zinc-800" />
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !newAlbumTitle.trim()}
                      className="mt-6 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-2 disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Create Album"}
                    </button>
                  </form>
                )}

                {artistAlbums.length === 0 ? (
                  <div>
                    {artistSongs.length > 0 ? (
                      <div className="divide-y divide-zinc-100/55 dark:divide-zinc-900">
                        {artistSongs.map((song, idx) => (
                          <div
                            key={song.id}
                            className="flex items-center justify-between py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <span className="font-mono text-[11px] text-zinc-400 w-4 text-right">
                                {idx + 1}
                              </span>
                              <img
                                src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                                alt={song.title}
                                className="h-10 w-10 object-cover border border-zinc-200 dark:border-zinc-900"
                              />
                              <div className="truncate">
                                <h5 className="font-serif text-xs font-bold text-zinc-900 dark:text-zinc-150 truncate">
                                  {song.title}
                                </h5>
                                <p className="font-sans text-[10px] text-zinc-450 truncate">
                                  Single
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <span className="font-mono text-[10px] text-zinc-400">
                                {song.listensCount || 0} listens
                              </span>
                              <button
                                onClick={() => onPlaySong(song)}
                                className="flex h-7 w-7 items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-650 hover:bg-red-600 hover:text-white dark:bg-zinc-900 dark:border-zinc-800 transition-all"
                              >
                                <Play className="h-3 w-3 fill-current ml-0.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-zinc-400 italic font-sans text-sm">
                        <p>No albums or tracks uploaded for {artist.name} yet.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {artistAlbums.slice(0, 4).map((album) => {
                      const albumSongs = artistSongs.filter(s => s.album === album.title);
                      return (
                        <div
                          key={album.id}
                          className="group relative cursor-pointer flex flex-col"
                          onClick={() => onViewAlbum && onViewAlbum(album.id)}
                        >
                          <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 mb-3 overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-sm">
                            <img
                              src={album.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                              {canEdit && onDeleteAlbum && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onDeleteAlbum(album.id);
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {albumSongs[0] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPlaySong(albumSongs[0]);
                                  }}
                                  className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl"
                                >
                                  <Play className="h-5 w-5 fill-current ml-1" />
                                </button>
                              )}
                            </div>
                          </div>
                          <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {album.title}
                          </h4>
                          <p className="font-sans text-xs text-zinc-500 mt-1 truncate">
                            {albumSongs.length} tracks {album.releaseYear ? `• ${album.releaseYear}` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* 'еще' text indicating more albums */}
                {artistAlbums.length > 4 && (
                  <div className="mt-8 flex justify-end">
                     <button 
                       onClick={() => setShowAllAlbums(true)}
                       className="font-serif text-sm font-black italic uppercase tracking-wider text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors flex items-center gap-1"
                     >
                       еще <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                     </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
