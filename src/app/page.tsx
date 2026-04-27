import FeedGrid from '@/components/FeedGrid';
import LatestActivity from '@/components/LatestActivity';
import HomeHero from '@/components/HomeHero';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — hidden automatically when logged in (see HomeHero client component) */}
      <HomeHero />

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
