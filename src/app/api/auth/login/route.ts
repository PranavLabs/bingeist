import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { ensureSchema } from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await ensureSchema();
    const { rows } = await pool.query<{ id: number; username: string; password_hash: string }>(
      'SELECT id, username, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, username: user.username });

    const res = NextResponse.json({ message: 'Logged in', username: user.username });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
