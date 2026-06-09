// src/app/api/logout/route.ts
// Phase 33 — clears the crm_auth cookie and ends the session.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('crm_auth', '', { path: '/', maxAge: 0 });
  return res;
}
