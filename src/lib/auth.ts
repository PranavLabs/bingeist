import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_VALUE = process.env.JWT_SECRET;
if (!SECRET_VALUE && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const SECRET = new TextEncoder().encode(
  SECRET_VALUE || 'bingeist-dev-secret-change-in-production'
);
const COOKIE_NAME = 'bingeist_token';

export interface JWTPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId as number, username: payload.username as string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
