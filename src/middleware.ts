// src/middleware.ts
// Simple site-wide password gate. Every request must carry a valid auth cookie;
// otherwise it is redirected to /login. The password itself lives in the
// CRM_PASSWORD env var (never in code). This is a lightweight gate, not full
// user auth — Supabase Auth with real accounts is the proper later upgrade.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that must stay public so the gate itself can work.
const PUBLIC_PATHS = ['/login', '/api/login', '/rfq'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page + login API + Next internals/assets through.
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const expected = process.env.CRM_PASSWORD;
  const cookie = req.cookies.get('crm_auth')?.value;

  // If no password is configured on the server, fail OPEN is unsafe — fail CLOSED.
  if (!expected || cookie !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on everything except static assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};