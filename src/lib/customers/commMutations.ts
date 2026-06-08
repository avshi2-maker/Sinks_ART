'use server';

// src/lib/customers/commMutations.ts
// Phase 19 Stage B step 4 — createNoteComm (AddNoteInlineForm).
// Phase 22 — optional `party` tags the note: customer / ales / general.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type NoteParty = 'customer' | 'ales' | 'general';

export interface CreateNoteInput {
  customerId:  string;
  projectId?:  string | null;
  text:        string;
  party?:      NoteParty;
}

export interface MutationResult {
  ok:    boolean;
  error: string | null;
  id?:   string;
}

function partyToComm(party?: NoteParty): { comm_type: string; subject: string } {
  if (party === 'customer') return { comm_type: 'note_customer', subject: 'תכתובת עם הלקוח' };
  if (party === 'ales')     return { comm_type: 'note_ales',     subject: 'תכתובת עם אלס' };
  return { comm_type: 'other', subject: 'הערה' };
}

export async function createNoteComm(input: CreateNoteInput): Promise<MutationResult> {
  const text = (input.text || '').trim();
  if (!text) {
    return { ok: false, error: 'תוכן ההערה חובה' };
  }
  if (!input.customerId) {
    return { ok: false, error: 'customerId missing' };
  }

  const { comm_type, subject } = partyToComm(input.party);
  const sb = getServerSupabase();
  const now = new Date().toISOString();

  const res = await sb
    .from('customer_communications')
    .insert({
      customer_id:  input.customerId,
      project_id:   input.projectId || null,
      comm_type,
      subject,
      body:         text,
      occurred_at:  now,
    })
    .select('id')
    .single();

  if (res.error) {
    return { ok: false, error: res.error.message };
  }

  revalidatePath('/customers/' + input.customerId);
  return { ok: true, error: null, id: res.data.id };
}
