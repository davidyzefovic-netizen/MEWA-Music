import React, { useState } from "react";
import {
  Users,
  Music,
  AlertTriangle,
  Check,
  X,
  Edit2,
  Trash2,
  Save,
  Shield,
  Mic,
  User as UserIcon,
  Search,
} from "lucide-react";
import { UserProfile, Song, Complaint, UserRole, Banner } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardProps {
  usersProfileList: UserProfile[];
  songs: Song[];
  complaints: Complaint[];
  banners: Banner[];
  onUpdateUserRole: (userId: string, role: UserRole) => Promise<void>;
  onUpdateSongStatus: (songId: string, status: "approved" | "rejected") => Promise<void>;
  onDeleteSong: (songId: string) => Promise<void>;
  onUpdateSongDetails: (songId: string, updatedFields: Partial<Song>) => Promise<void>;
  onUpdateComplaintStatus: (complaintId: string, status: "resolved" | "dismissed") => Promise<void>;
  onAddBanner: (imageUrl: string, linkUrl?: string) => Promise<void>;
  onUpdateBanner: (bannerId: string, isActive: boolean) => Promise<void>;
  onDeleteBanner: (bannerId: string) => Promise<void>;
}

export default function AdminDashboard({
  usersProfileList,
  songs,
  complaints,
  banners,
  onUpdateUserRole,
  onUpdateSongStatus,
  onDeleteSong,
  onUpdateSongDetails,
  onUpdateComplaintStatus,
  onAddBanner,
  onUpdateBanner,
  onDeleteBanner,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "songs" | "complaints" | "banners">("users");
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Banner form states
  const [newBannerImage, setNewBannerImage] = useState<File | null>(null);
  const [newBannerLink, setNewBannerLink] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Filter songs by their pending review status
  const pendingSongs = songs.filter((s) => s.status === "pending");
  const approvedSongs = songs.filter((s) => s.status === "approved");

  // Temporary edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [editLyrics, setEditLyrics] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editGenres, setEditGenres] = useState<string[]>([]);

  const handleBannerUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerImage) return;

    setIsUploadingBanner(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await onAddBanner(base64String, newBannerLink);
        setNewBannerImage(null);
        setNewBannerLink("");
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(newBannerImage);
    } catch (err) {
      console.error(err);
      alert("Failed to upload banner.");
      setIsUploadingBanner(false);
    }
  };

  const startEditing = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album || "");
    setEditLyrics(song.lyrics);
    setEditCoverUrl(song.coverUrl || "");
    setEditGenres(song.genres || []);
  };

  const saveSongEdits = async () => {
    if (!editingSong) return;
    try {
      await onUpdateSongDetails(editingSong.id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
        lyrics: editLyrics,
        coverUrl: editCoverUrl,
        genres: editGenres,
      });
      setEditingSong(null);
    } catch (err) {
      console.error("Failed to update song: ", err);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 pb-28">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-black italic text-zinc-900 dark:text-zinc-50 tracking-tight">
          Admin Dashboard
        </h2>
        <p className="font-serif text-xs italic text-zinc-500 dark:text-zinc-400 mt-1">
          Manage system security, verify track approvals, resolve copyright complaints, and assign user roles.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === "users"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          <Users className="h-4 w-4" /> Users List ({usersProfileList.length})
        </button>
        <button
          onClick={() => setActiveTab("songs")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === "songs"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          <Music className="h-4 w-4" /> Song Verification ({pendingSongs.length} pending)
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === "complaints"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Copyright DMCA ({complaints.filter((c) => c.status === "pending").length} new)
        </button>
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === "banners"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          <Search className="h-4 w-4" /> Banners ({banners.length})
        </button>
      </div>

      {/* Tabs Content */}
      <div className="mt-4">
        {/* TAB 1: USERS */}
        {activeTab === "users" && (
          <div className="rounded-none border border-zinc-200/60 bg-white shadow-sm overflow-hidden dark:border-zinc-850 dark:bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/40">
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User Profile</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role Access</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {usersProfileList.map((prof) => (
                    <tr key={prof.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-3">
                        <img
                          src={prof.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                          alt={prof.displayName}
                          className="h-9 w-9 rounded-none object-cover border border-zinc-100 dark:border-zinc-800"
                        />
                        <span className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {prof.displayName || "Unknown User"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {prof.email}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-none px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                            prof.role === "admin"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                              : prof.role === "author"
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          }`}
                        >
                          {prof.role === "admin" ? (
                            <Shield className="h-3 w-3" />
                          ) : prof.role === "author" ? (
                            <Mic className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                          {prof.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <select
                          value={prof.role}
                          onChange={(e) => onUpdateUserRole(prof.uid, e.target.value as UserRole)}
                          className="rounded-none border border-zinc-200 bg-white px-2 py-1 font-sans text-xs font-semibold text-zinc-700 shadow-sm focus:border-red-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          <option value="user">User</option>
                          <option value="author">Author</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SONG REVIEW AND APPROVALS */}
        {activeTab === "songs" && (
          <div className="space-y-6">
            {/* Review queue */}
            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-none bg-amber-500" /> Pending Song Approvals Queue
              </h3>
              {pendingSongs.length === 0 ? (
                <p className="font-serif text-xs italic text-zinc-400 dark:text-zinc-500 py-4 text-center">
                  No new songs pending admin verification.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex flex-col md:flex-row md:items-center justify-between rounded-none border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-900/10 gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                          alt={song.title}
                          className="h-12 w-12 rounded-none object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                        <div>
                          <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {song.title}
                          </h4>
                          <p className="font-serif text-xs italic text-zinc-500 dark:text-zinc-400">
                            By {song.artist} • Uploaded by {song.authorName || "Author"}
                          </p>
                        </div>
                      </div>

                      {/* Display brief lyrics preview */}
                      <div className="flex-1 max-w-sm px-4">
                        <p className="font-serif text-xs text-zinc-400 line-clamp-2 italic">
                          "{song.lyrics}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => onUpdateSongStatus(song.id, "approved")}
                          className="flex h-8 items-center gap-1.5 rounded-none bg-red-600 px-3 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-sm hover:bg-red-700 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => onUpdateSongStatus(song.id, "rejected")}
                          className="flex h-8 items-center gap-1.5 rounded-none bg-zinc-150 border border-zinc-250 px-3 font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-850 dark:text-zinc-300 dark:border-zinc-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Song Catalog Modifier */}
            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Active Catalog Directory ({approvedSongs.length})
              </h3>
              {approvedSongs.length === 0 ? (
                <p className="font-serif text-xs italic text-zinc-400 py-4 text-center">No songs currently active.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between rounded-none border border-zinc-150 p-3.5 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                          alt={song.title}
                          className="h-11 w-11 rounded-none object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-serif text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {song.title}
                          </h4>
                          <p className="font-serif text-[10px] text-zinc-500 dark:text-zinc-400 truncate italic">
                            {song.artist} • {song.album || "Single"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => startEditing(song)}
                          className="rounded-none p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          title="Edit Details & Lyrics"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSong(song.id)}
                          className="rounded-none p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 cursor-pointer"
                          title="Delete Song"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DMCA COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
            <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Dmca Copyright & Content Reports Queue
            </h3>
            {complaints.length === 0 ? (
              <p className="font-serif text-xs italic text-zinc-400 py-4 text-center">No complaints filed currently.</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`rounded-none border p-4 transition-all ${
                      ticket.status === "pending"
                        ? "border-rose-200 bg-rose-50/30 dark:border-rose-950/30"
                        : "border-zinc-100 bg-zinc-50/40 dark:border-zinc-900/20"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-zinc-100 pb-2.5 dark:border-zinc-900">
                      <div>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-rose-500">
                          Reason: {ticket.reason}
                        </span>
                        <h4 className="mt-0.5 font-serif text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Target Song: {ticket.songTitle} by {ticket.songArtist}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-none px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                            ticket.status === "pending"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">
                          Filed: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <p className="font-semibold text-zinc-950 dark:text-zinc-200">Reporter: {ticket.reporterEmail}</p>
                      <p className="mt-1 font-serif text-xs text-zinc-500 dark:text-zinc-400">
                        {ticket.description}
                      </p>
                    </div>

                    {ticket.status === "pending" && (
                      <div className="mt-3.5 flex gap-2.5">
                        <button
                          onClick={() => onUpdateComplaintStatus(ticket.id, "resolved")}
                          className="flex h-7 items-center gap-1.5 rounded-none bg-red-600 px-3 font-sans text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-700 cursor-pointer"
                        >
                          <Check className="h-3 w-3" /> Resolve (Remove Content)
                        </button>
                        <button
                          onClick={() => onUpdateComplaintStatus(ticket.id, "dismissed")}
                          className="flex h-7 items-center gap-1.5 rounded-none bg-zinc-150 px-3 font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          <X className="h-3 w-3" /> Dismiss Ticket
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BANNERS */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Upload New Banner
              </h3>
              <form onSubmit={handleBannerUpload} className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Banner Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewBannerImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Link URL (Optional)</label>
                  <input
                    type="url"
                    value={newBannerLink}
                    onChange={(e) => setNewBannerLink(e.target.value)}
                    placeholder="e.g. /artist/neon-skyline or https://example.com"
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUploadingBanner || !newBannerImage}
                  className="bg-zinc-900 text-white font-mono text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {isUploadingBanner ? "Uploading..." : "Add Banner"}
                </button>
              </form>
            </div>

            <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
              <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Active & Past Banners
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="border border-zinc-200 p-3 dark:border-zinc-800">
                    <img src={banner.imageUrl} alt="Banner" className="w-full h-32 object-cover mb-3" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={banner.isActive}
                          onChange={(e) => onUpdateBanner(banner.id, e.target.checked)}
                          className="h-4 w-4 accent-red-600"
                        />
                        <span className="text-xs text-zinc-500 font-mono">Active</span>
                      </div>
                      <button
                        onClick={() => onDeleteBanner(banner.id)}
                        className="text-red-600 hover:text-red-700 font-mono text-[10px] font-bold uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT SONG MODAL/FORM OVERLAY */}
      <AnimatePresence>
        {editingSong && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setEditingSong(null)} />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 top-0 z-50 m-auto h-[550px] w-full max-w-xl rounded-none border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900">
                <h3 className="font-serif text-base font-bold italic text-zinc-900 dark:text-zinc-100">
                  Edit Track: {editingSong.title}
                </h3>
                <button
                  onClick={() => setEditingSong(null)}
                  className="rounded-none p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Song Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Artist Name</label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Album Title</label>
                    <input
                      type="text"
                      value={editAlbum}
                      onChange={(e) => setEditAlbum(e.target.value)}
                      className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Song Lyrics (LRC Timed/Plain)</label>
                  <textarea
                    rows={6}
                    value={editLyrics}
                    onChange={(e) => setEditLyrics(e.target.value)}
                    className="w-full rounded-none border border-zinc-200 bg-zinc-50 p-3 font-sans text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-3">
                  <button
                    onClick={() => setEditingSong(null)}
                    className="rounded-none bg-zinc-100 px-4 py-2 font-mono text-[10px] font-bold text-zinc-650 hover:bg-zinc-200 dark:bg-zinc-850 dark:text-zinc-400 uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSongEdits}
                    className="flex items-center gap-1.5 rounded-none bg-red-600 px-4 py-2 font-mono text-[10px] font-bold text-white hover:bg-red-700 uppercase tracking-wider cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
