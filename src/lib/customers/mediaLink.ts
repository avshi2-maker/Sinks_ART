'use server';

// src/lib/customers/mediaLink.ts
// Phase 36 — link/unlink media_analyses assets to a project.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MediaAsset {
  id: string;
  project_id: string | null;
  cloudinary_url: string | null;
  thumbnail_url: string | null;
  source_filename: string | null;
  media_type: string | null;
  extracted_stone_type: string | null;
  extracted_dimensions: string | null;
}

// All media for a customer (attached to any project or none).
export async function fetchCustomerMedia(customerId: string): Promise<MediaAsset[]> {
  const sb = getServerSupabase();
  const res = await sb
    .from('media_analyses')
    .select('id, project_id, cloudinary_url, thumbnail_url, source_filename, media_type, extracted_stone_type, extracted_dimensions')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchCustomerMedia]', res.error.message); return []; }
  return (res.data || []) as MediaAsset[];
}

export interface LinkResult { ok: boolean; error?: string; }

export async function attachMediaToProject(mediaId: string, projectId: string, customerId: string): Promise<LinkResult> {
  if (!mediaId || !projectId) return { ok: false, error: 'missing ids' };
  const sb = getServerSupabase();
  const res = await sb.from('media_analyses').update({ project_id: projectId }).eq('id', mediaId);
  if (res.error) return { ok: false, error: res.error.message };
  if (customerId) revalidatePath('/customers/' + customerId);
  return { ok: true };
}

export async function detachMediaFromProject(mediaId: string, customerId: string): Promise<LinkResult> {
  if (!mediaId) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('media_analyses').update({ project_id: null }).eq('id', mediaId);
  if (res.error) return { ok: false, error: res.error.message };
  if (customerId) revalidatePath('/customers/' + customerId);
  return { ok: true };
}
