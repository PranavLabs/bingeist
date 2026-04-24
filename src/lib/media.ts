// TVMaze: free public API for TV shows (no key required)
const TVMAZE_BASE = 'https://api.tvmaze.com';
// OMDb: movie database (requires OMDB_API_KEY env var)
const OMDB_BASE = 'https://www.omdbapi.com';
// Jikan: unofficial MyAnimeList API (no key required)
const JIKAN_BASE = 'https://api.jikan.moe/v4';

export interface MediaItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  genres?: string[];
  // Rich fields (populated on detail fetch)
  language?: string;
  runtime_minutes?: number;
  // Movie-specific
  director?: string;
  writer?: string;
  cast?: string[];
  country?: string;
  ratings?: { source: string; value: string }[];
  // TV-specific
  network?: string;
  schedule?: string;
  status?: string;
  episode_count?: number;
  seasons?: number;
  // Anime-specific
  episodes?: number;
  duration_minutes?: number;
  studios?: string[];
  themes?: string[];
  score?: number;
  aired?: string;
  trailer_url?: string;
}

// ── TVMaze helpers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTVMazeShow(show: any, enriched = false): MediaItem {
  const base: MediaItem = {
    id: `tvmaze_${show.id}`,
    media_type: 'tv',
    title: show.name || 'Unknown',
    overview: show.summary ? show.summary.replace(/<[^>]*>/g, '') : '',
    poster_path: show.image?.medium || show.image?.original || '',
    backdrop_path: '',
    release_date: show.premiered || '',
    vote_average: show.rating?.average ?? undefined,
    genres: show.genres || [],
  };
  if (!enriched) return base;
  return {
    ...base,
    language: show.language || undefined,
    runtime_minutes: show.averageRuntime || show.runtime || undefined,
    network: show.network?.name || show.webChannel?.name || undefined,
    schedule: show.schedule
      ? `${show.schedule.days?.join(', ') || ''} ${show.schedule.time || ''}`.trim()
      : undefined,
    status: show.status || undefined,
  };
}

export async function searchTVMaze(query: string): Promise<MediaItem[]> {
  try {
    const url = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => mapTVMazeShow(item.show));
  } catch {
    return [];
  }
}

export async function getTVMazeShow(id: string): Promise<MediaItem | null> {
  try {
    const showId = id.startsWith('tvmaze_') ? id.slice(7) : id;
    const [showRes, episodesRes] = await Promise.all([
      fetch(`${TVMAZE_BASE}/shows/${showId}`, { next: { revalidate: 300 } }),
      fetch(`${TVMAZE_BASE}/shows/${showId}/episodes`, { next: { revalidate: 3600 } }),
    ]);
    if (!showRes.ok) return null;
    const show = await showRes.json();
    const enriched = mapTVMazeShow(show, true);

    if (episodesRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const episodes: any[] = await episodesRes.json();
      enriched.episode_count = episodes.length;
      const seasonNums = new Set(episodes.map((e: { season: number }) => e.season));
      enriched.seasons = seasonNums.size;
    }

    return enriched;
  } catch {
    return null;
  }
}

// ── OMDb helpers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOMDbMovie(r: any, enriched = false): MediaItem {
  const base: MediaItem = {
    id: `omdb_${r.imdbID}`,
    media_type: 'movie',
    title: r.Title || 'Unknown',
    overview: r.Plot && r.Plot !== 'N/A' ? r.Plot : '',
    poster_path: r.Poster && r.Poster !== 'N/A' ? r.Poster : '',
    backdrop_path: '',
    release_date:
      r.Released && r.Released !== 'N/A'
        ? r.Released
        : r.Year
        ? `${r.Year}-01-01`
        : '',
    vote_average:
      r.imdbRating && r.imdbRating !== 'N/A'
        ? parseFloat(r.imdbRating)
        : undefined,
    genres:
      r.Genre && r.Genre !== 'N/A' ? r.Genre.split(', ') : [],
  };
  if (!enriched) return base;

  // Parse runtime e.g. "148 min" → 148
  let runtimeMinutes: number | undefined;
  if (r.Runtime && r.Runtime !== 'N/A') {
    const m = r.Runtime.match(/(\d+)/);
    if (m) runtimeMinutes = parseInt(m[1], 10);
  }

  return {
    ...base,
    language: r.Language && r.Language !== 'N/A' ? r.Language.split(', ')[0] : undefined,
    country: r.Country && r.Country !== 'N/A' ? r.Country : undefined,
    runtime_minutes: runtimeMinutes,
    director: r.Director && r.Director !== 'N/A' ? r.Director : undefined,
    writer: r.Writer && r.Writer !== 'N/A' ? r.Writer : undefined,
    cast: r.Actors && r.Actors !== 'N/A' ? r.Actors.split(', ') : undefined,
    ratings: Array.isArray(r.Ratings) && r.Ratings.length > 0 ? r.Ratings : undefined,
  };
}

export async function searchOMDb(query: string): Promise<MediaItem[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `${OMDB_BASE}/?s=${encodeURIComponent(query)}&apikey=${apiKey}&type=movie`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.Response === 'False') return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.Search || []).map((r: any) => ({
      id: `omdb_${r.imdbID}`,
      media_type: 'movie' as const,
      title: r.Title || 'Unknown',
      overview: '',
      poster_path: r.Poster && r.Poster !== 'N/A' ? r.Poster : '',
      backdrop_path: '',
      release_date: r.Year ? `${r.Year}-01-01` : '',
      vote_average: undefined,
      genres: [],
    }));
  } catch {
    return [];
  }
}

export async function getOMDbMovie(id: string): Promise<MediaItem | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  try {
    const imdbId = id.startsWith('omdb_') ? id.slice(5) : id;
    const url = `${OMDB_BASE}/?i=${imdbId}&apikey=${apiKey}&plot=full`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const r = await res.json();
    if (r.Response === 'False') return null;
    return mapOMDbMovie(r, true);
  } catch {
    return null;
  }
}

// ── Jikan (anime) helpers ─────────────────────────────────────────────────────

export async function searchJikan(query: string): Promise<MediaItem[]> {
  try {
    const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data || []).map((r: any) => ({
      id: `mal_${r.mal_id}`,
      media_type: 'anime' as const,
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
    }));
  } catch {
    return [];
  }
}

export async function getJikanAnime(malId: string): Promise<MediaItem | null> {
  try {
    const url = `${JIKAN_BASE}/anime/${malId}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const { data: r } = await res.json();

    // Parse duration e.g. "23 min per ep" or "1 hr 54 min" → minutes
    let durationMinutes: number | undefined;
    if (r.duration) {
      const hrMatch = r.duration.match(/(\d+)\s*hr/);
      const minMatch = r.duration.match(/(\d+)\s*min/);
      const hrs = hrMatch ? parseInt(hrMatch[1], 10) : 0;
      const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
      if (hrs || mins) durationMinutes = hrs * 60 + mins;
    }

    return {
      id: `mal_${r.mal_id}`,
      media_type: 'anime',
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
      // Rich fields
      language: 'Japanese',
      episodes: r.episodes || undefined,
      duration_minutes: durationMinutes,
      runtime_minutes: durationMinutes,
      studios: (r.studios || []).map((s: { name: string }) => s.name),
      themes: (r.themes || []).map((t: { name: string }) => t.name),
      score: r.score,
      status: r.status || undefined,
      aired: r.aired?.string || undefined,
      trailer_url: r.trailer?.url || undefined,
    };
  } catch {
    return null;
  }
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function getTrendingAnime(): Promise<MediaItem[]> {
  try {
    const url = `${JIKAN_BASE}/top/anime?limit=10`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data || []).map((r: any) => ({
      id: `mal_${r.mal_id}`,
      media_type: 'anime' as const,
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
    }));
  } catch {
    return [];
  }
}

export async function getTrendingTV(): Promise<MediaItem[]> {
  try {
    // TVMaze orders /shows by popularity; page 0 = the most-followed shows.
    const url = `${TVMAZE_BASE}/shows?page=0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, 10).map((s) => mapTVMazeShow(s));
  } catch {
    return [];
  }
}

export async function getTrendingMovies(): Promise<MediaItem[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];

  // OMDb has no trending endpoint. We approximate "popular movies" by fetching
  // a curated list of well-known recent IMDb IDs in parallel. These cover
  // blockbusters and critically acclaimed films from the last few years.
  // NOTE: Update this list periodically (e.g. quarterly) to keep content relevant.
  const popularImdbIds = [
    'tt15398776', // Oppenheimer (2023)
    'tt1517268',  // Barbie (2023)
    'tt9362722',  // Spider-Man: Across the Spider-Verse (2023)
    'tt6791350',  // Guardians of the Galaxy Vol. 3 (2023)
    'tt1630029',  // Avatar: The Way of Water (2022)
    'tt3228774',  // Creed III (2023)
    'tt10954600', // Ant-Man and the Wasp: Quantumania (2023)
    'tt14230458', // The Creator (2023)
    'tt5433140',  // Fast X (2023)
    'tt7144666',  // Dune: Part Two (2024)
  ];

  const results = await Promise.allSettled(
    popularImdbIds.map(id => getOMDbMovie(`omdb_${id}`))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<MediaItem | null> =>
        r.status === 'fulfilled'
    )
    .map(r => r.value)
    .filter((m): m is MediaItem => m !== null);
}

// ── Feed pool (for homepage mixed grid) ───────────────────────────────────────

export async function getFeedPool(): Promise<MediaItem[]> {
  // Fetch a larger pool for filtering/scoring
  const [anime, tv, movies] = await Promise.all([
    getTrendingAnime(),
    getTrendingTVPage0(),
    getTrendingMovies(),
  ]);
  return [...anime, ...tv, ...movies];
}

async function getTrendingTVPage0(): Promise<MediaItem[]> {
  try {
    const url = `${TVMAZE_BASE}/shows?page=0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, 20).map((s) => mapTVMazeShow(s));
  } catch {
    return [];
  }
}

// ── Watch-time estimation ─────────────────────────────────────────────────────

export interface WatchTimeResult {
  totalMinutes: number;
  isEstimated: boolean;
}

export async function getMediaRuntimeMinutes(
  mediaId: string,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<{ minutes: number; estimated: boolean } | null> {
  try {
    if (mediaType === 'movie') {
      const item = await getOMDbMovie(mediaId);
      if (!item?.runtime_minutes) return null;
      return { minutes: item.runtime_minutes, estimated: false };
    }

    if (mediaType === 'tv') {
      const item = await getTVMazeShow(mediaId);
      if (!item) return null;
      const runtime = item.runtime_minutes ?? 45; // fallback 45 min/ep
      const eps = item.episode_count ?? (item.seasons ? item.seasons * 10 : 1);
      return { minutes: runtime * eps, estimated: !item.runtime_minutes || !item.episode_count };
    }

    if (mediaType === 'anime') {
      const item = await getJikanAnime(
        mediaId.startsWith('mal_') ? mediaId.slice(4) : mediaId
      );
      if (!item) return null;
      const epDuration = item.duration_minutes ?? 24; // fallback 24 min/ep
      const eps = item.episodes ?? 12; // fallback 12 eps
      return { minutes: epDuration * eps, estimated: !item.duration_minutes || !item.episodes };
    }

    return null;
  } catch {
    return null;
  }
}
