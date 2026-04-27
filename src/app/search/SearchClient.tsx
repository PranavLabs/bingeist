'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MediaCard from '@/components/MediaCard';
import { Suspense } from 'react';

interface MediaItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'anime', label: 'Anime' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string, type: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/media/search?q=${encodeURIComponent(q)}&type=${type}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    if (q) {
      setQuery(q);
      setFilter(type);
      doSearch(q, type);
    }
  }, [searchParams, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${filter}`);
    doSearch(query, filter);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${newFilter}`);
      doSearch(query, newFilter);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-200 mb-6">
          <span className="text-emerald-400">$</span> search_content
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search movies, TV shows, anime...'
            className="flex-1 bg-gray-900/50 border border-gray-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter === f.value
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-gray-900/50 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium text-gray-500">No results found</p>
          <p className="text-sm mt-1">Try a different query or filter</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <p className="text-xs text-gray-600 mb-4">{results.length} results</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map(item => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                id={item.id}
                media_type={item.media_type}
                title={item.title}
                poster_path={item.poster_path}
                overview={item.overview}
                vote_average={item.vote_average}
                release_date={item.release_date}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-sm">Search for movies, TV shows, or anime to get started</p>
        </div>
      )}
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8 text-gray-600">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
