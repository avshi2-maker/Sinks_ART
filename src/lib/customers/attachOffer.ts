'use server';

// src/lib/customers/attachOffer.ts
// One-click "attach offer to project": logs a communication row for the offer file
// and (best-effort) a media_analyses row so the file lives in Cloudinary + Supabase,
// linked to customer_id AND project_id (Architectural Rule).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface AttachOfferInput {
  customerId: string;
  projectId: string;
  url: string;               // Cloudinary secure_url of the uploaded offer
  filename: string;
  isPdf: boolean;
  thumbnailUrl?: string | null;
}

export interface AttachResult {
  ok: boolean;
  error: string | null;
  id?: string;
}

export async function attachOfferToProject(input: AttachOfferInput): Promise<AttachResult> {
  if (!input.customerId) return { ok: false, error: 'customerId missing' };
  if (!input.projectId) return { ok: false, error: 'projectId missing' };
  if (!input.url) return { ok: false, error: 'file url missing' };

  const sb = getServerSupabase();
  const now = new Date().toISOString();
  const label = (input.filename || 'הצעת מחיר').trim();

  // 1) communication row on the project timeline
  const commRes = await sb
    .from('customer_communications')
    .insert({
      customer_id: input.customerId,
      project_id: input.projectId,
      comm_type: 'pdf',
      subject: '📄 הצעת מחיר',
      body: label + '\n' + input.url,
      occurred_at: now,
    })
    .select('id')
    .single();

  if (commRes.error) return { ok: false, error: commRes.error.message };

  // 2) media_analyses row (Architectural Rule) — best-effort, never blocks the attach
  const mediaRes = await sb
    .from('media_analyses')
    .insert({
      comm_id: commRes.data.id,
      customer_id: input.customerId,
      project_id: input.projectId,
      media_type: input.isPdf ? 'pdf' : 'photo',
      source_url: input.url,
      cloudinary_url: input.url,
      thumbnail_url: input.thumbnailUrl || input.url,
      source_filename: label,
      status: 'attached',
      used_for_quote: true,
    })
    .select('id')
    .single();

  if (mediaRes.error) console.error('[attachOffer] media_analyses insert:', mediaRes.error.message);

  revalidatePath('/customers/' + input.customerId);
  return { ok: true, error: null, id: commRes.data.id };
}
