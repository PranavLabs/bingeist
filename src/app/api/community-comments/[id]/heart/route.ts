import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();

  const { rows: commentRows } = await pool.query('SELECT id FROM community_comments WHERE id = $1', [id]);
  if (!commentRows[0]) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const { rows: existing } = await pool.query(
    'SELECT 1 FROM community_comment_hearts WHERE user_id = $1 AND comment_id = $2',
    [session.userId, id]
  );

  if (existing.length > 0) {
    await pool.query('DELETE FROM community_comment_hearts WHERE user_id = $1 AND comment_id = $2', [session.userId, id]);
  } else {
    await pool.query('INSERT INTO community_comment_hearts (user_id, comment_id) VALUES ($1, $2)', [session.userId, id]);
  }

  const { rows } = await pool.query<{ c: string }>(
    'SELECT COUNT(*) AS c FROM community_comment_hearts WHERE comment_id = $1',
    [id]
  );
  return NextResponse.json({ hearted: existing.length === 0, count: parseInt(rows[0].c, 10) });
}
