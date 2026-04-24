'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActivityItem {
  kind: 'post' | 'reply';
  id: number;
  content: string;
  image_url?: string | null;
  media_id: string;
  media_type: 'movie' | 'tv' | 'anime';
  media_title: string;
  spoiler: boolean;
  created_at: string;
  username: string;
  avatar_url: string;
  post_id?: number | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPE_COLORS = {
  movie: 'text-blue-400',
  tv: 'text-purple-400',
  anime: 'text-pink-400',
};

export default function LatestActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(data => {
        setItems(data.activity || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-3xl mb-2">🌐</p>
        <p className="text-sm">No activity yet — be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={`${item.kind}-${item.id}`}
          className="flex items-start gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
        >
          <div className="w-7 h-7 flex-shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
            {item.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.avatar_url} alt={item.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              item.username[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${item.username}`}
                className="text-xs font-medium text-gray-300 hover:text-emerald-400 transition-colors"
              >
                {item.username}
              </Link>
              <span className="text-xs text-gray-600">
                {item.kind === 'reply' ? 'replied on' : 'posted on'}
              </span>
              <Link
                href={`/media/${item.media_id}?type=${item.media_type}`}
                className={`text-xs font-medium hover:underline ${TYPE_COLORS[item.media_type]}`}
              >
                {item.media_title}
              </Link>
              <span className="text-xs text-gray-600 ml-auto">{timeAgo(item.created_at)}</span>
            </div>
            {!item.spoiler && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">
                {item.content}
              </p>
            )}
            {item.spoiler && (
              <p className="text-xs text-gray-600 mt-0.5 italic">⚠ spoiler hidden</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
