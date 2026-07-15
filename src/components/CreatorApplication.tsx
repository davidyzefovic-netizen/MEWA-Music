import React, { useState } from "react";
import { Mic, CheckCircle2, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";

interface CreatorApplicationProps {
  userProfile: UserProfile | null;
  onApply: (details: { artistName: string; links: string; description: string }) => Promise<void>;
}

export default function CreatorApplication({ userProfile, onApply }: CreatorApplicationProps) {
  const [artistName, setArtistName] = useState("");
  const [links, setLinks] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!artistName.trim() || !links.trim()) {
      setError("Please provide an artist name and at least one link.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onApply({ artistName, links, description });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex-1 overflow-y-auto p-6 pb-28 flex flex-col items-center justify-center">
        <p className="text-zinc-500">You must be logged in to apply.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex-1 overflow-y-auto p-6 pb-28 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg rounded-none border border-green-200 bg-green-50 p-8 text-center dark:border-green-900/50 dark:bg-green-900/10">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-2 font-serif text-2xl font-black italic tracking-tight text-green-950 dark:text-green-400">
            Application Submitted
          </h2>
          <p className="font-sans text-sm text-green-800 dark:text-green-300">
            Your application to become a verified artist on MEWA has been sent to our moderators. We will review your application and upgrade your account if approved!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 pb-28">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
            Apply for Artist Access
          </h2>
          <p className="mt-2 font-sans text-sm text-zinc-500 dark:text-zinc-400">
            Want to share your original music with the community? Submit an application to get Creator Studio access for free. Our team will review your links to verify authenticity.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-none border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-sans text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-none border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Artist / Band Name *
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g. Neon Skyline"
              className="h-11 w-full rounded-none border border-zinc-200 bg-zinc-50 px-3 font-sans text-sm transition-colors focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Links to your Music (Spotify, Soundcloud, YouTube) *
            </label>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Paste URLs here..."
              rows={3}
              className="w-full resize-none rounded-none border border-zinc-200 bg-zinc-50 p-3 font-sans text-sm transition-colors focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us a bit about your music or why you want to join."
              rows={4}
              className="w-full resize-none rounded-none border border-zinc-200 bg-zinc-50 p-3 font-sans text-sm transition-colors focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-none bg-indigo-600 px-6 font-sans text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              <Mic className="h-4.5 w-4.5" />
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
