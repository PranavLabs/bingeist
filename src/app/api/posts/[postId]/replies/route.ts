import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const db = getDb();

  const replies = db.prepare(`
    SELECT r.*, u.username, u.avatar_url
    FROM replies r
    JOIN users u ON u.id = r.user_id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC
  `).all(postId);

  return NextResponse.json({ replies });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: 'Reply cannot exceed 1000 characters' }, { status: 400 });
  }

  const db = getDb();
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const result = db.prepare(
    'INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(postId, session.userId, content.trim());

  const reply = db.prepare(`
    SELECT r.*, u.username, u.avatar_url
    FROM replies r JOIN users u ON u.id = r.user_id WHERE r.id = ?
  `).get(result.lastInsertRowid);

  return NextResponse.json({ reply }, { status: 201 });
}
