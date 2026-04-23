import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUsername = searchParams.get('username');

  let userId: number;

  if (targetUsername) {
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername) as { id: number } | undefined;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    userId = user.id;
  } else {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = session.userId;
  }

  const db = getDb();
  const items = db.prepare(
    'SELECT * FROM watchlist_items WHERE user_id = ? ORDER BY added_at DESC'
  ).all(userId);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type, title, poster_path, status } = await req.json();

  if (!media_id || !media_type || !title) {
    return NextResponse.json({ error: 'media_id, media_type, and title are required' }, { status: 400 });
  }

  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO watchlist_items (user_id, media_id, media_type, title, poster_path, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET status = excluded.status`
    ).run(session.userId, media_id, media_type, title, poster_path || '', status || 'plan_to_watch');

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

  const db = getDb();
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (status) { updates.push('status = ?'); values.push(status); }
  if (rating !== undefined) { updates.push('rating = ?'); values.push(rating); }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  values.push(session.userId, media_id, media_type);
  db.prepare(
    `UPDATE watchlist_items SET ${updates.join(', ')} WHERE user_id = ? AND media_id = ? AND media_type = ?`
  ).run(...values);

  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type } = await req.json();

  if (!media_id || !media_type) {
    return NextResponse.json({ error: 'media_id and media_type are required' }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    'DELETE FROM watchlist_items WHERE user_id = ? AND media_id = ? AND media_type = ?'
  ).run(session.userId, media_id, media_type);

  return NextResponse.json({ message: 'Removed from watchlist' });
}
