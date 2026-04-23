import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter glow text-emerald-400 mb-4">
          BINGEIST<span className="animate-pulse">_</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-8 leading-relaxed">
          Your social watchlist for movies, TV shows &amp; anime.<br />
          Track, rate, share and discuss with your community.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-12">
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
              desc: 'Search millions of movies, TV shows, and anime from TMDB and MyAnimeList.',
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

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        BINGEIST v1 — 2026 · Powered by TMDB &amp; MyAnimeList
      </footer>
    </div>
  );
}
