import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  await ensureSchema();

  const { rows: postRows } = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (!postRows[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { rows: existing } = await pool.query(
    'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [session.userId, postId]
  );

  if (existing.length > 0) {
    await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [session.userId, postId]);
    const { rows } = await pool.query<{ c: string }>(
      'SELECT COUNT(*) AS c FROM post_likes WHERE post_id = $1',
      [postId]
    );
    return NextResponse.json({ liked: false, like_count: parseInt(rows[0].c, 10) });
  } else {
    await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [session.userId, postId]);
    const { rows } = await pool.query<{ c: string }>(
      'SELECT COUNT(*) AS c FROM post_likes WHERE post_id = $1',
      [postId]
    );
    return NextResponse.json({ liked: true, like_count: parseInt(rows[0].c, 10) });
  }
}
