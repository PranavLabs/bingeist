import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const db = getDb();

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const existing = db.prepare('SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?').get(session.userId, postId);

  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?').run(session.userId, postId);
    const count = (db.prepare('SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?').get(postId) as { c: number }).c;
    return NextResponse.json({ liked: false, like_count: count });
  } else {
    db.prepare('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)').run(session.userId, postId);
    const count = (db.prepare('SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?').get(postId) as { c: number }).c;
    return NextResponse.json({ liked: true, like_count: count });
  }
}
