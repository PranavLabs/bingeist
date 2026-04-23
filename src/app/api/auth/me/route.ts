import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });

  const db = getDb();
  const user = db.prepare('SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?').get(session.userId) as
    | { id: number; username: string; email: string; bio: string; avatar_url: string; created_at: string }
    | undefined;

  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}

export async function DELETE() {
  const { COOKIE_NAME } = await import('@/lib/auth');
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
