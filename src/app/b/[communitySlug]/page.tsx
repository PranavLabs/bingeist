import type { Metadata } from 'next';
import CommunityPageClient from './CommunityPageClient';

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

interface PageProps {
  params: Promise<{ communitySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { communitySlug } = await params;
  const canonicalUrl = `${APP_URL}/b/${communitySlug}`;

  try {
    const base = process.env.APP_URL
      ? process.env.APP_URL.replace(/\/$/, '')
      : `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${base}/api/communities/${communitySlug}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const community = data.community;
      return {
        title: `${community.title} Community | Bingeist`,
        description: community.description || `Join the ${community.title} community on Bingeist.`,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          url: canonicalUrl,
          title: `${community.title} | Bingeist Forums`,
          description: community.description || `Join the ${community.title} community on Bingeist.`,
          siteName: 'Bingeist',
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    title: `${communitySlug} | Bingeist Forums`,
    alternates: { canonical: canonicalUrl },
  };
}

export default async function CommunityPage({ params }: PageProps) {
  const { communitySlug } = await params;
  return <CommunityPageClient slug={communitySlug} />;
}
