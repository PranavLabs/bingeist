'use client';

import Link from 'next/link';
import Image from 'next/image';

interface MediaCardProps {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  compact?: boolean;
}

const TYPE_COLORS = {
  movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export default function MediaCard({
  id,
  media_type,
  title,
  poster_path,
  overview,
  vote_average,
  release_date,
  compact = false,
}: MediaCardProps) {
  const href = `/media/${id}?type=${media_type}`;
  const year = release_date ? new Date(release_date).getFullYear() : null;

  if (compact) {
    return (
      <Link href={href} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-emerald-500/30 transition-all group">
        <div className="w-10 h-14 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
          {poster_path ? (
            <Image src={poster_path} alt={title} width={40} height={56} className="object-cover w-full h-full" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 group-hover:text-emerald-400 transition-colors truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[media_type]} uppercase font-medium`}>{media_type}</span>
            {year && <span className="text-xs text-gray-500">{year}</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
      <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
        {poster_path ? (
          <Image
            src={poster_path}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">🎬</div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border ${TYPE_COLORS[media_type]} uppercase font-medium backdrop-blur-sm`}>
            {media_type}
          </span>
        </div>
        {vote_average !== undefined && vote_average > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs px-2 py-0.5 rounded font-medium">
            ★ {vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors text-sm leading-tight line-clamp-2">
          {title}
        </h3>
        {year && <p className="text-xs text-gray-500 mt-1">{year}</p>}
        {overview && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{overview}</p>
        )}
      </div>
    </Link>
  );
}
