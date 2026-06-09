'use server';

// src/lib/sites/siteMutations.ts
// Phase 34 — Site model writes: contacts, tasks, visits, attach project.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MutResult { ok: boolean; error?: string; }

function revalidateSite(siteId: string) { revalidatePath('/sites/' + siteId); }

// ── Contacts ──
export async function addSiteContact(input: { siteId: string; name_he: string; role_he?: string; phone?: string; email?: string }): Promise<MutResult> {
  if (!input.siteId || !input.name_he?.trim()) return { ok: false, error: 'שם איש קשר חובה' };
  const sb = getServerSupabase();
  const res = await sb.from('site_contacts').insert({
    site_id: input.siteId, name_he: input.name_he.trim(),
    role_he: input.role_he?.trim() || null, phone: input.phone?.trim() || null, email: input.email?.trim() || null,
  });
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(input.siteId);
  return { ok: true };
}

export async function deleteSiteContact(id: string, siteId: string): Promise<MutResult> {
  const sb = getServerSupabase();
  const res = await sb.from('site_contacts').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(siteId);
  return { ok: true };
}

// ── Tasks ──
export async function addSiteTask(input: { siteId: string; title_he: string; due_date?: string | null }): Promise<MutResult> {
  if (!input.siteId || !input.title_he?.trim()) return { ok: false, error: 'כותרת משימה חובה' };
  const sb = getServerSupabase();
  const res = await sb.from('site_tasks').insert({
    site_id: input.siteId, title_he: input.title_he.trim(), due_date: input.due_date || null,
  });
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(input.siteId);
  return { ok: true };
}

export async function toggleSiteTask(id: string, done: boolean, siteId: string): Promise<MutResult> {
  const sb = getServerSupabase();
  const res = await sb.from('site_tasks').update({ done }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(siteId);
  return { ok: true };
}

export async function deleteSiteTask(id: string, siteId: string): Promise<MutResult> {
  const sb = getServerSupabase();
  const res = await sb.from('site_tasks').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(siteId);
  return { ok: true };
}

// ── Visits ──
export async function addSiteVisit(input: { siteId: string; visit_date?: string; attendees_he?: string; zones_he?: string; measurements_he?: string; findings_he?: string; photos_note_he?: string }): Promise<MutResult> {
  if (!input.siteId) return { ok: false, error: 'missing site' };
  const sb = getServerSupabase();
  const res = await sb.from('site_visits').insert({
    site_id: input.siteId,
    visit_date: input.visit_date || new Date().toISOString().slice(0, 10),
    attendees_he: input.attendees_he?.trim() || null,
    zones_he: input.zones_he?.trim() || null,
    measurements_he: input.measurements_he?.trim() || null,
    findings_he: input.findings_he?.trim() || null,
    photos_note_he: input.photos_note_he?.trim() || null,
  });
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(input.siteId);
  return { ok: true };
}

// ── Attach project to site ──
export async function attachProjectToSite(projectId: string, siteId: string): Promise<MutResult> {
  if (!projectId || !siteId) return { ok: false, error: 'missing ids' };
  const sb = getServerSupabase();
  const res = await sb.from('projects').update({ site_id: siteId }).eq('id', projectId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(siteId);
  return { ok: true };
}

export async function detachProjectFromSite(projectId: string, siteId: string): Promise<MutResult> {
  const sb = getServerSupabase();
  const res = await sb.from('projects').update({ site_id: null }).eq('id', projectId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidateSite(siteId);
  return { ok: true };
}
