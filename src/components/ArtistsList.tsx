import React, { useState, useRef } from "react";
import {
  Users,
  Search,
  Plus,
  X,
  MapPin,
  Calendar,
  Eye,
  FileImage,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";
import { ArtistProfile, UserProfile } from "../types";

const uploadFileToServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

interface ArtistsListProps {
  artists: ArtistProfile[];
  userProfile: UserProfile | null;
  onSelectArtist: (artist: ArtistProfile) => void;
  onCreateArtistProfile: (artistData: Omit<ArtistProfile, "views" | "createdAt">) => Promise<void>;
}

export default function ArtistsList({
  artists,
  userProfile,
  onSelectArtist,
  onCreateArtistProfile,
}: ArtistsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [hometown, setHometown] = useState("");
  const [formedIn, setFormedIn] = useState("");

  // Uploaded files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleBannerChange = async (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Artist Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Create a URL-friendly slug as the ID
      const artistSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 10000);

      await onCreateArtistProfile({
        id: artistSlug,
        name: name.trim(),
        bio: bio.trim(),
        hometown: hometown.trim(),
        formedIn: formedIn.trim(),
        imageUrl: imagePreview || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
        bannerUrl: bannerPreview || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        createdBy: userProfile?.uid || "anonymous",
      });

      // Clear states
      setName("");
      setBio("");
      setHometown("");
      setFormedIn("");
      setImageFile(null);
      setBannerFile(null);
      setImagePreview("");
      setBannerPreview("");
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to create artist profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArtists = artists.filter((art) =>
    art.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 pb-28">
      {/* Genius Style Header Banner */}
      <div className="relative mb-8 overflow-hidden border border-zinc-200 bg-amber-300 p-8 text-zinc-950 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="relative z-10 max-w-2xl">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-400">
            Cooperative Encyclopaedia
          </span>
          <h2 className="mt-1 font-serif text-3xl font-black italic tracking-tight uppercase sm:text-4xl">
            MEWA Genius Wiki
          </h2>
          <p className="mt-2 font-sans text-xs font-semibold leading-relaxed text-zinc-800 dark:text-zinc-300">
            Browse crowd-sourced profiles, artist biographies, backstories, and lyric annotations. Create dynamic pages for your favorite underground creators.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 opacity-15 sm:block">
          <Users className="h-full w-full rotate-12 scale-110" />
        </div>
      </div>

      {/* Directory Search & Action Row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-450" />
          <input
            type="text"
            placeholder="Search artist profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-none border border-zinc-200 bg-white pl-10 pr-4 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-950 focus:outline-none focus:border-red-500"
          />
        </div>

        {userProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-none bg-red-600 px-5 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/15 hover:bg-red-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Artist Page
          </button>
        )}
      </div>

      {/* Artists Grid */}
      {filteredArtists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <Users className="h-14 w-14 text-zinc-300 mb-4" />
          <p className="font-serif text-sm font-semibold text-zinc-900 dark:text-zinc-300">
            No artists found
          </p>
          <p className="font-sans text-xs text-zinc-500 mt-1">
            Be the first to build a page for this artist on MeloWiki!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist(artist)}
              className="group relative cursor-pointer overflow-hidden border border-zinc-200 bg-white shadow-sm hover:border-red-500 hover:shadow-md transition-all dark:border-zinc-850 dark:bg-zinc-950"
            >
              {/* Header Banner image or background color */}
              <div className="h-20 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                <img
                  src={artist.bannerUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"}
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Artist Avatar overlapping the banner */}
              <div className="absolute top-10 left-4 h-14 w-14 border-2 border-white bg-zinc-200 overflow-hidden dark:border-zinc-950">
                <img
                  src={artist.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Meta Content */}
              <div className="p-4 pt-6">
                <h4 className="font-serif text-base font-black tracking-tight text-zinc-900 group-hover:text-red-600 transition-colors dark:text-zinc-50 truncate">
                  {artist.name}
                </h4>
                
                {artist.bio ? (
                  <p className="mt-1.5 font-sans text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 h-8 leading-relaxed">
                    {artist.bio}
                  </p>
                ) : (
                  <p className="mt-1.5 font-sans text-[11px] text-zinc-400 italic">
                    No bio description provided yet. Click to view and write!
                  </p>
                )}

                {/* Info Badges */}
                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-zinc-100 pt-3 text-[10px] text-zinc-450 dark:border-zinc-900">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{artist.hometown || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{(artist.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>

              {/* Slide up interactive icon indicator */}
              <div className="absolute right-4 bottom-4 h-6 w-6 flex items-center justify-center bg-zinc-50 text-zinc-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ARTIST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white border border-zinc-200 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-900">
              <h3 className="font-serif text-base font-black italic text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-red-500" /> NEW GENIUS ARTIST PROFILE
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="rounded-none border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Artist / Band Name *</label>
                <input
                  type="text"
                  placeholder="e.g. David & The Neon Dream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Hometown / Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Berlin, Germany"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Formed In / Years Active</label>
                  <input
                    type="text"
                    placeholder="e.g. 2021 or 2018-Present"
                    value={formedIn}
                    onChange={(e) => setFormedIn(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-xs dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* FILE UPLOADS: AVATAR & BANNER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PHOTO UPLOAD */}
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Artist Photo (File upload)</label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        await handleImageChange(file);
                      }
                    }}
                    className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-850 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3 text-center"
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
                    {imagePreview ? (
                      <div className="flex items-center gap-2 w-full text-left">
                        <img src={imagePreview} alt="Preview" className="h-14 w-14 object-cover border border-zinc-250 dark:border-zinc-800 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-sans text-[10px] font-semibold text-zinc-900 dark:text-zinc-150 truncate">{imageFile?.name || "Compressed avatar"}</p>
                          <p className="font-mono text-[8px] text-zinc-400">JPEG Optimized</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-zinc-400 mb-1 group-hover:text-red-500 transition-colors" />
                        <span className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400">Choose Profile Image</span>
                      </>
                    )}
                  </div>
                </div>

                {/* BANNER UPLOAD */}
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Page Banner (File upload)</label>
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        await handleBannerChange(file);
                      }
                    }}
                    className="group relative flex h-24 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-red-500 hover:bg-zinc-100/50 dark:border-zinc-850 dark:bg-zinc-900/30 dark:hover:border-red-500 transition-all p-3 text-center"
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
                    {bannerPreview ? (
                      <div className="flex items-center gap-2 w-full text-left">
                        <img src={bannerPreview} alt="Preview" className="h-14 w-20 object-cover border border-zinc-250 dark:border-zinc-800 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-sans text-[10px] font-semibold text-zinc-900 dark:text-zinc-150 truncate">{bannerFile?.name || "Compressed banner"}</p>
                          <p className="font-mono text-[8px] text-zinc-400">JPEG Optimized</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-5 w-5 text-zinc-400 mb-1 group-hover:text-red-500 transition-colors" />
                        <span className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400">Choose Header Banner</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Biography & Career Summary</label>
                <textarea
                  rows={4}
                  placeholder="Write a brief biography of the artist's career, key releases, style, and backstories..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-none border border-zinc-200 bg-zinc-50 p-3.5 font-sans text-xs leading-relaxed dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex h-11 items-center justify-center gap-2 rounded-none bg-red-600 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Creating Page..." : "Deploy Artist Biography Page"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
