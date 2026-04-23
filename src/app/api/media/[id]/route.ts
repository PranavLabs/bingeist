import { NextRequest, NextResponse } from 'next/server';
import { getTMDBMedia, getJikanAnime } from '@/lib/media';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const type = new URL(_req.url).searchParams.get('type') as 'movie' | 'tv' | 'anime' | null;

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

  try {
    let media = null;
    if (type === 'anime') {
      const malId = id.startsWith('mal_') ? id.slice(4) : id;
      media = await getJikanAnime(malId);
    } else {
      media = await getTMDBMedia(id, type);
    }

    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ media });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
