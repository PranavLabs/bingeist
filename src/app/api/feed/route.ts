import { NextRequest, NextResponse } from 'next/server';
import { getFeedPool } from '@/lib/media';
import { buildUserProfile, scoreItems } from '@/lib/personalization';
import { getSessionUser } from '@/lib/auth';
import pool, { ensureSchema } from '@/lib/db';

// Re-validate the pool every hour
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = parseInt(searchParams.get('cursor') ?? '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 40);
  const typeFilter = searchParams.get('type') ?? 'all'; // all | movie | tv | anime
  const genreFilter = searchParams.get('genre') ?? '';  // comma-separated
  const langFilter = searchParams.get('language') ?? '';

  try {
    // Fetch the full candidate pool (cached by Next.js)
    let pool_items = await getFeedPool();

    // Apply type filter
    if (typeFilter !== 'all') {
      pool_items = pool_items.filter(i => i.media_type === typeFilter);
    }

    // Apply genre filter (any match)
    if (genreFilter) {
      const wanted = genreFilter.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
      if (wanted.length > 0) {
        pool_items = pool_items.filter(item =>
          (item.genres ?? []).some(g => wanted.includes(g.toLowerCase()))
        );
      }
    }

    // Apply language filter
    if (langFilter) {
      const wantedLang = langFilter.toLowerCase();
      pool_items = pool_items.filter(item =>
        item.language?.toLowerCase().includes(wantedLang)
      );
    }

    // Personalisation: score items if the user is logged in
    let userProfile = null;
    try {
      const session = await getSessionUser();
      if (session) {
        await ensureSchema();
        const { rows: watchlist } = await pool.query(
          `SELECT wi.media_type, wi.media_id
           FROM watchlist_items wi
           WHERE wi.user_id = $1`,
          [session.userId]
        );

        if (watchlist.length > 0) {
          // We use the pool_items we already have (pre-fetched) to get genres/overviews
          // for items in the watchlist where possible (avoids extra API calls)
          const poolMap = new Map(pool_items.map(i => [i.id, i]));
          const wlEntries = watchlist.map((row: { media_id: string; media_type: string }) => {
            const found = poolMap.get(row.media_id);
            return {
              media_type: row.media_type as 'movie' | 'tv' | 'anime',
              genres: found?.genres,
              overview: found?.overview,
            };
          });
          userProfile = buildUserProfile(wlEntries);
        }
      }
    } catch {
      // Non-fatal: if auth/db fails, just skip personalisation
    }

    // Score items
    const scored = userProfile
      ? scoreItems(pool_items, userProfile)
      : pool_items.map(item => ({ item, score: 0, personalised: false }));

    // Sort: personalised first (by score desc), then the rest
    scored.sort((a, b) => b.score - a.score);

    // Collect all available genres and languages for filter UI
    const allGenres = [...new Set(pool_items.flatMap(i => i.genres ?? []))].sort();
    const allLanguages = [...new Set(pool_items.map(i => i.language).filter(Boolean) as string[])].sort();

    // Paginate
    const page = scored.slice(cursor, cursor + limit);
    const hasMore = cursor + limit < scored.length;
    const nextCursor = hasMore ? cursor + limit : null;

    return NextResponse.json({
      items: page.map(s => ({ ...s.item, personalised: s.personalised })),
      nextCursor,
      hasMore,
      total: scored.length,
      allGenres,
      allLanguages,
    });
  } catch (err) {
    console.error('[feed] error:', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
