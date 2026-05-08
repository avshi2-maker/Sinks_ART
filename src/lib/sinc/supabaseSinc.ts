/**
 * src/lib/sinc/supabaseSinc.ts
 *
 * Typed Supabase queries for SinC-ART.
 *
 * Phase B    — Data Layer (Session 17, 06/05/2026)
 * Phase D    — Full save (Session 18, 06/05/2026)
 * Phase D fix 1 — schema columns corrected (06/05/2026):
 *   projects has description_he + notes (text), NOT notes_jsonb.
 * Phase D fix 2 — customers.source whitelist (07/05/2026):
 *   Allowed values are pinterest, whatsapp, instagram, website,
 *   referral, walk-in, phone, other. Using 'phone' for sinc-call
 *   created customers (literal semantic match — it IS a phone call).
 * Phase 16.5 — saveCallFull return now surfaces customer_id so the
 *   post-save UI can navigate to /customers/[customer_id].
 *   Latent Phase D defect: payload.customer_id was used for the insert
 *   but never echoed back to the caller. Fixed (Session 19, 07/05/2026).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SincCustomerRow,
  SincProjectRow,
  SincCustomerWithActiveProject,
  SincCallSavePayload,
  SincCallFullSavePayload,
  SincCallSaveResult,
} from './types';

const ACTIVE_PROJECT_STATUSES = [
  'ליד',
  'שיחת בירור',
  'הצעת מחיר נשלחה',
  'אושר',
  'שולמה מקדמה',
  'תשלום מלא',
];

const PROJECT_COLS = 'id, customer_id, title_he, status, description_he, notes, inquiry_date, created_at';

// ── Client factory (browser-side, anon key) ──

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase env vars missing. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  cachedClient = createClient(url, anonKey, { auth: { persistSession: false } });
  return cachedClient;
}

// ── Customer queries ──

export async function listCustomers(): Promise<SincCustomerRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('customers')
    .select('id, name_he, phone, email, source, notes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('שגיאה בטעינת לקוחות: ' + error.message);
  return (data || []) as SincCustomerRow[];
}

export async function getActiveProjectForCustomer(
  customerId: string,
): Promise<SincProjectRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('projects')
    .select(PROJECT_COLS)
    .eq('customer_id', customerId)
    .in('status', ACTIVE_PROJECT_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('שגיאה בטעינת פרויקט פעיל: ' + error.message);
  return data && data.length > 0 ? (data[0] as SincProjectRow) : null;
}

export async function listActiveProjectsForCustomer(
  customerId: string,
): Promise<SincProjectRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('projects')
    .select(PROJECT_COLS)
    .eq('customer_id', customerId)
    .in('status', ACTIVE_PROJECT_STATUSES)
    .order('created_at', { ascending: false });
  if (error) throw new Error('שגיאה בטעינת פרויקטים: ' + error.message);
  return (data || []) as SincProjectRow[];
}

export async function getCustomerWithActiveProject(
  customerId: string,
): Promise<SincCustomerWithActiveProject | null> {
  const sb = getSupabase();
  const { data: customerData, error: customerErr } = await sb
    .from('customers')
    .select('id, name_he, phone, email, source, notes, created_at')
    .eq('id', customerId)
    .single();
  if (customerErr || !customerData) return null;
  const activeProject = await getActiveProjectForCustomer(customerId);
  return { customer: customerData as SincCustomerRow, activeProject };
}

// ── Customer creation (Phase D) ──
//
// source='phone' matches the customers_source_check whitelist.
// Allowed values are: pinterest, whatsapp, instagram, website,
// referral, walk-in, phone, other.

export async function createCustomer(
  nameHe: string,
  phone:  string | null,
  notes:  string | null,
): Promise<SincCustomerRow> {
  const sb = getSupabase();
  const trimmedName  = (nameHe || '').trim().replace(/\s+/g, ' ');
  const trimmedPhone = (phone  || '').trim() || null;
  const trimmedNotes = (notes  || '').trim() || null;
  if (!trimmedName) throw new Error('שם לקוח חובה');

  const { data, error } = await sb
    .from('customers')
    .insert({
      name_he: trimmedName,
      phone:   trimmedPhone,
      email:   null,
      source:  'phone',
      notes:   trimmedNotes,
    })
    .select('id, name_he, phone, email, source, notes, created_at')
    .single();
  if (error || !data) throw new Error('שגיאה ביצירת לקוח: ' + (error?.message || 'no data'));
  return data as SincCustomerRow;
}

// ── Project auto-creation ──

export async function createLeadProject(
  customerId: string,
  titleHe:    string,
): Promise<SincProjectRow> {
  const sb = getSupabase();
  const today = new Date().toISOString().substring(0, 10);

  const { data, error } = await sb
    .from('projects')
    .insert({
      customer_id:    customerId,
      title_he:       titleHe,
      status:         'ליד',
      description_he: 'נוצר אוטומטית משיחת לקוח (SinC-ART)',
      notes:          'created_from=sinc_call; created_at=' + new Date().toISOString(),
      inquiry_date:   today,
    })
    .select(PROJECT_COLS)
    .single();
  if (error || !data) throw new Error('שגיאה ביצירת פרויקט: ' + (error?.message || 'no data'));
  return data as SincProjectRow;
}

// ── Save call analysis (legacy single-row, deprecated) ──

/** @deprecated Pre-Phase-D save (no parallel media_analyses row). Use saveCallFull(). */
export async function saveCallAnalysis(payload: SincCallSavePayload): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('customer_communications')
    .insert({
      customer_id:  payload.customer_id,
      project_id:   payload.project_id,
      comm_type:    payload.comm_type,
      subject:      payload.subject,
      body:         payload.body,
      ai_analysis:  payload.ai_analysis,
      audio_url:    payload.audio_url,
      api_cost_usd: payload.api_cost_usd,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error('שגיאה בשמירת השיחה: ' + (error?.message || 'no row returned'));
  return data.id as string;
}

// ── Phase D canonical save ──

export async function saveCallFull(
  payload: SincCallFullSavePayload,
): Promise<SincCallSaveResult> {
  const sb = getSupabase();

  let projectId     = payload.project_id;
  let projectWasNew = false;
  if (!projectId) {
    const today      = new Date().toLocaleDateString('en-GB');
    const titleHe    = 'שיחה - ' + today;
    const newProject = await createLeadProject(payload.customer_id, titleHe);
    projectId        = newProject.id;
    projectWasNew    = true;
  }

  const { data: commData, error: commErr } = await sb
    .from('customer_communications')
    .insert({
      customer_id:  payload.customer_id,
      project_id:   projectId,
      comm_type:    'call',
      subject:      payload.subject,
      body:         payload.body,
      ai_analysis:  payload.ai_analysis,
      audio_url:    payload.audio_url,
      api_cost_usd: payload.api_cost_usd,
      duration_seconds: Number.isFinite(payload.duration_sec) ? Math.round(payload.duration_sec) : null,
    })
    .select('id')
    .single();
  if (commErr || !commData) {
    throw new Error('שגיאה בשמירת השיחה: ' + (commErr?.message || 'no comm row'));
  }
  const commId = commData.id as string;

  const aiFullReport = {
    analysis:            payload.ai_analysis,
    speaker_map:         payload.speaker_map,
    bubbles:             payload.bubbles,
    raw_transcript_text: payload.raw_transcript_text,
    duration_sec:        payload.duration_sec,
    audio_url:           payload.audio_url,
    saved_phase:         'D',
    saved_at:            new Date().toISOString(),
  };

  const designIntent = [
    payload.ai_analysis.project_type,
    payload.ai_analysis.desired_style,
  ].filter(Boolean).join(' · ') || null;

  const { data: mediaData, error: mediaErr } = await sb
    .from('media_analyses')
    .insert({
      comm_id:              commId,
      customer_id:          payload.customer_id,
      project_id:           projectId,
      media_type:           'audio',
      source_url:           payload.audio_url,
      cloudinary_url:       payload.audio_url,
      thumbnail_url:        null,
      source_filename:      payload.source_filename,
      extracted_dimensions: payload.ai_analysis.dimensions       || null,
      extracted_stone_type: payload.ai_analysis.stone_preference || null,
      extracted_shape:      null,
      design_intent_he:     designIntent,
      reference_summary_he: payload.ai_analysis.summary_he       || null,
      ai_full_report:       aiFullReport,
      api_cost_usd:         payload.api_cost_usd,
    })
    .select('id')
    .single();
  if (mediaErr || !mediaData) {
    throw new Error(
      'שגיאה בשמירת ניתוח המדיה (השיחה כבר נשמרה: comm_id=' + commId + '): ' +
      (mediaErr?.message || 'no media row'),
    );
  }

  return {
    comm_id:           commId,
    media_analysis_id: mediaData.id as string,
    customer_id:       payload.customer_id,   // Phase 16.5 — surfaced for /customers/[id] navigation
    project_id:        projectId,
    project_was_new:   projectWasNew,
  };
}

// ── Subject builder ──

export function buildCallSubject(analysis: { customer_name_he: string; project_type: string }): string {
  const parts: string[] = ['שיחה'];
  if (analysis.customer_name_he) parts.push(analysis.customer_name_he);
  if (analysis.project_type)     parts.push(analysis.project_type);
  return parts.join(' · ');
}
