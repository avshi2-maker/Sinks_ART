// src/app/api/login/route.ts
// Validates the submitted password against CRM_PASSWORD and, on success, sets an
// httpOnly cookie that the middleware checks. Server-only; password never reaches
// the browser bundle.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }

  const expected = process.env.CRM_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'server not configured' }, { status: 500 });
  }

  if (body.password !== expected) {
    return NextResponse.json({ ok: false, error: 'סיסמה שגויה' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('crm_auth', expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}