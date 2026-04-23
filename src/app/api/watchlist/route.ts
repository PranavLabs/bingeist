import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUsername = searchParams.get('username');

  await ensureSchema();
  let userId: number;

  if (targetUsername) {
    const { rows } = await pool.query<{ id: number }>(
      'SELECT id FROM users WHERE username = $1',
      [targetUsername]
    );
    if (!rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    userId = rows[0].id;
  } else {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = session.userId;
  }

  const { rows: items } = await pool.query(
    'SELECT * FROM watchlist_items WHERE user_id = $1 ORDER BY added_at DESC',
    [userId]
  );

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type, title, poster_path, status } = await req.json();

  if (!media_id || !media_type || !title) {
    return NextResponse.json({ error: 'media_id, media_type, and title are required' }, { status: 400 });
  }

  await ensureSchema();
  try {
    await pool.query(
      `INSERT INTO watchlist_items (user_id, media_id, media_type, title, poster_path, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET status = EXCLUDED.status`,
      [session.userId, media_id, media_type, title, poster_path || '', status || 'plan_to_watch']
    );

    return NextResponse.json({ message: 'Added to watchlist' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type, status, rating } = await req.json();

  if (!media_id || !media_type) {
    return NextResponse.json({ error: 'media_id and media_type are required' }, { status: 400 });
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (status) { updates.push(`status = $${values.push(status)}`); }
  if (rating !== undefined) { updates.push(`rating = $${values.push(rating)}`); }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const userIdIdx = values.push(session.userId);
  const mediaIdIdx = values.push(media_id);
  const mediaTypeIdx = values.push(media_type);

  await ensureSchema();
  await pool.query(
    `UPDATE watchlist_items SET ${updates.join(', ')} WHERE user_id = $${userIdIdx} AND media_id = $${mediaIdIdx} AND media_type = $${mediaTypeIdx}`,
    values
  );

  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type } = await req.json();

  if (!media_id || !media_type) {
    return NextResponse.json({ error: 'media_id and media_type are required' }, { status: 400 });
  }

  await ensureSchema();
  await pool.query(
    'DELETE FROM watchlist_items WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
    [session.userId, media_id, media_type]
  );

  return NextResponse.json({ message: 'Removed from watchlist' });
}
