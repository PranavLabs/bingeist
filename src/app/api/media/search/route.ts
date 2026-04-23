import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB, searchJikan } from '@/lib/media';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'all'; // all | movie | tv | anime

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const tmdbPromise = (type === 'all' || type === 'movie' || type === 'tv') ? searchTMDB(query) : Promise.resolve([]);
    const animePromise = (type === 'all' || type === 'anime') ? searchJikan(query) : Promise.resolve([]);

    const [tmdbResults, animeResults] = await Promise.all([tmdbPromise, animePromise]);

    let results = [...tmdbResults, ...animeResults];

    if (type === 'movie') results = results.filter(r => r.media_type === 'movie');
    else if (type === 'tv') results = results.filter(r => r.media_type === 'tv');
    else if (type === 'anime') results = results.filter(r => r.media_type === 'anime');

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
