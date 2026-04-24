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
}

// ── TVMaze helpers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTVMazeShow(show: any): MediaItem {
  return {
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
    const url = `${TVMAZE_BASE}/shows/${showId}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return mapTVMazeShow(await res.json());
  } catch {
    return null;
  }
}

// ── OMDb helpers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOMDbMovie(r: any): MediaItem {
  return {
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
    return mapOMDbMovie(r);
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
    return (data as any[]).slice(0, 10).map(mapTVMazeShow);
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
