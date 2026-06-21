'use server';

// src/lib/sites/sitesData.ts
// Phase 34 — Site model data layer: types, list, single (with children), create.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SiteRow {
  id: string;
  customer_id: string | null;
  name_he: string;
  address_he: string | null;
  status: string;
  notes_he: string | null;
  created_at: string;
}
export interface SiteContact {
  id: string; site_id: string; name_he: string; role_he: string | null;
  phone: string | null; email: string | null; notes_he: string | null;
}
export interface SiteTask {
  id: string; site_id: string; title_he: string; done: boolean;
  due_date: string | null; notes_he: string | null; sort_order: number;
}
export interface SiteVisit {
  id: string; site_id: string; visit_date: string; attendees_he: string | null;
  zones_he: string | null; measurements_he: string | null; findings_he: string | null;
  photos_note_he: string | null; created_at: string;
}
export interface SiteProject {
  id: string; title_he: string; status: string; quoted_price_ils: number | null;
}
export interface SiteFull extends SiteRow {
  contacts: SiteContact[];
  tasks: SiteTask[];
  visits: SiteVisit[];
  projects: SiteProject[];
}

export async function fetchSites(): Promise<SiteRow[]> {
  const sb = getServerSupabase();
  const res = await sb.from('sites').select('*').order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchSites]', res.error.message); return []; }
  return (res.data || []) as SiteRow[];
}

export async function fetchSite(id: string): Promise<SiteFull | null> {
  const sb = getServerSupabase();
  const siteRes = await sb.from('sites').select('*').eq('id', id).maybeSingle();
  if (siteRes.error || !siteRes.data) return null;
  const site = siteRes.data as SiteRow;

  const [contacts, tasks, visits, projects] = await Promise.all([
    sb.from('site_contacts').select('*').eq('site_id', id),
    sb.from('site_tasks').select('*').eq('site_id', id).order('sort_order', { ascending: true }),
    sb.from('site_visits').select('*').eq('site_id', id).order('visit_date', { ascending: false }),
    sb.from('projects').select('id, title_he, status, quoted_price_ils').eq('site_id', id),
  ]);

  return {
    ...site,
    contacts: (contacts.data || []) as SiteContact[],
    tasks: (tasks.data || []) as SiteTask[],
    visits: (visits.data || []) as SiteVisit[],
    projects: (projects.data || []) as SiteProject[],
  };
}

export interface CreateSiteInput {
  name_he: string;
  customer_id?: string | null;
  address_he?: string | null;
  notes_he?: string | null;
}
export interface CreateSiteResult { ok: boolean; error?: string; siteId?: string; }

export async function createSite(input: CreateSiteInput): Promise<CreateSiteResult> {
  if (!input.name_he?.trim()) return { ok: false, error: 'שם האתר חובה' };
  const sb = getServerSupabase();
  const res = await sb.from('sites').insert({
    name_he: input.name_he.trim(),
    customer_id: input.customer_id || null,
    address_he: input.address_he?.trim() || null,
    notes_he: input.notes_he?.trim() || null,
  }).select('id').maybeSingle();
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/sites');
  return { ok: true, siteId: res.data?.id as string };
}

// ── Phase 35e — picker data sources ──

export interface LinkableProject {
  id: string;
  title_he: string;
  status: string;
  quoted_price_ils: number | null;
  site_id: string | null;
  customer_name: string | null;
}

// All projects with their current site_id + owning customer name.
// The site page filters: already-on-this-site are hidden, on-another-site are shown disabled.
export async function fetchLinkableProjects(): Promise<LinkableProject[]> {
  const sb = getServerSupabase();
  const [projRes, custRes] = await Promise.all([
    sb.from('projects').select('id, title_he, status, quoted_price_ils, site_id, customer_id').order('created_at', { ascending: false }),
    sb.from('customers').select('id, name_he'),
  ]);
  if (projRes.error) { console.error('[fetchLinkableProjects]', projRes.error.message); return []; }
  const customers = (custRes.data || []) as { id: string; name_he: string }[];
  const nameById = new Map<string, string>();
  for (const c of customers) nameById.set(c.id, c.name_he);
  const rows = (projRes.data || []) as { id: string; title_he: string; status: string; quoted_price_ils: number | null; site_id: string | null; customer_id: string | null }[];
  return rows.map((p) => ({
    id: p.id,
    title_he: p.title_he,
    status: p.status,
    quoted_price_ils: p.quoted_price_ils,
    site_id: p.site_id,
    customer_name: p.customer_id ? (nameById.get(p.customer_id) || null) : null,
  }));
}

export interface CustomerMini {
  id: string;
  name_he: string;
  phone: string | null;
  email: string | null;
}

// Active customers for the "add existing customer as site contact" picker.
export async function fetchCustomersMini(): Promise<CustomerMini[]> {
  const sb = getServerSupabase();
  const res = await sb.from('customers').select('id, name_he, phone, email').is('archived_at', null).order('name_he', { ascending: true });
  if (res.error) { console.error('[fetchCustomersMini]', res.error.message); return []; }
  return (res.data || []) as CustomerMini[];
}
