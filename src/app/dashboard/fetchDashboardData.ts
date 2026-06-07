/**
 * src/app/dashboard/fetchDashboardData.ts
 *
 * Single server-side function that runs all 4 dashboard queries in parallel
 * and returns one typed object with everything the dashboard components need.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 * Phase 22 — hides rows whose customer is archived (customers!inner + archived_at null).
 */

import { createClient } from '@supabase/supabase-js';

const ACTIVE_PROJECT_STATUSES = [
  'ליד',
  'שיחת בירור',
  'הצעת מחיר נשלחה',
  'אושר',
  'שולמה מקדמה',
  'תשלום מלא',
];

export interface DashboardData {
  today: {
    callCount:    number;
    photoCount:   number;
    videoCount:   number;
    totalCostUsd: number;
  };
  activeProjects: DashboardProject[];
  recentComms:    DashboardComm[];
  monthCostUsd:   number;
}

export interface DashboardProject {
  project_id:         string;
  project_title:      string;
  project_status:     string;
  project_created_at: string;
  customer_id:        string;
  customer_name:      string;
}

export interface DashboardComm {
  comm_id:          string;
  comm_type:        string;
  subject:          string;
  duration_seconds: number | null;
  created_at:       string;
  customer_id:      string;
  customer_name:    string;
  media_url:        string | null;
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing on server');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function startOfDayJerusalem(): string {
  const now = new Date();
  const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const startLocal = new Date(jerusalemNow.getFullYear(), jerusalemNow.getMonth(), jerusalemNow.getDate(), 0, 0, 0, 0);
  const tzOffsetMs = jerusalemNow.getTime() - now.getTime();
  return new Date(startLocal.getTime() - tzOffsetMs).toISOString();
}

function startOfMonthJerusalem(): string {
  const now = new Date();
  const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const startLocal = new Date(jerusalemNow.getFullYear(), jerusalemNow.getMonth(), 1, 0, 0, 0, 0);
  const tzOffsetMs = jerusalemNow.getTime() - now.getTime();
  return new Date(startLocal.getTime() - tzOffsetMs).toISOString();
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const sb = getServerSupabase();
  const todayStart = startOfDayJerusalem();
  const monthStart = startOfMonthJerusalem();

  const [todayRes, projectsRes, commsRes, monthCostRes] = await Promise.all([
    sb
      .from('customer_communications')
      .select('comm_type, api_cost_usd')
      .gte('created_at', todayStart),

    sb
      .from('projects')
      .select('id, title_he, status, created_at, customer_id, customers!inner(name_he, archived_at)')
      .in('status', ACTIVE_PROJECT_STATUSES)
      .is('customers.archived_at', null)
      .order('created_at', { ascending: false })
      .limit(10),

    sb
      .from('customer_communications')
      .select(`
        id, comm_type, subject, duration_seconds, audio_url, created_at, customer_id,
        customers!inner(name_he, archived_at),
        media_analyses(cloudinary_url)
      `)
      .is('customers.archived_at', null)
      .order('created_at', { ascending: false })
      .limit(10),

    sb
      .from('customer_communications')
      .select('api_cost_usd')
      .gte('created_at', monthStart),
  ]);

  if (todayRes.error)     throw new Error('Today query failed: '     + todayRes.error.message);
  if (projectsRes.error)  throw new Error('Projects query failed: '  + projectsRes.error.message);
  if (commsRes.error)     throw new Error('Comms query failed: '     + commsRes.error.message);
  if (monthCostRes.error) throw new Error('Month cost query failed: '+ monthCostRes.error.message);

  const todayRows = todayRes.data || [];
  const today = {
    callCount:    todayRows.filter((r: { comm_type: string }) => r.comm_type === 'call').length,
    photoCount:   todayRows.filter((r: { comm_type: string }) => r.comm_type === 'photo').length,
    videoCount:   todayRows.filter((r: { comm_type: string }) => r.comm_type === 'mp4').length,
    totalCostUsd: todayRows.reduce((sum: number, r: { api_cost_usd: number | null }) => sum + (Number(r.api_cost_usd) || 0), 0),
  };

  const activeProjects: DashboardProject[] = (projectsRes.data || []).map((p: {
    id: string;
    title_he: string;
    status: string;
    created_at: string;
    customer_id: string;
    customers: { name_he: string } | { name_he: string }[] | null;
  }) => {
    const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      project_id:         p.id,
      project_title:      p.title_he,
      project_status:     p.status,
      project_created_at: p.created_at,
      customer_id:        p.customer_id,
      customer_name:      cust?.name_he || 'לקוח לא ידוע',
    };
  });

  const recentComms: DashboardComm[] = (commsRes.data || []).map((c: {
    id: string;
    comm_type: string;
    subject: string;
    duration_seconds: number | null;
    audio_url: string | null;
    created_at: string;
    customer_id: string;
    customers: { name_he: string } | { name_he: string }[] | null;
    media_analyses: { cloudinary_url: string }[] | null;
  }) => {
    const cust = Array.isArray(c.customers) ? c.customers[0] : c.customers;
    const mediaFromAnalyses = Array.isArray(c.media_analyses) && c.media_analyses.length > 0
      ? c.media_analyses[0].cloudinary_url
      : null;
    return {
      comm_id:          c.id,
      comm_type:        c.comm_type,
      subject:          c.subject || '',
      duration_seconds: c.duration_seconds,
      created_at:       c.created_at,
      customer_id:      c.customer_id,
      customer_name:    cust?.name_he || 'לקוח לא ידוע',
      media_url:        c.audio_url || mediaFromAnalyses,
    };
  });

  const monthCostUsd = (monthCostRes.data || []).reduce(
    (sum: number, r: { api_cost_usd: number | null }) => sum + (Number(r.api_cost_usd) || 0),
    0,
  );

  return { today, activeProjects, recentComms, monthCostUsd };
}
