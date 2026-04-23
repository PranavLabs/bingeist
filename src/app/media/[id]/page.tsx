'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PostsFeed from '@/components/PostsFeed';
import WatchlistButton from '@/components/WatchlistButton';
import { Suspense } from 'react';

interface MediaItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  genres?: string[];
}

interface WatchlistItem {
  media_id: string;
  media_type: string;
  status: string;
}

function MediaDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'movie' | 'tv' | 'anime' | null;
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;

    const fetchData = async () => {
      const [mediaRes, watchlistRes] = await Promise.all([
        fetch(`/api/media/${id}?type=${type}`),
        fetch(`/api/watchlist`),
      ]);

      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setMedia(data.media);
      }

      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        const item = (data.items as WatchlistItem[])?.find(
          (i) => i.media_id === id && i.media_type === type
        );
        if (item) setWatchlistStatus(item.status);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, type]);

  if (!type) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-red-400">Missing media type parameter</div>;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-64 bg-gray-900/50 rounded-2xl animate-pulse" />
        <div className="h-8 bg-gray-900/50 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-gray-900/50 rounded animate-pulse w-full" />
      </div>
    );
  }

  if (!media) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500 text-center py-20">Media not found</div>;
  }

  const year = media.release_date ? new Date(media.release_date).getFullYear() : null;
  const typeColors = {
    movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return (
    <div>
      {/* Backdrop */}
      {media.backdrop_path && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <Image
            src={media.backdrop_path}
            alt={media.title}
            fill
            className="object-cover opacity-30"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-6 mb-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-28 md:w-40">
            <div className="aspect-[2/3] bg-gray-800 rounded-xl overflow-hidden">
              {media.poster_path ? (
                <Image
                  src={media.poster_path}
                  alt={media.title}
                  width={160}
                  height={240}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">🎬</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[media.media_type]} uppercase font-medium`}>
                {media.media_type}
              </span>
              {year && <span className="text-xs text-gray-500">{year}</span>}
              {media.vote_average !== undefined && media.vote_average > 0 && (
                <span className="text-xs text-yellow-400">★ {media.vote_average.toFixed(1)}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3 leading-tight">
              {media.title}
            </h1>

            {media.genres && media.genres.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {media.genres.map(g => (
                  <span key={g} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {media.overview && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3 md:line-clamp-none">
                {media.overview}
              </p>
            )}

            <WatchlistButton
              mediaId={media.id}
              mediaType={media.media_type}
              title={media.title}
              posterPath={media.poster_path}
              initialStatus={watchlistStatus}
            />
          </div>
        </div>

        {/* Discussion */}
        <div className="border-t border-gray-800 pt-8">
          <PostsFeed
            mediaId={media.id}
            mediaType={media.media_type}
            mediaTitle={media.title}
          />
        </div>
      </div>
    </div>
  );
}

export default function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  if (!id) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-600">Loading...</div>;

  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-gray-600">Loading...</div>}>
      <MediaDetailContent id={id} />
    </Suspense>
  );
}
