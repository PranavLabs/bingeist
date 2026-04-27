import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (!['remove', 'restore'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await ensureSchema();

  const { rows: memberRows } = await pool.query(
    `SELECT cm.role FROM community_members cm
     JOIN community_posts cp ON cp.community_id = cm.community_id
     JOIN community_comments cc ON cc.post_id = cp.id
     WHERE cc.id = $1 AND cm.user_id = $2`,
    [id, session.userId]
  );
  if (!memberRows[0] || !['owner', 'mod'].includes(memberRows[0].role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'remove') {
    await pool.query('UPDATE community_comments SET removed = TRUE WHERE id = $1', [id]);
  } else if (action === 'restore') {
    await pool.query('UPDATE community_comments SET removed = FALSE WHERE id = $1', [id]);
  }

  return NextResponse.json({ success: true });
}
