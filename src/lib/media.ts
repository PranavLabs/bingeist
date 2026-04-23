const TMDB_BASE = 'https://api.themoviedb.org/3';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function tmdbHeaders() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY is not set');
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

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

export async function searchTMDB(query: string): Promise<MediaItem[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
  const res = await fetch(url, { headers: tmdbHeaders(), next: { revalidate: 60 } });
  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv').map((r: any) => ({
    id: String(r.id),
    media_type: r.media_type as 'movie' | 'tv',
    title: r.title || r.name || 'Unknown',
    overview: r.overview || '',
    poster_path: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : '',
    backdrop_path: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : '',
    release_date: r.release_date || r.first_air_date || '',
    vote_average: r.vote_average,
    genres: [],
  }));
}

export async function getTMDBMedia(id: string, type: 'movie' | 'tv'): Promise<MediaItem | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const url = `${TMDB_BASE}/${type}/${id}?language=en-US`;
  const res = await fetch(url, { headers: tmdbHeaders(), next: { revalidate: 300 } });
  if (!res.ok) return null;

  const r = await res.json();
  return {
    id: String(r.id),
    media_type: type,
    title: r.title || r.name || 'Unknown',
    overview: r.overview || '',
    poster_path: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : '',
    backdrop_path: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : '',
    release_date: r.release_date || r.first_air_date || '',
    vote_average: r.vote_average,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genres: (r.genres || []).map((g: any) => g.name),
  };
}

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
