import React from "react";
import {
  Home,
  Heart,
  ListMusic,
  History,
  Sparkles,
  BarChart3,
  Mic,
  ShieldCheck,
  AlertTriangle,
  Info,
  Users,
  User,
} from "lucide-react";
import { AppView, UserProfile } from "../types";

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  userProfile: UserProfile | null;
  onLogin: () => void;
  isCollapsed?: boolean;
}

export default function Sidebar({
  currentView,
  setCurrentView,
  userProfile,
  onLogin,
  isCollapsed = false,
}: SidebarProps) {
  const role = userProfile?.role || "user";

  const navigationItems = [
    { id: "home", label: "Explore Music", icon: Home, roles: ["user", "author", "admin"] },
    { id: "artists", label: "Artists & Genius Pages", icon: Users, roles: ["user", "author", "admin"] },
    { id: "favorites", label: "My Favorites", icon: Heart, roles: ["user", "author", "admin"] },
    { id: "playlists", label: "Playlists", icon: ListMusic, roles: ["user", "author", "admin"] },
    { id: "history", label: "Recently Played", icon: History, roles: ["user", "author", "admin"] },
    { id: "profile", label: "My Profile", icon: User, roles: ["user", "author", "admin"] },
    { id: "recommendations", label: "For You", icon: Sparkles, roles: ["user", "author", "admin"] },
    { id: "analytics", label: "Analytics Panel", icon: BarChart3, roles: ["user", "author", "admin"] },
  ] as const;

  const managementItems = [
    { id: "author-panel", label: "Creator Studio", icon: Mic, roles: ["author", "admin"] },
    { id: "admin-dashboard", label: "Admin Dashboard", icon: ShieldCheck, roles: ["admin"] },
  ] as const;

  return (
    <aside className={`hidden h-[calc(100vh-4rem)] flex-col border-r border-zinc-200 bg-zinc-50/50 p-4 transition-all duration-300 dark:border-zinc-800 dark:bg-[#070707] sm:flex ${isCollapsed ? 'w-20 items-center' : 'w-64'}`}>
      {/* Primary Navigation Section */}
      <div className="space-y-1 w-full">
        {!isCollapsed && (
          <p className="px-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Discover
          </p>
        )}
        <nav className="mt-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-2.5'} rounded-none font-sans text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Creator & Admin Management Sections */}
      {(role === "author" || role === "admin") && (
        <div className="mt-6 space-y-1 w-full">
          {!isCollapsed && (
            <p className="px-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Management
            </p>
          )}
          <nav className="mt-2 space-y-1">
            {managementItems.map((item) => {
              if (!(item.roles as readonly string[]).includes(role)) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex w-full items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-2.5'} rounded-none font-sans text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Complaints Ticket Section for standard users */}
      <div className="mt-auto border-t w-full border-zinc-200/60 pt-4 dark:border-zinc-800/60 space-y-1">
        {userProfile && userProfile.role === "user" && (
          <button
            onClick={() => setCurrentView("apply-creator")}
            title={isCollapsed ? "Apply as Artist" : undefined}
            className={`flex w-full items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'} rounded-none font-sans text-xs font-semibold transition-all ${
              currentView === "apply-creator"
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-500 hover:bg-indigo-50/50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-indigo-950/10 dark:hover:text-indigo-400"
            }`}
          >
            <Mic className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Apply as Artist</span>}
          </button>
        )}

        <button
          onClick={() => setCurrentView("complaints")}
          title={isCollapsed ? "Report / DMCA" : undefined}
          className={`flex w-full items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'} rounded-none font-sans text-xs font-semibold transition-all ${
            currentView === "complaints"
              ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400"
              : "text-zinc-500 hover:bg-red-50/50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/10 dark:hover:text-rose-400"
          }`}
        >
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Report / DMCA</span>}
        </button>

        {/* Promo banner or instruction note */}
        {!userProfile && !isCollapsed && (
          <div className="mt-4 rounded-none border border-red-500/10 bg-red-500/5 p-3.5 dark:border-red-500/5 dark:bg-red-500/2">
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="font-serif text-[11px] font-bold text-red-950 dark:text-red-400">
                  Join the Community
                </p>
                <p className="mt-1 font-sans text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Sign in to create playlists, favorite tracks, review sync lyrics, and upload songs!
                </p>
                <button
                  onClick={onLogin}
                  className="mt-2.5 rounded-none bg-zinc-950 hover:bg-zinc-800 dark:bg-red-600 px-3 py-1 font-sans text-[10px] font-bold text-white shadow-sm dark:hover:bg-red-700 transition-colors"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
