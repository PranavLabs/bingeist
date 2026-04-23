'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface WatchlistItem {
  id: number;
  media_id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  status: string;
  rating: number | null;
  added_at: string;
}

const STATUS_CONFIG = {
  watching: { label: 'Watching', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  plan_to_watch: { label: 'Plan to Watch', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  on_hold: { label: 'On Hold', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  dropped: { label: 'Dropped', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
} as const;

const STATUSES = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetch('/api/watchlist')
        .then(r => r.json())
        .then(d => { setItems(d.items || []); setLoading(false); });
    }
  }, [user, authLoading, router]);

  const updateStatus = async (item: WatchlistItem, newStatus: string) => {
    setUpdatingId(item.id);
    await fetch('/api/watchlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: item.media_id, media_type: item.media_type, status: newStatus }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    setUpdatingId(null);
  };

  const updateRating = async (item: WatchlistItem, rating: number) => {
    setUpdatingId(item.id);
    await fetch('/api/watchlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: item.media_id, media_type: item.media_type, rating }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, rating } : i));
    setUpdatingId(null);
  };

  const removeItem = async (item: WatchlistItem) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: item.media_id, media_type: item.media_type }),
    });
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const filtered = activeTab === 'all' ? items : items.filter(i => i.status === activeTab);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-200">
          <span className="text-emerald-400">$</span> my_watchlist
        </h1>
        <span className="text-sm text-gray-500">{items.length} titles</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setActiveTab(activeTab === s ? 'all' : s)}
              className={`p-3 rounded-xl border text-center transition-all ${
                activeTab === s ? cfg.bg + ' border-opacity-60' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className={`text-lg font-bold ${cfg.color}`}>{counts[s]}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            activeTab === 'all'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-gray-900/30 border-gray-800 text-gray-500 hover:text-gray-300'
          }`}
        >
          All ({items.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">
            {activeTab === 'all' ? (
              <>Your watchlist is empty. <Link href="/search" className="text-emerald-400 hover:underline">Search for titles</Link> to add.</>
            ) : (
              `No titles with "${STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG]?.label}" status.`
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            return (
              <div key={item.id} className="flex gap-3 bg-gray-900/50 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors group">
                <Link href={`/media/${item.media_id}?type=${item.media_type}`} className="flex-shrink-0">
                  <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden">
                    {item.poster_path ? (
                      <Image src={item.poster_path} alt={item.title} width={40} height={56} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/media/${item.media_id}?type=${item.media_type}`}>
                    <h3 className="text-sm font-medium text-gray-200 hover:text-emerald-400 transition-colors truncate">{item.title}</h3>
                  </Link>
                  <span className="text-[10px] text-gray-600 uppercase">{item.media_type}</span>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item, e.target.value)}
                      disabled={updatingId === item.id}
                      className={`text-xs rounded-lg px-2 py-1 border outline-none transition-colors cursor-pointer disabled:opacity-50 ${cfg ? cfg.bg + ' ' + cfg.color : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s} className="bg-gray-900 text-gray-300">
                          {STATUS_CONFIG[s].label}
                        </option>
                      ))}
                    </select>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starVal = (i + 1) * 2;
                        return (
                          <button
                            key={i}
                            onClick={() => updateRating(item, item.rating === starVal ? 0 : starVal)}
                            className={`text-sm transition-colors ${
                              item.rating && item.rating >= starVal ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-400'
                            }`}
                          >
                            ★
                          </button>
                        );
                      })}
                      {item.rating ? <span className="text-xs text-gray-500">{item.rating}/10</span> : null}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item)}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all text-sm self-start p-1"
                  title="Remove from watchlist"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
