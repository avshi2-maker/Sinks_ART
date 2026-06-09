'use server';

// src/lib/leads/leadsData.ts
// Phase 37 — Leads Inbox: read website leads + one-click convert to customer+project.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface LeadRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city_he: string | null;
  project_type: string | null;
  budget_tier: string | null;
  preferred_marble_family: string | null;
  preferred_sink_config: string | null;
  has_architect: boolean | null;
  architect_name: string | null;
  notes_he: string | null;
  inspiration_image_urls: string[] | null;
  utm_source: string | null;
  status: string | null;
  converted_to_customer_id: string | null;
  converted_to_project_id: string | null;
  is_archived: boolean | null;
  created_at: string;
}

export async function fetchLeads(): Promise<LeadRow[]> {
  const sb = getServerSupabase();
  const res = await sb
    .from('leads')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchLeads]', res.error.message); return []; }
  return (res.data || []) as LeadRow[];
}

export interface ConvertResult { ok: boolean; error?: string; customerId?: string; projectId?: string; }

// One-click convert: lead -> customer + project, then stamp the lead as converted.
export async function convertLead(leadId: string): Promise<ConvertResult> {
  if (!leadId) return { ok: false, error: 'missing lead id' };
  const sb = getServerSupabase();

  const leadRes = await sb.from('leads').select('*').eq('id', leadId).single();
  if (leadRes.error || !leadRes.data) return { ok: false, error: 'הליד לא נמצא' };
  const lead = leadRes.data as LeadRow;

  if (lead.converted_to_customer_id) return { ok: false, error: 'הליד כבר הומר ללקוח' };

  const name = (lead.full_name || '').trim() || 'ליד ללא שם';
  const nowIso = new Date().toISOString();

  // 1) customer
  const custRes = await sb.from('customers').insert({
    name_he: name,
    phone: lead.phone?.trim() || null,
    email: lead.email?.trim() || null,
    city: lead.city_he?.trim() || null,
    profession: lead.has_architect && lead.architect_name ? ('אדריכל: ' + lead.architect_name) : null,
    source: 'website',
    notes: lead.notes_he?.trim() || null,
    is_active: true,
  }).select('id').single();
  if (custRes.error || !custRes.data) return { ok: false, error: 'יצירת לקוח נכשלה: ' + (custRes.error?.message || '') };
  const customerId = custRes.data.id as string;

  // 2) project (title from project_type; details from marble/sink/budget)
  const title = lead.project_type?.trim() || ('פנייה מהאתר · ' + new Date(lead.created_at).toLocaleDateString('he-IL'));
  const descParts = [
    lead.budget_tier ? ('תקציב: ' + lead.budget_tier) : null,
    lead.preferred_sink_config ? ('תצורת כיור: ' + lead.preferred_sink_config) : null,
    lead.notes_he ? ('הערות לקוח: ' + lead.notes_he) : null,
  ].filter(Boolean).join(' · ');
  const projRes = await sb.from('projects').insert({
    customer_id: customerId,
    title_he: title,
    status: 'ליד',
    stone_type_he: lead.preferred_marble_family?.trim() || null,
    description_he: descParts || null,
    inquiry_date: nowIso.slice(0, 10),
    created_at: nowIso,
    updated_at: nowIso,
  }).select('id').single();
  if (projRes.error || !projRes.data) {
    return { ok: false, error: 'הלקוח נוצר אך הפרויקט נכשל: ' + (projRes.error?.message || ''), customerId };
  }
  const projectId = projRes.data.id as string;

  // 3) stamp the lead
  const stampRes = await sb.from('leads').update({
    status: 'won',
    converted_to_customer_id: customerId,
    converted_to_project_id: projectId,
    updated_at: nowIso,
  }).eq('id', leadId);

  revalidatePath('/leads');
  return { ok: true, customerId, projectId };
}

export async function archiveLead(leadId: string): Promise<ConvertResult> {
  if (!leadId) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('leads').update({ is_archived: true }).eq('id', leadId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/leads');
  return { ok: true };
}

// Count of new (unconverted, unarchived) leads — for the nav badge.
export async function countNewLeads(): Promise<number> {
  const sb = getServerSupabase();
  const res = await sb
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('is_archived', false)
    .is('converted_to_customer_id', null);
  if (res.error) { console.error('[countNewLeads]', res.error.message); return 0; }
  return res.count || 0;
}