'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';

interface Post {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  removed: boolean;
  locked: boolean;
  created_at: string;
  username: string;
  heart_count: number;
  comment_count: number;
  user_hearted: number;
}

interface Community {
  id: number;
  slug: string;
  title: string;
  description: string;
  rules: string;
  member_count: number;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommunityPageClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userMembership, setUserMembership] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', body: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/communities/${slug}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setCommunity(data.community);
    setPosts(data.posts || []);
    setUserMembership(data.userMembership);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJoin = async () => {
    if (!user) { router.push('/login'); return; }
    const res = await fetch(`/api/communities/${slug}`, { method: 'POST' });
    if (res.ok) {
      setUserMembership('member');
      setCommunity(c => c ? { ...c, member_count: c.member_count + 1 } : c);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setSubmitting(true);
    setPostError('');
    const res = await fetch(`/api/communities/${slug}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postForm),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setPostError(data.error || 'Failed to create post'); return; }
    router.push(`/b/${slug}/post/${data.post.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">Community not found.</p>
        <Link href="/b" className="text-emerald-400 hover:underline text-sm mt-2 inline-block">← Back to Forums</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-6 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link href="/b" className="hover:text-emerald-400 transition-colors">Forums</Link>
              <span className="mx-1">/</span>
              <span className="text-emerald-400">/b/{community.slug}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-200">{community.title}</h1>
            {community.description && <p className="text-sm text-gray-400 mt-1">{community.description}</p>}
            <p className="text-xs text-gray-600 mt-2">{community.member_count} members</p>
          </div>
          {userMembership ? (
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + New Post
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className="flex-shrink-0 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition-all"
            >
              Join Community
            </button>
          )}
        </div>

        {community.rules && (
          <details className="mt-3">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">Community Rules</summary>
            <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{community.rules}</p>
          </details>
        )}
      </div>

      {/* Create Post Form */}
      {showPostForm && (
        <form onSubmit={handleSubmitPost} className="mb-6 bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-gray-200">Create a Post</h2>
          {postError && <p className="text-red-400 text-sm">{postError}</p>}
          <input
            type="text"
            placeholder="Post title *"
            value={postForm.title}
            onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors"
            required
          />
          <textarea
            placeholder="Post body (optional)"
            value={postForm.body}
            onChange={e => setPostForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <input
            type="url"
            placeholder="Image URL (https://...)"
            value={postForm.image_url}
            onChange={e => setPostForm(f => ({ ...f, image_url: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/b/${slug}/post/${post.id}`}
              className={`block bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors ${post.removed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.removed && <span className="text-xs bg-red-900/30 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded">removed</span>}
                    {post.locked && <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/40 px-1.5 py-0.5 rounded">locked</span>}
                    <h3 className="text-sm font-semibold text-gray-200 hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span>by <span className="text-gray-400">{post.username}</span></span>
                    <span>{timeAgo(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <span className={post.user_hearted ? 'text-red-400' : ''}>❤️</span>
                      {post.heart_count}
                    </span>
                    <span>💬 {post.comment_count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
