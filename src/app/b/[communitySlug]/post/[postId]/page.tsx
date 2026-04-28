import type { Metadata } from 'next';
import PostPageClient from './PostPageClient';

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

interface PageProps {
  params: Promise<{ communitySlug: string; postId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { communitySlug, postId } = await params;
  const canonicalUrl = `${APP_URL}/b/${communitySlug}/post/${postId}`;

  try {
    const base = process.env.APP_URL
      ? process.env.APP_URL.replace(/\/$/, '')
      : `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${base}/api/community-posts/${postId}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const post = data.post;
      return {
        title: `${post.title} — /b/${communitySlug} | Bingeist Forums`,
        description: post.body
          ? post.body.slice(0, 160)
          : `Discussion in /b/${communitySlug} on Bingeist.`,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          url: canonicalUrl,
          title: `${post.title} | Bingeist Forums`,
          description: post.body ? post.body.slice(0, 160) : `Discussion in /b/${communitySlug} on Bingeist.`,
          siteName: 'Bingeist',
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    title: `Post | /b/${communitySlug} | Bingeist Forums`,
    alternates: { canonical: canonicalUrl },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { postId } = await params;
  return <PostPageClient postId={postId} />;
}
