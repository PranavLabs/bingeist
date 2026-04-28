import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  await ensureSchema();

  const { rows: postRows } = await pool.query(
    'SELECT id FROM community_posts WHERE id = $1',
    [id]
  );
  if (!postRows[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { rows } = session
    ? await pool.query(
        `SELECT cc.id, cc.post_id, cc.parent_comment_id, cc.body, cc.removed, cc.created_at,
          u.username,
          (SELECT COUNT(*) FROM community_comment_hearts h WHERE h.comment_id = cc.id)::int AS heart_count,
          (SELECT COUNT(*) FROM community_comment_hearts h2 WHERE h2.comment_id = cc.id AND h2.user_id = $2)::int AS user_hearted
         FROM community_comments cc
         JOIN users u ON u.id = cc.user_id
         WHERE cc.post_id = $1
         ORDER BY cc.created_at ASC`,
        [id, session.userId]
      )
    : await pool.query(
        `SELECT cc.id, cc.post_id, cc.parent_comment_id, cc.body, cc.removed, cc.created_at,
          u.username,
          (SELECT COUNT(*) FROM community_comment_hearts h WHERE h.comment_id = cc.id)::int AS heart_count,
          0 AS user_hearted
         FROM community_comments cc
         JOIN users u ON u.id = cc.user_id
         WHERE cc.post_id = $1
         ORDER BY cc.created_at ASC`,
        [id]
      );

  return NextResponse.json({ comments: rows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { body, parent_comment_id } = await req.json();

  if (!body?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 });

  await ensureSchema();

  const { rows: postRows } = await pool.query(
    'SELECT id, locked FROM community_posts WHERE id = $1',
    [id]
  );
  if (!postRows[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (postRows[0].locked) return NextResponse.json({ error: 'Post is locked' }, { status: 403 });

  if (parent_comment_id) {
    const { rows: parentRows } = await pool.query(
      'SELECT id FROM community_comments WHERE id = $1 AND post_id = $2',
      [parent_comment_id, id]
    );
    if (!parentRows[0]) return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
  }

  const { rows } = await pool.query(
    `INSERT INTO community_comments (post_id, user_id, parent_comment_id, body)
     VALUES ($1, $2, $3, $4) RETURNING id, post_id, parent_comment_id, body, removed, created_at`,
    [id, session.userId, parent_comment_id || null, body.trim()]
  );

  return NextResponse.json({ comment: { ...rows[0], username: session.username, heart_count: 0, user_hearted: 0 } }, { status: 201 });
}
