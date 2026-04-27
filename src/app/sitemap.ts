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
  ];

  const mediaRoutes: MetadataRoute.Sitemap = CURATED_MEDIA.map(({ id, type }) => ({
    url: `${appUrl}/media/${id}?type=${type}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    await ensureSchema();
    const { rows } = await pool.query<{ username: string; created_at: string }>(
      'SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 500'
    );
    profileRoutes = rows.map(row => ({
      url: `${appUrl}/profile/${encodeURIComponent(row.username)}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // DB may not be available at build time; skip profile routes gracefully
  }

  return [...staticRoutes, ...mediaRoutes, ...profileRoutes];
}
