import React, { useState } from "react";
import {
  Bell,
  Search,
  LogOut,
  Shield,
  User as UserIcon,
  Mic,
  Moon,
  Sun,
  X,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  Wand2,
} from "lucide-react";
import { User } from "../types";
import { UserProfile, Notification, AppView } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  user: User | null;
  userProfile: UserProfile | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentView: AppView;
  setCurrentView: (v: AppView) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => Promise<void>;
  onClearNotifications: () => Promise<void>;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  enableAnimations: boolean;
  setEnableAnimations: (enabled: boolean) => void;
  enableTyping: boolean;
  setEnableTyping: (enabled: boolean) => void;
  showRightPanel: boolean;
  setShowRightPanel: (show: boolean) => void;
}

export default function Header({
  user,
  userProfile,
  onLogin,
  onLogout,
  searchQuery,
  setSearchQuery,
  currentView,
  setCurrentView,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  darkMode,
  setDarkMode,
  enableAnimations,
  setEnableAnimations,
  enableTyping,
  setEnableTyping,
  showRightPanel,
  setShowRightPanel,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-[#050505]">
      {/* Brand Logo */}
      {!isMobileSearchActive && (
      <div
        className="flex cursor-pointer items-center gap-2.5"
        onClick={() => setCurrentView("home")}
      >
        <div className="flex h-10 w-10 items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M 45 10 A 40 40 0 0 0 45 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 45 22 A 28 28 0 0 0 45 78" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 45 34 A 16 16 0 0 0 45 66" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            
            <path d="M 48 90 A 40 40 0 0 0 83 48" stroke="white" strokeWidth="12" />
            
            <path d="M 48 55 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0 m 9 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" fill="#dc2626" fillRule="evenodd" />
            <rect x="58" y="24" width="4" height="31" fill="#dc2626" />
            <path d="M 62 24 L 80 30 L 62 42 Z" fill="#dc2626" />
          </svg>
        </div>
        <div>
          <h1 className="font-serif text-xl font-black italic tracking-tight text-white">
            MEWA.
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">
            editorial music hub
          </p>
        </div>
      </div>

      )}
      {/* Global Search Bar */}
      <div className={`relative flex w-full max-w-md items-center ${isMobileSearchActive ? "flex" : "hidden md:flex"}`}>
        <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
        {(isMobileSearchActive) && (
          <button onClick={() => setIsMobileSearchActive(false)} className="md:hidden mr-2 p-2 text-zinc-400">
            <X className="h-5 w-5" />
          </button>
        )}
        <input
          type="text"
          placeholder="Search by song, artist, genre or tag..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (currentView !== "search" && e.target.value.trim() !== "") {
              setCurrentView("search");
            }
          }}
          className="h-10 w-full rounded-none border border-zinc-200 bg-zinc-50 pl-10 pr-4 font-sans text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-red-500 dark:focus:bg-zinc-900"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCurrentView("home");
            }}
            className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Control Actions / User Info */}
      <div className="flex items-center gap-2">
        {/* Settings Toggles */}
        {!isMobileSearchActive && (
          <button
            onClick={() => setIsMobileSearchActive(true)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
        <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="flex h-10 w-10 items-center justify-center rounded-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          title="Toggle Sidebar"
        >
          {showRightPanel ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setEnableAnimations(!enableAnimations)}
          className={`flex h-10 w-10 items-center justify-center rounded-none ${enableAnimations ? 'text-indigo-400 hover:text-indigo-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          title="Toggle Animations"
        >
          <Wand2 className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={() => setEnableTyping(!enableTyping)}
          className={`flex h-10 w-10 items-center justify-center rounded-none ${enableTyping ? 'text-indigo-400 hover:text-indigo-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          title="Toggle Biography Typing Effect"
        >
          <Type className="h-4.5 w-4.5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-10 w-10 items-center justify-center rounded-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="w-px h-6 bg-zinc-800 mx-1"></div>

        </div>
        {/* Notifications Button */}
        {user && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex h-10 w-10 items-center justify-center rounded-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              id="notifications-btn"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-mono text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-80 rounded-none border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none z-40"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-900">
                      <span className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Notifications
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={onClearNotifications}
                          className="font-sans text-xs font-semibold text-red-500 hover:text-red-600"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="mt-2.5 max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                          <p className="mt-1.5 font-sans text-xs text-zinc-400 dark:text-zinc-500">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={async () => {
                              await onMarkNotificationRead(notif.id);
                            }}
                            className={`group relative cursor-pointer p-3 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
                              !notif.read
                                ? "bg-red-50/40 dark:bg-red-500/5"
                                : ""
                            }`}
                          >
                            {!notif.read && (
                              <span className="absolute top-3.5 right-3 h-2 w-2 rounded-full bg-red-500" />
                            )}
                            <h4 className="font-sans text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {notif.title}
                            </h4>
                            <p className="mt-1 font-sans text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Authentication Panel */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* User Role Badge */}
            {userProfile && (
              <div
                className={`hidden items-center gap-1 rounded-none px-2.5 py-1 font-mono text-[11px] md:text-[10px] font-semibold uppercase tracking-wider md:flex ${
                  userProfile.role === "admin"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : userProfile.role === "author"
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {userProfile.role === "admin" ? (
                  <Shield className="h-3 w-3" />
                ) : userProfile.role === "author" ? (
                  <Mic className="h-3 w-3" />
                ) : (
                  <UserIcon className="h-3 w-3" />
                )}
                {userProfile.role}
              </div>
            )}

            {/* Profile Avatar & Sign Out */}
            <div className="flex items-center gap-2">
              <img
                src={
                  user.photoURL ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                }
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={onLogout}
                className="hidden h-8 w-8 items-center justify-center rounded-none text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 sm:flex"
                title="Log Out"
                id="logout-btn"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex h-10 items-center justify-center gap-2 rounded-none bg-white px-5 font-sans text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-zinc-200"
            id="login-btn"
          >
            Войти
          </button>
        )}
      </div>
    </header>
  );
}
