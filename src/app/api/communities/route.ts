import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export async function GET() {
  await ensureSchema();
  const { rows } = await pool.query(`
    SELECT c.id, c.slug, c.title, c.description, c.created_at,
      COUNT(DISTINCT cm.user_id)::int AS member_count,
      COUNT(DISTINCT cp.id)::int AS post_count
    FROM communities c
    LEFT JOIN community_members cm ON cm.community_id = c.id
    LEFT JOIN community_posts cp ON cp.community_id = c.id
    GROUP BY c.id
    ORDER BY member_count DESC, c.created_at DESC
  `);
  return NextResponse.json({ communities: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, rules } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const slug = generateSlug(title.trim());
  if (!slug) return NextResponse.json({ error: 'Invalid title for slug generation' }, { status: 400 });

  await ensureSchema();

  const { rows: existing } = await pool.query('SELECT id FROM communities WHERE slug = $1', [slug]);
  if (existing.length > 0) return NextResponse.json({ error: 'A community with this name already exists' }, { status: 409 });

  const { rows } = await pool.query<{ id: number; slug: string }>(
    `INSERT INTO communities (slug, title, description, rules, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, slug`,
    [slug, title.trim(), description?.trim() || '', rules?.trim() || '', session.userId]
  );
  const community = rows[0];

  await pool.query(
    `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [community.id, session.userId]
  );

  return NextResponse.json({ community }, { status: 201 });
}
