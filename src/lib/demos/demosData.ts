'use server';

// src/lib/demos/demosData.ts
// Phase 38 — Demo-Trials library: AI הדמיה demos. Extended: also holds saved sketches (kind='sketch').

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface DemoTrial {
  id: string;
  title_he: string | null;
  cloudinary_url: string | null;
  cloudinary_public_id: string | null;
  thumbnail_url: string | null;
  nano_banana_prompt: string | null;
  kling_prompt: string | null;
  inputs_jsonb: Record<string, unknown> | null;
  marble_family: string | null;
  notes_he: string | null;
  customer_id: string | null;
  project_id: string | null;
  kind: string | null;          // 'demo' | 'sketch'
  sketch_svg: string | null;    // inline SVG when kind === 'sketch'
  is_archived: boolean;
  created_at: string;
}

export interface DemoResult { ok: boolean; error?: string; id?: string; }

export async function fetchDemos(): Promise<DemoTrial[]> {
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').select('*').eq('is_archived', false).order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchDemos]', res.error.message); return []; }
  return (res.data || []) as DemoTrial[];
}

export interface SaveDemoInput {
  title_he?: string;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  thumbnail_url?: string;
  nano_banana_prompt?: string;
  kling_prompt?: string;
  inputs_jsonb?: Record<string, unknown>;
  marble_family?: string;
  notes_he?: string;
  customer_id?: string | null;
}

export async function saveDemo(input: SaveDemoInput): Promise<DemoResult> {
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').insert({
    title_he: input.title_he?.trim() || ('הדמיה · ' + new Date().toLocaleDateString('he-IL')),
    cloudinary_url: input.cloudinary_url || null,
    cloudinary_public_id: input.cloudinary_public_id || null,
    thumbnail_url: input.thumbnail_url || input.cloudinary_url || null,
    nano_banana_prompt: input.nano_banana_prompt || null,
    kling_prompt: input.kling_prompt || null,
    inputs_jsonb: input.inputs_jsonb || null,
    marble_family: input.marble_family?.trim() || null,
    notes_he: input.notes_he?.trim() || null,
    customer_id: input.customer_id || null,
    kind: 'demo',
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/demos');
  return { ok: true, id: res.data.id as string };
}

// Save a technical sketch into the gallery (kind='sketch'). Optional customer + project link.
export interface SaveSketchInput {
  title_he?: string;
  sketch_svg: string;
  spec?: Record<string, unknown>;
  notes_he?: string;
  customer_id?: string | null;
  project_id?: string | null;
}

export async function saveSketchToGallery(input: SaveSketchInput): Promise<DemoResult> {
  if (!input.sketch_svg) return { ok: false, error: 'אין שרטוט לשמירה' };
  const sb = getServerSupabase();
  const d = new Date();
  const stamp = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  const res = await sb.from('demo_trials').insert({
    title_he: input.title_he?.trim() || ('שרטוט · ' + stamp),
    sketch_svg: input.sketch_svg,
    inputs_jsonb: input.spec || null,
    notes_he: input.notes_he?.trim() || null,
    customer_id: input.customer_id || null,
    project_id: input.project_id || null,
    kind: 'sketch',
  }).select('id').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message || 'no row' };
  revalidatePath('/demos');
  return { ok: true, id: res.data.id as string };
}

export async function updateDemo(id: string, patch: { title_he?: string; notes_he?: string; marble_family?: string; customer_id?: string | null }): Promise<DemoResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').update({
    title_he: patch.title_he?.trim() || null,
    notes_he: patch.notes_he?.trim() || null,
    marble_family: patch.marble_family?.trim() || null,
    customer_id: patch.customer_id ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/demos');
  return { ok: true, id };
}

export async function deleteDemo(id: string): Promise<DemoResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').delete().eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/demos');
  return { ok: true };
}

// Attach/replace the render image on an existing demo (after generating in Nano Banana).
export async function setDemoImage(id: string, cloudinaryUrl: string, publicId?: string): Promise<DemoResult> {
  if (!id || !cloudinaryUrl) return { ok: false, error: 'missing id or url' };
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').update({
    cloudinary_url: cloudinaryUrl,
    cloudinary_public_id: publicId || null,
    thumbnail_url: cloudinaryUrl,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/demos');
  return { ok: true, id };
}

// Load one saved sketch's spec (for re-opening in the builder to edit -> save as new).
export interface SketchLoad { spec: Record<string, unknown>; title_he: string | null; }
export async function fetchSketchSpec(id: string): Promise<SketchLoad | null> {
  if (!id) return null;
  const sb = getServerSupabase();
  const res = await sb.from('demo_trials').select('inputs_jsonb, title_he').eq('id', id).eq('kind', 'sketch').single();
  if (res.error || !res.data) { console.error('[fetchSketchSpec]', res.error?.message); return null; }
  return { spec: (res.data.inputs_jsonb || {}) as Record<string, unknown>, title_he: res.data.title_he };
}
// ---- pickers for the save-to-gallery panel ----

export interface CustomerPickLite { id: string; name_he: string; }
export async function fetchCustomersForPicker(): Promise<CustomerPickLite[]> {
  const sb = getServerSupabase();
  const res = await sb.from('customers').select('id, name_he').is('archived_at', null).order('name_he', { ascending: true });
  if (res.error) { console.error('[fetchCustomersForPicker]', res.error.message); return []; }
  return (res.data || []) as CustomerPickLite[];
}

export interface ProjectPickLite { id: string; title_he: string | null; }
export async function fetchProjectsForCustomer(customerId: string): Promise<ProjectPickLite[]> {
  if (!customerId) return [];
  const sb = getServerSupabase();
  const res = await sb.from('projects').select('id, title_he').eq('customer_id', customerId).order('created_at', { ascending: false });
  if (res.error) { console.error('[fetchProjectsForCustomer]', res.error.message); return []; }
  return (res.data || []) as ProjectPickLite[];
}
