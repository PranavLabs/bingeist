import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureSchema } from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

function sanitizeUsername(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20) || 'user';
}

async function generateUniqueUsername(base: string): Promise<string> {
  const sanitized = sanitizeUsername(base);
  // Try exact first, then append numbers until unique
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? sanitized : `${sanitized.slice(0, 16)}${attempt}`;
    const { rows } = await pool.query('SELECT 1 FROM users WHERE username = $1', [candidate]);
    if (rows.length === 0) return candidate;
  }
  // Fallback: use a timestamp suffix
  return `${sanitized.slice(0, 12)}${Date.now().toString(36)}`.slice(0, 20);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_no_code`);
  }

  // Validate CSRF state
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=google_state_mismatch`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(`${appUrl}/login?error=google_token_failed`);
    }

    // Fetch user profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=google_profile_failed`);
    }

    const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
    const { sub: googleSub, email, name } = googleUser;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=google_no_email`);
    }

    await ensureSchema();

    // Check if this Google account is already linked
    const { rows: identityRows } = await pool.query<{ user_id: number }>(
      'SELECT user_id FROM oauth_identities WHERE provider = $1 AND provider_user_id = $2',
      ['google', googleSub]
    );

    let userId: number;
    let username: string;

    if (identityRows.length > 0) {
      // Existing OAuth user — fetch their account
      userId = identityRows[0].user_id;
      const { rows: userRows } = await pool.query<{ username: string }>(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );
      username = userRows[0].username;
    } else {
      // Check if a user with this email already exists (link accounts)
      const { rows: existingRows } = await pool.query<{ id: number; username: string }>(
        'SELECT id, username FROM users WHERE email = $1',
        [email]
      );

      if (existingRows.length > 0) {
        // Link Google identity to existing user
        userId = existingRows[0].id;
        username = existingRows[0].username;
        await pool.query(
          'INSERT INTO oauth_identities (user_id, provider, provider_user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [userId, 'google', googleSub]
        );
      } else {
        // Create new user from Google profile
        const baseUsername = name
          ? sanitizeUsername(name)
          : sanitizeUsername(email.split('@')[0]);
        const newUsername = await generateUniqueUsername(baseUsername);

        const { rows: newUserRows } = await pool.query<{ id: number }>(
          'INSERT INTO users (username, email, password_hash, bio, avatar_url) VALUES ($1, $2, NULL, $3, $4) RETURNING id',
          [newUsername, email, '', googleUser.picture || '']
        );
        userId = newUserRows[0].id;
        username = newUsername;

        await pool.query(
          'INSERT INTO oauth_identities (user_id, provider, provider_user_id) VALUES ($1, $2, $3)',
          [userId, 'google', googleSub]
        );
      }
    }

    // Issue JWT session
    const token = await signToken({ userId, username });

    const response = NextResponse.redirect(`${appUrl}/search`);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    // Clear the OAuth state cookie
    response.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/' });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/login?error=google_error`);
  }
}
