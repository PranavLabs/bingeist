'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: number;
  username: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

interface Stats {
  watching: number;
  completed: number;
  plan_to_watch: number;
  posts: number;
}

interface WatchTime {
  totalMinutes: number;
  totalHours: number;
  isEstimated: boolean;
}

interface WatchlistItem {
  id: number;
  media_id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  status: string;
  rating: number | null;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { user: currentUser } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [watchTime, setWatchTime] = useState<WatchTime | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', avatar_url: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    params.then(p => setUsername(p.username));
  }, [params]);

  useEffect(() => {
    if (!username) return;

    const load = async () => {
      const [profileRes, watchlistRes] = await Promise.all([
        fetch(`/api/profile/${username}`),
        fetch(`/api/watchlist?username=${username}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user);
        setStats(data.stats);
        if (data.watchTime) setWatchTime(data.watchTime);
        setEditForm({ bio: data.user.bio || '', avatar_url: data.user.avatar_url || '' });
      }

      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setWatchlist(data.items || []);
      }

      setLoading(false);
    };

    load();
  }, [username]);

  const saveProfile = async () => {
    if (!username) return;
    setSavingEdit(true);
    const res = await fetch(`/api/profile/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok && profile) {
      setProfile({ ...profile, bio: editForm.bio, avatar_url: editForm.avatar_url });
    }
    setSavingEdit(false);
    setEditing(false);
  };

  const isOwn = currentUser?.username === username;

  const STATUS_COLORS = {
    watching: 'text-blue-400',
    completed: 'text-emerald-400',
    plan_to_watch: 'text-yellow-400',
    on_hold: 'text-orange-400',
    dropped: 'text-red-400',
  } as const;

  const TYPE_COLORS = {
    movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  const filteredWatchlist = activeFilter === 'all'
    ? watchlist
    : watchlist.filter(i => i.status === activeFilter || i.media_type === activeFilter);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-32 bg-gray-900/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-900/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="glass-card glass-noise rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-400 flex-shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} width={64} height={64} className="object-cover" unoptimized />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-100">@{profile.username}</h1>
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-500 border border-gray-700 hover:border-emerald-500/30 hover:text-emerald-400 px-3 py-1 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Write something about yourself..."
                    maxLength={200}
                    rows={2}
                    className="w-full mt-1 bg-gray-800/50 border border-gray-700 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none resize-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Avatar URL</label>
                  <input
                    type="url"
                    value={editForm.avatar_url}
                    onChange={e => setEditForm(f => ({ ...f, avatar_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full mt-1 bg-gray-800/50 border border-gray-700 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={savingEdit}
                    className="text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm border border-gray-700 text-gray-400 hover:text-gray-200 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {profile.bio && <p className="text-sm text-gray-400 mt-1">{profile.bio}</p>}
                <p className="text-xs text-gray-600 mt-2">
                  Joined {new Date(profile.created_at + 'Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Watching', value: stats.watching, color: 'text-blue-400' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
            { label: 'Plan to Watch', value: stats.plan_to_watch, color: 'text-yellow-400' },
            { label: 'Posts', value: stats.posts, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="glass-card glass-noise rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
          {watchTime && (
            <div className="glass-card glass-noise rounded-xl p-4 text-center col-span-2 md:col-span-1">
              <div className="text-2xl font-bold text-teal-400">
                {watchTime.totalHours}h
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {watchTime.isEstimated ? 'Est. Hours Watched' : 'Hours Watched'}
              </div>
              {watchTime.isEstimated && (
                <div className="text-[10px] text-gray-600 mt-0.5">estimated</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Watchlist */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-200">Watchlist</h2>
          {isOwn && (
            <Link href="/watchlist" className="text-xs text-emerald-400 hover:underline">Manage →</Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'movie', label: 'Movies' },
            { value: 'tv', label: 'TV Shows' },
            { value: 'anime', label: 'Anime' },
            { value: 'watching', label: 'Watching' },
            { value: 'completed', label: 'Completed' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                activeFilter === f.value
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-gray-900/30 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWatchlist.map(item => (
              <Link
                key={item.id}
                href={`/media/${item.media_id}?type=${item.media_type}`}
                className="group bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all"
              >
                <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                  {item.poster_path ? (
                    <Image
                      src={item.poster_path}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">🎬</div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[item.media_type]} backdrop-blur-sm uppercase font-medium`}>
                      {item.media_type}
                    </span>
                  </div>
                  {item.rating && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      ★{item.rating}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-300 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">{item.title}</p>
                  <p className={`text-[10px] mt-1 ${STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || 'text-gray-600'}`}>
                    {item.status.replace(/_/g, ' ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
