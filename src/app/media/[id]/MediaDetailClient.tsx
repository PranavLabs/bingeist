'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PostsFeed from '@/components/PostsFeed';
import WatchlistButton from '@/components/WatchlistButton';
import { Suspense } from 'react';

interface Rating {
  source: string;
  value: string;
}

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
  // Rich fields
  language?: string;
  runtime_minutes?: number;
  country?: string;
  director?: string;
  writer?: string;
  cast?: string[];
  ratings?: Rating[];
  // TV
  network?: string;
  schedule?: string;
  status?: string;
  episode_count?: number;
  seasons?: number;
  // Anime
  episodes?: number;
  duration_minutes?: number;
  studios?: string[];
  themes?: string[];
  score?: number;
  aired?: string;
  trailer_url?: string;
}

interface WatchlistItem {
  media_id: string;
  media_type: string;
  status: string;
}

const TYPE_COLORS = {
  movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

function MetaRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-300 flex-1">{value}</span>
    </div>
  );
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
        <div className="h-64 glass-card rounded-2xl animate-pulse" />
        <div className="h-8 glass-card rounded-xl animate-pulse w-1/2" />
        <div className="h-4 glass-card rounded animate-pulse w-full" />
      </div>
    );
  }

  if (!media) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500 text-center py-20">Media not found</div>;
  }

  const year = media.release_date ? new Date(media.release_date).getFullYear() : null;

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
            <div className="aspect-[2/3] glass-card rounded-2xl overflow-hidden shadow-xl shadow-black/50">
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
              <span className={`text-xs px-2.5 py-0.5 rounded-full border glass-badge ${TYPE_COLORS[media.media_type]} uppercase font-semibold tracking-wide`}>
                {media.media_type}
              </span>
              {year && <span className="text-xs text-gray-500">{year}</span>}
              {(media.vote_average !== undefined && media.vote_average > 0) && (
                <span className="text-xs text-yellow-300 glass-badge px-2 py-0.5 rounded-full border border-yellow-500/20">
                  ★ {media.vote_average.toFixed(1)}
                </span>
              )}
              {media.score && media.score > 0 && media.media_type === 'anime' && (
                <span className="text-xs text-orange-300 glass-badge px-2 py-0.5 rounded-full border border-orange-500/20">
                  MAL {media.score.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3 leading-tight">
              {media.title}
            </h1>

            {/* Genres */}
            {media.genres && media.genres.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {media.genres.map(g => (
                  <span key={g} className="text-xs glass-badge text-gray-300 px-2.5 py-0.5 rounded-full border border-white/10">
                    {g}
                  </span>
                ))}
                {media.themes?.map(t => (
                  <span key={t} className="text-xs glass-badge text-gray-400 px-2.5 py-0.5 rounded-full border border-white/5 italic">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Overview / Synopsis */}
            {media.overview && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
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

        {/* Rich metadata panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Core details */}
          <div className="glass-card glass-noise rounded-2xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Details</h3>
            <MetaRow label="Status" value={media.status} />
            <MetaRow label="Language" value={media.language} />
            {media.media_type === 'movie' && (
              <>
                <MetaRow label="Country" value={media.country} />
                <MetaRow label="Runtime" value={media.runtime_minutes ? `${media.runtime_minutes} min` : undefined} />
                <MetaRow label="Director" value={media.director} />
                <MetaRow label="Writer" value={media.writer} />
              </>
            )}
            {media.media_type === 'tv' && (
              <>
                <MetaRow label="Network" value={media.network} />
                <MetaRow label="Schedule" value={media.schedule} />
                <MetaRow label="Runtime" value={media.runtime_minutes ? `~${media.runtime_minutes} min/ep` : undefined} />
                <MetaRow label="Seasons" value={media.seasons} />
                <MetaRow label="Episodes" value={media.episode_count} />
                <MetaRow label="Premiered" value={media.release_date} />
              </>
            )}
            {media.media_type === 'anime' && (
              <>
                <MetaRow label="Episodes" value={media.episodes} />
                <MetaRow label="Duration" value={media.duration_minutes ? `${media.duration_minutes} min/ep` : undefined} />
                <MetaRow label="Aired" value={media.aired} />
                <MetaRow label="Studios" value={media.studios?.join(', ')} />
              </>
            )}
          </div>

          {/* Ratings / Trailer */}
          {((media.ratings && media.ratings.length > 0) || media.cast || media.trailer_url) && (
            <div className="glass-card glass-noise rounded-2xl p-4">
              {media.ratings && media.ratings.length > 0 && (
                <>
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Ratings</h3>
                  {media.ratings.map(r => (
                    <div key={r.source} className="flex gap-3 py-2 border-b border-white/5 last:border-0">
                      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{r.source}</span>
                      <span className="text-sm text-gray-300">{r.value}</span>
                    </div>
                  ))}
                </>
              )}

              {media.cast && media.cast.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Cast</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{media.cast.join(', ')}</p>
                </div>
              )}

              {media.trailer_url && (
                <div className="mt-4">
                  <a
                    href={media.trailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors glass-badge px-3 py-1.5 rounded-xl border border-emerald-500/20"
                  >
                    ▶ Watch Trailer
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discussion */}
        <div className="border-t border-white/5 pt-8">
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

export default function MediaDetailClient({ params }: { params: Promise<{ id: string }> }) {
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

