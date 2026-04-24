import { NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';

export async function GET() {
  await ensureSchema();

  // Combine the latest posts and replies across all titles, ordered by newest first.
  const { rows } = await pool.query(`
    SELECT
      'post'      AS kind,
      p.id,
      p.content,
      p.image_url,
      p.media_id,
      p.media_type,
      p.media_title,
      p.spoiler,
      p.created_at,
      u.username,
      u.avatar_url,
      NULL::integer AS post_id
    FROM posts p
    JOIN users u ON u.id = p.user_id

    UNION ALL

    SELECT
      'reply'     AS kind,
      r.id,
      r.content,
      r.image_url,
      p2.media_id,
      p2.media_type,
      p2.media_title,
      FALSE        AS spoiler,
      r.created_at,
      u2.username,
      u2.avatar_url,
      r.post_id
    FROM replies r
    JOIN users u2 ON u2.id = r.user_id
    JOIN posts p2 ON p2.id = r.post_id

    ORDER BY created_at DESC
    LIMIT 30
  `);

  return NextResponse.json({ activity: rows });
}
