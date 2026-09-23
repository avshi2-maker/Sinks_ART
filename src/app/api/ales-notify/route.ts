// src/app/api/ales-notify/route.ts · updated 23.09.2026 14:22 (Asia/Jerusalem)
// Vercel Cron (every 10 min, vercel.json): pull finished Ales jobs → email Avshi about new ones + daily reminders.
// Public path (see middleware) — protected by CRON_SECRET when set. Idempotent: emails only unsent/overdue items.

import { NextRequest, NextResponse } from 'next/server';
import { runCaseAlerts } from '@/lib/case/caseAlert';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== 'Bearer ' + secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await runCaseAlerts()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
