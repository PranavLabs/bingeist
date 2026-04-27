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

# Google OAuth 2.0 credentials (optional — enables "Continue with Google")
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Public URL of your deployment (no trailing slash)
APP_URL=http://localhost:3000
```

> **TVMaze** is a free public API for TV shows — no key needed.
>
> **Jikan (MyAnimeList)** is a free public API for anime — no key needed.
>
> **OMDb** requires a free API key. Get one at [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx). The free tier allows 1,000 requests/day.
>
> **DATABASE_URL** requires a Postgres database. For local development you can run Postgres locally or use a free hosted option like [Neon](https://neon.tech). The schema is created automatically on first request.

### 3. (Optional) Set up Google OAuth

To enable **Continue with Google** on the login and register pages:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth 2.0 Client ID**.
5. Choose **Web application** as the application type.
6. Add the following **Authorized redirect URIs**:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://www.bingeist.com/api/auth/google/callback`
7. Click **Create**. Copy the **Client ID** and **Client Secret**.
8. Set them in your `.env.local` (or Vercel environment variables):
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   APP_URL=https://www.bingeist.com   # or http://localhost:3000 for local dev
   ```
9. On the **OAuth consent screen** tab, add your app name, logo, and the scope `email profile openid`.

> **Note:** If `GOOGLE_CLIENT_ID` is not set, the "Continue with Google" button still appears but clicking it returns a 501 error. You can safely omit Google OAuth if you only want email/password auth.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Production build

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
   | `APP_URL` | `https://www.bingeist.com` (your production domain) |
   | `GOOGLE_CLIENT_ID` | *(optional)* Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | *(optional)* Google OAuth Client Secret |

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
