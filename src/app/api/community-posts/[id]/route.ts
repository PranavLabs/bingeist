import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ensureSchema();

  const { rows } = await pool.query(
    `SELECT cp.id, cp.title, cp.body, cp.image_url, cp.removed, cp.locked, cp.created_at,
      u.username,
      c.slug AS community_slug, c.title AS community_title,
      (SELECT COUNT(*) FROM community_post_hearts h WHERE h.post_id = cp.id)::int AS heart_count,
      (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id AND cc.removed = FALSE)::int AS comment_count
     FROM community_posts cp
     JOIN users u ON u.id = cp.user_id
     JOIN communities c ON c.id = cp.community_id
     WHERE cp.id = $1`,
    [id]
  );
  if (!rows[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const session = await getSessionUser();
  let user_hearted = false;
  let userRole: string | null = null;
  if (session) {
    const { rows: heartRows } = await pool.query(
      'SELECT 1 FROM community_post_hearts WHERE user_id = $1 AND post_id = $2',
      [session.userId, id]
    );
    user_hearted = heartRows.length > 0;

    const { rows: memberRows } = await pool.query(
      `SELECT role FROM community_members cm
       JOIN community_posts cp ON cp.community_id = cm.community_id
       WHERE cp.id = $1 AND cm.user_id = $2`,
      [id, session.userId]
    );
    userRole = memberRows[0]?.role || null;
  }

  return NextResponse.json({ post: { ...rows[0], user_hearted, user_role: userRole } });
}
