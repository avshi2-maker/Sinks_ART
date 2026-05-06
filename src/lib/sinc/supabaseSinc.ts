/**
 * src/lib/sinc/supabaseSinc.ts
 *
 * Typed Supabase queries for SinC-ART (call intake system).
 * Reuses the existing CRM tables: customers, projects, customer_communications.
 * No schema changes needed — same shape as Phase 15 intake uses.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SincCustomerRow,
  SincProjectRow,
  SincCustomerWithActiveProject,
  SincCallSavePayload,
} from './types';

// ── Active project status values (8 Hebrew labels) ────────────
// Calls are linked to projects in these states; closed projects (הסתיים, אבוד)
// are not considered "active" for new call linking.
const ACTIVE_PROJECT_STATUSES = [
  'ליד',
  'שיחת בירור',
  'הצעת מחיר נשלחה',
  'אושר',
  'שולמה מקדמה',
  'תשלום מלא',
];

// ── Client factory (browser-side, uses anon key) ──────────────

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

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

// ── Customer + project loading ────────────────────────────────

/**
 * Load all customers ordered by most-recent first.
 * Used by the customer-picker dropdown.
 */
export async function listCustomers(): Promise<SincCustomerRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('customers')
    .select('id, name_he, phone, email, source, notes, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('שגיאה בטעינת לקוחות: ' + error.message);
  }
  return (data || []) as SincCustomerRow[];
}

/**
 * Find the most recent ACTIVE project for a given customer.
 * Returns null if the customer has no active project.
 */
export async function getActiveProjectForCustomer(
  customerId: string,
): Promise<SincProjectRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('projects')
    .select('id, customer_id, title_he, status, notes_jsonb, created_at')
    .eq('customer_id', customerId)
    .in('status', ACTIVE_PROJECT_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error('שגיאה בטעינת פרויקט פעיל: ' + error.message);
  }
  return data && data.length > 0 ? (data[0] as SincProjectRow) : null;
}

/**
 * Convenience: customer + their most-recent active project in one call.
 */
export async function getCustomerWithActiveProject(
  customerId: string,
): Promise<SincCustomerWithActiveProject | null> {
  const sb = getSupabase();
  const { data: customerData, error: customerErr } = await sb
    .from('customers')
    .select('id, name_he, phone, email, source, notes, created_at')
    .eq('id', customerId)
    .single();

  if (customerErr || !customerData) {
    return null;
  }

  const activeProject = await getActiveProjectForCustomer(customerId);

  return {
    customer:      customerData as SincCustomerRow,
    activeProject,
  };
}

// ── Project auto-creation ─────────────────────────────────────

/**
 * Create a new "ליד" (lead) project for a customer.
 * Used when the user saves a call but the customer has no active project.
 */
export async function createLeadProject(
  customerId: string,
  titleHe:    string,
): Promise<SincProjectRow> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('projects')
    .insert({
      customer_id: customerId,
      title_he:    titleHe,
      status:      'ליד',
      notes_jsonb: { created_from: 'sinc_call', created_at: new Date().toISOString() },
    })
    .select('id, customer_id, title_he, status, notes_jsonb, created_at')
    .single();

  if (error || !data) {
    throw new Error('שגיאה ביצירת פרויקט: ' + (error?.message || 'no data'));
  }
  return data as SincProjectRow;
}

// ── Save call analysis ────────────────────────────────────────

/**
 * Insert a customer_communications row for a saved call.
 * Returns the new row's id.
 */
export async function saveCallAnalysis(
  payload: SincCallSavePayload,
): Promise<string> {
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

  if (error || !data) {
    throw new Error('שגיאה בשמירת השיחה: ' + (error?.message || 'no row returned'));
  }
  return data.id as string;
}

/**
 * Build a default subject line from the analysis.
 * Tries to use the customer name + project type if present.
 */
export function buildCallSubject(analysis: { customer_name_he: string; project_type: string }): string {
  const parts: string[] = ['שיחה'];
  if (analysis.customer_name_he) parts.push(analysis.customer_name_he);
  if (analysis.project_type)     parts.push(analysis.project_type);
  return parts.join(' · ');
}
