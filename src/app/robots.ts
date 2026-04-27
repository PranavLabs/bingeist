import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/watchlist'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
