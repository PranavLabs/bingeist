import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  await ensureSchema();

  const { rows } = await pool.query<{
    id: number;
    username: string;
    bio: string;
    avatar_url: string;
    created_at: string;
  }>(
    'SELECT id, username, bio, avatar_url, created_at FROM users WHERE username = $1',
    [username]
  );
  const user = rows[0];

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [watchingRes, completedRes, planRes, postsRes] = await Promise.all([
    pool.query<{ c: string }>("SELECT COUNT(*) AS c FROM watchlist_items WHERE user_id = $1 AND status = 'watching'", [user.id]),
    pool.query<{ c: string }>("SELECT COUNT(*) AS c FROM watchlist_items WHERE user_id = $1 AND status = 'completed'", [user.id]),
    pool.query<{ c: string }>("SELECT COUNT(*) AS c FROM watchlist_items WHERE user_id = $1 AND status = 'plan_to_watch'", [user.id]),
    pool.query<{ c: string }>('SELECT COUNT(*) AS c FROM posts WHERE user_id = $1', [user.id]),
  ]);

  const stats = {
    watching: parseInt(watchingRes.rows[0].c, 10),
    completed: parseInt(completedRes.rows[0].c, 10),
    plan_to_watch: parseInt(planRes.rows[0].c, 10),
    posts: parseInt(postsRes.rows[0].c, 10),
  };

  return NextResponse.json({ user, stats });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = await params;
  if (session.username !== username) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { bio, avatar_url } = await req.json();

  await ensureSchema();
  await pool.query(
    'UPDATE users SET bio = $1, avatar_url = $2 WHERE id = $3',
    [bio ?? '', avatar_url ?? '', session.userId]
  );

  return NextResponse.json({ message: 'Profile updated' });
}
