'use server';

// src/lib/customers/commMutations.ts
// Phase 19 Stage B step 4 - Server Actions for customer_communications mutations.
// First mutation: createNoteComm (used by the inline AddNoteInlineForm).

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface CreateNoteInput {
  customerId:  string;
  projectId?:  string | null;  // optional — note can be customer-level or project-scoped
  text:        string;          // the note body (Hebrew)
}

export interface MutationResult {
  ok:    boolean;
  error: string | null;
  id?:   string;
}

export async function createNoteComm(input: CreateNoteInput): Promise<MutationResult> {
  const text = (input.text || '').trim();
  if (!text) {
    return { ok: false, error: 'תוכן ההערה חובה' };
  }
  if (!input.customerId) {
    return { ok: false, error: 'customerId missing' };
  }

  const sb = getServerSupabase();
  const now = new Date().toISOString();

  const res = await sb
    .from('customer_communications')
    .insert({
      customer_id:  input.customerId,
      project_id:   input.projectId || null,
      comm_type:    'other',     // marble's existing enum — notes ride as 'other' with subject='הערה'
      subject:      'הערה',
      body:         text,
      occurred_at:  now,
    })
    .select('id')
    .single();

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  // Revalidate the customer detail page so the new note appears immediately
  revalidatePath('/customers/' + input.customerId);
  return { ok: true, error: null, id: res.data.id };
}
