'use server';

// src/lib/sites/siteDocuments.ts
// Phase 36 — site documents server actions.
// addSiteDocument can also (a) create a follow-up task and (b) push an offer to the
// global arvo_offers tracker (dashboard "today's follow-ups"), PDF attached.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { SiteDocument, DocType } from '@/lib/sites/siteDocumentsTypes';
import { addSiteTask } from '@/lib/sites/siteMutations';
import { saveArvoOffer } from '@/lib/offers/arvoOffersData';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DocResult { ok: boolean; error?: string; id?: string; }

export async function fetchSiteDocuments(siteId: string): Promise<SiteDocument[]> {
  const sb = getServerSupabase();
  const res = await sb.from('site_documents').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchSiteDocuments]', res.error.message); return []; }
  return (res.data || []) as SiteDocument[];
}

export interface AddSiteDocumentInput {
  siteId: string;
  doc_type: DocType;
  title_he: string;
  cloudinary_url: string;
  file_name?: string | null;
  project_id?: string | null;
  customer_id?: string | null;
  total_ils?: number | null;
  notes_he?: string | null;
  createTask?: boolean;
  taskDueInDays?: number;
  pushToTracker?: boolean;
  customer_name?: string | null;
  customer_phone?: string | null;
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + (Number.isFinite(days) ? days : 5));
  return d.toISOString().slice(0, 10);
}

export async function addSiteDocument(input: AddSiteDocumentInput): Promise<DocResult> {
  if (!input.siteId || !input.title_he?.trim() || !input.cloudinary_url) return { ok: false, error: 'missing required fields' };
  const sb = getServerSupabase();
  const res = await sb.from('site_documents').insert({
    site_id: input.siteId,
    project_id: input.project_id || null,
    customer_id: input.customer_id || null,
    doc_type: input.doc_type,
    title_he: input.title_he.trim(),
    cloudinary_url: input.cloudinary_url,
    file_name: input.file_name || null,
    total_ils: typeof input.total_ils === 'number' ? input.total_ils : null,
    notes_he: input.notes_he || null,
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'insert failed' };

  if (input.createTask) {
    await addSiteTask({ siteId: input.siteId, title_he: 'מעקב: ' + input.title_he.trim(), due_date: plusDays(input.taskDueInDays ?? 5) });
  }

  if (input.pushToTracker && input.doc_type === 'offer') {
    const stamp = new Date();
    const offerNo = 'EXT-' + stamp.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(stamp.getHours()).padStart(2, '0') + String(stamp.getMinutes()).padStart(2, '0');
    await saveArvoOffer({
      offer_no: offerNo,
      customer_name: input.customer_name || undefined,
      customer_phone: input.customer_phone || undefined,
      recipient: 'customer',
      status: 'followup',
      total_ils: typeof input.total_ils === 'number' ? input.total_ils : 0,
      document_url: input.cloudinary_url,
      notes: 'נטען מאתר — ' + input.title_he.trim(),
    });
  }

  revalidatePath('/sites/' + input.siteId);
  revalidatePath('/dashboard');
  revalidatePath('/offers-sent');
  return { ok: true, id: res.data.id as string };
}

export async function deleteSiteDocument(id: string, siteId: string): Promise<DocResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('site_documents').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/sites/' + siteId);
  return { ok: true, id };
}
