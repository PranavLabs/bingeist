import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const db = getDb();

  const user = db.prepare(
    'SELECT id, username, bio, avatar_url, created_at FROM users WHERE username = ?'
  ).get(username) as { id: number; username: string; bio: string; avatar_url: string; created_at: string } | undefined;

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const stats = {
    watching: (db.prepare("SELECT COUNT(*) as c FROM watchlist_items WHERE user_id = ? AND status = 'watching'").get(user.id) as { c: number }).c,
    completed: (db.prepare("SELECT COUNT(*) as c FROM watchlist_items WHERE user_id = ? AND status = 'completed'").get(user.id) as { c: number }).c,
    plan_to_watch: (db.prepare("SELECT COUNT(*) as c FROM watchlist_items WHERE user_id = ? AND status = 'plan_to_watch'").get(user.id) as { c: number }).c,
    posts: (db.prepare("SELECT COUNT(*) as c FROM posts WHERE user_id = ?").get(user.id) as { c: number }).c,
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

  const db = getDb();
  db.prepare('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?').run(
    bio ?? '',
    avatar_url ?? '',
    session.userId
  );

  return NextResponse.json({ message: 'Profile updated' });
}
