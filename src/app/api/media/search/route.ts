import { NextRequest, NextResponse } from 'next/server';
import { searchTVMaze, searchOMDb, searchJikan } from '@/lib/media';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'all'; // all | movie | tv | anime

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const tvPromise = (type === 'all' || type === 'tv') ? searchTVMaze(query) : Promise.resolve([]);
    const moviePromise = (type === 'all' || type === 'movie') ? searchOMDb(query) : Promise.resolve([]);
    const animePromise = (type === 'all' || type === 'anime') ? searchJikan(query) : Promise.resolve([]);

    const [tvResults, movieResults, animeResults] = await Promise.all([tvPromise, moviePromise, animePromise]);

    const results = [...movieResults, ...tvResults, ...animeResults];

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
