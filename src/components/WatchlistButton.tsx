'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WatchlistButtonProps {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string;
  initialStatus?: string | null;
}

const STATUSES = [
  { value: 'watching', label: 'Watching', color: 'text-blue-400' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-400' },
  { value: 'plan_to_watch', label: 'Plan to Watch', color: 'text-yellow-400' },
  { value: 'on_hold', label: 'On Hold', color: 'text-orange-400' },
  { value: 'dropped', label: 'Dropped', color: 'text-red-400' },
];

export default function WatchlistButton({ mediaId, mediaType, title, posterPath, initialStatus }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(initialStatus || null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const currentStatus = STATUSES.find(s => s.value === status);

  const addOrUpdate = async (newStatus: string) => {
    setLoading(true);
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId, media_type: mediaType, title, poster_path: posterPath, status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
    setLoading(false);
    setOpen(false);
  };

  const remove = async () => {
    setLoading(true);
    const res = await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId, media_type: mediaType }),
    });
    if (res.ok) setStatus(null);
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
          status
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500/30 hover:text-emerald-400'
        } disabled:opacity-50`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>{status ? '✓' : '+'}</span>
        )}
        {currentStatus ? currentStatus.label : 'Add to Watchlist'}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-gray-900 border border-gray-700 rounded-xl py-1 shadow-2xl z-50">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => addOrUpdate(s.value)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-800 ${s.color} ${status === s.value ? 'font-bold' : ''}`}
            >
              {status === s.value ? '✓ ' : ''}{s.label}
            </button>
          ))}
          {status && (
            <>
              <hr className="border-gray-700 my-1" />
              <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors">
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
