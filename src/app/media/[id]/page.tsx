import type { Metadata } from 'next';
import MediaDetailClient from './MediaDetailClient';

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

async function fetchMediaMeta(id: string, type: string) {
  try {
    const base = process.env.APP_URL
      ? process.env.APP_URL.replace(/\/$/, '')
      : `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${base}/api/media/${id}?type=${type}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.media as {
        title: string;
        overview?: string;
        poster_path?: string;
        backdrop_path?: string;
        release_date?: string;
        vote_average?: number;
        genres?: string[];
      } | null;
    }
  } catch {
    // graceful fallback
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { type } = await searchParams;

  if (!type) return { title: 'Media' };

  const media = await fetchMediaMeta(id, type);
  const title = media?.title ?? 'Media';
  const description = media?.overview
    ? media.overview.slice(0, 160)
    : `${title} on Bingeist`;
  const image = media?.poster_path || media?.backdrop_path;
  const canonicalUrl = `${APP_URL}/media/${id}?type=${type}`;
  const typeLabel = type === 'movie' ? 'Movie' : type === 'tv' ? 'TV Show' : 'Anime';

  return {
    title: `${title} (${typeLabel})`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: type === 'movie' ? 'video.movie' : 'video.tv_show',
      url: canonicalUrl,
      title: `${title} | Bingeist`,
      description,
      images: image ? [{ url: image, alt: title }] : undefined,
      siteName: 'Bingeist',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Bingeist`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;

  const media = type ? await fetchMediaMeta(id, type) : null;
  const title = media?.title ?? 'Media';
  const description = media?.overview ? media.overview.slice(0, 160) : `${title} on Bingeist`;
  const image = media?.poster_path || media?.backdrop_path;
  const canonicalUrl = `${APP_URL}/media/${id}?type=${type ?? ''}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Search', item: `${APP_URL}/search` },
      { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
    ],
  };

  const schemaType =
    type === 'movie' ? 'Movie' : 'TVSeries';
  const mediaJsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description,
    url: canonicalUrl,
    ...(image ? { image } : {}),
    ...(media?.release_date ? { datePublished: media.release_date } : {}),
    ...(media?.genres?.length ? { genre: media.genres } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mediaJsonLd) }}
      />
      <MediaDetailClient params={params} />
    </>
  );
}
