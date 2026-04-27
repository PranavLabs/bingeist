import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { title, body, image_url } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const cleanImageUrl = image_url?.trim() || null;
  if (cleanImageUrl && !isValidImageUrl(cleanImageUrl)) {
    return NextResponse.json({ error: 'image_url must be a valid https:// URL' }, { status: 400 });
  }

  await ensureSchema();

  const { rows: communityRows } = await pool.query(
    'SELECT id FROM communities WHERE slug = $1',
    [slug]
  );
  if (!communityRows[0]) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  const communityId = communityRows[0].id;

  const { rows: membership } = await pool.query(
    'SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2',
    [communityId, session.userId]
  );
  if (!membership[0]) {
    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'member')`,
      [communityId, session.userId]
    );
  }

  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO community_posts (community_id, user_id, title, body, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [communityId, session.userId, title.trim(), body?.trim() || '', cleanImageUrl]
  );

  return NextResponse.json({ post: { id: rows[0].id } }, { status: 201 });
}
