import { cookies as nextCookies } from 'next/headers';

const COOKIE_NAME = 'qth.sess';
const SECURE = process.env.NODE_ENV === 'production';

type Store = {
  get(name: string): { name: string; value: string } | undefined;
  set(name: string, value: string, opts?: any): void;
  delete(name: string): void;
};

async function getCookieStore(): Promise<Store> {
  // Works whether cookies() returns a value or a Promise (Next 14/15 compatible)
  const maybe = (nextCookies as any)();
  return typeof maybe?.then === 'function' ? await maybe : maybe;
}

const baseOpts = {
  httpOnly: true,
  sameSite: 'strict' as const, // SECURITY: Changed from 'lax' to prevent CSRF
  secure: SECURE,
  path: '/',
  maxAge: 60 * 60 * 24, // SECURITY: Changed from 7 days to 24 hours for healthcare app
};

export async function writeSessionCookie(token: string) {
  const store = await getCookieStore();
  store.set(COOKIE_NAME, token, baseOpts);
}

export async function readSessionCookie(): Promise<string | null> {
  const store = await getCookieStore();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie() {
  const store = await getCookieStore();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
