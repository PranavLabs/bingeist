'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  removed: boolean;
  locked: boolean;
  created_at: string;
  username: string;
  community_slug: string;
  community_title: string;
  heart_count: number;
  comment_count: number;
  user_hearted: boolean;
  user_role: string | null;
}

interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  body: string;
  removed: boolean;
  created_at: string;
  username: string;
  heart_count: number;
  user_hearted: boolean;
  children?: Comment[];
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

function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<number, Comment>();
  comments.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: Comment[] = [];
  map.forEach(c => {
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.children!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function CommentNode({
  comment,
  postId,
  user,
  onReply,
  onHeart,
  isMod,
  onModerate,
}: {
  comment: Comment;
  postId: number;
  user: { username: string } | null;
  onReply: (parentId: number) => void;
  onHeart: (id: number) => void;
  isMod: boolean;
  onModerate: (id: number, action: string) => void;
}) {
  return (
    <div className="ml-0">
      <div className={`group ${comment.removed ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <span className="text-gray-400 font-medium">{comment.username}</span>
              <span>{timeAgo(comment.created_at)}</span>
              {comment.removed && <span className="text-red-400">[removed]</span>}
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {comment.removed ? '[This comment has been removed]' : comment.body}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => onHeart(comment.id)}
                className={`text-xs flex items-center gap-1 transition-colors ${comment.user_hearted ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
              >
                ❤️ {comment.heart_count}
              </button>
              {user && !comment.removed && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-gray-600 hover:text-emerald-400 transition-colors"
                >
                  Reply
                </button>
              )}
              {isMod && (
                <button
                  onClick={() => onModerate(comment.id, comment.removed ? 'restore' : 'remove')}
                  className="text-xs text-gray-700 hover:text-red-400 transition-colors"
                >
                  {comment.removed ? 'Restore' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {comment.children && comment.children.length > 0 && (
        <div className="ml-4 pl-3 border-l border-gray-800 mt-2 space-y-3">
          {comment.children.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              postId={postId}
              user={user}
              onReply={onReply}
              onHeart={onHeart}
              isMod={isMod}
              onModerate={onModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostPageClient({ postId }: { postId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/community-posts/${postId}`),
      fetch(`/api/community-posts/${postId}/comments`),
    ]).then(async ([postRes, commentsRes]) => {
      if (postRes.ok) {
        const data = await postRes.json();
        setPost(data.post);
      }
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments((data.comments || []).map((c: Comment & { user_hearted: number | boolean }) => ({
          ...c,
          user_hearted: Boolean(c.user_hearted),
        })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [postId]);

  const handleHeartPost = async () => {
    if (!user) { router.push('/login'); return; }
    const res = await fetch(`/api/community-posts/${postId}/heart`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setPost(p => p ? { ...p, user_hearted: data.hearted, heart_count: data.count } : p);
    }
  };

  const handleHeartComment = async (id: number) => {
    if (!user) { router.push('/login'); return; }
    const res = await fetch(`/api/community-comments/${id}/heart`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setComments(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, user_hearted: data.hearted, heart_count: data.count }
            : c
        )
      );
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!commentBody.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/community-posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody, parent_comment_id: replyTo }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setComments(prev => [...prev, { ...data.comment, user_hearted: false }]);
      setCommentBody('');
      setReplyTo(null);
    }
  };

  const handleModeratePost = async (action: string) => {
    const res = await fetch(`/api/community-posts/${postId}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setPost(p => p ? {
        ...p,
        removed: action === 'remove' ? true : action === 'restore' ? false : p.removed,
        locked: action === 'lock' ? true : action === 'unlock' ? false : p.locked,
      } : p);
    }
  };

  const handleModerateComment = async (id: number, action: string) => {
    const res = await fetch(`/api/community-comments/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setComments(prev =>
        prev.map(c => c.id === id ? { ...c, removed: action === 'remove' } : c)
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <div className="h-32 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">Post not found.</p>
        <Link href="/b" className="text-emerald-400 hover:underline text-sm mt-2 inline-block">← Back to Forums</Link>
      </div>
    );
  }

  const isMod = post.user_role === 'owner' || post.user_role === 'mod';
  const tree = buildTree(comments);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-600 mb-4">
        <Link href="/b" className="hover:text-emerald-400 transition-colors">Forums</Link>
        <span className="mx-1">/</span>
        <Link href={`/b/${post.community_slug}`} className="hover:text-emerald-400 transition-colors">/b/{post.community_slug}</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-500 truncate">{post.title}</span>
      </div>

      {/* Post */}
      <div className={`bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-6 backdrop-blur-sm ${post.removed ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {post.removed && <span className="text-xs bg-red-900/30 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded">removed</span>}
          {post.locked && <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/40 px-1.5 py-0.5 rounded">locked</span>}
        </div>
        <h1 className="text-xl font-bold text-gray-200 mb-2">{post.title}</h1>
        <div className="text-xs text-gray-600 mb-3">
          by <span className="text-gray-400">{post.username}</span>
          <span className="mx-1">·</span>
          {timeAgo(post.created_at)}
          <span className="mx-1">·</span>
          <Link href={`/b/${post.community_slug}`} className="text-emerald-400 hover:underline">/b/{post.community_slug}</Link>
        </div>
        {post.body && (
          <p className="text-sm text-gray-300 whitespace-pre-wrap mb-4">{post.body}</p>
        )}
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt="Post image"
            className="rounded-lg max-h-96 object-contain mb-4 border border-gray-800"
          />
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleHeartPost}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${
              post.user_hearted
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-500/40 hover:text-red-400'
            }`}
          >
            ❤️ {post.heart_count}
          </button>
          <span className="text-sm text-gray-600">💬 {comments.filter(c => !c.removed).length}</span>
          {isMod && (
            <>
              <button
                onClick={() => handleModeratePost(post.removed ? 'restore' : 'remove')}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                {post.removed ? 'Restore' : 'Remove'}
              </button>
              <button
                onClick={() => handleModeratePost(post.locked ? 'unlock' : 'lock')}
                className="text-xs text-gray-600 hover:text-yellow-400 transition-colors"
              >
                {post.locked ? 'Unlock' : 'Lock'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comment Form */}
      {!post.locked && (
        <form onSubmit={handleSubmitComment} className="mb-6 bg-gray-900/60 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-gray-400 mb-2">
            {replyTo ? `Replying to comment #${replyTo}` : 'Leave a comment'}
            {replyTo && (
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-gray-600 hover:text-gray-400 text-xs"
              >
                (cancel reply)
              </button>
            )}
          </h2>
          {user ? (
            <>
              <textarea
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none"
                required
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !commentBody.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting…' : 'Comment'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              <Link href="/login" className="text-emerald-400 hover:underline">Login</Link> to comment.
            </p>
          )}
        </form>
      )}

      {/* Comments */}
      <div className="space-y-4">
        {tree.length === 0 ? (
          <p className="text-center text-sm text-gray-600 py-8">No comments yet.</p>
        ) : (
          tree.map(comment => (
            <div key={comment.id} className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4">
              <CommentNode
                comment={comment}
                postId={post.id}
                user={user}
                onReply={setReplyTo}
                onHeart={handleHeartComment}
                isMod={isMod}
                onModerate={handleModerateComment}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
