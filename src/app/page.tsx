import Link from 'next/link';
import MediaCard from '@/components/MediaCard';
import LatestActivity from '@/components/LatestActivity';
import { getTrendingAnime, getTrendingTV, getTrendingMovies } from '@/lib/media';

export const revalidate = 3600; // ISR: revalidate trending data every hour

async function TrendingSection({
  title,
  emoji,
  color,
  items,
}: {
  title: string;
  emoji: string;
  color: string;
  items: Awaited<ReturnType<typeof getTrendingAnime>>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${color}`}>
        <span>{emoji}</span>
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.slice(0, 10).map(item => (
          <MediaCard
            key={item.id}
            id={item.id}
            media_type={item.media_type}
            title={item.title}
            poster_path={item.poster_path}
            overview={item.overview}
            vote_average={item.vote_average}
            release_date={item.release_date}
          />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [trendingAnime, trendingTV, trendingMovies] = await Promise.all([
    getTrendingAnime().catch(() => []),
    getTrendingTV().catch(() => []),
    getTrendingMovies().catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter glow text-emerald-400 mb-4">
          BINGEIST<span className="animate-pulse">_</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-8 leading-relaxed">
          Your social watchlist for movies, TV shows &amp; anime.<br />
          Track, rate, share and discuss with your community.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Link
            href="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Get Started
          </Link>
          <Link
            href="/search"
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500/30 text-gray-300 font-medium px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Browse Content
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          {[
            {
              icon: '🎬',
              title: 'Massive Catalog',
              desc: 'Search movies via OMDb, TV shows via TVMaze, and anime via MyAnimeList — all in one place.',
            },
            {
              icon: '📋',
              title: 'Smart Watchlist',
              desc: 'Organize your queue with statuses: Watching, Completed, Plan to Watch, and more.',
            },
            {
              icon: '💬',
              title: 'Social Threads',
              desc: 'Start discussions, share reviews, and reply to threads for any title — with spoiler guards.',
            },
          ].map(f => (
            <div key={f.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-emerald-500/20 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-200 mb-1 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending + Activity */}
      <div className="max-w-7xl mx-auto px-4 w-full pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Trending columns */}
          <div className="flex-1 min-w-0">
            <TrendingSection
              title="Trending Anime"
              emoji="🌸"
              color="text-pink-400"
              items={trendingAnime}
            />
            <TrendingSection
              title="Trending TV Shows"
              emoji="📺"
              color="text-purple-400"
              items={trendingTV}
            />
            <TrendingSection
              title="Popular Movies"
              emoji="🎬"
              color="text-blue-400"
              items={trendingMovies}
            />
          </div>

          {/* Latest Activity sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <span>🌐</span> Latest Activity
            </h2>
            <LatestActivity />
          </aside>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        BINGEIST v1 — 2026 · Powered by TVMaze, OMDb &amp; MyAnimeList
      </footer>
    </div>
  );
}

