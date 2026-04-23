'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="text-emerald-400 font-bold text-xl tracking-tighter glow">
          BINGEIST<span className="animate-pulse">_</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-gray-400 hover:text-emerald-400 transition-colors">Search</Link>
          {user && (
            <>
              <Link href="/watchlist" className="text-gray-400 hover:text-emerald-400 transition-colors">Watchlist</Link>
              <Link href={`/profile/${user.username}`} className="text-gray-400 hover:text-emerald-400 transition-colors">Profile</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-gray-800 rounded animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.username}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-gray-700 rounded-lg py-1 shadow-xl">
                  <Link href={`/profile/${user.username}`} className="block px-4 py-2 text-sm text-gray-300 hover:text-emerald-400 hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>Profile</Link>
                  <Link href="/watchlist" className="block px-4 py-2 text-sm text-gray-300 hover:text-emerald-400 hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>Watchlist</Link>
                  <hr className="border-gray-700 my-1" />
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors px-3 py-1.5">Login</Link>
              <Link href="/register" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded transition-colors">Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && (
        <div className="md:hidden border-t border-gray-800 px-4 py-2 flex gap-4 text-sm">
          <Link href="/search" className="text-gray-400 hover:text-emerald-400">Search</Link>
          <Link href="/watchlist" className="text-gray-400 hover:text-emerald-400">Watchlist</Link>
          <Link href={`/profile/${user.username}`} className="text-gray-400 hover:text-emerald-400">Profile</Link>
        </div>
      )}
    </nav>
  );
}
