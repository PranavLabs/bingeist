'use client';

import { useState, useEffect, useRef, useCallback } from 'react';import MediaCard from './MediaCard';

interface FeedItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  personalised?: boolean;
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: '🎬 Movies' },
  { value: 'tv', label: '📺 TV' },
  { value: 'anime', label: '🌸 Anime' },
] as const;

export default function FeedGrid() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [langFilter, setLangFilter] = useState('');
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [showGenrePanel, setShowGenrePanel] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (
    newCursor: number,
    type: string,
    genres: string[],
    lang: string,
    reset: boolean
  ) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        cursor: String(newCursor),
        limit: '20',
        type,
      });
      if (genres.length > 0) params.set('genre', genres.join(','));
      if (lang) params.set('language', lang);

      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error('Feed fetch failed');
      const data = await res.json();

      if (reset) {
        setItems(data.items ?? []);
      } else {
        setItems(prev => [...prev, ...(data.items ?? [])]);
      }
      setCursor(data.nextCursor ?? newCursor + 20);
      setHasMore(data.hasMore ?? false);

      // Populate filter options on first load
      if (newCursor === 0 && data.allGenres) setAllGenres(data.allGenres);
      if (newCursor === 0 && data.allLanguages) setAllLanguages(data.allLanguages);
    } catch {
      // silently fail; keep existing items
    }
    setLoading(false);
    setInitialLoad(false);
  }, [loading]);

  // Initial load
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    // Schedule async so React batches renders cleanly
    Promise.resolve().then(() => fetchPage(0, 'all', [], '', true));
  }, [fetchPage]);

  // Re-fetch when filters change
  const handleFilterChange = (
    newType: string,
    newGenres: string[],
    newLang: string
  ) => {
    setTypeFilter(newType);
    setGenreFilter(newGenres);
    setLangFilter(newLang);
    setItems([]);
    setCursor(0);
    setHasMore(true);
    setInitialLoad(true);
    fetchPage(0, newType, newGenres, newLang, true);
  };

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPage(cursor, typeFilter, genreFilter, langFilter, false);
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, hasMore, loading, typeFilter, genreFilter, langFilter, fetchPage]);

  const toggleGenre = (g: string) => {
    const next = genreFilter.includes(g)
      ? genreFilter.filter(x => x !== g)
      : [...genreFilter, g];
    handleFilterChange(typeFilter, next, langFilter);
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 space-y-3">
        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value, genreFilter, langFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                typeFilter === f.value
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'glass-badge text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Language dropdown */}
          {allLanguages.length > 0 && (
            <select
              value={langFilter}
              onChange={e => handleFilterChange(typeFilter, genreFilter, e.target.value)}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-medium glass-badge text-gray-300 bg-transparent outline-none cursor-pointer"
            >
              <option value="">All languages</option>
              {allLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}
        </div>

        {/* Genre filter */}
        {allGenres.length > 0 && (
          <div>
            <button
              onClick={() => setShowGenrePanel(v => !v)}
              className="text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>Genres {genreFilter.length > 0 ? `(${genreFilter.length} selected)` : ''}</span>
              <span>{showGenrePanel ? '▲' : '▼'}</span>
            </button>
            {showGenrePanel && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allGenres.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                      genreFilter.includes(g)
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'glass-badge text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {initialLoad ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">No results for these filters</p>
          <button
            onClick={() => handleFilterChange('all', [], '')}
            className="mt-3 text-xs text-emerald-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map(item => (
              <MediaCard
                key={item.id}
                id={item.id}
                media_type={item.media_type}
                title={item.title}
                poster_path={item.poster_path}
                overview={item.overview}
                vote_average={item.vote_average}
                release_date={item.release_date}
                personalised={item.personalised}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-8">
            {loading && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
            {!hasMore && !loading && items.length > 0 && (
              <p className="text-xs text-gray-600">— end of feed —</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
