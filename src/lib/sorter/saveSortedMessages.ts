'use server';

// src/lib/sorter/saveSortedMessages.ts
// Phase 29 — save approved sorted messages into customer_communications.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

const BUCKET_COMM: Record<string, string> = {
  price: 'bucket_price',
  spec: 'bucket_spec',
  options: 'bucket_options',
  logistics: 'bucket_logistics',
  general: 'bucket_general',
};

const BUCKET_LABEL: Record<string, string> = {
  price: 'מחיר',
  spec: 'טכני',
  options: 'אפשרויות',
  logistics: 'לוגיסטיקה',
  general: 'כללי',
};

const PARTY_LABEL: Record<string, string> = {
  customer: 'לקוח',
  ales: 'אלס',
  unknown: '',
};

export interface SaveSortedInput {
  customerId: string;
  projectId?: string | null;
  messages: { text: string; bucket: string; party: string }[];
}

export interface SaveSortedResult {
  ok: boolean;
  error?: string;
  saved?: number;
}

export async function saveSortedMessages(input: SaveSortedInput): Promise<SaveSortedResult> {
  if (!input.customerId) return { ok: false, error: 'missing customer' };
  const rows = (input.messages || []).filter((m) => m.text && m.text.trim());
  if (rows.length === 0) return { ok: false, error: 'אין הודעות לשמירה' };

  const sb = getServerSupabase();
  const now = new Date().toISOString();

  const inserts = rows.map((m) => {
    const partyLabel = PARTY_LABEL[m.party] || '';
    const bucketLabel = BUCKET_LABEL[m.bucket] || 'כללי';
    const subject = (partyLabel ? partyLabel + ' · ' : '') + bucketLabel;
    return {
      customer_id: input.customerId,
      project_id: input.projectId || null,
      comm_type: BUCKET_COMM[m.bucket] || 'bucket_general',
      subject,
      body: m.text.trim(),
      occurred_at: now,
    };
  });

  const res = await sb.from('customer_communications').insert(inserts);
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/customers/' + input.customerId);
  return { ok: true, saved: inserts.length };
}
