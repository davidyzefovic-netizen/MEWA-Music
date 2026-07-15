export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
export type UserRole = "user" | "author" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  preferredGenres: string[];
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  featuredArtists?: string[];
  album?: string;
  lyrics: string; // Plain text or timed lyrics format
  audioUrl?: string;
  coverUrl?: string;
  genres: string[];
  tags: string[];
  uploadedBy: string;
  authorName: string;
  status: "pending" | "approved" | "rejected";
  listensCount: number;
  likesCount: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  songIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  songId: string;
  createdAt: string;
}

export interface PlaybackHistory {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
}

export interface Complaint {
  id: string;
  songId: string;
  songTitle: string;
  songArtist: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  description: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ArtistProfile {
  id: string; // artist slug or custom ID, e.g. "neon-skyline" or artist_123
  name: string;
  bio?: string;
  imageUrl?: string;
  bannerUrl?: string;
  hometown?: string;
  formedIn?: string; // or active years
  createdBy: string; // uid of the user who created/manages this page
  createdAt: string;
  views?: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string; // link to ArtistProfile id
  artistName: string;
  coverUrl?: string;
  bannerUrl?: string;
  behindTheScenes?: string; // "Как делали"
  releaseYear?: string;
  createdBy: string;
  createdAt: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string; // Optional link, e.g. to album, artist, or external
  isActive: boolean;
  createdAt: string;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  userEmail: string;
  artistName: string;
  links: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export type AppView =
  | "home"
  | "favorites"
  | "playlists"
  | "history"
  | "recommendations"
  | "author-panel"
  | "admin-dashboard"
  | "analytics"
  | "complaints"
  | "search"
  | "artists"
  | "artist"
  | "album"
  | "apply-creator"
  | "profile";
