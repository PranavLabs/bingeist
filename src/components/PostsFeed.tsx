'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Post {
  id: number;
  user_id: number;
  media_id: string;
  media_type: string;
  content: string;
  spoiler: number;
  image_url?: string | null;
  created_at: string;
  username: string;
  avatar_url: string;
  reply_count: number;
  like_count: number;
  user_liked: number;
}

interface Reply {
  id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  username: string;
  avatar_url: string;
}

interface PostThreadProps {
  post: Post;
  onLikeToggle: (postId: number, liked: boolean, newCount: number) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr + 'Z').toLocaleDateString();
}

function AttachedImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="mt-2 text-xs text-gray-600 italic">Image failed to load.</p>
    );
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 max-w-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Attached image"
        className="w-full h-auto max-h-64 object-contain bg-gray-900"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function PostThread({ post, onLikeToggle }: PostThreadProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [showReplyImageInput, setShowReplyImageInput] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [revealed, setRevealed] = useState(!post.spoiler);

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    setLoadingReplies(true);
    const res = await fetch(`/api/posts/${post.id}/replies`);
    const data = await res.json();
    setReplies(data.replies || []);
    setShowReplies(true);
    setLoadingReplies(false);
  };

  const submitReply = async () => {
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    const res = await fetch(`/api/posts/${post.id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), image_url: replyImageUrl.trim() || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      setReplies(prev => [...prev, data.reply]);
      setReplyText('');
      setReplyImageUrl('');
      setShowReplyImageInput(false);
      setShowReplies(true);
    }
    setSubmittingReply(false);
  };

  const handleLike = async () => {
    if (!user) return;
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      onLikeToggle(post.id, data.liked, data.like_count);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.username}`} className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold hover:border-emerald-400 transition-colors">
            {post.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.avatar_url} alt={post.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              post.username[0].toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/profile/${post.username}`} className="text-sm font-medium text-gray-200 hover:text-emerald-400 transition-colors">
              {post.username}
            </Link>
            <span className="text-xs text-gray-600">{timeAgo(post.created_at)}</span>
            {!!post.spoiler && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">⚠ spoiler</span>
            )}
          </div>

          {!revealed ? (
            <div
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-gray-600 transition-colors"
              onClick={() => setRevealed(true)}
            >
              <p className="text-gray-500 text-sm italic">This post contains spoilers. Click to reveal.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
              {post.image_url && <AttachedImage url={post.image_url} />}
            </>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors ${post.user_liked ? 'text-emerald-400' : 'hover:text-emerald-400'} ${!user ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span>{post.user_liked ? '♥' : '♡'}</span>
              <span>{post.like_count}</span>
            </button>
            <button
              onClick={loadReplies}
              className="flex items-center gap-1.5 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <span>💬</span>
              <span>{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
            </button>
          </div>

          {/* Replies */}
          {loadingReplies && <p className="text-xs text-gray-600 mt-3">Loading replies...</p>}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-gray-800 pl-3">
              {replies.map(reply => (
                <div key={reply.id} className="flex gap-2">
                  <Link href={`/profile/${reply.username}`} className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-xs font-bold text-gray-300 hover:border-emerald-400 transition-colors">
                      {reply.username[0].toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${reply.username}`} className="text-xs font-medium text-gray-300 hover:text-emerald-400 transition-colors">{reply.username}</Link>
                      <span className="text-xs text-gray-600">{timeAgo(reply.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{reply.content}</p>
                    {reply.image_url && <AttachedImage url={reply.image_url} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {user && showReplies && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                  placeholder="Write a reply..."
                  maxLength={1000}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowReplyImageInput(v => !v)}
                  title="Attach image/GIF URL"
                  className={`text-xs border px-2 py-1.5 rounded-lg transition-colors ${showReplyImageInput ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                >
                  🖼
                </button>
                <button
                  onClick={submitReply}
                  disabled={submittingReply || !replyText.trim()}
                  className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
              </div>
              {showReplyImageInput && (
                <input
                  value={replyImageUrl}
                  onChange={e => setReplyImageUrl(e.target.value)}
                  placeholder="Paste image/GIF URL (https://...)"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PostsFeedProps {
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
}

export default function PostsFeed({ mediaId, mediaType, mediaTitle }: PostsFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [spoiler, setSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      const res = await fetch(`/api/posts?media_id=${mediaId}&media_type=${mediaType}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setLoaded(true);
    };
    loadPosts();
  }, [mediaId, mediaType]);

  const submitPost = async () => {
    if (!newPost.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_id: mediaId,
        media_type: mediaType,
        media_title: mediaTitle,
        content: newPost.trim(),
        spoiler,
        image_url: postImageUrl.trim() || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => [data.post, ...prev]);
      setNewPost('');
      setPostImageUrl('');
      setShowImageInput(false);
      setSpoiler(false);
    }
    setSubmitting(false);
  };

  const handleLikeToggle = (postId: number, liked: boolean, newCount: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, user_liked: liked ? 1 : 0, like_count: newCount } : p
    ));
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-200 mb-4">Discussion</h2>

      {user ? (
        <div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder={`Share your thoughts on ${mediaTitle}...`}
            maxLength={2000}
            rows={3}
            className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none resize-none"
          />
          {showImageInput && (
            <input
              value={postImageUrl}
              onChange={e => setPostImageUrl(e.target.value)}
              placeholder="Paste image/GIF URL (https://...)"
              className="w-full mt-2 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
            />
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={e => setSpoiler(e.target.checked)}
                  className="accent-yellow-400"
                />
                Mark as spoiler
              </label>
              <button
                type="button"
                onClick={() => setShowImageInput(v => !v)}
                title="Attach image/GIF URL"
                className={`text-xs border px-2 py-1 rounded-lg transition-colors ${showImageInput ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'}`}
              >
                🖼 Image/GIF
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">{newPost.length}/2000</span>
              <button
                onClick={submitPost}
                disabled={submitting || !newPost.trim()}
                className="text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-4 py-1.5 rounded-lg transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-900/30 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">
            <a href="/login" className="text-emerald-400 hover:underline">Log in</a> to join the discussion.
          </p>
        </div>
      )}

      {!loaded ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No posts yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostThread key={post.id} post={post} onLikeToggle={handleLikeToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

