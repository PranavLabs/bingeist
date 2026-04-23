import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  await ensureSchema();

  const { rows: replies } = await pool.query(
    `SELECT r.*, u.username, u.avatar_url
     FROM replies r
     JOIN users u ON u.id = r.user_id
     WHERE r.post_id = $1
     ORDER BY r.created_at ASC`,
    [postId]
  );

  return NextResponse.json({ replies });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: 'Reply cannot exceed 1000 characters' }, { status: 400 });
  }

  await ensureSchema();
  const { rows: postRows } = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (!postRows[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { rows: inserted } = await pool.query<{ id: number }>(
    'INSERT INTO replies (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
    [postId, session.userId, content.trim()]
  );

  const { rows } = await pool.query(
    `SELECT r.*, u.username, u.avatar_url
     FROM replies r JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
    [inserted[0].id]
  );

  return NextResponse.json({ reply: rows[0] }, { status: 201 });
}
