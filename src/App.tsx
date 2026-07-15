import React, { useState, useEffect } from "react";

import { User } from "./types";
import { auth, loginWithGoogle, logoutUser, db, OperationType, handleFirestoreError, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, increment, query, where, onSnapshot } from "./firebase";
import { Song, Playlist, UserProfile, Complaint, Notification, AppView, UserRole, ArtistProfile, Album } from "./types";
import { INITIAL_SONGS, GENRES_LIST } from "./initialSongs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AudioPlayer from "./components/AudioPlayer";
import SongCard from "./components/SongCard";
import SongRow from "./components/SongRow";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AdminDashboard from "./components/AdminDashboard";
import AuthorPanel from "./components/AuthorPanel";
import ArtistsList from "./components/ArtistsList";
import ArtistProfilePage from "./components/ArtistProfilePage";
import AlbumPage from "./components/AlbumPage";
import CreatorApplication from "./components/CreatorApplication";
import UserProfilePage from "./components/UserProfilePage";
import AuthModal from "./components/AuthModal";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Users,
  ListMusic,
  User as UserIcon,
  Plus,
  Play,
  Heart,
  Music,
  Trash2,
  Download,
  AlertTriangle,
  History,
  Sparkles,
  Info,
  Layers,
  X,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Bell,
  Volume2, Settings2,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [banners, setBanners] = useState<import("./types").Banner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<import("./types").CreatorApplication[]>([]);

  // Player controls state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [playbackMode, setPlaybackMode] = useState<"normal" | "loop" | "loop-one" | "shuffle">("normal");
  const [showQueue, setShowQueue] = useState(false);

  // App layouts & UI states
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableTyping, setEnableTyping] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [downloadedSongs, setDownloadedSongs] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  // My Wave states
  const [showMyWaveSettings, setShowMyWaveSettings] = useState(false);
  const [myWaveMood, setMyWaveMood] = useState<"Любое" | "Бодрое" | "Спокойное" | "Грустное" | "Веселое">("Любое");
  const [myWaveFamiliarity, setMyWaveFamiliarity] = useState<"Любое" | "Незнакомое" | "Любимое" | "Популярное">("Любое");

  // Playlists helper
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistPrivate, setNewPlaylistPrivate] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Complaints helper
  const [selectedComplaintSong, setSelectedComplaintSong] = useState<Song | null>(null);
  const [complaintReason, setComplaintReason] = useState("Copyright infringement");
  const [complaintDesc, setComplaintDesc] = useState("");

  // Sync dark theme on mount and whenever changed
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load offline downloaded songs list from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("downloaded_tracks");
    if (saved) {
      try {
        setDownloadedSongs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync user profile document
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          const isBootstrappedAdmin =
            firebaseUser.email?.toLowerCase() === "davidyzefovic@gmail.com" ||
            firebaseUser.email?.toLowerCase() === "maksimumatov228@gmail.com";

          if (!userSnap.exists()) {
            // New User Registration: Setup default roles
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Music Lover",
              photoURL: firebaseUser.photoURL || "",
              role: isBootstrappedAdmin ? "admin" : "user",
              preferredGenres: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          } else {
            const profileData = userSnap.data() as UserProfile;
            if (isBootstrappedAdmin && profileData.role !== "admin") {
              const updatedProfile = { ...profileData, role: "admin" as UserRole };
              await updateDoc(userDocRef, { role: "admin" });
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(profileData);
            }
          }
        } catch (err) {
          if (err && String(err).includes("Quota")) console.warn("User Profile: Quota exceeded, using offline mode"); else console.error("Failed to sync user profile: ", err);
          // Fallback if offline
          const isBootstrappedAdmin =
            firebaseUser.email?.toLowerCase() === "davidyzefovic@gmail.com" ||
            firebaseUser.email?.toLowerCase() === "maksimumatov228@gmail.com";
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Offline User",
            photoURL: firebaseUser.photoURL || "",
            role: isBootstrappedAdmin ? "admin" : "user",
            preferredGenres: [],
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
        setPlaylists([]);
        setFavorites([]);
        setHistory([]);
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Songs in real-time
  // Load Songs from Server API instead of Firebase
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [songsRes, artistsRes, albumsRes] = await Promise.all([
          fetch('/api/songs'),
          fetch('/api/artists'),
          fetch('/api/albums')
        ]);
        
        if (songsRes.ok) {
          const loadedSongs: Song[] = await songsRes.json();
          // Seed fallback if absolutely empty
          if (loadedSongs.length === 0) {
             setSongs(INITIAL_SONGS);
          } else {
             setSongs(loadedSongs);
          }
        }
        
        if (artistsRes.ok) {
          const loadedArtists = await artistsRes.json();
          setArtists(loadedArtists);
        }

        if (albumsRes.ok) {
          const loadedAlbums = await albumsRes.json();
          setAlbums(loadedAlbums);
        }
      } catch (err) {
        console.error("Failed to fetch catalog from server", err);
      }
    };

    fetchCatalog();
  }, [userProfile]);

  // Listen to Banners in real-time
  useEffect(() => {
    const bannersCol = collection(db, "banners");
    const unsubscribe = onSnapshot(
      bannersCol,
      (snapshot) => {
        const loadedBanners: import("./types").Banner[] = [];
        snapshot.forEach((doc) => {
          loadedBanners.push({ id: doc.id, ...doc.data() } as import("./types").Banner);
        });
        setBanners(loadedBanners);
      },
      (error) => {
        if (error && String(error).includes("Quota")) console.warn("Banners: Quota exceeded"); else console.error("Failed to fetch banners: ", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Banners still from firebase (optional)

  // Listen to user-specific data (Playlists, Favorites, History, Complaints, Notifications)
  useEffect(() => {
    if (!user) return;

    // 1. Playlists
    const plQuery = query(collection(db, "playlists"), where("ownerId", "==", user.uid));
    const unsubPlaylists = onSnapshot(plQuery, (snap) => {
      const list: Playlist[] = [];
      snap.forEach((d) => list.push(d.data() as Playlist));
      setPlaylists(list);
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("Playlists: Quota exceeded"); else console.error("playlists snapshot error", err); setPlaylists([]); });

    // 2. Favorites subcollection
    const favCol = collection(db, "users", user.uid, "favorites");
    const unsubFavs = onSnapshot(favCol, (snap) => {
      const list: string[] = [];
      snap.forEach((d) => {
        list.push(d.data().songId);
      });
      setFavorites(list);
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("Favs: Quota exceeded"); else console.error("favs snapshot error", err); setFavorites([]); });

    // 3. Playback History log
    const histQuery = query(collection(db, "listeningHistory"), where("userId", "==", user.uid));
    const unsubHistory = onSnapshot(histQuery, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      setHistory(list.sort((a, b) => b.playedAt.localeCompare(a.playedAt)));
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("History: Quota exceeded"); else console.error("history snapshot error", err); setHistory([]); });

    // 4. Notifications
    const notifQuery = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const unsubNotifs = onSnapshot(notifQuery, (snap) => {
      const list: Notification[] = [];
      snap.forEach((d) => list.push(d.data() as Notification));
      setNotifications(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("Notifs: Quota exceeded"); else console.error("notifs snapshot error", err); setNotifications([]); });

    return () => {
      unsubPlaylists();
      unsubFavs();
      unsubHistory();
      unsubNotifs();
    };
  }, [user]);

  // Listen to Admin-only collections (Users & Complaints)
  useEffect(() => {
    if (!userProfile || userProfile.role !== "admin") {
      setAllUsers([]);
      setComplaints([]);
      return;
    }

    // 1. All Users (to assign roles)
    const usersCol = collection(db, "users");
    const unsubUsers = onSnapshot(usersCol, (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setAllUsers(list);
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("Users: Quota exceeded"); else console.error("users snapshot error", err); setAllUsers([]); });

    // 2. Complaints queue
    const complaintsCol = collection(db, "complaints");
    const unsubComplaints = onSnapshot(complaintsCol, (snap) => {
      const list: Complaint[] = [];
      snap.forEach((d) => list.push(d.data() as Complaint));
      setComplaints(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("Complaints: Quota exceeded"); else console.error("complaints snapshot error", err); setComplaints([]); });

    // 3. Creator Applications
    const creatorAppsCol = collection(db, "creator_applications");
    const unsubCreatorApps = onSnapshot(creatorAppsCol, (snap) => {
      const list: import("./types").CreatorApplication[] = [];
      snap.forEach((d) => list.push(d.data() as import("./types").CreatorApplication));
      setCreatorApplications(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (err) => { if (err && String(err).includes("Quota")) console.warn("CreatorApps: Quota exceeded"); else console.error("creator apps snapshot error", err); setCreatorApplications([]); });

    return () => {
      unsubUsers();
      unsubComplaints();
      unsubCreatorApps();
    };
  }, [userProfile]);

  // Handle Song play
  const handlePlaySong = (song: Song, contextQueue?: Song[]) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      const activeGroup = contextQueue || songs.filter((s) => s.status === "approved");
      const currentIndex = activeGroup.findIndex((s) => s.id === song.id);
      const newQueue = activeGroup.slice(currentIndex + 1);
      setOriginalQueue(activeGroup);
      
      if (playbackMode === "shuffle") {
        setQueue([...newQueue].sort(() => Math.random() - 0.5));
      } else {
        setQueue(newQueue);
      }
    }
  };

  const handleNextSong = () => {
    if (playbackMode === "loop-one" && currentSong) {
      const el = document.querySelector("audio");
      if (el) {
        el.currentTime = 0;
        el.play();
      }
      setIsPlaying(true);
      return;
    }

    if (queue.length > 0) {
      const next = queue[0];
      setCurrentSong(next);
      setQueue(queue.slice(1));
      setIsPlaying(true);
    } else {
      if (playbackMode === "loop" && originalQueue.length > 0) {
        const next = originalQueue[0];
        setCurrentSong(next);
        setQueue(originalQueue.slice(1));
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handlePrevSong = () => {
    if (audioRefCurrentTime() > 3) {
      audioSeekTo(0);
    } else {
      if (currentSong) {
        const idx = originalQueue.findIndex((s) => s.id === currentSong.id);
        if (idx > 0) {
          const prev = originalQueue[idx - 1];
          setCurrentSong(prev);
          let newQ = originalQueue.slice(idx);
          if (playbackMode === "shuffle") {
            newQ = [...newQ].sort(() => Math.random() - 0.5);
          }
          setQueue(newQ);
          setIsPlaying(true);
        } else if (playbackMode === "loop" && originalQueue.length > 0) {
          const prev = originalQueue[originalQueue.length - 1];
          setCurrentSong(prev);
          setQueue([]);
          setIsPlaying(true);
        }
      }
    }
  };

  const audioRefCurrentTime = () => {
    const el = document.querySelector("audio");
    return el ? el.currentTime : 0;
  };

  const audioSeekTo = (secs: number) => {
    const el = document.querySelector("audio");
    if (el) el.currentTime = secs;
  };

  // Triggered when listener streams song successfully (15+ seconds or 50% song elapsed)
  const handleIncrementPlay = async (songId: string) => {
    if (!user) return;

    try {
      // 1. Update tracks database total count
      const songDocRef = doc(db, "songs", songId);
      await updateDoc(songDocRef, {
        listensCount: increment(1),
      });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, listensCount: (s.listensCount || 0) + 1 } : s));

      // 2. Insert tracking log to listeningHistory
      const logId = `${user.uid}_${songId}_${Date.now()}`;
      await setDoc(doc(db, "listeningHistory", logId), {
        id: logId,
        userId: user.uid,
        songId,
        playedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Increment plays tracker failed: ", err);
    }
  };

  // Auth Modal wrapper
  const handleSignIn = async () => {
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentSong(null);
    setIsPlaying(false);
  };

  // Favorites Toggler
  const handleToggleFavorite = async (songId: string) => {
    if (!user) {
      await handleSignIn();
      return;
    }

    const favDocRef = doc(db, "users", user.uid, "favorites", songId);
    try {
      if (favorites.includes(songId)) {
        await deleteDoc(favDocRef);
        // decrement likesCount on song
        await updateDoc(doc(db, "songs", songId), {
          likesCount: increment(-1),
        });
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) - 1) } : s));
      } else {
        await setDoc(favDocRef, {
          userId: user.uid,
          songId,
          createdAt: new Date().toISOString(),
        });
        // increment likesCount on song
        await updateDoc(doc(db, "songs", songId), {
          likesCount: increment(1),
        });
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, likesCount: (s.likesCount || 0) + 1 } : s));
      }
    } catch (err) {
      console.error("Failed toggle favorite: ", err);
    }
  };

  // Offline download toggler (local simulation)
  const handleToggleDownload = (songId: string) => {
    let list = [...downloadedSongs];
    if (list.includes(songId)) {
      list = list.filter((id) => id !== songId);
    } else {
      list.push(songId);
    }
    setDownloadedSongs(list);
    localStorage.setItem("downloaded_tracks", JSON.stringify(list));
  };

  // Create Custom Playlist
  const handleCreatePlaylist = async () => {
    if (!user) return;
    if (!newPlaylistName.trim()) return;

    const plId = `pl_${Date.now()}`;
    const playlistDocRef = doc(db, "playlists", plId);

    try {
      await setDoc(playlistDocRef, {
        id: plId,
        name: newPlaylistName,
        ownerId: user.uid,
        songIds: [],
        isPrivate: newPlaylistPrivate,
        createdAt: new Date().toISOString(),
      });
      setNewPlaylistName("");
      setShowCreatePlaylistModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Add song to selected playlist
  const handleAddSongToPlaylist = async (playlistId: string, songId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    if (pl.songIds.includes(songId)) return;

    const updated = [...pl.songIds, songId];
    try {
      await updateDoc(doc(db, "playlists", playlistId), {
        songIds: updated,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId: string, songId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const updated = pl.songIds.filter((id) => id !== songId);
    try {
      await updateDoc(doc(db, "playlists", playlistId), {
        songIds: updated,
      });
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist({ ...selectedPlaylist, songIds: updated });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle offline mode for playlist
  const handleTogglePlaylistOffline = (playlist: Playlist, toggleOn: boolean) => {
    let dlList = [...downloadedSongs];
    playlist.songIds.forEach((sid) => {
      if (toggleOn && !dlList.includes(sid)) {
        dlList.push(sid);
      } else if (!toggleOn) {
        dlList = dlList.filter((id) => id !== sid);
      }
    });
    setDownloadedSongs(dlList);
    localStorage.setItem("downloaded_tracks", JSON.stringify(dlList));
  };

  // Admin and Creator modifications
  const handleUpdateUserRole = async (userId: string, targetRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: targetRole,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Approve / Reject uploaded song
  const handleUpdateSongStatus = async (songId: string, targetStatus: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "songs", songId), {
        status: targetStatus,
      });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, status: targetStatus } : s));

      // If approved, notify followers/favoriters of this artist/creator!
      if (targetStatus === "approved") {
        const approvedSong = songs.find((s) => s.id === songId);
        if (approvedSong) {
          // Identify users that might like this artist or have matching preferred genres
          const artistName = approvedSong.artist;
          // Loop through active users or simply trigger a general notification
          // We create system-wide notifications for active users (or current users as a demo)
          allUsers.forEach(async (usr) => {
            const notifId = `notif_${usr.uid}_${Date.now()}`;
            await setDoc(doc(db, "notifications", notifId), {
              id: notifId,
              userId: usr.uid,
              title: "New Release Approved! 🎵",
              message: `${artistName} released a new track: '${approvedSong.title}' in ${approvedSong.genres?.join(", ")}!`,
              read: false,
              createdAt: new Date().toISOString(),
            });
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await deleteDoc(doc(db, "songs", songId));
      if (currentSong?.id === songId) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSongDetails = async (songId: string, updatedFields: Partial<Song>) => {
    try {
      await updateDoc(doc(db, "songs", songId), updatedFields);
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updatedFields } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBanner = async (imageUrl: string, linkUrl?: string) => {
    try {
      const newBanner = {
        imageUrl,
        linkUrl: linkUrl || "",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "banners"), newBanner);
    } catch (err) {
      console.error(err);
      alert("Failed to add banner");
    }
  };

  const handleUpdateBanner = async (bannerId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "banners", bannerId), { isActive });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteDoc(doc(db, "banners", bannerId));
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Author Track (Creator Studio)
  const handleUploadSongByCreator = async (songData: any): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    const songId = `song_${Date.now()}`;

    // Admin uploads are auto-approved, author uploads start as pending
    const status = userProfile?.role === "admin" ? "approved" : "pending";

    try {
      const newSong = {
        ...songData,
        id: songId,
        uploadedBy: user.uid,
        authorName: user.displayName || "Original Creator",
        status,
        listensCount: 0,
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "songs", songId), newSong);
      setSongs(prev => [newSong, ...prev]);
      return songId;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Artist profiles CRUD & lookup handlers
  const handleCreateArtistProfile = async (artistData: Omit<ArtistProfile, "views" | "createdAt">) => {
    if (!user) throw new Error("Authentication required");
    try {
      const newArtist = {
        ...artistData,
        views: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "artists", artistData.id), newArtist);
      setArtists(prev => [newArtist, ...prev]);
    } catch (err) {
      console.error("Failed to create artist profile:", err);
      throw err;
    }
  };

  const handleUpdateArtistProfile = async (artistId: string, updatedFields: Partial<ArtistProfile>) => {
    try {
      await updateDoc(doc(db, "artists", artistId), updatedFields);
      setArtists(prev => prev.map(a => a.id === artistId ? { ...a, ...updatedFields } : a));
    } catch (err) {
      console.error("Failed to update artist profile:", err);
      throw err;
    }
  };

  const handleDeleteArtistProfile = async (artistId: string) => {
    try {
      await deleteDoc(doc(db, "artists", artistId));
      if (selectedArtist?.id === artistId) {
        setSelectedArtist(null);
        setCurrentView("artists");
      }
    } catch (err) {
      console.error("Failed to delete artist profile:", err);
      throw err;
    }
  };

  // Albums CRUD handlers
  const handleCreateAlbum = async (albumData: Omit<Album, "id" | "createdAt" | "createdBy">) => {
    if (!user) throw new Error("Authentication required");
    const albumId = `album_${Date.now()}`;
    try {
      await setDoc(doc(db, "albums", albumId), {
        ...albumData,
        id: albumId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      return albumId;
    } catch (err) {
      console.error("Failed to create album:", err);
      throw err;
    }
  };

  const handleUpdateAlbum = async (albumId: string, updatedFields: Partial<Album>) => {
    try {
      await updateDoc(doc(db, "albums", albumId), updatedFields);
      setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...updatedFields } : a));
    } catch (err) {
      console.error("Failed to update album:", err);
      throw err;
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      await deleteDoc(doc(db, "albums", albumId));
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(null);
        setCurrentView("artists");
      }
    } catch (err) {
      console.error("Failed to delete album:", err);
      throw err;
    }
  };

  const handleViewAlbum = (albumId: string) => {
    const found = albums.find((a) => a.id === albumId);
    if (found) {
      setSelectedAlbum(found);
      setCurrentView("album");
    }
  };

  const handleIncrementArtistViews = async (artistId: string) => {
    try {
      await updateDoc(doc(db, "artists", artistId), {
        views: increment(1),
      });
    } catch (err) {
      console.error("Failed to increment views:", err);
    }
  };

  const handleViewArtistByName = (artistName: string) => {
    const found = artists.find((art) => art.name.toLowerCase() === artistName.toLowerCase());
    if (found) {
      setSelectedArtist(found);
      setCurrentView("artist");
      handleIncrementArtistViews(found.id);
    } else {
      setCurrentView("artists");
      alert(`The Artist profile page for "${artistName}" hasn't been created yet. You can create it now!`);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "creator_applications", appId), {
        status,
      });

      const application = creatorApplications.find(a => a.id === appId);
      if (application && status === "approved") {
        await handleUpdateUserRole(application.userId, "author");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: "resolved" | "dismissed") => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status,
      });

      // If resolved, we auto-delete/retract the offending track!
      if (status === "resolved") {
        const ticket = complaints.find((c) => c.id === complaintId);
        if (ticket) {
          await handleDeleteSong(ticket.songId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit DMCA Complaint
  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedComplaintSong) return;

    const compId = `dmca_${Date.now()}`;
    try {
      await setDoc(doc(db, "complaints", compId), {
        id: compId,
        songId: selectedComplaintSong.id,
        songTitle: selectedComplaintSong.title,
        songArtist: selectedComplaintSong.artist,
        reporterId: user.uid,
        reporterEmail: user.email || "anonymous",
        reason: complaintReason,
        description: complaintDesc,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setComplaintDesc("");
      setSelectedComplaintSong(null);
      alert("DMCA report ticket submitted successfully. Administrators will review this shortly.");
    } catch (err) {
      console.error(err);
    }
  };

  // Clear user notifications
  const handleClearAllNotifications = async () => {
    if (!user) return;
    notifications.forEach(async (n) => {
      await deleteDoc(doc(db, "notifications", n.id));
    });
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Preferred Genres settings (Recommendations system)
  const handleGenrePrefToggle = async (genre: string) => {
    if (!user || !userProfile) return;
    let list = [...(userProfile.preferredGenres || [])];
    if (list.includes(genre)) {
      list = list.filter((g) => g !== genre);
    } else {
      list.push(genre);
    }
    try {
      await updateDoc(doc(db, "users", user.uid), {
        preferredGenres: list,
      });
      setUserProfile({ ...userProfile, preferredGenres: list });
    } catch (err) {
      console.error(err);
    }
  };

  // Filters songs to display
  const approvedSongsOnly = songs.filter((s) => s.status === "approved");

  // Filter songs based on current view criteria
  const getFilteredSongs = (): Song[] => {
    if (currentView === "home") {
      let filtered = approvedSongsOnly;
      if (selectedGenre !== "All") {
        filtered = filtered.filter((s) => s.genres?.includes(selectedGenre));
      }
      return filtered;
    }

    if (currentView === "favorites") {
      return approvedSongsOnly.filter((s) => favorites.includes(s.id));
    }

    if (currentView === "search") {
      if (!searchQuery.trim()) return approvedSongsOnly;
      const q = searchQuery.toLowerCase();
      return approvedSongsOnly.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.featuredArtists?.some((fa) => fa.toLowerCase().includes(q)) ||
          s.genres?.some((g) => g.toLowerCase().includes(q)) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (currentView === "recommendations") {
      const prefs = userProfile?.preferredGenres || [];
      if (prefs.length === 0) return approvedSongsOnly; // default fallback
      return approvedSongsOnly.filter((s) => s.genres?.some((g) => prefs.includes(g)));
    }

    return approvedSongsOnly;
  };

  const filteredSongsToDisplay = getFilteredSongs();

  return (
    <div className={`flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 text-zinc-900 transition-colors ${darkMode ? "dark" : ""}`}>
      {/* HEADER BANNER */}
      <Header
        user={user}
        userProfile={userProfile}
        onLogin={handleSignIn}
        onLogout={handleSignOut}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentView={currentView}
        setCurrentView={setCurrentView}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearAllNotifications}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        enableAnimations={enableAnimations}
        setEnableAnimations={setEnableAnimations}
        enableTyping={enableTyping}
        setEnableTyping={setEnableTyping}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          userProfile={userProfile}
          onLogin={handleSignIn}
          isCollapsed={!showRightPanel}
        />

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-zinc-900 flex flex-col transition-colors pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: enableAnimations ? 0.2 : 0 }}
              className="flex-1 overflow-y-auto flex flex-col"
            >
              {/* Subheader Filters for Home view only */}
              {currentView === "home" && (
                <>
                  {/* BANNERS CAROUSEL */}
              {banners.filter(b => b.isActive).length > 0 && (
                <div className="w-full flex gap-4 overflow-x-auto px-6 py-6 border-b border-zinc-100 dark:border-zinc-800 scrollbar-none snap-x">
                  {banners.filter(b => b.isActive).map(banner => (
                    <a
                      key={banner.id}
                      href={banner.linkUrl || "#"}
                      target={banner.linkUrl ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-[300px] h-[140px] md:w-[450px] md:h-[200px] snap-center overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity"
                    >
                      <img src={banner.imageUrl} alt="Promo Banner" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {/* MY WAVE BUTTON */}
              {userProfile && (
                <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="relative w-full h-[250px] md:h-[350px] overflow-hidden bg-zinc-950 flex flex-col items-center justify-center group cursor-pointer border border-zinc-200/50 dark:border-zinc-800 shadow-xl"
                       onClick={() => {
                          let myWaveSongs = songs.filter(s => s.status === "approved");
                          
                          // Filter by Familiarity
                          if (myWaveFamiliarity === "Незнакомое") {
                            const playedSongIds = history.map(h => h.songId);
                            const unfamiliar = myWaveSongs.filter(s => !playedSongIds.includes(s.id));
                            if (unfamiliar.length > 0) myWaveSongs = unfamiliar;
                          } else if (myWaveFamiliarity === "Любимое") {
                            const favAndHistory = [...favorites, ...history.map(h => h.songId)];
                            const familiar = myWaveSongs.filter(s => favAndHistory.includes(s.id));
                            if (familiar.length > 0) myWaveSongs = familiar;
                          } else if (myWaveFamiliarity === "Популярное") {
                            const sorted = [...myWaveSongs].sort((a, b) => (b.listensCount + b.likesCount) - (a.listensCount + a.likesCount));
                            myWaveSongs = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 2)));
                          }

                          // Filter by Mood
                          if (myWaveMood !== "Любое") {
                            let moodGenres: string[] = [];
                            if (myWaveMood === "Бодрое") moodGenres = ["Electronic", "Hip Hop", "Rock", "Pop", "Metal"];
                            if (myWaveMood === "Спокойное") moodGenres = ["Classical", "Jazz", "Ambient", "Acoustic"];
                            if (myWaveMood === "Грустное") moodGenres = ["Blues", "Alternative", "Indie"];
                            if (myWaveMood === "Веселое") moodGenres = ["Pop", "Disco", "Funk", "Dance"];
                            
                            const matchedMood = myWaveSongs.filter(s => s.genres.some(g => moodGenres.includes(g)));
                            if (matchedMood.length > 0) myWaveSongs = matchedMood;
                          } else if (userProfile.preferredGenres.length > 0) {
                            const matched = myWaveSongs.filter(s => s.genres.some(g => userProfile.preferredGenres.includes(g)));
                            if (matched.length > 0) myWaveSongs = matched;
                          }

                          if (myWaveSongs.length > 0) {
                            const randomSong = myWaveSongs[Math.floor(Math.random() * myWaveSongs.length)];
                            handlePlaySong(randomSong, myWaveSongs);
                          }
                       }}
                  >
                    {/* Glowing background effect matching site colors (red/dark) */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-red-600/30 via-zinc-950 to-red-900/30 blur-3xl opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent opacity-50 blur-2xl group-hover:opacity-80 transition-opacity duration-700" />
                    
                    {/* Concentric rings to simulate waves */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-red-500/10 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 ease-out" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-red-500/5 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 delay-100 ease-out" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                      <div className="flex items-center gap-4 text-white">
                        <Play className="w-12 h-12 md:w-16 md:h-16 fill-white drop-shadow-xl" />
                        <h2 className="font-serif text-5xl md:text-6xl font-black tracking-tight drop-shadow-2xl">Моя волна</h2>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMyWaveSettings(true);
                        }}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-6 py-2.5 rounded-full font-sans text-xs md:text-sm font-semibold tracking-wide transition-colors"
                      >
                        <Settings2 className="w-4 h-4" /> Настроить
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex h-14 items-center gap-2.5 overflow-x-auto border-b border-zinc-100 px-6 shrink-0 dark:border-zinc-800 scrollbar-none">
                {GENRES_LIST.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`rounded-none border px-4 py-1.5 font-sans text-[11px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                      selectedGenre === genre
                        ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white"
                        : "bg-transparent text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-950"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </>
          )}

              {/* VIEW: HOME, SEARCH, FAVORITES */}
          {(currentView === "home" || currentView === "search" || currentView === "favorites") && (
            <div className="p-6 pb-28 flex-1">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-black italic text-zinc-950 dark:text-zinc-50 tracking-tight capitalize">
                    {currentView === "home"
                      ? `${selectedGenre} Music Explorer`
                      : currentView === "search"
                      ? `Search results for: "${searchQuery}"`
                      : "My Favorite Tracks Collection"}
                  </h3>
                  <p className="font-serif text-xs italic text-zinc-400 mt-1">
                    {currentView === "home"
                      ? "Browse authorized releases, synchronize active lyrics and bookmark files."
                      : currentView === "search"
                      ? `Found ${filteredSongsToDisplay.length} songs matching query.`
                      : `You have bookmarked ${favorites.length} melodies.`}
                  </p>
                </div>
              </div>

              {filteredSongsToDisplay.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-none p-8">
                  <Music className="h-16 w-16 text-red-500/40 animate-pulse" />
                  <p className="mt-4 font-serif text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    No songs found here
                  </p>
                  <p className="max-w-xs font-serif text-xs italic text-zinc-400 mt-1">
                    Try another genre, modify your search terms, or contribute original songs in Creator Studio!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                  {filteredSongsToDisplay.map((song, idx) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onPlay={(s) => handlePlaySong(s, filteredSongsToDisplay)}
                      favorites={favorites}
                      onToggleFavorite={handleToggleFavorite}
                      playlists={playlists}
                      onAddSongToPlaylist={handleAddSongToPlaylist}
                      downloadedSongs={downloadedSongs}
                      onToggleDownload={handleToggleDownload}
                      onReportSong={(s) => setSelectedComplaintSong(s)}
                      onSelectArtist={handleViewArtistByName}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: RECENTLY PLAYED */}
          {currentView === "history" && (
            <div className="p-6 pb-28 flex flex-col">
              <div className="mb-5">
                <h3 className="font-serif text-2xl font-black italic text-zinc-950 dark:text-zinc-50 tracking-tight">
                  Recently Played History
                </h3>
                <p className="font-serif text-xs italic text-zinc-400 mt-1">
                  Detailed timeline logs of music played during recent days and weeks.
                </p>
              </div>

              {!user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-none p-8">
                  <History className="h-14 w-14 text-zinc-300 mb-4" />
                  <p className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    Playback history requires profile sync
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="mt-3.5 rounded-none bg-red-600 px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700"
                  >
                    Sync Profile Now
                  </button>
                </div>
              ) : history.length === 0 ? (
                <p className="font-serif text-xs italic text-zinc-400 dark:text-zinc-500 text-center py-12">
                  No playback history recorded yet. Put on some tunes!
                </p>
              ) : (
                <div className="max-w-2xl space-y-3.5">
                  {history.map((log) => {
                    const song = songs.find((s) => s.id === log.songId);
                    if (!song) return null;
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-none border border-zinc-150 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                            alt={song.title}
                            className="h-12 w-12 rounded-none object-cover border border-zinc-250 dark:border-zinc-850"
                          />
                          <div>
                            <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {song.title}
                            </h4>
                            <p className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <span className="font-mono text-[9px] text-zinc-450 uppercase tracking-wider block">
                              Last Played:
                            </span>
                            <span className="block font-sans text-[11px] font-semibold text-zinc-650 dark:text-zinc-400">
                              {new Date(log.playedAt).toLocaleDateString()} {new Date(log.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePlaySong(song, history.map(l => songs.find(s => s.id === l.songId)).filter(Boolean))}
                            className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-colors"
                          >
                            <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: SMART RECOMMENDATIONS ("For You") */}
          {currentView === "recommendations" && (
            <div className="p-6 pb-28 flex flex-col">
              <div className="mb-5">
                <h3 className="font-serif text-2xl font-black italic text-zinc-950 dark:text-zinc-50 tracking-tight">
                  Smart Recommendations For You
                </h3>
                <p className="font-serif text-xs italic text-zinc-400 mt-1">
                  Personalized feed customized based on your favorite genre preferences.
                </p>
              </div>

              {!user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-none p-8">
                  <Sparkles className="h-14 w-14 text-zinc-300 mb-4" />
                  <p className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    Recommendations require signing in
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="mt-3.5 rounded-none bg-red-600 px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Genre preference settings widget */}
                  <div className="rounded-none border border-red-500/10 bg-red-500/2 p-5 dark:bg-red-500/1">
                    <h4 className="font-serif text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">
                      Configure your genre preferences
                    </h4>
                    <p className="font-serif text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 italic">
                      Toggle the styles you enjoy to feed our recommender system.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {GENRES_LIST.filter((g) => g !== "All").map((genre) => {
                        const isPref = (userProfile?.preferredGenres || []).includes(genre);
                        return (
                          <button
                            key={genre}
                            onClick={() => handleGenrePrefToggle(genre)}
                            className={`rounded-none border px-3.5 py-1 font-sans text-[11px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${
                              isPref
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-transparent text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendation Grid */}
                  <div>
                    <h4 className="font-serif text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5">
                      Matches based on preferred genres
                    </h4>
                    {filteredSongsToDisplay.length === 0 ? (
                      <p className="font-serif text-xs text-zinc-400 dark:text-zinc-500 italic py-4">
                        Choose some preferred genres above to see recommendations!
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {filteredSongsToDisplay.map((song) => (
                          <SongCard
                            key={song.id}
                            song={song}
                            isPlaying={isPlaying}
                            isCurrent={currentSong?.id === song.id}
                            onPlay={(s) => handlePlaySong(s, filteredSongsToDisplay)}
                            favorites={favorites}
                            onToggleFavorite={handleToggleFavorite}
                            playlists={playlists}
                            onAddSongToPlaylist={handleAddSongToPlaylist}
                            downloadedSongs={downloadedSongs}
                            onToggleDownload={handleToggleDownload}
                            onReportSong={(s) => setSelectedComplaintSong(s)}
                            onSelectArtist={handleViewArtistByName}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: PLAYLISTS MANAGEMENT */}
          {currentView === "playlists" && (
            <div className="p-6 pb-28 flex flex-col">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-black italic text-zinc-950 dark:text-zinc-50 tracking-tight">
                    My Custom Playlists
                  </h3>
                  <p className="font-serif text-xs italic text-zinc-400 mt-1">
                    Create playlists and sync them for seamless offline listening.
                  </p>
                </div>
                {user && (
                  <button
                    onClick={() => setShowCreatePlaylistModal(true)}
                    className="flex h-10 items-center gap-1.5 rounded-none bg-zinc-950 px-5 font-sans text-[11px] md:text-[10px] uppercase tracking-widest font-bold text-white shadow-sm dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white"
                  >
                    <Plus className="h-4 w-4" /> Create Playlist
                  </button>
                )}
              </div>

              {!user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-none p-8">
                  <Layers className="h-14 w-14 text-zinc-300 mb-4" />
                  <p className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    Playlists require profile sync
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="mt-3.5 rounded-none bg-red-600 px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700"
                  >
                    Sign In Now
                  </button>
                </div>
              ) : selectedPlaylist ? (
                /* PLAYLIST INSIDE VIEW */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 gap-4">
                    <div>
                      <button
                        onClick={() => setSelectedPlaylist(null)}
                        className="font-serif text-xs font-bold text-red-600 hover:underline mb-1 flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to lists
                      </button>
                      <h4 className="font-serif text-xl font-bold text-zinc-900 dark:text-white">
                        {selectedPlaylist.name}
                      </h4>
                      <p className="font-serif text-xs italic text-zinc-400 mt-0.5">
                        Contains {selectedPlaylist.songIds?.length || 0} track assets.
                      </p>
                    </div>

                    {/* Offline sync toggle */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] md:text-[10px] uppercase tracking-wider text-zinc-500">Offline Sync:</span>
                      <button
                        onClick={() => {
                          const anyNotInLocal = selectedPlaylist.songIds.some((id) => !downloadedSongs.includes(id));
                          handleTogglePlaylistOffline(selectedPlaylist, anyNotInLocal);
                        }}
                        className={`flex h-8 items-center gap-1.5 rounded-none px-3.5 font-sans text-[11px] md:text-[10px] uppercase tracking-wider font-bold shadow-sm transition-all ${
                          selectedPlaylist.songIds.every((id) => downloadedSongs.includes(id)) && selectedPlaylist.songIds.length > 0
                            ? "bg-red-600 text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {selectedPlaylist.songIds.every((id) => downloadedSongs.includes(id)) && selectedPlaylist.songIds.length > 0
                          ? "Synced Offline"
                          : "Download All"}
                      </button>
                    </div>
                  </div>

                  {/* Songs list inside playlist */}
                  <div className="max-w-3xl space-y-3">
                    {selectedPlaylist.songIds?.length === 0 ? (
                      <p className="font-serif text-xs text-zinc-400 py-6 italic text-center">
                        This playlist is empty. Add songs by hover dropdown menu on tracks!
                      </p>
                    ) : (
                      selectedPlaylist.songIds.map((sid) => {
                        const song = songs.find((s) => s.id === sid);
                        if (!song) return null;
                        return (
                          <div
                            key={song.id}
                            className="flex items-center justify-between rounded-none border border-zinc-100 p-3 hover:bg-zinc-50/50 dark:border-zinc-900"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                                alt={song.title}
                                className="h-10 w-10 rounded-none object-cover border border-zinc-200 dark:border-zinc-800"
                              />
                              <div>
                                <h4 className="font-serif text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  {song.title}
                                </h4>
                                <p className="font-sans text-[11px] md:text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {song.artist}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePlaySong(song, selectedPlaylist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean))}
                                className="rounded-none p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600"
                              >
                                <Play className="h-4 w-4 fill-current ml-0.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveSongFromPlaylist(selectedPlaylist.id, song.id)}
                                className="rounded-none p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                                title="Remove from playlist"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* GRID OF PLAYLISTS */
                <div>
                  {playlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
                      <Layers className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                      <p className="font-serif text-sm font-bold text-zinc-950 dark:text-zinc-200">
                        Create your first list
                      </p>
                      <button
                        onClick={() => setShowCreatePlaylistModal(true)}
                        className="mt-3 rounded-none bg-red-600 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm"
                      >
                        New Playlist
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {playlists.map((pl) => (
                        <div
                          key={pl.id}
                          className="group relative cursor-pointer rounded-none border border-zinc-200/60 bg-white p-5 hover:border-zinc-300 dark:border-zinc-850 dark:bg-zinc-950 hover:shadow-md transition-all"
                          onClick={() => setSelectedPlaylist(pl)}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-none bg-red-500/10 text-red-500 mb-4">
                            <Layers className="h-6 w-6" />
                          </div>
                          <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {pl.name}
                          </h4>
                          <p className="font-serif text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 italic">
                            {pl.songIds?.length || 0} track elements • {pl.isPrivate ? "Private" : "Public"}
                          </p>

                          <div className="absolute bottom-5 right-5 flex h-8 w-8 items-center justify-center rounded-none bg-zinc-50 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white dark:bg-zinc-900 transition-all">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW: CREATOR APPLICATION */}
          {currentView === "apply-creator" && (
            <CreatorApplication
              userProfile={userProfile}
              onApply={async (details) => {
                if (!userProfile) throw new Error("Not logged in");
                const appId = `app_${Date.now()}_${userProfile.uid}`;
                await setDoc(doc(db, "creator_applications", appId), {
                  id: appId,
                  userId: userProfile.uid,
                  userEmail: userProfile.email,
                  artistName: details.artistName,
                  links: details.links,
                  description: details.description,
                  status: "pending",
                  createdAt: new Date().toISOString()
                });
              }}
            />
          )}

          {/* VIEW: COMPLAINTS & REPORT DMCA LIST */}
          {currentView === "complaints" && (
            <div className="p-6 pb-28 flex flex-col">
              <div className="mb-5">
                <h3 className="font-sans text-lg font-extrabold text-zinc-950 dark:text-zinc-50">
                  Copyright & Content Complaints
                </h3>
                <p className="font-sans text-xs text-zinc-400">
                  Submit DMCA claims or copyright infringement notifications for songs violating guidelines.
                </p>
              </div>

              {!user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertTriangle className="h-14 w-14 text-zinc-300" />
                  <p className="mt-4 font-sans text-sm font-bold text-zinc-900 dark:text-zinc-200">
                    Complaints system requires login
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="mt-3.5 rounded-full bg-emerald-500 px-5 py-2 font-sans text-xs font-bold text-white shadow-sm"
                  >
                    Sync Auth Now
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl space-y-6">
                  {/* General complaints instruction */}
                  <div className="rounded-2xl border border-rose-500/15 bg-rose-500/2 p-4.5 dark:border-rose-950/30">
                    <h4 className="font-sans text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" /> Intellectual Property Notice
                    </h4>
                    <p className="mt-1 font-sans text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      To file a claim, select the song from the music cards' dropdown menus and select 'Report DMCA' to automatically link the song reference. All tickets are reviewed manually by MeloLyrics administrators.
                    </p>
                  </div>

                  {/* Filed tickets lists */}
                  <div>
                    <h4 className="font-sans text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                      My Submitted Tickets History
                    </h4>
                    {complaints.filter((c) => c.reporterId === user.uid).length === 0 ? (
                      <p className="font-sans text-xs text-zinc-400 italic py-2">
                        You have not submitted any content complaints.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {complaints
                          .filter((c) => c.reporterId === user.uid)
                          .map((ticket) => (
                            <div
                              key={ticket.id}
                              className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/30"
                            >
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
                                <div>
                                  <span className="font-mono text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                                    {ticket.reason}
                                  </span>
                                  <h5 className="font-sans text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                                    {ticket.songTitle} by {ticket.songArtist}
                                  </h5>
                                </div>
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="mt-2 font-sans text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {ticket.description}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ARTISTS DIRECTORY */}
          {currentView === "artists" && (
            <ArtistsList
              artists={artists}
              userProfile={userProfile}
              onSelectArtist={(artist) => {
                setSelectedArtist(artist);
                setCurrentView("artist");
                handleIncrementArtistViews(artist.id);
              }}
              onCreateArtistProfile={handleCreateArtistProfile}
            />
          )}

          {/* VIEW: ARTIST PROFILE PAGE */}
          {currentView === "artist" && selectedArtist && (
            <ArtistProfilePage
              artist={selectedArtist}
              songs={songs}
              albums={albums}
              userProfile={userProfile}
              onBack={() => {
                setSelectedArtist(null);
                setCurrentView("artists");
              }}
              onPlaySong={handlePlaySong}
              onUpdateArtist={async (artistId, updatedFields) => {
                await handleUpdateArtistProfile(artistId, updatedFields);
                setSelectedArtist((prev) => (prev ? { ...prev, ...updatedFields } : null));
              }}
              onDeleteArtist={handleDeleteArtistProfile}
              onCreateAlbum={handleCreateAlbum}
              onUpdateAlbum={handleUpdateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
              onViewAlbum={handleViewAlbum}
            />
          )}

          {/* VIEW: ALBUM PAGE */}
          {currentView === "album" && selectedAlbum && (
            <AlbumPage
              album={selectedAlbum}
              songs={songs}
              userProfile={userProfile}
              onBack={() => {
                setSelectedAlbum(null);
                setCurrentView(selectedArtist ? "artist" : "artists");
              }}
              onPlaySong={handlePlaySong}
              onUpdateAlbum={handleUpdateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
              onUpdateSongDetails={handleUpdateSongDetails}
            />
          )}

          {/* VIEW: CREATOR STUDIO (Author Panel) */}
          {/* Profile View */}
          {currentView === "profile" && (
            <UserProfilePage
              userProfile={userProfile}
              history={history}
              songs={songs}
              artists={artists}
              darkMode={darkMode}
            />
          )}

          {currentView === "author-panel" && (
            <AuthorPanel
              userProfile={userProfile}
              songs={songs}
              onUploadSong={handleUploadSongByCreator}
              onEditSong={handleUpdateSongDetails}
              onDeleteSong={handleDeleteSong}
            />
          )}

          {/* VIEW: ADMIN DASHBOARD */}
          {currentView === "admin-dashboard" && (
            <AdminDashboard
              usersProfileList={allUsers}
              songs={songs}
              complaints={complaints}
              banners={banners}
              creatorApplications={creatorApplications}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateSongStatus={handleUpdateSongStatus}
              onDeleteSong={handleDeleteSong}
              onUpdateSongDetails={handleUpdateSongDetails}
              onUpdateComplaintStatus={handleUpdateComplaintStatus}
              onUpdateApplicationStatus={handleUpdateApplicationStatus}
              onAddBanner={handleAddBanner}
              onUpdateBanner={handleUpdateBanner}
              onDeleteBanner={handleDeleteBanner}
            />
          )}

          {/* VIEW: ANALYTICS PANEL */}
          {currentView === "analytics" && (
            <AnalyticsPanel
              songs={songs.filter((s) => s.status === "approved")}
              history={history}
              totalUsersCount={allUsers.length}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>


      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] pt-2 pb-2 h-auto min-h-[4rem]">
        {[
          { id: 'home', icon: <Home className="h-5 w-5" />, label: 'Главная' },
          { id: 'artists', icon: <Users className="h-5 w-5" />, label: 'Артисты' },
          { id: 'favorites', icon: <Heart className="h-5 w-5" />, label: 'Избранное' },
          { id: 'playlists', icon: <ListMusic className="h-5 w-5" />, label: 'Плейлисты' },
          { id: 'profile', icon: <UserIcon className="h-5 w-5" />, label: 'Профиль' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as AppView)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              currentView === item.id 
                ? "text-red-600 dark:text-red-500" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {item.icon}
            <span className="font-sans text-[11px] md:text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* FLOATING MEDIA AUDIO PLAYER */}
      <AudioPlayer
        userProfile={userProfile}
        currentSong={currentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        playlists={playlists}
        onAddSongToPlaylist={handleAddSongToPlaylist}
        downloadedSongs={downloadedSongs}
        onToggleDownload={handleToggleDownload}
        onPlayIncrement={handleIncrementPlay}
        playbackMode={playbackMode}
        setPlaybackMode={setPlaybackMode}
        queue={queue}
        setQueue={setQueue}
        showQueue={showQueue}
        setShowQueue={setShowQueue}
        originalQueue={originalQueue}
        onPlaySong={handlePlaySong}
      />

      {/* MODAL: CREATE PLAYLIST */}
      <AnimatePresence>
        {showMyWaveSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: enableAnimations ? 0.2 : 0 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
                <h4 className="font-sans text-sm font-bold text-zinc-900 dark:text-white">
                  Настройки Моей Волны
                </h4>
                <button
                  onClick={() => setShowMyWaveSettings(false)}
                  className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Настроение</label>
                  <select
                    value={myWaveMood}
                    onChange={(e) => setMyWaveMood(e.target.value as any)}
                    className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="Любое">Любое</option>
                    <option value="Бодрое">Бодрое</option>
                    <option value="Спокойное">Спокойное</option>
                    <option value="Грустное">Грустное</option>
                    <option value="Веселое">Веселое</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Характер треков</label>
                  <select
                    value={myWaveFamiliarity}
                    onChange={(e) => setMyWaveFamiliarity(e.target.value as any)}
                    className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="Любое">Любое</option>
                    <option value="Незнакомое">Незнакомое</option>
                    <option value="Любимое">Любимое</option>
                    <option value="Популярное">Популярное</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowMyWaveSettings(false)}
                  className="w-full rounded-full bg-red-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-red-700"
                >
                  Готово
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          darkMode={darkMode}
        />

        {showCreatePlaylistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: enableAnimations ? 0.2 : 0 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
                <h4 className="font-sans text-sm font-bold text-zinc-900 dark:text-white">
                  Create Custom Playlist
                </h4>
                <button
                  onClick={() => setShowCreatePlaylistModal(false)}
                  className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-sans text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chill Synthwave Beats"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newPlaylistPrivate}
                    onChange={(e) => setNewPlaylistPrivate(e.target.checked)}
                    className="h-4 w-4 rounded bg-zinc-100 border-zinc-300 accent-emerald-500"
                  />
                  <label
                    htmlFor="isPrivate"
                    className="font-sans text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                  >
                    Keep this playlist private
                  </label>
                </div>

                <button
                  onClick={handleCreatePlaylist}
                  className="w-full h-10 rounded-xl bg-emerald-500 font-sans text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-600"
                >
                  Create Playlist
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SUBMIT GENERAL DMCA REPORT */}
      <AnimatePresence>
        {selectedComplaintSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: enableAnimations ? 0.2 : 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 dark:border-zinc-900 mb-4">
                <h4 className="font-sans text-sm font-bold text-zinc-900 dark:text-white">
                  Report Content Infringement
                </h4>
                <button
                  onClick={() => setSelectedComplaintSong(null)}
                  className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFileComplaint} className="space-y-4">
                <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-900">
                  <img
                    src={selectedComplaintSong.coverUrl}
                    alt={selectedComplaintSong.title}
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h5 className="font-sans text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {selectedComplaintSong.title}
                    </h5>
                    <p className="font-sans text-[11px] md:text-[10px] text-zinc-400 truncate">
                      By {selectedComplaintSong.artist}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Infringement Reason
                  </label>
                  <select
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 font-sans text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="Copyright infringement">Copyright infringement (DMCA Takedown)</option>
                    <option value="Inappropriate lyrics">Inappropriate or abusive lyrics</option>
                    <option value="Plagiarism">Artist / Creator Plagiarism</option>
                    <option value="Low audio quality">Incorrect cover artwork or audio stream file</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Detailed Explanation
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed evidence or timestamps validating your report..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-sans text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-rose-500 font-sans text-xs font-bold text-white shadow-md shadow-rose-500/10 hover:bg-rose-600"
                >
                  File Complaint Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
