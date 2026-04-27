import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getSessionUser();
  await ensureSchema();

  const { rows: communityRows } = await pool.query(
    `SELECT c.id, c.slug, c.title, c.description, c.rules, c.created_at,
      COUNT(DISTINCT cm.user_id)::int AS member_count
     FROM communities c
     LEFT JOIN community_members cm ON cm.community_id = c.id
     WHERE c.slug = $1
     GROUP BY c.id`,
    [slug]
  );
  if (!communityRows[0]) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  const community = communityRows[0];

  let userMembership = null;
  if (session) {
    const { rows } = await pool.query(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [community.id, session.userId]
    );
    if (rows[0]) userMembership = rows[0].role;
  }

  const { rows: posts } = session
    ? await pool.query(
        `SELECT cp.id, cp.title, cp.body, cp.image_url, cp.removed, cp.locked, cp.created_at,
          u.username,
          (SELECT COUNT(*) FROM community_post_hearts h WHERE h.post_id = cp.id)::int AS heart_count,
          (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id AND cc.removed = FALSE)::int AS comment_count,
          (SELECT COUNT(*) FROM community_post_hearts h2 WHERE h2.post_id = cp.id AND h2.user_id = $2)::int AS user_hearted
         FROM community_posts cp
         JOIN users u ON u.id = cp.user_id
         WHERE cp.community_id = $1
         ORDER BY cp.created_at DESC
         LIMIT 30`,
        [community.id, session.userId]
      )
    : await pool.query(
        `SELECT cp.id, cp.title, cp.body, cp.image_url, cp.removed, cp.locked, cp.created_at,
          u.username,
          (SELECT COUNT(*) FROM community_post_hearts h WHERE h.post_id = cp.id)::int AS heart_count,
          (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id AND cc.removed = FALSE)::int AS comment_count,
          0 AS user_hearted
         FROM community_posts cp
         JOIN users u ON u.id = cp.user_id
         WHERE cp.community_id = $1
         ORDER BY cp.created_at DESC
         LIMIT 30`,
        [community.id]
      );

  return NextResponse.json({ community, posts, userMembership });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  await ensureSchema();

  const { rows: communityRows } = await pool.query(
    'SELECT id FROM communities WHERE slug = $1',
    [slug]
  );
  if (!communityRows[0]) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  const communityId = communityRows[0].id;

  const { rows: existing } = await pool.query(
    'SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2',
    [communityId, session.userId]
  );
  if (!existing[0]) {
    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'member')`,
      [communityId, session.userId]
    );
  }

  return NextResponse.json({ joined: true, role: existing[0]?.role || 'member' });
}
