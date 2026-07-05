import { Song } from "./types";

export const INITIAL_SONGS: Omit<Song, "createdAt">[] = [
  {
    id: "seed-track-1",
    title: "Midnight Drive",
    artist: "Neon Skyline",
    album: "Retro Waves",
    lyrics: `[00:00] (Instrumental Intro - Synth Beat)
[00:15] Cruising down the coastal line
[00:19] Watch the neon shadows shine
[00:22] Purple skies and golden beams
[00:26] We are living in our dreams
[00:29] (Chorus)
[00:30] Oh, midnight drive, under city lights
[00:33] Speeding through the darkest nights
[00:37] No looking back, the road is clear
[00:41] Feeling alive with you right here
[00:44] [00:44] (Sustained Synth Chords)
[00:50] Radio plays a classic tune
[00:54] Fading out beneath the moon
[00:57] Engine hums a steady song
[01:01] This is where we both belong
[01:04] (Chorus)
[01:05] Oh, midnight drive, under city lights
[01:09] Speeding through the darkest nights
[01:12] No looking back, the road is clear
[01:16] Feeling alive with you right here
[01:19] (Guitar Synth Solo)
[01:35] Outro fading slowly...`,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    genres: ["Synthwave", "Electronic"],
    tags: ["retro", "driving", "chill", "neon"],
    uploadedBy: "system",
    authorName: "Neon Skyline",
    status: "approved",
    listensCount: 1420,
    likesCount: 85,
  },
  {
    id: "seed-track-2",
    title: "Acoustic Breeze",
    artist: "Claire de Lune",
    album: "Whispers of Wind",
    lyrics: `[00:00] (Acoustic Guitar Picking Intro)
[00:10] Morning sun upon your face
[00:14] Time slows down in this quiet place
[00:18] Gentle wind begins to blow
[00:22] Secrets that we used to know
[00:26] (Chorus)
[00:27] Fly away on an acoustic breeze
[00:31] Rustling leaves among the trees
[00:35] Safe and warm, we'll find a way
[00:39] Turning night into a golden day
[00:43] (Verse 2)
[00:44] Words unspoken, hearts aligned
[00:48] All the worries left behind
[00:52] Take my hand, we'll walk the shore
[00:56] We don't need to ask for more
[01:00] (Chorus)
[01:01] Fly away on an acoustic breeze
[01:05] Rustling leaves among the trees
[01:09] Safe and warm, we'll find a way
[01:13] Turning night into a golden day
[01:17] (Outro Guitar Solo Fades)`,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    genres: ["Acoustic", "Folk"],
    tags: ["calm", "morning", "guitar", "peaceful"],
    uploadedBy: "system",
    authorName: "Claire de Lune",
    status: "approved",
    listensCount: 890,
    likesCount: 64,
  },
  {
    id: "seed-track-3",
    title: "Echoes of Silence",
    artist: "Deep Resonance",
    album: "The Deep Ocean",
    lyrics: `[00:00] (Ambient Pads and Echoing Piano)
[00:12] Down below the crushing weight
[00:16] Far away from love and hate
[00:20] Solitude is where we find
[00:24] The quiet corners of the mind
[00:28] (Chorus)
[00:29] Echoes of silence, calling my name
[00:33] Nothing is different, nothing the same
[00:37] Lost in the deep, where shadows reside
[00:41] Drifting along with the incoming tide
[00:45] (Instrumental Interlude)
[00:57] Voices fade and disappear
[01:01] No more doubt and no more fear
[01:05] Just a heartbeat in the dark
[01:09] Waiting for a tiny spark
[01:13] (Chorus)
[01:14] Echoes of silence, calling my name
[01:18] Nothing is different, nothing the same
[01:22] Lost in the deep, where shadows reside
[01:26] Drifting along with the incoming tide`,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    genres: ["Ambient", "Chillout"],
    tags: ["space", "meditation", "dark", "deep"],
    uploadedBy: "system",
    authorName: "Deep Resonance",
    status: "approved",
    listensCount: 2150,
    likesCount: 112,
  },
  {
    id: "seed-track-4",
    title: "Electric Horizon",
    artist: "Cyber Crew",
    album: "Hyperdrive",
    lyrics: `[00:00] (Fast Techno Rhythm Beat)
[00:08] Grid is locked, the code is set
[00:12] No regrets, no safety net
[00:16] Digital lights illuminate the street
[00:20] Feel the rhythm of our pounding feet
[00:24] (Chorus)
[00:25] Run towards the electric horizon
[00:29] Where the neon sun is rising
[00:33] Live the data, breathe the light
[00:37] We own the cybernetic night!
[00:41] (Verse 2)
[00:42] Cyber dreams and optical lines
[00:46] Crossing over all designs
[00:50] Virtual minds, we are free
[00:54] Designing our own destiny
[00:58] (Chorus)
[00:59] Run towards the electric horizon
[01:03] Where the neon sun is rising
[01:07] Live the data, breathe the light
[01:11] We own the cybernetic night!`,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    genres: ["Techno", "Electronic"],
    tags: ["cyber", "energetic", "beat", "future"],
    uploadedBy: "system",
    authorName: "Cyber Crew",
    status: "approved",
    listensCount: 3040,
    likesCount: 210,
  }
];

export const GENRES_LIST = [
  "All",
  "Synthwave",
  "Electronic",
  "Acoustic",
  "Folk",
  "Ambient",
  "Chillout",
  "Techno",
  "Rock",
  "Pop",
  "Hip-Hop",
  "Jazz"
];
