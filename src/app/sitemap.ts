import type { MetadataRoute } from 'next';
import pool, { ensureSchema } from '@/lib/db';

export const revalidate = 86400; // revalidate once per day

// Curated popular media to include in sitemap
const CURATED_MEDIA = [
  // Popular movies (OMDb IDs)
  { id: 'tt0111161', type: 'movie' }, // Shawshank Redemption
  { id: 'tt0068646', type: 'movie' }, // The Godfather
  { id: 'tt0468569', type: 'movie' }, // The Dark Knight
  { id: 'tt0071562', type: 'movie' }, // The Godfather Part II
  { id: 'tt0050083', type: 'movie' }, // 12 Angry Men
  // Popular TV (TVMaze IDs)
  { id: '82', type: 'tv' },          // Game of Thrones
  { id: '169', type: 'tv' },         // Breaking Bad
  { id: '1871', type: 'tv' },        // Stranger Things
  // Popular anime (MAL IDs)
  { id: '5114', type: 'anime' },     // FMA Brotherhood
  { id: '1535', type: 'anime' },     // Death Note
  { id: '11061', type: 'anime' },    // Hunter x Hunter
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${appUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${appUrl}/b`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const mediaRoutes: MetadataRoute.Sitemap = CURATED_MEDIA.map(({ id, type }) => ({
    url: `${appUrl}/media/${id}?type=${type}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  let profileRoutes: MetadataRoute.Sitemap = [];
  let communityRoutes: MetadataRoute.Sitemap = [];
  let communityPostRoutes: MetadataRoute.Sitemap = [];
  try {
    await ensureSchema();
    const { rows: userRows } = await pool.query<{ username: string; created_at: string }>(
      'SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 500'
    );
    profileRoutes = userRows.map(row => ({
      url: `${appUrl}/profile/${encodeURIComponent(row.username)}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const { rows: communityRows } = await pool.query<{ slug: string; created_at: string }>(
      'SELECT slug, created_at FROM communities ORDER BY created_at DESC LIMIT 200'
    );
    communityRoutes = communityRows.map(row => ({
      url: `${appUrl}/b/${encodeURIComponent(row.slug)}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    const { rows: postRows } = await pool.query<{ id: number; community_slug: string; created_at: string }>(
      `SELECT cp.id, c.slug AS community_slug, cp.created_at
       FROM community_posts cp
       JOIN communities c ON c.id = cp.community_id
       WHERE cp.removed = FALSE
       ORDER BY cp.created_at DESC LIMIT 500`
    );
    communityPostRoutes = postRows.map(row => ({
      url: `${appUrl}/b/${encodeURIComponent(row.community_slug)}/post/${row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }));
  } catch {
    // DB may not be available at build time; skip dynamic routes gracefully
  }

  return [...staticRoutes, ...mediaRoutes, ...profileRoutes, ...communityRoutes, ...communityPostRoutes];
}
