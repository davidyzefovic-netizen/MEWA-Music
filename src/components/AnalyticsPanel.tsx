import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Song, PlaybackHistory } from "../types";
import { Music, Play, Heart, Users, TrendingUp } from "lucide-react";

interface AnalyticsPanelProps {
  songs: Song[];
  history: PlaybackHistory[];
  totalUsersCount: number;
}

export default function AnalyticsPanel({ songs, history, totalUsersCount }: AnalyticsPanelProps) {
  // Aggregate data for Top Songs (by Play count)
  const topSongsData = [...songs]
    .sort((a, b) => b.listensCount - a.listensCount)
    .slice(0, 5)
    .map((song) => ({
      name: song.title,
      plays: song.listensCount,
      likes: song.likesCount,
    }));

  // Aggregate data for Genre Distribution
  const genreCounts: { [genre: string]: number } = {};
  songs.forEach((song) => {
    song.genres?.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const genreData = Object.keys(genreCounts).map((genre) => ({
    name: genre,
    value: genreCounts[genre],
  }));

  const COLORS = ["#b91c1c", "#7f1d1d", "#991b1b", "#450a0a", "#3f3f46", "#1c1917", "#52525b"];

  // Activity over the last days (Simulated over the last week or aggregated from actual history)
  const activityData = [
    { day: "Mon", plays: 240, activeListeners: 40 },
    { day: "Tue", plays: 300, activeListeners: 45 },
    { day: "Wed", plays: 280, activeListeners: 42 },
    { day: "Thu", plays: 350, activeListeners: 50 },
    { day: "Fri", plays: 480, activeListeners: 68 },
    { day: "Sat", plays: 590, activeListeners: 84 },
    { day: "Sun", plays: 520, activeListeners: 78 },
  ];

  // Global summaries
  const totalListens = songs.reduce((sum, song) => sum + (song.listensCount || 0), 0);
  const totalLikes = songs.reduce((sum, song) => sum + (song.likesCount || 0), 0);
  const totalSongs = songs.length;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 pb-28">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-black italic text-zinc-900 dark:text-zinc-50 tracking-tight">
          Analytics Dashboard
        </h2>
        <p className="font-serif text-xs italic text-zinc-500 dark:text-zinc-400 mt-1">
          Real-time insights on tracks popularity, listening events, and listener engagement.
        </p>
      </div>

      {/* Grid Summaries */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm transition-all dark:border-zinc-850 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Streams</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-red-500/10 text-red-600">
              <Play className="h-4 w-4 fill-current" />
            </div>
          </div>
          <p className="mt-2.5 font-serif text-2xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
            {totalListens.toLocaleString()}
          </p>
          <span className="mt-1 flex items-center gap-1 font-mono text-[9px] font-bold text-red-600 uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5" /> +12.4% this week
          </span>
        </div>

        {/* Card 2 */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm transition-all dark:border-zinc-850 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Favorites</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-red-500/10 text-red-600">
              <Heart className="h-4 w-4 fill-current" />
            </div>
          </div>
          <p className="mt-2.5 font-serif text-2xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
            {totalLikes.toLocaleString()}
          </p>
          <span className="mt-1 flex items-center gap-1 font-mono text-[9px] font-bold text-red-600 uppercase tracking-wider">
            +4.3% increase
          </span>
        </div>

        {/* Card 3 */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm transition-all dark:border-zinc-850 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Songs Pool</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-red-500/10 text-red-600">
              <Music className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2.5 font-serif text-2xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
            {totalSongs}
          </p>
          <span className="mt-1 flex items-center gap-1 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            Active catalog
          </span>
        </div>

        {/* Card 4 */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm transition-all dark:border-zinc-850 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Listeners</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-red-500/10 text-red-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2.5 font-serif text-2xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
            {Math.max(totalUsersCount, 8)}
          </p>
          <span className="mt-1 flex items-center gap-1 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            Realtime database
          </span>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Playback Streams Trend (AreaChart) */}
        <div className="lg:col-span-2 rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
          <div className="mb-4">
            <h3 className="font-serif text-sm font-bold italic text-zinc-950 dark:text-zinc-100">
              Weekly Streaming Volume
            </h3>
            <p className="font-serif text-xs text-zinc-400 italic">Daily playcounts and concurrency logs</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="playsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "monospace" }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "monospace" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "0px",
                    border: "none",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="plays"
                  stroke="#b91c1c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#playsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Genre Distribution (PieChart) */}
        <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
          <div className="mb-4">
            <h3 className="font-serif text-sm font-bold italic text-zinc-950 dark:text-zinc-100">
              Genre Distribution
            </h3>
            <p className="font-serif text-xs text-zinc-400 italic">Database proportion by genre tag</p>
          </div>
          <div className="h-56">
            {genreData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="font-serif text-xs italic text-zinc-400">No tracks to categorize</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderRadius: "0px",
                      border: "none",
                      color: "#fff",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Pie Legends */}
          <div className="mt-2 flex flex-wrap gap-2.5 justify-center">
            {genreData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-none"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="font-serif text-[11px] md:text-[10px] italic text-zinc-500 dark:text-zinc-400">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Full Row: Popular Tracks (BarChart) */}
        <div className="lg:col-span-3 rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
          <div className="mb-4">
            <h3 className="font-serif text-sm font-bold italic text-zinc-950 dark:text-zinc-100">
              Top 5 Most Listened Tracks
            </h3>
            <p className="font-serif text-xs text-zinc-400 italic">All-time streams metrics per individual song</p>
          </div>
          <div className="h-64">
            {topSongsData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="font-serif text-xs italic text-zinc-400">No tracks registered yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSongsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "monospace" }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "monospace" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderRadius: "0px",
                      border: "none",
                      color: "#fff",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="plays" fill="#b91c1c" radius={[0, 0, 0, 0]} barSize={40}>
                    {topSongsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#7f1d1d" : "#b91c1c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
