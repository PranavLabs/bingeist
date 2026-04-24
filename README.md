# BINGEIST

A social watchlist platform for movies, TV shows, and anime.

## Features

- **User Auth** — Register and log in with secure JWT-based sessions
- **Search** — Find movies via OMDb, TV shows via TVMaze, and anime via Jikan (MAL) APIs
- **Watchlist** — Track titles with statuses: Watching, Completed, Plan to Watch, On Hold, Dropped
- **Star Ratings** — Rate titles 1–10 from your watchlist
- **Discussion Threads** — Post and reply under any movie/TV show/anime, with spoiler protection
- **Image/GIF Attachments** — Attach an image or GIF URL to any post or reply
- **Likes** — Like posts from the community
- **User Profiles** — Public profiles showing watchlist and stats
- **Trending Homepage** — Preloaded trending anime, TV shows, and popular movies
- **Latest Activity Feed** — Combined recent posts and replies across all titles

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
# Postgres connection string (e.g. from Neon: https://neon.tech)
DATABASE_URL=postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require

# Get a free API key from https://www.omdbapi.com/apikey.aspx
OMDB_API_KEY=your_omdb_api_key_here

# Random secret for JWT signing
JWT_SECRET=your-random-secret-here
```

> **TVMaze** is a free public API for TV shows — no key needed.
>
> **Jikan (MyAnimeList)** is a free public API for anime — no key needed.
>
> **OMDb** requires a free API key. Get one at [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx). The free tier allows 1,000 requests/day.
>
> **DATABASE_URL** requires a Postgres database. For local development you can run Postgres locally or use a free hosted option like [Neon](https://neon.tech). The schema is created automatically on first request.

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

## Deploying to Vercel + Neon (free tier)

### Step 1 — Create a free Neon Postgres database

1. Sign up at [neon.tech](https://neon.tech) (free tier available).
2. Create a new project.
3. Copy the connection string from the dashboard — it looks like:
   ```
   postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require
   ```
   This is your `DATABASE_URL`.

> **Note:** File-based SQLite is not compatible with Vercel's serverless runtime because the filesystem is ephemeral. This project uses Postgres for persistent storage.

### Step 2 — Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
3. In the Vercel project dashboard go to **Settings → Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `OMDB_API_KEY` | Your OMDb API key (free at omdbapi.com) |
   | `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |

4. Click **Deploy**. The database schema is created automatically on first request.

## Tech Stack

- **Next.js 16** (App Router, API Routes, ISR)
- **Tailwind CSS**
- **Postgres** via `pg` (hosted on Neon or any Postgres provider)
- **JWT** via `jose`
- **bcryptjs** for password hashing
- **TVMaze API** for TV shows (no key)
- **OMDb API** for movies (free key required)
- **Jikan API** (unofficial MAL) for anime (no key)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activity/   # global latest activity feed
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
│   ├── LatestActivity.tsx
│   ├── MediaCard.tsx
│   ├── Navbar.tsx
│   ├── PostsFeed.tsx
│   └── WatchlistButton.tsx
├── hooks/
│   └── useAuth.tsx     # AuthContext + useAuth hook
└── lib/
    ├── auth.ts         # JWT helpers
    ├── db.ts           # Postgres pool + schema init
    └── media.ts        # TVMaze + OMDb + Jikan API clients
```
