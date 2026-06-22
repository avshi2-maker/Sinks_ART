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

export interface NewLeadLite { id: string; full_name: string | null; phone: string | null; city_he: string | null; is_door: boolean; created_at: string; }

// New (unconverted, unarchived) leads for the dashboard, newest first. Flags door
// leads by the 🚪 marker the website door form writes into notes_he.
export async function fetchNewLeads(limit = 6): Promise<NewLeadLite[]> {
  const sb = getServerSupabase();
  const res = await sb
    .from('leads')
    .select('id, full_name, phone, city_he, notes_he, created_at')
    .eq('is_archived', false)
    .is('converted_to_customer_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (res.error) { console.error('[fetchNewLeads]', res.error.message); return []; }
  return (res.data || []).map((r) => ({
    id: r.id as string,
    full_name: (r.full_name as string) ?? null,
    phone: (r.phone as string) ?? null,
    city_he: (r.city_he as string) ?? null,
    is_door: typeof r.notes_he === 'string' && (r.notes_he as string).startsWith('🚪'),
    created_at: r.created_at as string,
  }));
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

// Phase 42 — create a lead from an Instagram DM (source=instagram). Free text -> notes_he;
// constrained columns left null (project_type/budget_tier have CHECKs) to avoid violations.
export interface InstaLeadInput {
  full_name?: string;
  phone?: string;
  city_he?: string;
  style_he?: string;
  notes_he?: string;
}
export async function createInstagramLead(input: InstaLeadInput): Promise<ConvertResult> {
  const sb = getServerSupabase();
  const noteParts = [input.style_he ? ('סגנון: ' + input.style_he) : null, input.notes_he || null].filter(Boolean);
  const res = await sb.from('leads').insert({
    full_name: input.full_name?.trim() || 'פנייה מאינסטגרם',
    phone: input.phone?.trim() || null,
    city_he: input.city_he?.trim() || null,
    notes_he: noteParts.join(' · ') || null,
    status: 'new',
    utm_source: 'instagram',
    is_archived: false,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/leads');
  return { ok: true, customerId: undefined };
}

// Phase 43 — create a lead from any pasted source (instagram | whatsapp | other).
export async function createPastedLead(input: InstaLeadInput & { source?: string }): Promise<ConvertResult> {
  const sb = getServerSupabase();
  const noteParts = [input.style_he ? ('סגנון: ' + input.style_he) : null, input.notes_he || null].filter(Boolean);
  const src = input.source || 'instagram';
  const namePrefix = src === 'whatsapp' ? 'פנייה מוואטסאפ' : src === 'call' ? 'פנייה משיחה' : 'פנייה מאינסטגרם';
  const res = await sb.from('leads').insert({
    full_name: input.full_name?.trim() || namePrefix,
    phone: input.phone?.trim() || null,
    city_he: input.city_he?.trim() || null,
    notes_he: noteParts.join(' · ') || null,
    status: 'new',
    utm_source: src,
    is_archived: false,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/leads');
  return { ok: true };
}

// Phase 44 — lightweight customer list for the lead-link picker.
export interface CustomerLite { id: string; name_he: string; phone: string | null; }
export async function fetchCustomersLite(): Promise<CustomerLite[]> {
  const sb = getServerSupabase();
  const res = await sb.from('customers').select('id, name_he, phone').is('archived_at', null).order('name_he', { ascending: true });
  if (res.error) { console.error('[fetchCustomersLite]', res.error.message); return []; }
  return (res.data || []) as CustomerLite[];
}

// Phase 44 — link a lead to an EXISTING customer (no new customer created).
// Stamps the lead as converted + logs the lead's content as a note on the customer's timeline.
export async function linkLeadToExisting(leadId: string, customerId: string): Promise<ConvertResult> {
  if (!leadId || !customerId) return { ok: false, error: 'missing ids' };
  const sb = getServerSupabase();

  const leadRes = await sb.from('leads').select('*').eq('id', leadId).single();
  if (leadRes.error || !leadRes.data) return { ok: false, error: 'הליד לא נמצא' };
  const lead = leadRes.data as LeadRow;
  if (lead.converted_to_customer_id) return { ok: false, error: 'הליד כבר מקושר ללקוח' };

  // log the inquiry as a note on the existing customer's timeline
  const noteBody = [lead.project_type, lead.budget_tier, lead.notes_he].filter(Boolean).join(' · ') || 'פנייה חדשה';
  await sb.from('customer_communications').insert({
    customer_id: customerId,
    comm_type: 'note',
    subject: 'פנייה חדשה (' + (lead.utm_source || 'lead') + ')',
    body: noteBody,
    occurred_at: new Date().toISOString(),
  });

  // stamp the lead as linked (won) without creating a new customer
  const stamp = await sb.from('leads').update({
    status: 'won',
    converted_to_customer_id: customerId,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId);
  if (stamp.error) return { ok: false, error: 'סימון הליד נכשל: ' + stamp.error.message };

  revalidatePath('/leads');
  return { ok: true, customerId };
}