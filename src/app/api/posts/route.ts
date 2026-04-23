import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const media_id = searchParams.get('media_id');
  const media_type = searchParams.get('media_type');

  if (!media_id || !media_type) {
    return NextResponse.json({ error: 'media_id and media_type are required' }, { status: 400 });
  }

  const session = await getSessionUser();
  const db = getDb();

  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar_url,
      (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) as reply_count,
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count
      ${session ? ', (SELECT COUNT(*) FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = ?) as user_liked' : ''}
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.media_id = ? AND p.media_type = ?
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all(...(session ? [session.userId] : []), media_id, media_type);

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_id, media_type, media_title, content, spoiler } = await req.json();

  if (!media_id || !media_type || !media_title || !content?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Post content cannot exceed 2000 characters' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO posts (user_id, media_id, media_type, media_title, content, spoiler) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(session.userId, media_id, media_type, media_title, content.trim(), spoiler ? 1 : 0);

  const post = db.prepare(`
    SELECT p.*, u.username, u.avatar_url, 0 as reply_count, 0 as like_count, 0 as user_liked
    FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(result.lastInsertRowid);

  return NextResponse.json({ post }, { status: 201 });
}
