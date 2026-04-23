# BINGEIST

A social watchlist platform for movies, TV shows, and anime.

## Features

- **User Auth** — Register and log in with secure JWT-based sessions
- **Search** — Find movies, TV shows, and anime via TMDB and Jikan (MAL) APIs
- **Watchlist** — Track titles with statuses: Watching, Completed, Plan to Watch, On Hold, Dropped
- **Star Ratings** — Rate titles 1–10 from your watchlist
- **Discussion Threads** — Post and reply under any movie/TV show/anime, with spoiler protection
- **Likes** — Like posts from the community
- **User Profiles** — Public profiles showing watchlist and stats

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
# Get from https://www.themoviedb.org/settings/api
# Use the "API Read Access Token" (v4 Bearer token)
TMDB_API_KEY=your_tmdb_bearer_token_here

# Random secret for JWT signing
JWT_SECRET=your-random-secret-here
```

> **Jikan (MyAnimeList)** is a free public API — no key needed.
>
> **TMDB** requires a free account and a v4 Read Access Token. Get one at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Production build

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** (App Router, API Routes)
- **Tailwind CSS**
- **SQLite** via `better-sqlite3` (data stored in `./data/bingeist.db`)
- **JWT** via `jose`
- **bcryptjs** for password hashing
- **TMDB API** for movies & TV
- **Jikan API** (unofficial MAL) for anime

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/       # register, login, me (logout)
│   │   ├── media/      # search, [id]
│   │   ├── posts/      # post CRUD, likes, replies
│   │   ├── profile/    # user profile CRUD
│   │   └── watchlist/  # watchlist CRUD
│   ├── login/
│   ├── media/[id]/
│   ├── profile/[username]/
│   ├── register/
│   ├── search/
│   └── watchlist/
├── components/
│   ├── MediaCard.tsx
│   ├── Navbar.tsx
│   ├── PostsFeed.tsx
│   └── WatchlistButton.tsx
├── hooks/
│   └── useAuth.tsx     # AuthContext + useAuth hook
└── lib/
    ├── auth.ts         # JWT helpers
    ├── db.ts           # SQLite setup
    └── media.ts        # TMDB + Jikan API clients
```
