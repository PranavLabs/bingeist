import Link from 'next/link';
import FeedGrid from '@/components/FeedGrid';
import LatestActivity from '@/components/LatestActivity';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden mesh-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter glow text-emerald-400 mb-4 relative">
          BINGEIST<span className="animate-pulse">_</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-8 leading-relaxed relative">
          Your social watchlist for movies, TV shows &amp; anime.<br />
          Track, rate, share and discuss with your community.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-8 relative">
          <Link
            href="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/25"
          >
            Get Started
          </Link>
          <Link
            href="/search"
            className="glass-card hover:border-emerald-500/30 text-gray-300 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Browse Content
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full text-left relative">
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
            <div key={f.title} className="glass-card glass-noise rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-200 mb-1 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feed + Activity */}
      <div className="max-w-7xl mx-auto px-4 w-full pb-16 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Infinite scroll feed */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-100">Discover</h2>
              <span className="text-xs text-gray-500 glass-badge px-2 py-1 rounded-full">
                Mixed feed · infinite scroll
              </span>
            </div>
            <FeedGrid />
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

      <footer className="border-t border-white/5 py-4 text-center text-xs text-gray-600">
        BINGEIST v2 — 2026 · Powered by TVMaze, OMDb &amp; MyAnimeList
      </footer>
    </div>
  );
}


