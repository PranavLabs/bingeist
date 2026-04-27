import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const canonicalUrl = `${APP_URL}/profile/${encodeURIComponent(username)}`;

  let bio: string | undefined;
  let avatarUrl: string | undefined;

  try {
    const base = process.env.APP_URL
      ? process.env.APP_URL.replace(/\/$/, '')
      : `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${base}/api/profile/${username}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      bio = data.user?.bio;
      avatarUrl = data.user?.avatar_url;
    }
  } catch {
    // graceful fallback
  }

  const title = `@${username} on Bingeist`;
  const description = bio || `Check out ${username}'s watchlist and reviews on Bingeist.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title: `${title} | Bingeist`,
      description,
      images: avatarUrl ? [{ url: avatarUrl, alt: `${username}'s avatar` }] : undefined,
      siteName: 'Bingeist',
    },
    twitter: {
      card: 'summary',
      title: `${title} | Bingeist`,
      description,
      images: avatarUrl ? [avatarUrl] : undefined,
    },
  };
}

export default function ProfilePage({ params }: PageProps) {
  return <ProfileClient params={params} />;
}
