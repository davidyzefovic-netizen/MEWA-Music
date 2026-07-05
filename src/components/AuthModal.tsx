import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, LogIn } from "lucide-react";
import { loginWithGoogle, loginWithEmail, registerWithEmail } from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function AuthModal({ isOpen, onClose, darkMode }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-sm overflow-hidden rounded-none shadow-2xl border ${
            darkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute right-4 top-4 p-2 transition-colors ${
              darkMode ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-black"
            }`}
          >
            <X size={16} />
          </button>

          <div className="p-8">
            <h2 className={`mb-6 font-serif text-2xl font-bold ${darkMode ? "text-white" : "text-zinc-950"}`}>
              {isLogin ? "С возвращением" : "Регистрация"}
            </h2>

            {error && (
              <div className={`mb-6 p-3 text-xs border ${darkMode ? "border-red-900/50 bg-red-950/20 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? "text-zinc-600" : "text-zinc-400"}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full rounded-none py-2.5 pl-9 pr-4 font-sans text-xs outline-none transition-all border ${
                      darkMode
                        ? "bg-zinc-900 text-white placeholder-zinc-600 border-zinc-800 focus:border-white"
                        : "bg-zinc-50 text-black placeholder-zinc-400 border-zinc-200 focus:border-zinc-950"
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
                  Пароль
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? "text-zinc-600" : "text-zinc-400"}`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full rounded-none py-2.5 pl-9 pr-4 font-sans text-xs outline-none transition-all border ${
                      darkMode
                        ? "bg-zinc-900 text-white placeholder-zinc-600 border-zinc-800 focus:border-white"
                        : "bg-zinc-50 text-black placeholder-zinc-400 border-zinc-200 focus:border-zinc-950"
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-6 w-full rounded-none py-3 font-sans text-xs font-semibold transition-all disabled:opacity-50 ${
                  darkMode ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"
                }`}
              >
                {loading ? "Подождите..." : isLogin ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className={`flex-1 border-t ${darkMode ? "border-zinc-800" : "border-zinc-200"}`} />
              <span className={`px-4 font-mono text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-600" : "text-zinc-400"}`}>или</span>
              <div className={`flex-1 border-t ${darkMode ? "border-zinc-800" : "border-zinc-200"}`} />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-none border py-3 font-sans text-xs font-semibold transition-all ${
                darkMode
                  ? "border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
                  : "border-zinc-200 bg-zinc-50 text-black hover:bg-zinc-100"
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Войти через Google
            </button>

            <div className="mt-6 text-center">
              <span className={`font-sans text-xs ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
                {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className={`font-sans text-xs font-semibold ${darkMode ? "text-white hover:text-zinc-300" : "text-zinc-950 hover:text-zinc-700"}`}
              >
                {isLogin ? "Зарегистрироваться" : "Войти"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
