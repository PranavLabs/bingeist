import { NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });

  await ensureSchema();
  const { rows } = await pool.query<{
    id: number;
    username: string;
    email: string;
    bio: string;
    avatar_url: string;
    created_at: string;
  }>(
    'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = $1',
    [session.userId]
  );
  const user = rows[0];

  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}

export async function DELETE() {
  const { COOKIE_NAME } = await import('@/lib/auth');
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
