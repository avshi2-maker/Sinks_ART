// src/middleware.ts
// Site-wide password gate + stamps the request path into a header so the root
// layout can render public pages (/rfq) without the CRM nav.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that must stay public (no login): the gate itself + Ales RFQ pages.
const PUBLIC_PATHS = ['/login', '/api/login', '/rfq'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Stamp the path so server components (root layout) can read it.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const expected = process.env.CRM_PASSWORD;
  const cookie = req.cookies.get('crm_auth')?.value;
  if (!expected || cookie !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
