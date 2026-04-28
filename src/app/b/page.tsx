'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Community {
  id: number;
  slug: string;
  title: string;
  description: string;
  member_count: number;
  post_count: number;
  created_at: string;
}

export default function ForumsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', rules: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetch('/api/communities')
      .then(r => r.json())
      .then(data => {
        setCommunities(data.communities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (slug: string) => {
    if (!user) { router.push('/login'); return; }
    await fetch(`/api/communities/${slug}`, { method: 'POST' });
    router.push(`/b/${slug}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error || 'Failed to create community'); return; }
    router.push(`/b/${data.community.slug}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">
            <span className="text-emerald-400">/b/</span> Forums
          </h1>
          <p className="text-sm text-gray-500 mt-1">Community discussions about movies, TV, and anime</p>
        </div>
        <button
          onClick={() => { if (!user) { router.push('/login'); return; } setShowCreate(!showCreate); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Create Community
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-gray-200 mb-2">Create a Community</h2>
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <input
            type="text"
            placeholder="Community name *"
            value={createForm.title}
            onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={createForm.description}
            onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <textarea
            placeholder="Community rules (optional)"
            value={createForm.rules}
            onChange={e => setCreateForm(f => ({ ...f, rules: e.target.value }))}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No communities yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {communities.map(c => (
            <div key={c.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/b/${c.slug}`} className="text-base font-semibold text-gray-200 hover:text-emerald-400 transition-colors">
                  /b/{c.slug}
                </Link>
                {c.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{c.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>{c.member_count} members</span>
                  <span>{c.post_count} posts</span>
                </div>
              </div>
              <button
                onClick={() => handleJoin(c.slug)}
                className="flex-shrink-0 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 hover:text-black font-bold px-4 py-1.5 rounded-lg text-sm transition-all"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
