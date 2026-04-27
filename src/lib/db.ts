import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('movie','tv','anime')),
      title TEXT NOT NULL,
      poster_path TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'plan_to_watch'
        CHECK(status IN ('watching','completed','plan_to_watch','dropped','on_hold')),
      rating INTEGER CHECK(rating BETWEEN 1 AND 10),
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, media_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      media_title TEXT NOT NULL,
      content TEXT NOT NULL,
      spoiler BOOLEAN NOT NULL DEFAULT FALSE,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS replies (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, post_id)
    );
  `);

  // Migrate existing databases: add image_url columns if they don't exist yet
  await pool.query(`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE replies ADD COLUMN IF NOT EXISTS image_url TEXT;
  `);

  // OAuth identities table for social login providers (Google, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS oauth_identities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, provider_user_id)
    );

    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  `);

  schemaInitialized = true;
}

export default pool;
