import { NextRequest, NextResponse } from 'next/server';
import { getTVMazePage, getJikanTopPage, getMovieBatch, getOMDbMovie, getTVMazeShow, getJikanAnime, MediaItem } from '@/lib/media';
import { buildUserProfile, scoreItems } from '@/lib/personalization';
import { getSessionUser } from '@/lib/auth';
import pool, { ensureSchema } from '@/lib/db';

interface FeedCursor {
  tvPage: number;
  animePage: number;
  movieOffset: number;
}

function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string | null): FeedCursor {
  const defaults: FeedCursor = { tvPage: 0, animePage: 1, movieOffset: 0 };
  if (!s) return defaults;
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    return {
      tvPage: typeof parsed.tvPage === 'number' ? parsed.tvPage : 0,
      animePage: typeof parsed.animePage === 'number' ? parsed.animePage : 1,
      movieOffset: typeof parsed.movieOffset === 'number' ? parsed.movieOffset : 0,
    };
  } catch {
    return defaults;
  }
}

const MOVIE_BATCH_SIZE = 20;
// Maximum rounds to loop when filters are strict
const MAX_ROUNDS = 5;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursorParam = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 40);
  const typeFilter = searchParams.get('type') ?? 'all'; // all | movie | tv | anime
  const genreFilter = searchParams.get('genre') ?? '';  // comma-separated
  const langFilter = searchParams.get('language') ?? '';

  const genreWanted = genreFilter
    .split(',')
    .map(g => g.trim().toLowerCase())
    .filter(Boolean);
  const langWanted = langFilter.toLowerCase();

  const cursor = decodeCursor(cursorParam);
  let { tvPage, animePage, movieOffset } = cursor;

  function applyFilters(items: MediaItem[]): MediaItem[] {
    let result = items;
    if (typeFilter !== 'all') {
      result = result.filter(i => i.media_type === typeFilter);
    }
    if (genreWanted.length > 0) {
      result = result.filter(item =>
        (item.genres ?? []).some(g => genreWanted.includes(g.toLowerCase()))
      );
    }
    if (langWanted) {
      result = result.filter(item =>
        item.language?.toLowerCase().includes(langWanted)
      );
    }
    return result;
  }

  try {
    const candidates: MediaItem[] = [];
    let rounds = 0;
    let tvExhausted = false;
    let animeExhausted = false;
    let movieExhausted = false;

    // Collect genre/language metadata for the filter UI
    const allGenresSet = new Set<string>();
    const allLanguagesSet = new Set<string>();

    while (candidates.length < limit && rounds < MAX_ROUNDS) {
      const needTv = typeFilter === 'all' || typeFilter === 'tv';
      const needAnime = typeFilter === 'all' || typeFilter === 'anime';
      const needMovie = typeFilter === 'all' || typeFilter === 'movie';

      const [tvResult, animeResult, movieResult] = await Promise.allSettled([
        needTv && !tvExhausted ? getTVMazePage(tvPage) : Promise.resolve([]),
        needAnime && !animeExhausted ? getJikanTopPage(animePage) : Promise.resolve([]),
        needMovie && !movieExhausted ? getMovieBatch(movieOffset, MOVIE_BATCH_SIZE) : Promise.resolve([]),
      ]);

      const tv = tvResult.status === 'fulfilled' ? tvResult.value : [];
      const anime = animeResult.status === 'fulfilled' ? animeResult.value : [];
      const movies = movieResult.status === 'fulfilled' ? movieResult.value : [];

      // Track source exhaustion and advance cursors
      if (needTv) {
        if (tv.length === 0) tvExhausted = true;
        else tvPage++;
      }
      if (needAnime) {
        if (anime.length === 0) animeExhausted = true;
        else animePage++;
      }
      if (needMovie) {
        movieOffset += movies.length;
        if (movies.length < MOVIE_BATCH_SIZE) movieExhausted = true;
      }

      // Collect genre/language metadata from raw items (before type filter)
      [...tv, ...anime, ...movies].forEach(item => {
        (item.genres ?? []).forEach(g => allGenresSet.add(g));
        if (item.language) allLanguagesSet.add(item.language);
      });

      const batch = applyFilters([...tv, ...anime, ...movies]);
      candidates.push(...batch);

      // If all relevant sources are exhausted, stop looping
      const allExhausted =
        (!needTv || tvExhausted) &&
        (!needAnime || animeExhausted) &&
        (!needMovie || movieExhausted);
      if (allExhausted) break;

      rounds++;
    }

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = candidates.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Personalization: build user profile by fetching actual watchlist item details
    let userProfile = null;
    try {
      const session = await getSessionUser();
      if (session) {
        await ensureSchema();
        const { rows: watchlist } = await pool.query(
          `SELECT wi.media_type, wi.media_id
           FROM watchlist_items wi
           WHERE wi.user_id = $1
           LIMIT 20`,
          [session.userId]
        );

        if (watchlist.length > 0) {
          // Fetch real details for each watchlist item to build the user profile.
          // This avoids relying on watchlist items being present in the current feed pool.
          const wlDetails = await Promise.allSettled(
            watchlist.map((row: { media_id: string; media_type: string }) => {
              const { media_id, media_type } = row;
              if (media_type === 'movie') return getOMDbMovie(media_id);
              if (media_type === 'tv') return getTVMazeShow(media_id);
              if (media_type === 'anime') {
                const malId = media_id.replace(/^mal_/, '');
                return getJikanAnime(malId);
              }
              return Promise.resolve(null);
            })
          );

          const wlEntries = wlDetails
            .filter(
              (r): r is PromiseFulfilledResult<MediaItem | null> =>
                r.status === 'fulfilled' && r.value !== null
            )
            .map(r => ({
              media_type: r.value!.media_type,
              genres: r.value!.genres,
              overview: r.value!.overview,
            }));

          if (wlEntries.length > 0) {
            userProfile = buildUserProfile(wlEntries);
          }
        }
      }
    } catch {
      // Non-fatal: if auth/db fails, skip personalization
    }

    // Score items
    const scored = userProfile
      ? scoreItems(unique, userProfile)
      : unique.map(item => ({ item, score: 0, personalised: false }));

    // Sort: personalised items first (by score desc), then the rest
    scored.sort((a, b) => {
      if (a.personalised !== b.personalised) return a.personalised ? -1 : 1;
      return b.score - a.score;
    });

    const page = scored.slice(0, limit);

    // hasMore: true if any relevant source has not been exhausted
    const hasMore =
      ((typeFilter === 'all' || typeFilter === 'tv') && !tvExhausted) ||
      ((typeFilter === 'all' || typeFilter === 'anime') && !animeExhausted) ||
      ((typeFilter === 'all' || typeFilter === 'movie') && !movieExhausted);

    const nextCursor = encodeCursor({ tvPage, animePage, movieOffset });

    return NextResponse.json({
      items: page.map(s => ({ ...s.item, personalised: s.personalised })),
      nextCursor,
      hasMore,
      total: unique.length,
      allGenres: [...allGenresSet].sort(),
      allLanguages: [...allLanguagesSet].sort(),
    });
  } catch (err) {
    console.error('[feed] error:', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
