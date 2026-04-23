import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const media_id = searchParams.get('media_id');
  const media_type = searchParams.get('media_type');

  if (!media_id || !media_type) {
    return NextResponse.json({ error: 'media_id and media_type are required' }, { status: 400 });
  }

  const session = await getSessionUser();
  await ensureSchema();

  let posts;
  if (session) {
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id)::int AS reply_count,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id)::int AS like_count,
        (SELECT COUNT(*) FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = $1)::int AS user_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.media_id = $2 AND p.media_type = $3
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [session.userId, media_id, media_type]
    );
    posts = rows;
  } else {
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id)::int AS reply_count,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id)::int AS like_count,
        0 AS user_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.media_id = $1 AND p.media_type = $2
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [media_id, media_type]
    );
    posts = rows;
  }

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

  await ensureSchema();
  const { rows: inserted } = await pool.query<{ id: number }>(
    'INSERT INTO posts (user_id, media_id, media_type, media_title, content, spoiler) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [session.userId, media_id, media_type, media_title, content.trim(), spoiler ? true : false]
  );

  const { rows } = await pool.query(
    `SELECT p.*, u.username, u.avatar_url, 0 AS reply_count, 0 AS like_count, 0 AS user_liked
     FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = $1`,
    [inserted[0].id]
  );

  return NextResponse.json({ post: rows[0] }, { status: 201 });
}
