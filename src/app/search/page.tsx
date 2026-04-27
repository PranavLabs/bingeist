import type { Metadata } from 'next';
import SearchClient from './SearchClient';

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Search Movies, TV Shows & Anime',
  description:
    'Search and discover movies, TV shows, and anime. Find titles, check ratings, and add them to your watchlist on Bingeist.',
  alternates: { canonical: `${APP_URL}/search` },
  openGraph: {
    type: 'website',
    url: `${APP_URL}/search`,
    title: 'Search | Bingeist',
    description: 'Search and discover movies, TV shows, and anime on Bingeist.',
    siteName: 'Bingeist',
  },
  twitter: {
    card: 'summary',
    title: 'Search | Bingeist',
    description: 'Search and discover movies, TV shows, and anime on Bingeist.',
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
