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
                <label className={`mb-1.5 block font-mono text-[11px] md:text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
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
                <label className={`mb-1.5 block font-mono text-[11px] md:text-[10px] uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
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
            <div className="mt-4 mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-none py-3 font-sans text-xs font-semibold transition-all border ${
                  darkMode 
                    ? "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-600" 
                    : "border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50"
                }`}
              >
                <LogIn size={14} />
                Войти через Google
              </button>
            </div>
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
